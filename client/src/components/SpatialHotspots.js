import { motion } from 'framer-motion';
import { MapPin, Layers } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { cn, API_URL } from '../lib/utils';

function clusterRadius(size = 1) {
  return Math.min(18, Math.max(8, 8 + (size - 1) * 0.7));
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function SpatialHotspots() {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiFailed, setApiFailed] = useState(false);

  useEffect(() => {
    const url = `${API_URL}/api/spatial/hotspots`;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(d => {
        console.log('[Sentinel] Spatial hotspots API success:', d);
        setGeoData(d);
        setApiFailed(false);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Sentinel] Spatial hotspots fetch error:', err.message);
        console.info('[Sentinel] Using sample spatial data as fallback');
        setApiFailed(true);
        setLoading(false);
      });
  }, []);

  const displayData = geoData && !apiFailed ? geoData : sampleHotspots;
  const features = displayData?.features || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        'rounded-xl border border-border dark:border-border',
        'bg-white dark:bg-card',
        'shadow-glass-light dark:shadow-glass',
        'backdrop-blur-md overflow-hidden'
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyber-red/20">
            <MapPin className="w-4 h-4 text-cyber-red" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Spatial Hotspots
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              DBSCAN cluster heatmap
            </p>
          </div>
        </div>
        <Layers className="w-4 h-4 text-slate-400" />
      </div>

      <div className="h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {apiFailed && (
          <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-cyber-amber/20 border border-cyber-amber/30 text-xs text-cyber-amber">
            Using sample data — backend unavailable
          </div>
        )}
        <MapContainer
          center={[20, 0]}
          zoom={2}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <ChangeView center={[20.5937, 78.9629]} zoom={5} />
          {features.map((feat, i) => {
            const coords = feat.geometry?.coordinates;
            if (!coords) return null;
            const [lng, lat] = coords;
            const props = feat.properties || {};
            const size = props.cluster_size || props.count || 1;
            return (
              <CircleMarker
                key={i}
                center={[lat, lng]}
                radius={clusterRadius(size)}
                pathOptions={{
                  color: '#ef4444',
                  weight: 1.5,
                  opacity: 0.9,
                  fillColor: '#f87171',
                  fillOpacity: 0.35,
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -clusterRadius(size)]}
                  className="rounded-lg border border-white/10 bg-black/85 backdrop-blur-md text-white text-xs shadow-lg px-3 py-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-cyber-red text-sm">Cluster {props.cluster_id || i + 1}</p>
                    <p>Incidents: <span className="font-mono text-slate-200">{size}</span></p>
                    {props.avg_risk != null && <p>Risk Score: <span className="font-mono text-slate-200">{props.avg_risk}</span></p>}
                    {props.primary_mo && <p>Primary MO: <span className="font-mono text-slate-200">{props.primary_mo}</span></p>}
                    {props.region && <p>Region: <span className="font-mono text-slate-200">{props.region}</span></p>}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="text-xs leading-relaxed min-w-[130px]">
                    <p className="font-semibold mb-1 text-slate-900">Cluster {props.cluster_id || i + 1}</p>
                    <p>Incidents: <span className="font-mono">{size}</span></p>
                    {props.avg_risk != null && <p>Risk Score: <span className="font-mono">{props.avg_risk}</span></p>}
                    {props.primary_mo && <p>Primary MO: <span className="font-mono">{props.primary_mo}</span></p>}
                    {props.region && <p>Region: {props.region}</p>}
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

const sampleHotspots = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [30.0, 40.0] }, properties: { cluster_id: 1, cluster_size: 8, avg_risk: 0.85, region: 'Eastern Europe', primary_mo: 'Phishing Kit' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-10.0, 25.0] }, properties: { cluster_id: 2, cluster_size: 5, avg_risk: 0.72, region: 'North Africa', primary_mo: 'Credential Theft' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [75.0, 18.0] }, properties: { cluster_id: 3, cluster_size: 12, avg_risk: 0.91, region: 'South Asia', primary_mo: 'Ransomware' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-100.0, 25.0] }, properties: { cluster_id: 4, cluster_size: 3, avg_risk: 0.60, region: 'North America', primary_mo: 'Data Exfil' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [120.0, -10.0] }, properties: { cluster_id: 5, cluster_size: 2, avg_risk: 0.45, region: 'Southeast Asia', primary_mo: 'Reconnaissance' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [15.0, -10.0] }, properties: { cluster_id: 6, cluster_size: 7, avg_risk: 0.78, region: 'Central Africa', primary_mo: 'BEC Scam' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-60.0, -15.0] }, properties: { cluster_id: 7, cluster_size: 4, avg_risk: 0.55, region: 'South America', primary_mo: 'Malware' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [140.0, 35.0] }, properties: { cluster_id: 8, cluster_size: 6, avg_risk: 0.69, region: 'East Asia', primary_mo: 'DDoS' } },
  ],
};
