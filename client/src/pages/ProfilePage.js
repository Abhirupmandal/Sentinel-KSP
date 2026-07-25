import { motion } from 'framer-motion';
import { User, Shield, MapPin, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const fields = [
    { label: 'Officer ID', value: user.officer_id, icon: Shield },
    { label: 'Employee ID', value: user.employee_id, icon: User },
    { label: 'Full Name', value: user.full_name, icon: User },
    { label: 'Assigned Role', value: user.role, icon: Shield },
    { label: 'District', value: user.district, icon: MapPin },
    { label: 'Station', value: user.station, icon: Building2 },
    { label: 'Department', value: user.department, icon: Building2 },
    { label: 'Rank', value: user.rank, icon: Shield },
  ];

  const isSystemAdmin = user.role === 'SystemAdministrator';

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2.5">
          <User className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-semibold text-white tracking-tight">Officer Profile Summary</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-7">
          Your authenticated officer identity and assigned role details.
        </p>
      </motion.div>

      {isSystemAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
          <Shield className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong>System Administrator Access Notice:</strong> Your role has infrastructure access only
            and is restricted from viewing operational crime data per KSP RBAC governance policies.
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden divide-y divide-slate-800/60">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-3.5">
            <Icon className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</div>
              <div className="text-xs text-white font-medium">{value || '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
