import { motion } from 'framer-motion';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleLandingRoute } from '../../lib/permissions';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const landing = getRoleLandingRoute(user?.role);

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
          <ShieldOff className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
          403 Access Denied
        </h1>
        
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Your active role (<span className="text-accent font-semibold">{user?.role || 'Guest'}</span>) does not possess permission to access this module under KSP RBAC policies.
        </p>

        <button
          onClick={() => navigate(landing, { replace: true })}
          className="w-full py-3 px-4 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Authorized Workspace
        </button>
      </motion.div>
    </div>
  );
}
