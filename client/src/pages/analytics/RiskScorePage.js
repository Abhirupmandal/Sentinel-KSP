import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  RefreshCw,
  Cpu,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { predictiveClient } from '../../lib/api/predictiveClient';

const DISTRICTS = [
  'Bengaluru Urban',
  'Delhi NCR',
  'Mumbai',
  'Kolkata',
  'Hyderabad',
  'Pune',
];

export default function RiskScorePage() {
  const [selectedDistrict, setSelectedDistrict] = useState('Bengaluru Urban');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRiskScore = async (district) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictiveClient.getRiskScore(district);
      if (res && res.data) {
        setData(res.data);
      } else {
        setData(res || null);
      }
    } catch (err) {
      console.error('Failed to fetch risk score:', err);
      setError(err?.message || 'Failed to fetch risk score from backend service.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskScore(selectedDistrict);
  }, [selectedDistrict]);

  const riskAnalysis = data?.predictive_analysis || {};
  const riskScore = typeof riskAnalysis.risk_score === 'number' ? riskAnalysis.risk_score : 0;
  const riskLevel = riskAnalysis.risk_level || 'LOW';
  const confidence = riskAnalysis.confidence || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Predictive Risk Scoring Framework</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                AI & ML-assisted composite threat risk index for police districts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-accent"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchRiskScore(selectedDistrict)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
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

      {/* Primary Risk Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Dial / Gauge Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Composite Risk Score</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              riskLevel === 'HIGH'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : riskLevel === 'MEDIUM'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {riskLevel} RISK
            </span>
          </div>

          <div className="text-center py-4 space-y-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="text-5xl font-extrabold text-white tracking-tight font-mono">
                {loading ? '...' : (riskScore * 100).toFixed(0)}
                <span className="text-2xl font-normal text-slate-500">/100</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Predicted Incident Probability Index
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  riskScore >= 0.7
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : riskScore >= 0.4
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.round(riskScore * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 (Minimal Risk)</span>
              <span>50 (Moderate)</span>
              <span>100 (Critical)</span>
            </div>
          </div>
        </motion.div>

        {/* Intelligence Breakdown Details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              <span>Predictive Model Insights — {selectedDistrict}</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Jurisdiction: {selectedDistrict}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Historical Samples</div>
              <div className="text-lg font-bold text-white">{data?.total_historical_cases ?? 0} cases</div>
              <div className="text-[10px] text-slate-500">Analyzed in training window</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Model Confidence</div>
              <div className="text-lg font-bold text-emerald-400">{(confidence * 100).toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500">Statistical reliability score</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Threat Matrix Scope</div>
              <div className="text-sm font-semibold text-accent truncate">Multi-Vector Crime Index</div>
              <div className="text-[10px] text-slate-500">Karnataka Police Intelligence Core</div>
            </div>
          </div>

          {/* Model Status */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200">District Incident Risk Assessment — Monitoring</span>
            </div>
            <span className="font-semibold text-emerald-400">● Operational</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
