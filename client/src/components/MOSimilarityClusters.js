import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Percent, ChevronDown } from 'lucide-react';
import { cn, API_URL } from '../lib/utils';

function ScoreBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color =
    pct >= 80 ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30'
    : pct >= 50 ? 'bg-cyber-amber/20 text-cyber-amber border-cyber-amber/30'
    : 'bg-cyber-red/20 text-cyber-red border-cyber-red/30';

  return (
    <span className={cn('px-2 py-0.5 rounded-md text-xs font-mono font-bold border', color)}>
      {pct}%
    </span>
  );
}

const extractClusters = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.clusters)) return data.clusters;
  if (Array.isArray(data.mo_clusters)) return data.mo_clusters;
  if (Array.isArray(data.similarity_clusters)) return data.similarity_clusters;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  for (const val of Object.values(data)) {
    if (Array.isArray(val) && val.length > 0) return val;
  }
  return [];
};

function getClusterTitle(cluster, index) {
  const raw = cluster.cluster_name || cluster.title || cluster.cluster_id || cluster.id || '';
  const str = String(raw).replace(/^%+/, '').trim();
  return str || `Cluster ${index + 1}`;
}

const getCaseCount = (c) => {
  if (!c || typeof c !== 'object') return 0;
  if (typeof c.case_count === 'number') return c.case_count;
  if (typeof c.size === 'number') return c.size;
  if (typeof c.count === 'number') return c.count;
  if (Array.isArray(c.cases)) return c.cases.length;
  if (Array.isArray(c.case_ids)) return c.case_ids.length;
  if (Array.isArray(c.members)) return c.members.length;
  if (Array.isArray(c.pairs)) return c.pairs.length;
  if (Array.isArray(c.items)) return c.items.length;
  if (Array.isArray(c.documents)) return c.documents.length;
  for (const val of Object.values(c)) {
    if (Array.isArray(val)) return val.length;
  }
  return 1;
};

function getKeywords(cluster) {
  const raw = cluster.keywords || cluster.summary || cluster.modus_operandi || cluster.mo_summary || [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function getCaseItems(cluster) {
  return cluster.cases || cluster.case_ids || cluster.members || cluster.pairs || [];
}

export default function MOSimilarityClusters() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const url = `${API_URL}/api/analytics/mo-clusters`;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(d => {
        console.info('[Sentinel] MO clusters raw payload:', d);
        const extracted = extractClusters(d);
        console.log('[Sentinel Debug] First cluster object structure:', extracted[0]);
        if (extracted.length) {
          setClusters(extracted);
          setError(null);
          setExpandedId(getClusterTitle(extracted[0], 0));
        } else {
          throw new Error('No valid cluster data in response');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Sentinel] MO clusters fetch error:', err.message);
        console.info('[Sentinel] Using sample cluster data as fallback');
        setClusters([]);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const rawData = clusters.length ? clusters : sampleClusters;
  const activeClusters = rawData
    .map(c => ({ ...c, _count: getCaseCount(c) }))
    .filter(c => c._count > 0)
    .sort((a, b) => b._count - a._count)
    .slice(0, 5);
  const displayData = activeClusters.length ? activeClusters : rawData.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        'rounded-xl border border-border dark:border-border',
        'bg-white dark:bg-card',
        'shadow-glass-light dark:shadow-glass',
        'backdrop-blur-md overflow-hidden'
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-amber/20">
            <FileText className="w-4 h-4 text-cyber-amber" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              MO Similarity Clusters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              TF-IDF / Cosine similarity
            </p>
          </div>
        </div>
        {loading && (
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {displayData.map((cluster, i) => {
            const title = getClusterTitle(cluster, i);
            const count = getCaseCount(cluster);
            const keywords = getKeywords(cluster);
            const caseItems = getCaseItems(cluster);
            const isExpanded = expandedId === title;

            return (
              <motion.div
                key={title}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, layout: { duration: 0.2 } }}
                className={cn(
                  'rounded-lg border border-border dark:border-border overflow-hidden',
                  isExpanded ? 'bg-slate-50 dark:bg-surface' : 'bg-white dark:bg-card'
                )}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : title)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 dark:hover:bg-black/10 transition-colors select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-cyber-amber/15 shrink-0">
                      <Percent className="w-3.5 h-3.5 text-cyber-amber" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {count} case{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {keywords.length > 0 && (
                      <span className="hidden sm:inline-flex gap-1">
                        {keywords.slice(0, 2).map((kw, k) => (
                          <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20">
                            {kw}
                          </span>
                        ))}
                      </span>
                    )}
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-slate-400 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>
                </div>

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
                      <div className="px-4 pb-4 pt-1 border-t border-border dark:border-border">
                        {keywords.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                              Keywords / MO
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {keywords.map((kw, k) => (
                                <span key={k} className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {caseItems.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                              Associated Cases
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {caseItems.map((item, j) => {
                                if (typeof item === 'string') {
                                  return (
                                    <div key={j} className="rounded-lg border border-border dark:border-border bg-white/50 dark:bg-black/20 p-2.5">
                                      <span className="text-[11px] font-mono font-medium text-slate-900 dark:text-white">{item}</span>
                                    </div>
                                  );
                                }
                                const caseA = item.case_a || item.case_id || item.case || item[0];
                                const caseB = item.case_b || item.related_case || item[1];
                                const score = item.similarity || item.score || item[2];

                                return (
                                  <div
                                    key={j}
                                    className="rounded-lg border border-border dark:border-border bg-white/50 dark:bg-black/20 p-2.5"
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-mono font-medium text-slate-900 dark:text-white truncate">
                                        {caseA}
                                      </span>
                                      {score != null && <ScoreBadge score={score} />}
                                    </div>
                                    {caseB && (
                                      <>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                          <div className="flex-1 h-px bg-border dark:bg-border" />
                                          <span>vs</span>
                                          <div className="flex-1 h-px bg-border dark:bg-border" />
                                        </div>
                                        <p className="mt-1.5 text-[11px] font-mono font-medium text-slate-900 dark:text-white text-right truncate">
                                          {caseB}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
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

        {!loading && !clusters.length && error && (
          <div className="text-center py-4 space-y-1">
            <p className="text-xs text-cyber-amber">API error: {error}</p>
            <p className="text-xs text-slate-500">Showing sample clusters — start your backend at localhost:5000</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const sampleClusters = [
  {
    cluster_name: 'CLUSTER 1 — Phishing Campaigns',
    case_count: 4,
    keywords: ['phishing', 'credential harvesting', 'lookalike domain'],
    cases: [
      { case_a: 'CASE-2024-001', case_b: 'CASE-2024-042', similarity: 0.92 },
      { case_a: 'CASE-2024-001', case_b: 'CASE-2025-013', similarity: 0.78 },
    ],
  },
  {
    cluster_name: 'CLUSTER 2 — Ransomware Ops',
    case_count: 3,
    keywords: ['ransomware', 'data exfiltration', 'double extortion'],
    cases: [
      { case_a: 'CASE-2024-089', case_b: 'CASE-2025-027', similarity: 0.85 },
      { case_a: 'CASE-2025-013', case_b: 'CASE-2025-027', similarity: 0.63 },
    ],
  },
  {
    cluster_name: 'CLUSTER 3 — Dark Web Tradecraft',
    case_count: 2,
    keywords: ['darknet', 'cryptocurrency', 'marketplace'],
    cases: [
      { case_a: 'CASE-2024-042', case_b: 'CASE-2024-089', similarity: 0.71 },
      { case_a: 'CASE-2024-042', case_b: 'CASE-2025-027', similarity: 0.55 },
    ],
  },
];
