# Sentinel Engine

> DevSecOps & Spatial Intelligence Platform for Crime Analytics

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-API-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Map-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Zoho Catalyst](https://img.shields.io/badge/Zoho-Catalyst-1F73C4?logo=zoho&logoColor=white)](https://www.zoho.com/catalyst/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)

Sentinel Engine is a full-stack crime analytics platform comprising a **React dashboard frontend** and a **Flask intelligence API** running on Zoho Catalyst. The frontend visualizes geospatial hotspots, entity relationship graphs, and Modus Operandi similarity clusters in real time.

---

## Frontend — `client/`

A React 19 single-page application built with Vite (CRA-based), Tailwind CSS, and react-leaflet. It connects to the backend API at `http://localhost:5000` and renders interactive analytics views.

### Tech Stack

| Library | Version | Purpose |
| --- | --- | --- |
| React | 19 | UI framework |
| react-leaflet | 5 | Map rendering with CircleMarker, Popup, and Tooltip |
| Leaflet | 1.9 | Map tiles (CartoDB DarkMatter) |
| vis-network | 10 | Force-directed entity graph |
| Framer Motion | 12 | Layout animations and transitions |
| Tailwind CSS | 3 | Utility-first styling with custom cyber theme tokens |
| Lucide React | — | Icon library |
| clsx + tailwind-merge | — | Class name merging via `cn()` utility |

### Getting Started

```bash
cd client
npm install
npm start
```

The dev server starts at `http://localhost:3000` and proxies API requests to `http://localhost:5000`.

> **Note:** The backend must be running locally for full functionality. See [Backend API](#backend-api) below.

### Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start development server |
| `npm run build` | Production build to `build/` |
| `npm test` | Run test suite |

### Environment Variables

Set via a `.env` file or shell environment:

| Variable | Default | Description |
| --- | --- | --- |
| `REACT_APP_API_URL` | `http://localhost:5000` | Backend API base URL |

### Architecture

```
src/
├── App.js                         — Router setup (/ and /dashboard → Dashboard)
├── index.js                       — Entry point
├── index.css                      — Tailwind directives + custom theme
│
├── components/
│   ├── SpatialHotspots.js         — Leaflet map with DBSCAN cluster CircleMarkers
│   ├── EntityNetworkGraph.js      — vis-network force-directed graph
│   ├── MOSimilarityClusters.js     — Expandable MO similarity cluster cards
│   ├── NavHeader.js               — Top navigation bar with live health status
│   └── Layout.js                  — App shell wrapper
│
├── pages/
│   └── Dashboard.js               — Analytics dashboard grid layout
│
├── context/
│   └── ThemeContext.js             — Dark/light theme provider
│
└── lib/
    └── utils.js                   — cn() helper + API_URL constant
```

### Components

#### SpatialHotspots
- Renders a full-screen Leaflet map with **CartoDB DarkMatter** tiles
- Displays DBSCAN cluster centers as **CircleMarker** components
- Marker stroke: `#ef4444` (cyber-red), fill: `#f87171` at 35% opacity
- Radius scales linearly from 8 px to 18 px based on cluster size
- **Hover tooltip** shows Cluster ID, incident count, risk score, primary MO, and region
- **Click popup** shows the same metadata in a clean card
- Falls back to sample GeoJSON data when the backend is unavailable

#### EntityNetworkGraph
- Renders an interactive force-directed graph using **vis-network**
- Nodes represent Cases (blue) and Accused entities (red)
- Edges represent `LINKED_TO` relationships
- Betweenness centrality highlights high-importance hubs
- Falls back to sample node/edge data on API failure

#### MOSimilarityClusters
- Displays MO similarity clusters as **expandable cards**
- Each card shows cluster name, case count, and keyword badges
- Expanded view lists associated case pairs with similarity scores
- Field mapping handles flexible backend response shapes:
  - Cluster title: `cluster_name`, `title`, `cluster_id`, `id`
  - Case count: `case_count`, `size`, `count`, array lengths (`cases`, `case_ids`, `members`, `pairs`, `items`, `documents`)
  - Keywords: `keywords`, `summary`, `modus_operandi`, `mo_summary` (array or comma-separated string)
- Auto-expands the first cluster on load
- Falls back to sample clusters when the API returns no data

#### NavHeader
- Displays the Sentinel Engine branding and version
- **Live health indicator** polls `GET /api/health` every 15 seconds
- Status badge: green (online), red (offline), amber (error)
- Dark/light theme toggle

---

## Backend API — `functions/sentinel_api/`

A Flask application that serves analytics endpoints by querying Zoho Catalyst Data Store through the Catalyst SDK and REST APIs. The API is organized as a Zoho Catalyst Advanced Function with a local Flask entrypoint for development.

### Quickstart

```bash
pip install -r requirements.txt
python functions/sentinel_api/main.py
```

The server binds to `http://localhost:5000` by default. A `.env` file is required for local Catalyst access.

### Required Environment Variables

| Variable | Description |
| --- | --- |
| `ZC_SDK_CLIENT_ID` | Zoho self-client ID used for OAuth token generation |
| `ZC_SDK_CLIENT_SECRET` | Zoho self-client secret used for OAuth token generation |
| `ZC_SDK_REFRESH_TOKEN` | Refresh token for Catalyst Data Store API access |
| `CATALYST_PROJECT_ID` | Catalyst project ID used in REST Data Store URLs |
| `CATALYST_PROJECT_KEY` / `ZAID` | Catalyst project key used by the SDK initializer |
| `CATALYST_ENV` | Optional Catalyst environment name; defaults to `Development` |
| `LOG_LEVEL` | Optional Flask logging level; defaults to `INFO` |

### Endpoints

| Method | Route | Module | Description |
| --- | --- | --- | --- |
| GET | `/` | `main.py` | Root liveness probe |
| GET | `/api/health` | `main.py` | API health check used by the frontend status indicator |
| GET | `/api/geospatial/incidents` | `routes/geospatial.py` | CaseMaster incidents with geospatial coordinates |
| GET | `/api/spatial/hotspots` | `routes/geospatial.py` | GeoJSON `FeatureCollection` of DBSCAN hotspot clusters |
| GET | `/api/analysis/link-graph` | `routes/link_analysis.py` | Case-to-accused relationship graph |
| GET | `/api/graph/network` | `routes/link_analysis.py` | Centrality-scored nodes and edges for entity link analysis |
| POST | `/api/predictive/risk-score` | `routes/predictive.py` | District-level risk score based on historical case volume |
| GET | `/api/analytics/mo-clusters?threshold=0.35` | `routes/predictive.py` | MO similarity clusters via TF-IDF and cosine similarity |

### Backend Modules

| File | Responsibility |
| --- | --- |
| `functions/sentinel_api/main.py` | Creates the Flask app, enables CORS, registers blueprints, exposes health checks, and defines the Catalyst handler |
| `functions/sentinel_api/config.py` | Initializes the Catalyst SDK, manages OAuth token caching, and provides Data Store/ZCQL helpers |
| `functions/sentinel_api/routes/geospatial.py` | Builds incident and hotspot responses from CaseMaster latitude/longitude data |
| `functions/sentinel_api/routes/link_analysis.py` | Builds NetworkX relationship graphs from CaseMaster and Accused rows |
| `functions/sentinel_api/routes/predictive.py` | Computes district risk scores and MO similarity clusters |
| `functions/sentinel_api/scripts/seed_data.py` | Seeds Catalyst Data Store tables for local/demo data setup |

### Data Handling

- Catalyst Data Store rows are normalized before response formatting to support both direct REST responses and table-wrapped ZCQL rows.
- Geospatial clustering uses DBSCAN with haversine distance over CaseMaster latitude/longitude coordinates.
- Link analysis uses NetworkX to return frontend-ready `nodes`, `edges`, and top centrality hubs.
- MO clustering accepts PascalCase and snake_case CaseMaster fields, including `CaseID` / `case_id`, `ModusOperandi` / `modus_operandi`, and `CrimeGroup` / `crime_group`.
- MO clustering returns a standardized success wrapper: `{"status": "success", "clusters": [...]}` and falls back to an empty cluster array when fewer than two valid MO rows are available.

---

## Repository Layout

```text
sentinel-ksp/
├── client/                        — React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── lib/
│   ├── package.json
│   └── tailwind.config.js
├── functions/
│   └── sentinel_api/              — Flask backend
│       ├── main.py
│       ├── config.py
│       ├── routes/
│       │   ├── geospatial.py
│       │   ├── link_analysis.py
│       │   └── predictive.py
│       └── scripts/
│           └── seed_data.py
├── .env                           — Catalyst credentials (not committed)
├── catalyst.json
├── requirements.txt
└── README.md
```

---

## Implementation Notes

- The frontend uses `REACT_APP_API_URL` (default `http://localhost:5000`) for all fetch calls. Set this environment variable to point to a different backend host in production.
- All API fetch errors are logged to the browser console with a `[Sentinel]` prefix, including HTTP status codes.
- The backend uses REST-backed `fetch_all_rows()` helpers for Catalyst Data Store access during local execution.
- DBSCAN hotspot clustering uses `sklearn.cluster.DBSCAN` with haversine distance over latitude/longitude coordinates.
- Entity graph generation uses NetworkX and returns frontend-ready `nodes` and `edges` arrays.
- MO clustering uses `TfidfVectorizer` and `cosine_similarity` from Scikit-Learn with clean empty-array fallbacks for insufficient data.
