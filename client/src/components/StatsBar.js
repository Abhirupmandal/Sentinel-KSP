import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, MapPin, Network, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { cn, API_URL, fetchWithAuth } from '../lib/utils';

const STAT_CONFIG = [
  {
    key: 'totalCases',
    label: 'TOTAL CASES',
    subtext: 'Recorded FIRs',
    icon: FileText,
    color: 'text-[#00d1ff]',
    glow: 'drop-shadow-[0_0_10px_rgba(0,209,255,0.4)]',
    bg: 'bg-[#00d1ff]/10',
    borderTop: 'bg-[#00d1ff]',
    borderHover: 'hover:border-[#00d1ff]/50',
  },
  {
    key: 'totalAccused',
    label: 'ACCUSED PERSONS',
    subtext: 'Identified Suspects',
    icon: Users,
    color: 'text-red-400',
    glow: 'drop-shadow-[0_0_10px_rgba(248,113,113,0.4)]',
    bg: 'bg-red-500/10',
    borderTop: 'bg-red-500',
    borderHover: 'hover:border-red-500/50',
  },
  {
    key: 'hotspotClusters',
    label: 'HOTSPOT CLUSTERS',
    subtext: 'Geospatial Zones',
    icon: MapPin,
    color: 'text-amber-400',
    glow: 'drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]',
    bg: 'bg-amber-500/10',
    borderTop: 'bg-amber-400',
    borderHover: 'hover:border-amber-400/50',
  },
  {
    key: 'networkEdges',
    label: 'NETWORK LINKS',
    subtext: 'Inter-Case Rel.',
    icon: Network,
    color: 'text-purple-400',
    glow: 'drop-shadow-[0_0_10px_rgba(192,132,252,0.4)]',
    bg: 'bg-purple-500/10',
    borderTop: 'bg-purple-400',
    borderHover: 'hover:border-purple-400/50',
  },
  {
    key: 'moPairs',
    label: 'MO MATCHES',
    subtext: 'Modus Operandi',
    icon: TrendingUp,
    color: 'text-[#39ff14]',
    glow: 'drop-shadow-[0_0_10px_rgba(57,255,20,0.4)]',
    bg: 'bg-[#39ff14]/10',
    borderTop: 'bg-[#39ff14]',
    borderHover: 'hover:border-[#39ff14]/50',
  },
  {
    key: 'absconding',
    label: 'ABSCONDING',
    subtext: 'Active Alerts',
    icon: AlertTriangle,
    color: 'text-rose-500',
    glow: 'drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    bg: 'bg-rose-500/15',
    borderTop: 'bg-rose-500',
    borderHover: 'hover:border-rose-500/60',
    pulsing: true,
  },
];

export default function StatsBar() {
  const [stats, setStats] = useState({
    totalCases: '—',
    totalAccused: '—',
    hotspotClusters: '—',
    networkEdges: '—',
    moPairs: '—',
    absconding: '—',
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [hotspotJson, networkJson, moJson, overviewJson] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/spatial/hotspots`).then(r => r.json()).catch(() => null),
          fetchWithAuth(`${API_URL}/api/graph/network`).then(r => r.json()).catch(() => null),
          fetchWithAuth(`${API_URL}/api/analytics/mo-clusters`).then(r => r.json()).catch(() => null),
          fetchWithAuth(`${API_URL}/api/dashboard/overview`).then(r => r.json()).catch(() => null),
        ]);

        const hotspotRes = hotspotJson?.data || hotspotJson || {};
        const networkRes = networkJson?.data || networkJson || {};
        const moRes = moJson?.data || moJson || {};
        const overviewRes = overviewJson?.data || overviewJson || {};

        const graph = networkRes?.graph || {};
        const totalCases = overviewRes?.total_cases ?? graph?.nodes?.filter(n => n.type === 'Case').length ?? 0;
        const totalAccused = overviewRes?.total_accused ?? graph?.nodes?.filter(n => n.type !== 'Case').length ?? 0;
        const clusters = hotspotRes?.total_hotspots ?? hotspotRes?.hotspots?.length ?? 0;
        const networkEdges = graph?.edges?.length ?? 0;
        const moPairs = moRes?.total_matches_found ?? moRes?.matches?.length ?? 0;
        const abscondingCount = overviewRes?.arrest_status_breakdown?.Absconding ?? 0;

        setStats({
          totalCases,
          totalAccused,
          hotspotClusters: clusters,
          networkEdges,
          moPairs,
          absconding: abscondingCount,
        });
        setLoaded(true);
      } catch (e) {
        console.error('[Sentinel] StatsBar fetch error:', e);
        setLoaded(true);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {STAT_CONFIG.map((cfg, i) => {
        const Icon = cfg.icon;
        const value = stats[cfg.key];
        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 * i }}
            className={cn(
              'relative overflow-hidden rounded-xl border border-white/10 flex flex-col justify-between p-4',
              'bg-[#121318]/80 backdrop-blur-md',
              'shadow-lg transition-all duration-300 group',
              cfg.borderHover
            )}
          >
            {/* Top status accent bar */}
            <div className={cn('absolute top-0 left-0 right-0 h-[2px] opacity-80', cfg.borderTop)} />

            {/* Header: Icon & Pulse Indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg border border-white/5', cfg.bg)}>
                <Icon className={cn('w-4 h-4', cfg.color)} />
              </div>
              {cfg.pulsing ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">LIVE</span>
                </div>
              ) : (
                <Activity className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
              )}
            </div>

            {/* Value & Label */}
            <div className="flex flex-col gap-0.5">
              <p className={cn('text-2xl font-extrabold font-mono tracking-tight', cfg.color, cfg.glow)}>
                {loaded ? (
                  typeof value === 'number' ? value.toLocaleString() : value
                ) : (
                  <span className="inline-block w-12 h-7 bg-white/10 rounded animate-pulse" />
                )}
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  {cfg.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {cfg.subtext}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
