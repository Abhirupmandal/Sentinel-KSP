import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No Data Records Found',
  description = 'There are currently no records matching the requested query parameters.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="p-10 rounded-2xl border border-slate-800 bg-slate-900/40 text-center max-w-md mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-accent/20 hover:bg-accent/30 border border-accent/30 text-accent text-xs font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
