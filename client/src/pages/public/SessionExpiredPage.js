import { motion } from 'framer-motion';
import { Clock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100 relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
          <Clock className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
          Session Expired
        </h1>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Your active session has automatically expired after 15 minutes of inactivity per KSP Security Governance. Please log in again to resume your workstation session.
        </p>

        <button
          onClick={() => navigate('/login', { replace: true })}
          className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
        >
          <LogIn className="w-4 h-4" />
          Sign In to Sentinel Engine
        </button>
      </motion.div>
    </div>
  );
}
