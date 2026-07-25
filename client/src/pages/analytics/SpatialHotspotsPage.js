import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import SpatialHotspots from '../../components/SpatialHotspots';

export default function SpatialHotspotsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-accent" />
          <h1 className="text-xl font-semibold text-white tracking-tight">Spatial Crime Hotspot Analysis</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1 ml-7">
          Spatiotemporal cluster density mapping across Karnataka police jurisdictions.
        </p>
      </motion.div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
        <SpatialHotspots />
      </div>
    </div>
  );
}
