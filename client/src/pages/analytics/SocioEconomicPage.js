import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  RefreshCw,
  Users,
  BookOpen,
  Briefcase,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { predictiveClient } from '../../lib/api/predictiveClient';

export default function SocioEconomicPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSocioEconomic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictiveClient.getSocioEconomicLayer();
      if (res && res.data) {
        setData(res.data);
      } else {
        setData(res || null);
      }
    } catch (err) {
      console.error('Failed to fetch socio-economic correlations:', err);
      setError(err?.message || 'Failed to load socio-economic layer data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocioEconomic();
  }, []);

  const summary = data?.summary || {};
  const districts = data?.districts || [];
  const factors = summary.correlation_factors || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Socio-Economic Correlation Layer</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Demographic overlay mapping crime density against population density, literacy, and employment
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchSocioEconomic}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-colors self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
          <span>Refresh</span>
        </button>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Correlation Coefficients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Urban Density Factor</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">+{factors.density_to_crime ?? 0.74}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Strong Correlation</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Population density vs incident frequency</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unemployment Coefficient</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">+{factors.unemployment_to_crime ?? 0.68}</span>
            <span className="text-[10px] text-amber-400 font-medium">Moderate Impact</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Unemployment index vs financial crime rate</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Literacy Buffer Index</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{factors.literacy_inverse_correlation ?? -0.52}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Inverse Buffer</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Literacy rate inverse correlation</div>
        </motion.div>
      </div>

      {/* District Macro Demographic Breakdown Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent" />
          <span>Regional Socio-Demographic & Crime Rates</span>
        </h2>

        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Population Density</th>
                  <th className="px-4 py-3">Literacy Rate</th>
                  <th className="px-4 py-3">Unemployment Index</th>
                  <th className="px-4 py-3 text-right">Crime Rate / 100k</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {districts.map((d, idx) => (
                  <tr key={d.district || idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-white">{d.district}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">{d.population_density_per_sq_km} / sq.km</td>
                    <td className="px-4 py-3.5 font-mono text-emerald-400">{d.literacy_rate_percent}%</td>
                    <td className="px-4 py-3.5 font-mono text-amber-400">{d.unemployment_index}%</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-accent text-right">{d.crime_rate_per_100k}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
