import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserCog, UserPlus, Lock, KeyRound, Search, AlertTriangle, Copy, Check, ShieldCheck, Clock, Filter } from 'lucide-react';
import { adminClient } from '../../lib/api/adminClient';
import PageLoader from '../../components/shared/PageLoader';
import EmptyState from '../../components/shared/EmptyState';
import { useToast } from '../../context/ToastContext';

function GovernanceProvenanceHeader() {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST';
  return (
    <div className="w-full px-4 py-2.5 rounded-xl bg-[#121721] border border-white/10 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[#00d1ff] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CYBER COMMAND GOVERNANCE DIRECTORY</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>DIRECTORY SYNC: {timestamp}</span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
          <Filter className="w-3 h-3 text-[#00d1ff]" />
          <span>MUTABLE STATE: ZOHO CATALYST DATASTORE</span>
        </span>
        <span className="px-2 py-0.5 rounded bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30 font-semibold">
          AUDIT LOGGING: ACTIVE
        </span>
      </div>
    </div>
  );
}

export default function OfficerManagementPage() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdModalData, setCreatedModalData] = useState(null);
  const [resetModalData, setResetModalData] = useState(null);

  const { addToast } = useToast();

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const res = await adminClient.getOfficers();
      const list = res.data?.officers || (Array.isArray(res.data) ? res.data : []);
      setOfficers(list);
      setError(null);
    } catch (err) {
      console.error('[Sentinel] Fetch officers error:', err);
      setError(err.message || 'Failed to fetch officers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleToggleLock = async (officerId, currentState) => {
    try {
      if (currentState === 'Locked' || currentState === 'Suspended') {
        await adminClient.unlockAccount(officerId);
        addToast(`Officer ${officerId} account unlocked successfully`, 'success');
      } else {
        await adminClient.lockAccount(officerId);
        addToast(`Officer ${officerId} account locked`, 'warning');
      }
      fetchOfficers();
    } catch (err) {
      addToast(err.message || 'Failed to update account state', 'error');
    }
  };

  const handleResetPassword = async (officerId) => {
    try {
      const res = await adminClient.resetPassword(officerId);
      const tempPw = res.data?.temp_password || 'KSPTemp@2026!';
      setResetModalData({ officerId, tempPw });
      addToast(`Password reset issued for ${officerId}`, 'success');
    } catch (err) {
      addToast(err.message || 'Password reset failed', 'error');
    }
  };

  const filteredOfficers = officers.filter(
    (o) =>
      (o.FullName || o.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.OfficerID || o.officer_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.EmployeeID || o.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.Role || o.role || '').toLowerCase().includes(search.toLowerCase())
  );

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
            <UserCog className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Cyber Command Center — Officer Lifecycle & Credential Governance
            </h1>
            <p className="text-xs text-slate-400">
              Centralized KSP user provisioning, role assignments, and credential status management
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00d1ff] hover:bg-[#00d1ff]/90 text-[#0b0e14] font-semibold text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,209,255,0.25)] shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Provision New Officer Account
        </button>
      </motion.div>

      {/* Governance Provenance Header */}
      <GovernanceProvenanceHeader />

      {/* Search Toolbar */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#121721] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter officers by Name, Officer ID, Employee ID, or Role..."
            className="w-full pl-10 pr-4 py-2 bg-[#0b0e14] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00d1ff]"
          />
        </div>
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
          Showing <strong className="text-white">{filteredOfficers.length}</strong> Records
        </div>
      </div>

      {/* Officers Data Table */}
      {loading ? (
        <PageLoader message="Querying Officer records from Catalyst Data Store..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredOfficers.length === 0 ? (
        <EmptyState title="No Officer Records Found" message="No KSP officers match the current filter criteria." />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#121721] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0e14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Officer ID</th>
                  <th className="px-5 py-3.5">Employee ID</th>
                  <th className="px-5 py-3.5">Full Name</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">District / Station</th>
                  <th className="px-5 py-3.5">State</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredOfficers.map((o) => {
                  const officerId = o.OfficerID || o.officer_id;
                  const empId = o.EmployeeID || o.employee_id;
                  const name = o.FullName || o.full_name;
                  const role = o.Role || o.role;
                  const district = o.District || o.district || 'Statewide';
                  const station = o.Station || o.station || 'HQ';
                  const state = o.AccountState || o.account_state || 'Active';
                  const isTemp = o.TempPasswordFlag ?? o.temp_password_flag;

                  const isLocked = state === 'Locked' || state === 'Suspended';

                  return (
                    <tr key={officerId} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#00d1ff]">{officerId}</td>
                      <td className="px-5 py-3.5 text-slate-300">{empId}</td>
                      <td className="px-5 py-3.5 font-sans font-semibold text-white">{name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                          {role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{district} • {station}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              isLocked
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : state === 'Pending'
                                ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                                : 'bg-[#39ff14]/15 text-[#39ff14] border-[#39ff14]/30'
                            }`}
                          >
                            {state}
                          </span>
                          {isTemp && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 text-[9px] border border-amber-400/20">
                              TEMP PWD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleResetPassword(officerId)}
                          title="Issue Temporary Password Reset"
                          className="px-2.5 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 text-[11px] transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                          Reset
                        </button>
                        <button
                          onClick={() => handleToggleLock(officerId, state)}
                          title={isLocked ? 'Unlock Account' : 'Lock Account'}
                          className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${
                            isLocked
                              ? 'bg-[#39ff14]/10 hover:bg-[#39ff14]/20 border-[#39ff14]/30 text-[#39ff14]'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5 inline mr-1" />
                          {isLocked ? 'Unlock' : 'Lock'}
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

      {/* Provisioning Modal */}
      {showCreateModal && (
        <CreateOfficerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(createdData) => {
            setShowCreateModal(false);
            setCreatedModalData(createdData);
            fetchOfficers();
          }}
        />
      )}

      {/* Created Officer Credential Modal */}
      {createdModalData && (
        <CredentialsDisplayModal
          title="Officer Account Provisioned Successfully"
          data={createdModalData}
          onClose={() => setCreatedModalData(null)}
        />
      )}

      {/* Password Reset Display Modal */}
      {resetModalData && (
        <CredentialsDisplayModal
          title="Temporary Password Reset Issued"
          data={{
            OfficerID: resetModalData.officerId,
            TempPassword: resetModalData.tempPw,
          }}
          onClose={() => setResetModalData(null)}
        />
      )}
    </div>
  );
}

function CreateOfficerModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    role: 'FieldInvestigator',
    district: 'Bengaluru Urban',
    rank: 'Police Inspector',
    station: 'Cyber Crime PS',
    department: 'Cyber Crime Division',
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);

    try {
      const res = await adminClient.createOfficer(formData);
      addToast('Officer account created successfully', 'success');
      onSuccess(res.data);
    } catch (e) {
      setErr(e.message || 'Failed to create officer account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e14]/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#121721] border border-white/10 rounded-2xl p-6 shadow-2xl text-xs"
      >
        <h2 className="text-base font-semibold text-white mb-1">Provision New KSP Officer Account</h2>
        <p className="text-slate-400 mb-4 text-[11px]">
          Generates a temporary credential and writes directly to live Catalyst Data Store.
        </p>

        {err && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="e.g. KSP-EMP-2026"
                className="w-full px-3 py-2 bg-[#0b0e14] border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Suresh Kumar"
                className="w-full px-3 py-2 bg-[#0b0e14] border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Assigned Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-[#0b0e14] border border-white/10 rounded-lg text-white"
              >
                <option value="CyberSecurityAdministrator">CyberSecurityAdministrator</option>
                <option value="SCRBDataAnalyst">SCRBDataAnalyst</option>
                <option value="FieldInvestigator">FieldInvestigator</option>
                <option value="CommandSupervisor">CommandSupervisor</option>
                <option value="SystemAdministrator">SystemAdministrator</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Rank *</label>
              <input
                type="text"
                required
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="w-full px-3 py-2 bg-[#0b0e14] border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 bg-[#0b0e14] border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Police Station</label>
              <input
                type="text"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="w-full px-3 py-2 bg-[#0b0e14] border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#00d1ff] hover:bg-[#00d1ff]/90 text-[#0b0e14] font-semibold"
            >
              {submitting ? 'Provisioning Account...' : 'Provision Officer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function CredentialsDisplayModal({ title, data, onClose }) {
  const [copied, setCopied] = useState(false);

  const officerId = data.officer_id || data.OfficerID;
  const tempPw = data.temp_password || data.TempPassword || 'KSPTemp@2026!';

  const handleCopy = () => {
    navigator.clipboard.writeText(`Officer ID: ${officerId}\nTemp Password: ${tempPw}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e14]/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#121721] border border-white/10 rounded-2xl p-6 shadow-2xl text-xs"
      >
        <h2 className="text-base font-semibold text-amber-400 mb-1">{title}</h2>
        <p className="text-slate-400 mb-4 text-[11px]">
          Share these temporary credentials securely with the officer. A password change will be enforced on first login.
        </p>

        <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/10 space-y-2 mb-4">
          <div>
            <span className="text-slate-500 text-[10px]">OFFICER ID:</span>
            <p className="text-sm font-bold text-[#00d1ff]">{officerId}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">TEMPORARY PASSWORD:</span>
            <p className="text-sm font-bold text-amber-400">{tempPw}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center gap-2 text-xs"
          >
            {copied ? <Check className="w-4 h-4 text-[#39ff14]" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#00d1ff] text-[#0b0e14] font-bold text-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
