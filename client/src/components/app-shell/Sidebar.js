import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Layers,
  Network,
  Fingerprint,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  UserCog,
  MonitorDot,
  FileSearch,
  ShieldAlert,
  Siren,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NAV_SECTIONS } from '../../lib/navigation';
import { hasPermission } from '../../lib/permissions';

const ICON_MAP = {
  LayoutDashboard,
  MapPin,
  Layers,
  Network,
  Fingerprint,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  UserCog,
  MonitorDot,
  FileSearch,
  ShieldAlert,
  Siren,
};

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role;

  // Filter navigation sections & items based on role permissions
  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasPermission(role, item.permission)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center shadow-lg transition-colors z-40"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {filteredSections.map((section) => (
          <div key={section.id}>
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
                {section.label}
              </h3>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const IconComponent = ICON_MAP[item.icon] || LayoutDashboard;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-accent/15 text-accent border border-accent/30 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
