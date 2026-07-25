import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import MOSimilarityClusters from '../../components/MOSimilarityClusters';

export default function MOMatchingPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2.5">
          <Fingerprint className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-semibold text-white tracking-tight">MO Signature Matching Workspace</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-7">
          Computational Jaccard similarity matching of modus operandi signatures across active investigation files.
        </p>
      </motion.div>

      <MOSimilarityClusters />
    </div>
  );
}
