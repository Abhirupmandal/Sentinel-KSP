import { motion } from 'framer-motion';
import { LayoutDashboard, Clock, Filter, ShieldCheck } from 'lucide-react';
import SpatialHotspots from '../../components/SpatialHotspots';
import EntityNetworkGraph from '../../components/EntityNetworkGraph';
import MOSimilarityClusters from '../../components/MOSimilarityClusters';
import StatsBar from '../../components/StatsBar';

function ProvenanceHeader() {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' IST';
  return (
    <div className="w-full px-4 py-2.5 rounded-xl bg-[#121721] border border-white/10 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[#00d1ff] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>JURISDICTION: STATEWIDE (KARNATAKA)</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>LAST UPDATED: {timestamp}</span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
          <Filter className="w-3 h-3 text-[#00d1ff]" />
          <span>FILTERS: ALL DISTRICTS • ALL CRIME GROUPS</span>
        </span>
        <span className="px-2 py-0.5 rounded bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/30 font-semibold">
          CONFIDENCE: HIGH (CATALYST DATASTORE)
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00d1ff]/10 border border-[#00d1ff]/30 text-[#00d1ff]">
            <LayoutDashboard className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Karnataka Statewide Crime Intelligence Situational Overview
            </h1>
            <p className="text-xs text-slate-400">
              SCRB Executive Intelligence & Cross-Jurisdiction Operations Console
            </p>
          </div>
        </div>
      </motion.div>

      {/* Provenance Header */}
      <ProvenanceHeader />

      {/* Metric Cards Grid */}
      <StatsBar />

      {/* Map & Link Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpatialHotspots />
        <EntityNetworkGraph />
      </div>

      {/* Modus Operandi Pattern Analysis */}
      <MOSimilarityClusters />
    </div>
  );
}
