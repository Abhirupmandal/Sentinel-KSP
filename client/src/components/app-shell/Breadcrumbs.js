import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const PATH_NAME_MAP = {
  dashboard: 'Dashboard Overview',
  geospatial: 'Geospatial Intelligence',
  hotspots: 'Spatial Hotspots',
  drilldown: 'District Drilldown',
  'link-analysis': 'Link & Network Analysis',
  graph: 'Entity Network Graph',
  offender: 'Repeat Offender Profile',
  'mo-match': 'MO Signature Matching',
  predictive: 'Predictive Analytics',
  risk: 'Risk Scoring Framework',
  anomalies: 'Behavioral Anomalies',
  'socio-economic': 'Socio-Economic Layer',
  admin: 'Cyber Command Center',
  officers: 'User Management',
  sessions: 'Active Sessions',
  'audit-logs': 'Audit Log Inspector',
  incidents: 'Security Incidents',
  emergency: 'Emergency Access',
  profile: 'Officer Profile',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
      <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = PATH_NAME_MAP[value] || value;

        return (
          <div key={to} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-slate-200">{displayName}</span>
            ) : (
              <Link to={to} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
