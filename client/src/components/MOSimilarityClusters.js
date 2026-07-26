import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Percent, ChevronDown, Cpu, Network } from 'lucide-react';
import { cn, API_URL, fetchWithAuth } from '../lib/utils';

function ScoreBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color =
    pct >= 80
      ? 'bg-[#39ff14]/15 text-[#39ff14] border-[#39ff14]/40 shadow-[0_0_10px_rgba(57,255,20,0.3)]'
      : pct >= 50
      ? 'bg-amber-400/15 text-amber-400 border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
      : 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]';

  return (
    <span className={cn('px-2.5 py-1 rounded-md text-xs font-mono font-extrabold border tracking-wider', color)}>
      {pct}% MATCH
    </span>
  );
}

const SAMPLE_CLUSTERS = [
  {
    title: 'Phishing email impersonating state bank asking for KYC update & OTP verification',
    caseCount: 14,
    crimeGroups: ['Cyber Fraud', 'Banking Scam'],
    crimeHeads: ['Phishing', 'Identity Theft'],
    pairs: [
      { case_a: 'CASE-2026-1021', case_b: 'CASE-2026-1045', similarity: 0.92 },
      { case_a: 'CASE-2026-1021', case_b: 'CASE-2026-1089', similarity: 0.87 },
      { case_a: 'CASE-2026-1045', case_b: 'CASE-2026-1102', similarity: 0.81 },
    ],
    topSimilarity: 0.92,
  },
  {
    title: 'Crypto Investment WhatsApp scheme promising 300% weekly returns via fake portal',
    caseCount: 9,
    crimeGroups: ['Financial Crime', 'Crypto Fraud'],
    crimeHeads: ['Ponzi Scheme', 'Crypto Drainer'],
    pairs: [
      { case_a: 'CASE-2026-2004', case_b: 'CASE-2026-2018', similarity: 0.88 },
      { case_a: 'CASE-2026-2004', case_b: 'CASE-2026-2033', similarity: 0.84 },
    ],
    topSimilarity: 0.88,
  },
  {
    title: 'SIM Swap fraud bypassing 2FA on mobile banking apps during nighttime hours',
    caseCount: 7,
    crimeGroups: ['Telecom Fraud', 'Account Takeover'],
    crimeHeads: ['SIM Swap', 'Unauthorized Access'],
    pairs: [
      { case_a: 'CASE-2026-3011', case_b: 'CASE-2026-3042', similarity: 0.79 },
    ],
    topSimilarity: 0.79,
  },
];

function groupByMO(matches, limit = 8) {
  const moMap = {};

  matches.forEach(match => {
    const c1 = match.case_1 || match.case_a || {};
    const c2 = match.case_2 || match.case_b || {};
    const score = match.similarity_score ?? match.similarity ?? 0;
    const moText = c1.mo || c1.modus_operandi || c2.mo || c2.modus_operandi || '';
    if (!moText) return;

    if (!moMap[moText]) {
      moMap[moText] = {
        modus_operandi: moText,
        caseIds: new Set(),
        pairs: [],
        topSimilarity: 0,
      };
    }

    const entry = moMap[moText];
    const caseA = c1.case_id || c1.fir || 'Unknown';
    const caseB = c2.case_id || c2.fir || 'Unknown';
    entry.pairs.push({ case_a: caseA, case_b: caseB, similarity: score });
    entry.caseIds.add(caseA);
    entry.caseIds.add(caseB);
    if (score > entry.topSimilarity) entry.topSimilarity = score;
  });

  return Object.values(moMap)
    .map(entry => ({
      title: entry.modus_operandi,
      caseCount: entry.caseIds.size,
      crimeGroups: ['Cyber Fraud'],
      crimeHeads: ['Automated Pattern'],
      pairs: entry.pairs.slice(0, 6),
      topSimilarity: entry.topSimilarity,
    }))
    .sort((a, b) => b.caseCount - a.caseCount)
    .slice(0, limit);
}

export default function MOSimilarityClusters() {
  const [groupedClusters, setGroupedClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchWithAuth(`${API_URL}/api/analytics/mo-clusters`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        const d = json.data || json;
        const raw = Array.isArray(d.matches) ? d.matches : (Array.isArray(d.clusters) ? d.clusters : (Array.isArray(d) ? d : []));
        const grouped = groupByMO(raw, 8);
        setGroupedClusters(grouped);
        if (grouped.length) setExpandedId(grouped[0].title);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Sentinel] MO clusters error:', err.message);
        setError(err.message);
        setGroupedClusters([]);
        setLoading(false);
      });
  }, []);

  const display = groupedClusters;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative rounded-2xl border border-white/10 bg-[#121318]/90 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Top ambient glowing line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-[#00d1ff] to-amber-500/20 opacity-80" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-sans tracking-tight">
                MO Similarity Intelligence Clusters
              </h2>
              <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-400/20">
                TF-IDF COSIM
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Modus Operandi pattern matching across registered FIRs
            </p>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d1ff]/10 border border-[#00d1ff]/30 text-[#00d1ff] text-xs font-mono">
            <div className="w-3.5 h-3.5 border-2 border-[#00d1ff] border-t-transparent rounded-full animate-spin" />
            <span>ANALYZING...</span>
          </div>
        )}
      </div>

      {/* Cluster List Container */}
      <div className="p-6 space-y-3 max-h-[560px] overflow-y-auto custom-scrollbar">
        {!loading && error && !groupedClusters.length && (
          <div className="text-center py-3 text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg">
            API notice: {error} — Serving offline fallback cluster models
          </div>
        )}

        <AnimatePresence initial={false}>
          {display.map((cluster, i) => {
            const isExpanded = expandedId === cluster.title;
            return (
              <motion.div
                key={cluster.title}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, layout: { duration: 0.2 } }}
                className={cn(
                  'rounded-xl border transition-all duration-200 overflow-hidden',
                  isExpanded
                    ? 'border-[#00d1ff]/40 bg-[#1a1b21] shadow-[0_0_20px_rgba(0,209,255,0.1)]'
                    : 'border-white/10 bg-[#16171d]/60 hover:border-white/20 hover:bg-[#16171d]'
                )}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : cluster.title)}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      <Percent className="w-4 h-4 text-[#00d1ff]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-100 font-sans truncate max-w-[420px]">
                        {cluster.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          <strong className="text-[#00d1ff]">{cluster.caseCount}</strong> FIRs linked
                        </span>
                        {cluster.crimeGroups.length > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
                            {cluster.crimeGroups[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <ScoreBadge score={cluster.topSimilarity} />
                    <ChevronDown
                      size={16}
                      className={cn(
                        'text-slate-400 transition-transform duration-200',
                        isExpanded && 'rotate-180 text-[#00d1ff]'
                      )}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-white/10 bg-black/20">
                        {cluster.pairs.length > 0 && (
                          <div>
                            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                              <Network className="w-3 h-3 text-[#00d1ff]" />
                              Identified Cosine Pair Matches
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {cluster.pairs.map((pair, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#121318] border border-white/10 font-mono text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-3.5 h-3.5 text-[#00d1ff] shrink-0" />
                                    <span className="text-slate-200 font-semibold">{pair.case_a}</span>
                                    <span className="text-slate-500">↔</span>
                                    <span className="text-slate-200 font-semibold">{pair.case_b}</span>
                                  </div>
                                  <span className="text-[11px] font-bold text-[#39ff14] ml-2">
                                    {Math.round((pair.similarity || 0) * 100)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
