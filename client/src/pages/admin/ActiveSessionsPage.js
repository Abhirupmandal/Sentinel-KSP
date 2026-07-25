import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MonitorDot, LogOut, RefreshCw, Users, Clock, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import { adminClient } from '../../lib/api/adminClient';
import PageLoader from '../../components/shared/PageLoader';
import EmptyState from '../../components/shared/EmptyState';
import { useToast } from '../../context/ToastContext';

function SessionProvenanceHeader() {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST';
  return (
    <div className="w-full px-4 py-2.5 rounded-xl bg-[#121721] border border-white/10 font-mono text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[#00d1ff] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SESSION GOVERNANCE REGISTRY</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>REAL-TIME AUDIT: {timestamp}</span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
          <Filter className="w-3 h-3 text-[#00d1ff]" />
          <span>POLICY: SINGLE ACTIVE SESSION ENFORCED</span>
        </span>
        <span className="px-2 py-0.5 rounded bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30 font-bold">
          SLIDING TIMEOUT: 15 MIN
        </span>
      </div>
    </div>
  );
}

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await adminClient.getActiveSessions();
      const list = res.data?.sessions || (Array.isArray(res.data) ? res.data : []);
      setSessions(list);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleForceLogout = async (officerId) => {
    try {
      await adminClient.forceLogout(officerId);
      addToast(`Session for ${officerId} terminated successfully`, 'success');
      fetchSessions();
    } catch (err) {
      addToast(err.message || 'Force logout failed', 'error');
    }
  };

  const activeCount = sessions.length;

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00d1ff]/10 border border-[#00d1ff]/30 text-[#00d1ff]">
            <MonitorDot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Cyber Command Center — Active Session Governance & Termination
            </h1>
            <p className="text-xs text-slate-400">
              Real-time monitoring of all authenticated officer sessions across police workstations
            </p>
          </div>
        </div>
        <button
          onClick={fetchSessions}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#00d1ff]" /> Refresh Registry
        </button>
      </motion.div>

      {/* Session Provenance Header */}
      <SessionProvenanceHeader />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard icon={Users} label="TOTAL ACTIVE SESSIONS" value={activeCount} color="cyan" />
        <MetricCard icon={MonitorDot} label="UNIQUE WORKSTATION IPS" value={new Set(sessions.map(s => s.IPAddress || s.ip_address || '127.0.0.1')).size} color="emerald" />
        <MetricCard icon={Clock} label="AVERAGE INACTIVITY AGE" value={calcAvgAge(sessions)} color="amber" />
      </div>

      {loading ? (
        <PageLoader label="Querying active session registry from Catalyst Data Store..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState icon={MonitorDot} title="No Active Sessions Registered" description="There are currently no active authenticated officer sessions in the datastore." />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#121721] overflow-hidden shadow-2xl text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0b0e14] border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Officer ID</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">IP Address</th>
                  <th className="py-3.5 px-5">Device Fingerprint</th>
                  <th className="py-3.5 px-5">Last Activity Time</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {sessions.map((s, i) => {
                  const oid = s.OfficerID || s.officer_id || 'N/A';
                  const role = s.Role || s.role || 'CyberSecurityAdministrator';
                  const ip = s.IPAddress || s.ip_address || '127.0.0.1';
                  const device = (s.DeviceFingerprint || s.device_fingerprint || '').slice(0, 16) || '—';
                  const lastAct = s.LastActivityTime || s.last_activity || s.CreatedAt || s.created_at || '';

                  return (
                    <tr key={s.SessionID || s.session_id || i} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#00d1ff]">{oid}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                          {role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">{ip}</td>
                      <td className="py-3.5 px-5 text-slate-400">{device}</td>
                      <td className="py-3.5 px-5 text-slate-400">{formatTime(lastAct)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleForceLogout(oid)}
                          title="Terminate Officer Session"
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Terminate</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color = 'cyan' }) {
  const colorMap = {
    cyan: 'bg-[#00d1ff]/10 border-[#00d1ff]/30 text-[#00d1ff]',
    emerald: 'bg-[#39ff14]/10 border-[#39ff14]/30 text-[#39ff14]',
    amber: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
  };
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]} bg-[#121721]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-wider text-slate-400 font-bold">{label}</span>
        <Icon className="w-4 h-4 opacity-80" />
      </div>
      <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    let str = String(iso).trim();
    if (!str.endsWith('Z') && !str.includes('+')) {
      str = str.replace(' ', 'T') + 'Z';
    }
    return new Date(str).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function calcAvgAge(sessions) {
  if (!sessions.length) return '—';
  const now = Date.now();
  const ages = sessions.map(s => {
    const created = s.LastActivityTime || s.CreatedAt || s.created_at;
    if (!created) return 0;
    let str = String(created).trim();
    if (!str.endsWith('Z') && !str.includes('+')) {
      str = str.replace(' ', 'T') + 'Z';
    }
    return (now - new Date(str).getTime()) / 60000;
  }).filter(a => a > 0);
  if (!ages.length) return '1m';
  const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
  return avg < 60 ? `${Math.round(avg)}m` : `${(avg / 60).toFixed(1)}h`;
}
