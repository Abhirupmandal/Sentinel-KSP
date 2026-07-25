import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  FileText,
  Building2,
  RefreshCw,
  Search,
  Network,
  AlertCircle,
} from 'lucide-react';
import { linkAnalysisClient } from '../../lib/api/linkAnalysisClient';

export default function OffenderProfilePage() {
  const { accusedId } = useParams();
  const [targetId, setTargetId] = useState(accusedId || 'ACC-2026-2031');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await linkAnalysisClient.getOffenderProfile(id);
      if (res && res.data) {
        setData(res.data);
      } else {
        setData(res || null);
      }
    } catch (err) {
      console.error('Failed to fetch offender profile:', err);
      setError(err?.message || `Failed to fetch criminal profile for Accused ID: ${id}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(targetId);
  }, [targetId]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Repeat Offender Criminal Profile</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidated criminal footprint joining FIR records across multiple police jurisdictions
              </p>
            </div>
          </div>
        </div>

        {/* Accused ID Lookup Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Accused ID (e.g. ACC-2026-2031)..."
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent w-64"
            />
          </div>
          <button
            onClick={() => fetchProfile(targetId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            <span>Search</span>
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{data?.name || data?.Name || (loading ? 'Loading...' : 'Accused Record')}</h2>
              <p className="text-xs text-accent font-medium">{data?.alias || data?.ArrestStatus || 'Active Subject'}</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Accused ID</span>
              <span className="text-white">{data?.accused_id || data?.AccusedID || targetId}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Arrest / Case Status</span>
              <span className="text-amber-400 font-semibold">{data?.ArrestStatus || data?.arrest_status || 'Under Investigation'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Age / Gender</span>
              <span className="text-slate-200">{data?.Age || data?.age || 'N/A'} yrs / {data?.Gender || data?.gender || 'N/A'}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Linked Case ID</span>
              <span className="text-emerald-400 font-bold">{data?.CaseID || data?.case_id || 'N/A'}</span>
            </div>
          </div>
        </motion.div>

        {/* Linked FIRs & Associates Workspace */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <span>Cross-Jurisdictional FIR Footprint</span>
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          ) : (data?.linked_firs || []).length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Linked Case: {data?.CaseID || 'N/A'}</span>
              </div>
              <div className="text-slate-400">{data?.MODetails || data?.modus_operandi || 'Modus operandi record verified in KSP crime repository.'}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.linked_firs || []).map((fir, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{fir.fir_number || fir.FIRNumber}</span>
                      <span className="text-slate-400 font-normal">• {fir.crime_head || fir.CrimeHead}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{fir.unit_name || fir.UnitID}</span>
                    </div>
                  </div>
                  <span className="text-slate-400">{fir.offense_date || fir.OffenseDate}</span>
                </div>
              ))}
            </div>
          )}

          {/* Modus Operandi & Accused Details */}
          {data?.MODetails && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-400" />
                <span>Modus Operandi Details</span>
              </h4>
              <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                {data.MODetails}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
