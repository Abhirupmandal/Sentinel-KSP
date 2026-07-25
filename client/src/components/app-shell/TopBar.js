import { useEffect, useState } from 'react';
import { Shield, Activity, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api/config';

function StatusBadge() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (mounted) setStatus(res.ok ? 'online' : 'degraded');
      } catch (err) {
        if (mounted) setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const colorMap = {
    online: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    offline: 'bg-red-500',
    checking: 'bg-slate-500',
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300 backdrop-blur-sm">
      <span className={`w-2 h-2 rounded-full animate-pulse ${colorMap[status]}`} />
      <span className="capitalize text-[11px]">
        {status === 'checking' ? 'Connecting...' : status}
      </span>
    </div>
  );
}

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 shadow-md shadow-accent/10">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Sentinel<span className="text-accent"> Engine</span>
            </h1>
            <p className="text-[10px] text-slate-400 -mt-0.5">
              Karnataka State Police Cyber Command Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge />

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">v1.0.8</span>
          </div>

          {isAuthenticated && user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <div className="text-xs font-semibold text-white leading-tight">
                  {user.full_name || user.officer_id}
                </div>
                <div className="text-[10px] text-accent font-medium">
                  {user.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition-colors"
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
