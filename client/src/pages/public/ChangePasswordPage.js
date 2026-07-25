import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Check, X, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/utils';
import { getRoleLandingRoute } from '../../lib/permissions';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Password Policy Checks
  const checks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    different: currentPassword.length > 0 && newPassword !== currentPassword,
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isFormValid = Object.values(checks).every(Boolean) && currentPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setLoading(true);

    try {
      const data = await fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (data.success === false) {
        throw new Error(data.message || 'Password update failed');
      }

      if (setUser && user) {
        setUser({ ...user, temp_password_flag: false, account_state: 'Active' });
      }

      const landing = getRoleLandingRoute(user?.role);
      navigate(landing, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to update password. Please verify your current temporary password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col justify-between items-center p-6 text-slate-100 font-sans selection:bg-[#00d1ff]/30">
      {/* Top Banner */}
      <div className="w-full max-w-5xl flex items-center justify-between border-b border-white/10 pb-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Key className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              KARNATAKA STATE POLICE
            </h2>
            <p className="text-[10px] text-slate-400">
              Cyber Command Directorate • Credential Security Mandate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-[10px] font-bold tracking-widest uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>MANDATORY FIRST-LOGIN CREDENTIAL UPDATE</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full my-auto flex justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-[#121721] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top amber accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Credential Password Update
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Direct Datastore Update Required Before System Access
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                Current Temporary Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none text-xs text-white placeholder-slate-600"
                placeholder="Enter temporary password"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none text-xs font-mono text-white placeholder-slate-600"
                placeholder="Enter strong new password"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none text-xs font-mono text-white placeholder-slate-600"
                placeholder="Re-enter new password"
              />
            </div>

            {/* KSP Policy Checklist */}
            <div className="p-3.5 rounded-xl bg-[#0b0e14] border border-white/10 space-y-1.5 text-[11px]">
              <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">
                KSP Credential Policy Mandates:
              </span>
              <PolicyItem label="Minimum 8 characters" valid={checks.length} />
              <PolicyItem label="One uppercase letter (A-Z)" valid={checks.uppercase} />
              <PolicyItem label="One numeric digit (0-9)" valid={checks.number} />
              <PolicyItem label="One special character (!@#$%^&*)" valid={checks.special} />
              <PolicyItem label="Different from temporary password" valid={checks.different} />
              <PolicyItem label="Password fields match" valid={checks.match} />
            </div>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-400/90 disabled:opacity-40 text-[#0b0e14] font-semibold text-xs transition-all shadow-[0_0_15px_rgba(251,191,36,0.25)] mt-2"
            >
              {loading ? 'Encrypting & Updating Hash...' : 'Update Password & Activate Account'}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Footer Legal & Provenance */}
      <footer className="w-full max-w-5xl border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
        <div>
          Karnataka State Police Directorate © 2026
        </div>
        <div>
          Credential Cryptographic Hash Updated Directly in Zoho Catalyst Data Store
        </div>
      </footer>
    </div>
  );
}

function PolicyItem({ label, valid }) {
  return (
    <div className={`flex items-center gap-2 ${valid ? 'text-[#39ff14]' : 'text-slate-500'}`}>
      {valid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
  );
}
