import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Building2,
  Search,
  RefreshCw,
  TrendingUp,
  MapPin,
  ShieldAlert,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { geospatialClient } from '../../lib/api/geospatialClient';

const DISTRICT_LIST = [
  { id: '', name: 'All Units / Districts Overview' },
  { id: 'Bengaluru Urban', name: 'Bengaluru Urban' },
  { id: 'Delhi NCR', name: 'Delhi NCR' },
  { id: 'Mumbai', name: 'Mumbai' },
  { id: 'Kolkata', name: 'Kolkata' },
  { id: 'Hyderabad', name: 'Hyderabad' },
  { id: 'Pune', name: 'Pune' },
];

export default function DistrictDrilldownPage() {
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('cases-desc');

  const fetchDrilldown = async (districtName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await geospatialClient.getDrilldown(districtName);
      if (res && res.data) {
        setData(res.data);
      } else {
        setData(res || null);
      }
    } catch (err) {
      console.error('Failed to fetch district drilldown:', err);
      setError(err?.message || 'Failed to load geospatial unit drilldown data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrilldown(selectedDistrict);
  }, [selectedDistrict]);

  const stations = data?.stations || [];
  const totalCases = data?.total_cases ?? stations.reduce((acc, s) => acc + (s.case_count || 0), 0);
  const maxStationCases = Math.max(...stations.map((s) => s.case_count || 0), 1);
  const topStation = stations.length > 0
    ? [...stations].sort((a, b) => (b.case_count || 0) - (a.case_count || 0))[0]
    : null;
  const avgCasesPerStation = stations.length > 0 ? (totalCases / stations.length).toFixed(1) : 0;

  // Filter & Sort Stations
  const filteredStations = stations
    .filter((st) => {
      const name = (st.unit_name || st.unit_id || '').toLowerCase();
      const dist = (st.district || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return name.includes(q) || dist.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'cases-desc') return (b.case_count || 0) - (a.case_count || 0);
      if (sortBy === 'cases-asc') return (a.case_count || 0) - (b.case_count || 0);
      if (sortBy === 'name-asc') return (a.unit_name || a.unit_id || '').localeCompare(b.unit_name || b.unit_id || '');
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">District & Station Crime Drilldown</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Police station jurisdiction volume breakdown and unit-level crime analytics
              </p>
            </div>
          </div>
        </div>

        {/* District Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 pr-10 text-xs font-medium text-slate-200 hover:border-slate-700 focus:outline-none focus:border-accent transition-colors"
            >
              {DISTRICT_LIST.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => fetchDrilldown(selectedDistrict)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Unit Incidents</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{loading ? '...' : totalCases}</span>
            <span className="text-[10px] text-slate-400">reported cases</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Filter: <span className="text-slate-300 font-medium">{selectedDistrict || 'All Operational Units'}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Reporting Units</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{loading ? '...' : stations.length}</span>
            <span className="text-[10px] text-slate-400">active units</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Status: <span className="text-emerald-400 font-medium">Live Feed Active</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Highest Volume Unit</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-white truncate">{loading ? '...' : topStation?.unit_name || topStation?.unit_id || 'N/A'}</div>
            <div className="text-[11px] text-amber-400 font-medium mt-0.5">{topStation ? `${topStation.case_count} cases` : '-'}</div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Highest recorded density</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unit Average</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{loading ? '...' : avgCasesPerStation}</span>
            <span className="text-[10px] text-slate-400">cases / unit</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Mean incident distribution</div>
        </motion.div>
      </div>

      {/* Main Content Card: Station Drilldown List */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
        {/* Table Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search police unit or jurisdiction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-400">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent"
            >
              <option value="cases-desc">Highest Case Volume</option>
              <option value="cases-asc">Lowest Case Volume</option>
              <option value="name-asc">Unit Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Station Breakdown List */}
        {loading ? (
          <div className="space-y-3 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No police units found</div>
            <div className="text-xs text-slate-500">No units match the query for the selected filter.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStations.map((station, index) => {
              const caseCount = station.case_count || 0;
              const percentage = totalCases > 0 ? Math.round((caseCount / totalCases) * 100) : 0;
              const isHighVolume = caseCount >= maxStationCases * 0.7;
              const isModerateVolume = caseCount >= maxStationCases * 0.3 && !isHighVolume;

              return (
                <motion.div
                  key={station.unit_id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-[240px]">
                    <div className={`p-2.5 rounded-xl border mt-0.5 ${
                      isHighVolume
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : isModerateVolume
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{station.unit_name || station.unit_id || 'Police Unit'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isHighVolume
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : isModerateVolume
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          {isHighVolume ? 'High Volume' : isModerateVolume ? 'Moderate Volume' : 'Standard Volume'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Unit: <span className="text-slate-300">{station.unit_id || 'N/A'}</span></span>
                        {station.district && (
                          <>
                            <span>•</span>
                            <span>District: <span className="text-slate-300">{station.district}</span></span>
                          </>
                        )}
                        {station.latitude && station.longitude && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">
                              {Number(station.latitude).toFixed(4)}, {Number(station.longitude).toFixed(4)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Volume Progress Bar */}
                  <div className="flex-1 max-w-md w-full space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Crime Volume Share</span>
                      <span className="text-slate-200 font-semibold">{percentage}% ({caseCount} cases)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHighVolume
                            ? 'bg-gradient-to-r from-red-500 to-amber-500'
                            : isModerateVolume
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
