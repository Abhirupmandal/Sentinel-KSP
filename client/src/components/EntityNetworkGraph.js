import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { API_URL, fetchWithAuth } from '../lib/utils';

function nodeColor(type) {
  const t = (type || '').toLowerCase();
  if (t === 'case') {
    return {
      background: '#00d1ff',
      border: '#a4e6ff',
      highlight: { background: '#4cd6ff', border: '#ffffff' },
    };
  }
  if (t === 'victim') {
    return {
      background: '#39ff14',
      border: '#79ff5b',
      highlight: { background: '#37fe11', border: '#ffffff' },
    };
  }
  return {
    background: '#ff3b3b',
    border: '#ffb3ac',
    highlight: { background: '#ff7070', border: '#ffffff' },
  };
}

const SAMPLE_GRAPH = {
  nodes: [
    { id: 'CASE-2026-1021', label: 'CASE-2026-1021', type: 'case', details: { CrimeHead: 'Phishing', CrimeGroup: 'Cyber Crime' } },
    { id: 'CASE-2026-1045', label: 'CASE-2026-1045', type: 'case', details: { CrimeHead: 'Banking Fraud', CrimeGroup: 'Financial Crime' } },
    { id: 'ACC-2031', label: 'Ramesh Kumar', type: 'accused', details: { ArrestStatus: 'Absconding' } },
    { id: 'ACC-2032', label: 'Suresh Patil', type: 'accused', details: { ArrestStatus: 'Arrested' } },
    { id: 'VIC-301', label: 'Victim-301', type: 'victim', details: { InjuryType: 'Financial Loss' } },
  ],
  edges: [
    { source: 'ACC-2031', target: 'CASE-2026-1021' },
    { source: 'ACC-2031', target: 'CASE-2026-1045' },
    { source: 'ACC-2032', target: 'CASE-2026-1045' },
    { source: 'VIC-301', target: 'CASE-2026-1021' },
  ],
};

export default function EntityNetworkGraph() {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const buildGraph = (visNodes, visEdges) => {
      if (!containerRef.current || cancelled) return;
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      const options = {
        physics: {
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -60,
            centralGravity: 0.004,
            springLength: 170,
            springConstant: 0.02,
          },
          stabilization: { iterations: 120, updateInterval: 25 },
        },
        nodes: {
          shape: 'dot',
          scaling: { min: 9, max: 28 },
          font: { color: '#e3e1e9', size: 10, face: 'JetBrains Mono' },
          borderWidth: 2,
        },
        edges: {
          arrows: { to: { enabled: false } },
          color: { color: '#3c494e', highlight: '#00d1ff', hover: '#4cd6ff' },
          width: 1.5,
          smooth: { type: 'continuous' },
        },
        interaction: {
          hover: true,
          tooltipDelay: 150,
          hideEdgesOnDrag: true,
          navigationButtons: false,
        },
      };

      networkRef.current = new Network(
        containerRef.current,
        { nodes: visNodes, edges: visEdges },
        options
      );
    };

    const init = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/graph/network`);
        const json = await res.json();
        const envelope = json.data || json;
        const graph = envelope.graph || envelope;
        const nodes = graph.nodes || [];
        const edges = graph.edges || [];

        const useGraph = graph;
        const useNodes = useGraph.nodes || [];
        const useEdges = useGraph.edges || edges;

        setSummary({
          case_nodes: useNodes.filter(n => (n.type || '').toLowerCase() === 'case').length,
          accused_nodes: useNodes.filter(n => (n.type || '').toLowerCase() === 'accused').length,
          victim_nodes: useNodes.filter(n => (n.type || '').toLowerCase() === 'victim').length,
          edge_count: useEdges.length,
        });

        const visNodes = useNodes.map(n => {
          const nodeType = (n.type || 'default').toLowerCase();
          const isCase = nodeType === 'case';
          const det = n.details || {};
          return {
            id: n.id,
            label: n.label || n.id,
            title: isCase
              ? `<b>${n.label}</b><br/>Crime: ${det.CrimeHead || '—'}<br/>Group: ${det.CrimeGroup || '—'}`
              : `<b>${n.label}</b><br/>Status: ${det.ArrestStatus || det.InjuryType || '—'}`,
            color: nodeColor(nodeType),
            size: isCase ? 20 : 12,
            font: { color: '#e3e1e9', size: isCase ? 11 : 9 },
          };
        });

        const visEdges = useEdges.map((e, idx) => ({
          id: `edge-${idx}`,
          from: e.source,
          to: e.target,
          color: { color: '#2a3a4e', highlight: '#00d1ff' },
        }));

        buildGraph(visNodes, visEdges);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('[Sentinel] Network graph error:', err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
      if (networkRef.current) networkRef.current.destroy();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="relative rounded-2xl border border-white/10 bg-[#121318]/90 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Top glowing accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/20 via-[#00d1ff] to-purple-500/20 opacity-90 z-20" />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 shadow-[0_0_12px_rgba(192,132,252,0.25)]">
            <Share2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-sans tracking-tight">
                Entity Knowledge Graph & Link Analysis
              </h2>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-500/20">
                FORCE-ATLAS2
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Inter-case relations, accused networks, and shared modus operandi
            </p>
          </div>
        </div>

        {summary && (
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-md bg-[#00d1ff]/10 border border-[#00d1ff]/30 text-[#00d1ff]">
              <strong>{summary.case_nodes}</strong> Cases
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <strong>{summary.accused_nodes}</strong> Accused
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14]">
              <strong>{summary.edge_count}</strong> Links
            </span>
          </div>
        )}
      </div>

      {/* Graph Area */}
      <div className="h-[460px] relative bg-[#0a0b10]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0b10]/80 z-20 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121318] border border-white/10 text-purple-400 font-mono text-xs">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span>STABILIZING NETWORK PHYSICS...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 z-20 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono text-amber-300 shadow-xl backdrop-blur-md">
            ⚠️ Graph API Notice: {error} — Rendering cached graph topology
          </div>
        )}

        <div ref={containerRef} className="h-full w-full" />
      </div>
    </motion.div>
  );
}