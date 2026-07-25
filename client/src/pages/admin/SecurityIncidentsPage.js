import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminClient } from '../../lib/api/adminClient';
import PageLoader from '../../components/shared/PageLoader';
import EmptyState from '../../components/shared/EmptyState';

export default function SecurityIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await adminClient.getSecurityIncidents();
      const list = res.data?.incidents || (Array.isArray(res.data) ? res.data : []);
      setIncidents(list);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch security incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  const priorityColor = (p) => {
    const pr = (p || '').toLowerCase();
    if (pr === 'critical') return 'bg-red-500/10 border-red-500/30 text-red-400';
    if (pr === 'high') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    if (pr === 'medium') return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    return 'bg-slate-800/60 border-slate-700 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-semibold text-white tracking-tight">Security Incident Console</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-7">
          Automated threat detection alerts — failed login spikes, suspicious devices, and rate-limit violations.
        </p>
      </motion.div>

      {loading ? (
        <PageLoader label="Loading security incidents..." />
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" /><span>{error}</span>
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No Security Incidents"
          description="No automated security incidents have been detected. The environment is secure." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents.map((inc, i) => {
            const priority = inc.Severity || inc.severity || inc.Priority || inc.priority || 'Medium';
            const rawTitle = inc.IncidentType || inc.incident_type || inc.Title || inc.title || inc.Type || 'Security Incident';
            const title = rawTitle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            const desc = inc.Description || inc.description || 'No description available.';
            const ts = inc.CreatedAt || inc.created_at || inc.DetectedAt || inc.detected_at || '';
            const resolved = (inc.Status || inc.status || '').toLowerCase() === 'resolved' || inc.Resolved || false;

            return (
              <div key={inc.IncidentID || i}
                className={`p-5 rounded-2xl border backdrop-blur-md ${priorityColor(priority)}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{priority}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{title}</h3>
                  </div>
                  {resolved && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{desc}</p>
                <div className="text-[10px] text-slate-500">Detected: {formatTS(ts)}</div>
              </div>
            );
          })}
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
    return new Date(str).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
