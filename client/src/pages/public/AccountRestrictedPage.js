import { motion } from 'framer-motion';
import { Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountRestrictedPage() {
  const { user, logout } = useAuth();
  const state = user?.account_state || user?.accountState || 'Restricted';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
          Account Access Restricted
        </h1>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Your account status is currently set to <span className="text-red-400 font-semibold">{state}</span>. Access to Sentinel-KSP intelligence workspaces is restricted. Please contact your Cyber Security Administrator.
        </p>

        <button
          onClick={logout}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          End Session & Exit
        </button>
      </motion.div>
    </div>
  );
}
