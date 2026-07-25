import { Shield } from 'lucide-react';

export default function PageLoader({ label = 'Loading intelligence module...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
        <Shield className="w-5 h-5 text-accent absolute" />
      </div>
      <p className="text-xs text-slate-400 font-medium animate-pulse">{label}</p>
    </div>
  );
}
