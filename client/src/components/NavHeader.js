import { Activity, Moon, Sun, Shield, LogOut, Radio, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { cn, API_URL } from '../lib/utils';
import { useEffect, useState } from 'react';

function StatusBadge() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (mounted) setStatus(res.ok ? 'online' : 'error');
      } catch (err) {
        if (mounted) setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const statusConfig = {
    online: { label: 'COMMAND ONLINE', color: 'bg-[#39ff14]', glow: 'drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]', border: 'border-[#39ff14]/30' },
    offline: { label: 'NETWORK DISCONNECTED', color: 'bg-rose-500', glow: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]', border: 'border-rose-500/30' },
    error: { label: 'SYSTEM ALERT', color: 'bg-amber-400', glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]', border: 'border-amber-400/30' },
    checking: { label: 'INITIALIZING...', color: 'bg-cyan-400', glow: 'drop-shadow-[0_0_8px_rgba(0,209,255,0.8)]', border: 'border-cyan-400/30' },
  };

  const cfg = statusConfig[status] || statusConfig.checking;

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121318]/90 border text-slate-200 font-mono text-[10px] tracking-wider font-semibold shadow-inner', cfg.border)}>
      <span className={cn('w-2 h-2 rounded-full animate-pulse', cfg.color, cfg.glow)} />
      <span>{cfg.label}</span>
    </div>
  );
}

export default function NavHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-xl bg-[#0a0b10]/85 shadow-2xl">
      <div className="flex items-center justify-between h-16 px-6 max-w-[1600px] mx-auto">
        {/* Left: Branding & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00d1ff]/10 border border-[#00d1ff]/30 shadow-[0_0_15px_rgba(0,209,255,0.25)]">
            <Shield className="w-5.5 h-5.5 text-[#00d1ff] drop-shadow-[0_0_8px_rgba(0,209,255,0.6)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight font-sans">
                Sentinel <span className="text-[#00d1ff]">KSP</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-[#00d1ff]/15 border border-[#00d1ff]/30 text-[9px] font-mono font-bold text-[#00d1ff] uppercase tracking-widest">
                CYBER COMMAND
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide">
              Karnataka State Police • Crime Intelligence Engine
            </p>
          </div>
        </div>

        {/* Right: Actions, Status & User Controls */}
        <div className="flex items-center gap-4">
          <StatusBadge />

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400 font-mono text-[10px]">
            <Radio className="w-3 h-3 text-[#39ff14] animate-pulse" />
            <span>ENCRYPTED CHANNEL</span>
          </div>

          {isAuthenticated && user && (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-100 flex items-center justify-end gap-1.5">
                  <User className="w-3 h-3 text-[#00d1ff]" />
                  <span>{user.full_name || user.officer_id}</span>
                </div>
                <div className="text-[10px] text-[#00d1ff] tracking-wide">
                  {user.role} {user.employee_id ? `[${user.employee_id}]` : ''}
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout from Sentinel"
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)] hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-slate-300"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
