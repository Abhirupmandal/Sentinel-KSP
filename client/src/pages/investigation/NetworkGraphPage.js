import { motion } from 'framer-motion';
import { Network } from 'lucide-react';
import EntityNetworkGraph from '../../components/EntityNetworkGraph';

export default function NetworkGraphPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2.5">
          <Network className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-semibold text-white tracking-tight">Entity Network Graph Workspace</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-7">
          Interactive force-directed graph connecting suspects, cases, and police units across jurisdictions.
        </p>
      </motion.div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
        <EntityNetworkGraph />
      </div>
    </div>
  );
}
