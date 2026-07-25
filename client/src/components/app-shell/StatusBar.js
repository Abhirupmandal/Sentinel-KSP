import { ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StatusBar() {
  const { user, token } = useAuth();

  if (!user || !token) return null;

  // Extract session truncated ID
  const sessionId = token.slice(-8).toUpperCase();

  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-6 flex items-center justify-between text-[11px] text-slate-500 z-30">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Session: <span className="text-slate-300">SES-{sessionId}</span></span>
        </span>
        <span className="hidden md:inline">|</span>
        <span className="hidden md:inline">Officer ID: <span className="text-slate-300">{user.officer_id || user.employee_id}</span></span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Session Timeout: 15m</span>
        </span>
        <span>Karnataka State Police — Secure Channel</span>
      </div>
    </footer>
  );
}
