import { motion } from 'framer-motion';
import { Layers, Radio, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { API_URL, fetchWithAuth } from '../lib/utils';

function clusterRadius(size = 1) {
  return Math.min(22, Math.max(10, 10 + (size - 1) * 0.8));
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const sampleHotspots = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.5946, 12.9716] }, properties: { cluster_id: 1, size: 24, label: 'Bengaluru Central - Financial Hub' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [72.8777, 19.0760] }, properties: { cluster_id: 2, size: 18, label: 'Mumbai Metro - Cyber Cell' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.2090, 28.6139] }, properties: { cluster_id: 3, size: 31, label: 'Delhi NCR - Sim Swap Ring' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.3639, 22.5726] }, properties: { cluster_id: 4, size: 12, label: 'Kolkata Metro - Phishing Trap' } },
  ],
  summary: { clusters: 4, total_cases: 85 },
};

export default function SpatialHotspots() {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    const url = `${API_URL}/api/spatial/hotspots`;
    fetchWithAuth(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(res => {
        const d = res.data || res;
        const hotspots = d.hotspots || [];
        const geoJson = {
          type: 'FeatureCollection',
          features: hotspots.map((h, i) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [h.longitude, h.latitude] },
            properties: {
              cluster_id: i,
              size: h.case_count || h.intensity || 1,
              crime_head: h.top_crime_head || 'Unknown',
              label: h.top_crime_head || `Cluster ${i + 1}`,
            },
          })),
          summary: { clusters: hotspots.length, total_cases: d.total_hotspots || hotspots.length },
        };
        setGeoData(geoJson);
        setApiFailed(false);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Sentinel] Spatial hotspots fetch error:', err.message);
        setApiFailed(true);
        setLoading(false);
      });
  }, []);

  const displayData = geoData && !apiFailed ? geoData : { type: 'FeatureCollection', features: [], summary: { clusters: 0, total_cases: 0 } };
  const features = displayData?.features || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative rounded-2xl border border-white/10 bg-[#121318]/90 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Top status accent gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/20 via-rose-500 to-[#00d1ff]/40 opacity-90 z-20" />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-sans tracking-tight">
                Geospatial Incident Hotspots
              </h2>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-rose-500/20">
                DBSCAN SPATIAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Statewide crime density & spatial anomaly clustering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span><strong className="text-white">{features.length}</strong> ACTIVE ZONES</span>
          </div>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Map View Frame */}
      <div className="h-[420px] relative bg-[#0a0b10]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0b10]/80 z-20 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121318] border border-white/10 text-[#00d1ff] font-mono text-xs">
              <div className="w-4 h-4 border-2 border-[#00d1ff] border-t-transparent rounded-full animate-spin" />
              <span>RENDERING SPATIAL TILES...</span>
            </div>
          </div>
        )}

        {apiFailed && (
          <div className="absolute top-4 left-4 z-20 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono text-amber-300 shadow-xl backdrop-blur-md">
            ⚠️ API offline — Rendering simulated hotspot coordinates
          </div>
        )}

        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={false}
          className="h-full w-full z-10"
        >
          <ChangeView center={[20.5937, 78.9629]} zoom={5} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> Dark Matter'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {features.map((feat, idx) => {
            const [lng, lat] = feat.geometry.coordinates;
            const props = feat.properties;
            const radius = clusterRadius(props.size);

            return (
              <CircleMarker
                key={idx}
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color: '#ff3b3b',
                  fillColor: '#ff3b3b',
                  fillOpacity: 0.55,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                  <div className="px-2 py-1 bg-[#121318] border border-rose-500/30 rounded text-slate-100 font-mono text-xs shadow-xl">
                    <p className="font-bold text-rose-400">{props.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{props.size} Incidents Reported</p>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="p-1 font-mono text-xs">
                    <p className="font-bold text-rose-600">{props.label}</p>
                    <p className="text-slate-600">Cases: {props.size}</p>
                    <p className="text-slate-500 text-[10px] mt-1">Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </motion.div>
  );
}
