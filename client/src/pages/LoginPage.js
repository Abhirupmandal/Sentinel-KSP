import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User, AlertTriangle, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/shared/BrandLogo';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(employeeId.trim(), password);
      if (result.officer?.temp_password_flag) {
        navigate('/change-password', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const status = err.status;
      if (status === 409) {
        setError('An active session already exists for this Officer ID on another device. Per KSP security policies, concurrent logins are prohibited. Please terminate your active session first.');
      } else if (status === 403) {
        setError('Your officer account access is currently restricted. Please contact your Cyber Security Administrator.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your Employee ID and credential password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col justify-between items-center p-6 text-slate-100 font-sans selection:bg-[#00d1ff]/30">
      {/* Top Classification Banner */}
      <div className="w-full max-w-5xl flex items-center justify-between border-b border-white/10 pb-4 pt-2">
        <BrandLogo />

        <div className="flex items-center gap-2 px-3 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold tracking-widest uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RESTRICTED — LAW ENFORCEMENT ONLY</span>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="w-full my-auto flex justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md bg-[#121721] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top subtle accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d1ff] to-transparent opacity-80" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-[#00d1ff]/10 border border-[#00d1ff]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,209,255,0.2)]">
              <Shield className="w-6 h-6 text-[#00d1ff]" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Sentinel<span className="text-[#00d1ff]">-KSP</span> Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Authenticate Credential Access
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-400 text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-2">
                Employee ID / Officer ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. KSP-ADMIN-001"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00d1ff] focus:ring-1 focus:ring-[#00d1ff] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-2">
                Credential Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0e14] border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00d1ff] focus:ring-1 focus:ring-[#00d1ff] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00d1ff] hover:bg-[#00d1ff]/90 text-[#0b0e14] font-semibold text-sm rounded-xl shadow-[0_0_15px_rgba(0,209,255,0.25)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Authenticating Directory...</span>
              ) : (
                <>
                  <span>Authenticate & Access Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Admin Box */}
          <div className="mt-7 p-3.5 bg-[#0b0e14] border border-white/10 rounded-xl font-mono text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-300 mb-1.5">
              <Key className="w-3.5 h-3.5 text-[#00d1ff]" />
              <span>Demo Administrator Credential</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Employee ID: <span className="text-white font-bold">KSP-ADMIN-001</span><br />
              Password: <span className="text-white font-bold">KSPAdmin@2026!</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer Legal & Provenance */}
      <footer className="w-full max-w-5xl border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
        <div>
          Karnataka State Police Cyber Command Portal © 2026
        </div>
        <div>
          Authorized Law Enforcement Personnel Only • All Access Logged
        </div>
      </footer>
    </div>
  );
}
