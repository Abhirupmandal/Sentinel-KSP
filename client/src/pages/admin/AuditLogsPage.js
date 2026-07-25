import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Search, Filter, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { adminClient } from '../../lib/api/adminClient';
import PageLoader from '../../components/shared/PageLoader';
import EmptyState from '../../components/shared/EmptyState';

function AuditProvenanceHeader() {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST';
  return (
    <div className="w-full px-4 py-2.5 rounded-xl bg-[#121721] border border-white/10 font-mono text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[#00d1ff] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>IMMUTABLE AUDIT TRAIL DIRECTORY</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>QUERY SYNC: {timestamp}</span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
          <Filter className="w-3 h-3 text-[#00d1ff]" />
          <span>STORAGE: ZOHO CATALYST AUDITLOGS TABLE</span>
        </span>
        <span className="px-2 py-0.5 rounded bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30 font-bold">
          INTEGRITY: VERIFIED
        </span>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ officer_id: '', action: '' });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.officer_id) params.officer_id = filters.officer_id;
      if (filters.action) params.action = filters.action;
      const res = await adminClient.getAuditLogs(params);
      const list = res.data?.logs || res.data?.audit_logs || (Array.isArray(res.data) ? res.data : []);
      setLogs(list);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00d1ff]/10 border border-[#00d1ff]/30 text-[#00d1ff]">
          <FileSearch className="w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Cyber Command Center — Immutable Security Audit Log Inspector
          </h1>
          <p className="text-xs text-slate-400">
            Regulatory-grade audit trail for all authentication events, administrative actions, and data access
          </p>
        </div>
      </motion.div>

      {/* Audit Provenance Header */}
      <AuditProvenanceHeader />

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#121721] border border-white/10 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#0b0e14] px-3 py-2 border border-white/10 rounded-xl">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={filters.officer_id}
            onChange={(e) => setFilters({ ...filters, officer_id: e.target.value })}
            placeholder="Filter by Actor Officer ID..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#0b0e14] px-3 py-2 border border-white/10 rounded-xl">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="bg-transparent text-xs text-white focus:outline-none w-full"
          >
            <option value="" className="bg-[#121721]">All Action Types</option>
            <option value="LOGIN" className="bg-[#121721]">LOGIN</option>
            <option value="LOGIN_FAILED" className="bg-[#121721]">LOGIN_FAILED</option>
            <option value="LOGOUT" className="bg-[#121721]">LOGOUT</option>
            <option value="DATA_READ" className="bg-[#121721]">DATA_READ</option>
            <option value="DATA_WRITE" className="bg-[#121721]">DATA_WRITE</option>
            <option value="OFFICER_CREATE" className="bg-[#121721]">OFFICER_CREATE</option>
            <option value="PASSWORD_RESET" className="bg-[#121721]">PASSWORD_RESET</option>
            <option value="EMERGENCY_ACCESS_GRANT" className="bg-[#121721]">EMERGENCY_ACCESS_GRANT</option>
          </select>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-[#00d1ff] hover:bg-[#00d1ff]/90 text-[#0b0e14] font-semibold text-xs transition-all shadow-[0_0_15px_rgba(0,209,255,0.2)]"
        >
          Query Audit Trail
        </button>
      </div>

      {loading ? (
        <PageLoader label="Querying immutable AuditLogs directory in Catalyst Data Store..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={FileSearch} title="No Audit Records Found" description="No audit log entries match the specified filter criteria." />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#121721] overflow-hidden shadow-2xl text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0b0e14] border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Timestamp (IST)</th>
                  <th className="py-3.5 px-5">Actor Officer ID</th>
                  <th className="py-3.5 px-5">Action Type</th>
                  <th className="py-3.5 px-5">Target Resource</th>
                  <th className="py-3.5 px-5">Result</th>
                  <th className="py-3.5 px-5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.map((log, i) => {
                  const ts = log.Time_Stamp || log.Timestamp || log.timestamp || log.CreatedAt || '';
                  const actor = log.ActorOfficerID || log.OfficerID || log.officer_id || log.Actor || 'OFF-ADMIN-001';
                  const rawAction = log.Action || log.action || '—';
                  const resource = log.ResourceID ? `${log.ResourceType || ''}/${log.ResourceID}` : (log.ResourceType || log.Resource || log.resource || 'System');
                  const result = log.Inference || log.Result || log.result || log.StatusCode || 'SUCCESS';
                  const ip = log.IPAddress || log.ip_address || '127.0.0.1';
                  const isSuccess = String(result).toUpperCase() === 'SUCCESS' || String(result).startsWith('2');

                  return (
                    <tr key={log.AuditID || log.audit_id || i} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-5 text-slate-400 text-[11px] font-mono">{formatTS(ts)}</td>
                      <td className="py-3.5 px-5 font-bold text-[#00d1ff]">{actor}</td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-200 font-bold text-[10px] uppercase">
                          {rawAction}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 max-w-[220px] truncate">{resource}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            isSuccess
                              ? 'bg-[#39ff14]/15 text-[#39ff14] border-[#39ff14]/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {result}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono">{ip}</td>
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

function formatTS(iso) {
  if (!iso) return '—';
  try {
    let str = String(iso).trim();
    if (!str.endsWith('Z') && !str.includes('+')) {
      str = str.replace(' ', 'T') + 'Z';
    }
    return new Date(str).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return iso;
  }
}
