import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  ShieldAlert,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { predictiveClient } from '../../lib/api/predictiveClient';

export default function BehavioralAnomalyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(0.75);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const fetchAnomalies = async (currentThreshold) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictiveClient.getBehavioralAnomalies('', currentThreshold);
      if (res && res.data) {
        setData(res.data);
      } else {
        setData(res || null);
      }
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
      setError(err?.message || 'Failed to retrieve anomaly analysis from backend.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies(threshold);
  }, [threshold]);

  const anomalies = data?.anomalies || [];
  const filteredAnomalies = anomalies.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.case_id || '').toLowerCase().includes(q) ||
      (a.fir_number || '').toLowerCase().includes(q) ||
      (a.district || '').toLowerCase().includes(q) ||
      (a.crime_head || '').toLowerCase().includes(q) ||
      (a.flag || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Behavioral Anomaly Detection</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated statistical anomaly detection across incident velocity and MO signatures
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Sensitivity Cutoff:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value={0.65}>0.65 (Sensitive)</option>
              <option value={0.75}>0.75 (Standard)</option>
              <option value={0.85}>0.85 (High Precision)</option>
            </select>
          </div>

          <button
            onClick={() => fetchAnomalies(threshold)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FIR, case ID or anomaly flag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Anomalies Table / Cards */}
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No anomalies detected</div>
            <div className="text-xs text-slate-500">No crime reports exceed the sensitivity threshold of {threshold}.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnomalies.map((item, index) => {
              const score = item.anomaly_score || 0;
              const isSevere = score >= 0.85;

              return (
                <motion.div
                  key={item.case_id || index}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl border mt-0.5 ${
                      isSevere
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.case_id || 'Case Record'}</span>
                        <span className="text-xs text-slate-400">({item.fir_number || 'N/A'})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isSevere
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {(item.flag || 'OUTLIER').replace('SPATIAL_CLUSTER_OUTLIER', 'Anomalous Pattern').replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{item.district || 'Unknown Jurisdiction'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>{item.crime_head || 'General Crime'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Anomaly Score Display */}
                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Anomaly Score</div>
                      <div className={`text-lg font-bold ${isSevere ? 'text-red-400' : 'text-amber-400'}`}>
                        {(score * 100).toFixed(0)}/100
                      </div>
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
