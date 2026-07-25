# High-Level Design (HLD) Specification — Sentinel-KSP

**Karnataka State Police — Crime Intelligence & Cyber Command Platform**  
**Document Version:** 2.4.0  
**Security Classification:** RESTRICTED — FOR OFFICIAL USE ONLY  

---

## 1. Executive Summary & Architectural Goals

**Sentinel-KSP** is an enterprise-grade, government-class crime intelligence, spatial analytics, and cyber command platform engineered for the **Karnataka State Police (KSP)**. The platform aggregates multi-jurisdictional crime records across state districts, providing real-time situational awareness, computational geospatial hotspot clustering, link analysis graph visualization, modus operandi (MO) similarity matching, and predictive risk indices.

### Key Architectural Principles

1. **Zero-Trust Administrative & Session Governance**: Every incoming request undergoes mandatory, non-cached token verification, session active-state evaluation against live datastore records, 15-minute sliding window inactivity enforcement, and strict RBAC permission validation.
2. **Institutional & Regulatory Integrity**: Strict audit logging of all administrative and analytical interactions. Cryptographic 10-step post-write hash verification on credential mutations.
3. **Decoupled Monorepo Architecture**: Clean separation between a high-performance React 18 SPA client layer and a stateless Flask REST API hosted as a Zoho Catalyst Advanced Function.
4. **Resilient BaaS Data Engine**: Dual-mode data access layer using direct Zoho Catalyst BaaS REST ZCQL API endpoints with OAuth 2.0 token caching and automatic fallback to mock datastores in unconfigured environments.

---

## 2. Multi-Tier System Architecture

```mermaid
graph TD
    subgraph Client_Tier ["Client Tier (React 18 SPA)"]
        UI["User Interface Layer<br/>(Tailwind CSS / Lucide React)"]
        State["State Management<br/>(AuthContext / ThemeContext / ToastContext)"]
        Router["React Router v6<br/>Guarded Route Pipeline"]
        Viz["Analytics Engine<br/>(Leaflet / vis-network / Recharts)"]
        ClientAPI["HTTP Client Layer<br/>(fetchWithAuth Interceptor)"]

        UI --> State
        State --> Router
        Router --> Viz
        Viz --> ClientAPI
    end

    subgraph Gateway_Security_Tier ["Gateway & Security Pipeline (Flask Middleware)"]
        Cors["CORS & Request Sanitizer"]
        AuthMw["require_auth<br/>(JWT Token & Account State Check)"]
        SessMw["require_session<br/>(15-Min Sliding Window & Active Check)"]
        RbacMw["require_role<br/>(Least-Privilege RBAC Engine)"]
        AuditMw["audit_action<br/>(Regulatory Log Interceptor)"]

        ClientAPI -->|HTTPS / Bearer JWT| Cors
        Cors --> AuthMw
        AuthMw --> SessMw
        SessMw --> RbacMw
        RbacMw --> AuditMw
    end

    subgraph Service_Tier ["Service & Computational Engine Layer"]
        AuthSvc["AuthService"]
        OfficerSvc["OfficerService"]
        SessSvc["SessionService"]
        AuditSvc["AuditService"]
        GeoSvc["GeospatialService<br/>(DBSCAN Hotspots)"]
        LinkSvc["LinkAnalysisService<br/>(NetworkX Graphs)"]
        PredSvc["PredictiveService<br/>(TF-IDF / Cosine Similarity)"]

        AuditMw --> AuthSvc
        AuditMw --> OfficerSvc
        AuditMw --> SessSvc
        AuditMw --> AuditSvc
        AuditMw --> GeoSvc
        AuditMw --> LinkSvc
        AuditMw --> PredSvc
    end

    subgraph Persistence_Tier ["Data Abstraction & BaaS Storage"]
        Repo["Repository Layer<br/>(Officer, Session, Audit, Case, Accused)"]
        CatClient["CatalystClient<br/>(REST ZCQL / OAuth Token Cache)"]
        CatDataStore[("Zoho Catalyst Data Store<br/>(Cloud Relational BaaS)")]

        AuthSvc --> Repo
        OfficerSvc --> Repo
        SessSvc --> Repo
        AuditSvc --> Repo
        GeoSvc --> Repo
        LinkSvc --> Repo
        PredSvc --> Repo

        Repo --> CatClient
        CatClient -->|REST ZCQL / JSON| CatDataStore
    end
```

---

## 3. Security, Authentication & Session Lifecycle

### 3.1 Single Active Session Policy & Token Issuance

To prevent concurrent account usage across unauthorized police workstations, Sentinel-KSP enforces a strict single-session rule per officer:

1. **Authentication Verification**: Identifies officer via `OfficerID` or `EmployeeID`, verifies `AccountState` (rejects `Locked`, `Disabled`, or `Retired`), and verifies password hash using bcrypt.
2. **Session Eviction**: Queries `ActiveSessions` table for existing `IsActive = true` records belonging to the officer. Any existing active session is immediately marked `IsActive = false`.
3. **Session Provisioning**: Inserts a new row in `ActiveSessions` containing `SessionID`, `IPAddress`, `DeviceFingerprint`, and `LastActivityTime`.
4. **JWT Issuance**: Issues an 8-hour JWT signed with HMAC-SHA256 containing `sub` (OfficerID), `sid` (SessionID), and `role`.

```mermaid
sequenceDiagram
    autonumber
    actor Officer
    participant Client as React Client
    participant AuthRoute as Auth Route
    participant AuthSvc as AuthService
    participant SessSvc as SessionService
    participant OfficerRepo as OfficerRepo
    participant CatDS as Catalyst Data Store

    Officer->>Client: Enters OfficerID & Password
    Client->>AuthRoute: POST /api/auth/login
    AuthRoute->>AuthSvc: login(identifier, password)
    AuthSvc->>OfficerRepo: get_by_officer_id / employee_id
    OfficerRepo->>CatDS: ZCQL SELECT * FROM Officers
    CatDS-->>OfficerRepo: Officer Record
    OfficerRepo-->>AuthSvc: Officer Record
    AuthSvc->>AuthSvc: Verify bcrypt password hash & AccountState
    AuthSvc->>SessSvc: create_session(officer_id)
    SessSvc->>CatDS: Evict existing active sessions (IsActive=False)
    SessSvc->>CatDS: INSERT into ActiveSessions
    CatDS-->>SessSvc: New Session Record (SessionID)
    SessSvc-->>AuthSvc: Session Metadata
    AuthSvc->>AuthSvc: Issue JWT (sub, sid, role)
    AuthSvc-->>AuthRoute: Token & Profile Payload
    AuthRoute-->>Client: HTTP 200 OK (Token + Profile)
    Client-->>Officer: Render Operational Workspace
```

### 3.2 10-Step Cryptographic Credential Post-Write Verification

When an officer updates their password (first-login or administrative reset), Sentinel-KSP executes a zero-trust post-write verification flow to guarantee data store integrity:

```mermaid
flowchart TD
    A[Receive Change Password Request] --> B[Validate New Password != Current Password]
    B --> C[Verify Current Password against Live PasswordHash]
    C --> D[Hash New Password with bcrypt 12 rounds]
    D --> E[REST PATCH Update to Catalyst Officers Row]
    E --> F[Re-fetch Live Officers Row by OfficerID]
    F --> G{Cryptographic Check 1:<br/>New Password Matches Hash?}
    G -- No --> Err1[Raise Post-Write Exception]
    G -- Yes --> H{Cryptographic Check 2:<br/>Old Password Fails Hash?}
    H -- No --> Err2[Raise Post-Write Exception]
    H -- Yes --> I{Check TempPasswordFlag == False?}
    I -- No --> Err3[Raise Post-Write Exception]
    I -- Yes --> J{Check AccountState == Active?}
    J -- No --> Err4[Raise Post-Write Exception]
    J -- Yes --> K[Record Audit Log & Return Success]
```

---

## 4. Role-Based Access Control (RBAC) Matrix

The system enforces least-privilege access control across 5 defined roles and 17 granular permission scopes.

| Role | Scope & Domain Authority | Assigned Permissions |
|------|--------------------------|----------------------|
| **CyberSecurityAdministrator** | Identity management, session monitoring, account lifecycle, emergency access, audit review, security incident handling, full analytics read. | `OFFICER_CREATE`, `OFFICER_LOCK`, `OFFICER_UNLOCK`, `OFFICER_DISABLE`, `PASSWORD_RESET`, `SESSION_FORCE_LOGOUT`, `SESSION_VIEW`, `AUDIT_VIEW`, `EMERGENCY_ACCESS_GRANT`, `EMERGENCY_ACCESS_END`, `SECURITY_INCIDENT_VIEW`, `SECURITY_INCIDENT_RESOLVE`, `DASHBOARD_VIEW`, `GEOSPATIAL_VIEW`, `LINK_ANALYSIS_VIEW`, `PREDICTIVE_VIEW`, `CASE_READ` |
| **SCRBDataAnalyst** | Intelligence dashboards, spatiotemporal trend analysis, risk scoring, MO similarity clustering, case read/write. | `CASE_READ`, `CASE_WRITE`, `DASHBOARD_VIEW`, `GEOSPATIAL_VIEW`, `LINK_ANALYSIS_VIEW`, `PREDICTIVE_VIEW` |
| **FieldInvestigator** | Read-only criminological link analysis, repeat offender profiles, case history lookup. | `CASE_READ`, `LINK_ANALYSIS_VIEW` |
| **CommandSupervisor** | Executive dashboard overviews and high-level KPI monitoring. | `DASHBOARD_VIEW` |
| **SystemAdministrator** | Infrastructure monitoring (no operational business permissions). | *None (Empty frozenset per least-privilege)* |

---

## 5. Computational Analytics Formulations

### 5.1 Geospatial DBSCAN Hotspot Detection

Given a dataset of FIR case points $P = \{p_1, p_2, \dots, p_n\}$ where $p_i = (\text{lat}_i, \text{lon}_i)$, coordinates are converted to spherical radians:

$$\phi_i = \text{lat}_i \times \frac{\pi}{180}, \quad \lambda_i = \text{lon}_i \times \frac{\pi}{180}$$

Distance between points is computed using the **Haversine Distance Metric**:

$$d(p_i, p_j) = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\phi_j - \phi_i}{2}\right) + \cos(\phi_i)\cos(\phi_j)\sin^2\left(\frac{\lambda_j - \lambda_i}{2}\right)} \right)$$

where $R = 6371.0088\text{ km}$ (Earth radius). Clustering is evaluated via Scikit-Learn `DBSCAN(eps=2.0 / 6371.0088, min_samples=3, metric='haversine')`.

### 5.2 NetworkX Link Analysis & Betweenness Centrality

The entity network graph is represented as an undirected graph $G = (V, E)$, where vertex set $V = V_{\text{Case}} \cup V_{\text{Accused}}$ and edges $E$ represent `LINKED_TO` relationships.

Betweenness centrality $C_B(v)$ for node $v \in V$ is calculated to identify high-risk offender hubs:

$$C_B(v) = \sum_{s \neq v \neq t \in V} \frac{\sigma_{st}(v)}{\sigma_{st}}$$

where $\sigma_{st}$ is the total number of shortest paths from node $s$ to node $t$ and $\sigma_{st}(v)$ is the number of those paths that pass through $v$.

### 5.3 Modus Operandi (MO) Cosine Similarity

The corpus of case MO descriptions $D = \{d_1, d_2, \dots, d_m\}$ is transformed into term frequency-inverse document frequency (TF-IDF) feature vectors $\mathbf{v}_i \in \mathbb{R}^k$:

$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log \left( \frac{|D|}{1 + |\{d' \in D : t \in d'\}|} \right)$$

Pairwise similarity between cases $A$ and $B$ is computed as:

$$\text{Sim}(A, B) = \frac{\mathbf{v}_A \cdot \mathbf{v}_B}{\|\mathbf{v}_A\|_2 \|\mathbf{v}_B\|_2}$$

Pairs exceeding threshold $\theta = 0.35$ are tagged as potential serial MO signature matches.

---

## 6. Datastore Schema Architecture

```text
+-----------------------+       +-----------------------+       +-----------------------+
|       Officers        |       |    ActiveSessions     |       |       AuditLogs       |
+-----------------------+       +-----------------------+       +-----------------------+
| ROWID (PK)            |<------| ROWID (PK)            |       | ROWID (PK)            |
| OfficerID (UK)        |       | SessionID (UK)        |       | AuditID (UK)          |
| FullName              |       | OfficerID (FK)        |       | Timestamp             |
| EmployeeID (UK)       |       | IsActive (Boolean)    |       | ActorOfficerID        |
| PasswordHash          |       | LastActivityTime      |       | Action                |
| TempPasswordFlag      |       | IPAddress             |       | ResourceType          |
| PasswordLastChanged   |       | DeviceFingerprint     |       | ResourceID            |
| Role                  |       +-----------------------+       | Inference (SUCCESS/   |
| District              |                                       |            FAILURE)   |
| Rank                  |                                       | IPAddress             |
| Station               |                                       | DeviceFingerprint     |
| Department            |                                       | ExtraMetadata (JSON)  |
| AccountState          |                                       +-----------------------+
| CreatedBy             |
+-----------------------+
            ^
            |
+-----------------------+       +-----------------------+       +-----------------------+
|      CaseMaster       |       |        Accused        |       |        Victim         |
+-----------------------+       +-----------------------+       +-----------------------+
| ROWID (PK)            |       | ROWID (PK)            |       | ROWID (PK)            |
| CaseID (UK)           |<------| AccusedID (UK)        |       | VictimID (UK)         |
| FIRNumber             |       | CaseID (FK)           |       | CaseID (FK)           |
| District              |       | Name                  |       | Name                  |
| PoliceStation         |       | Age                   |       | Gender                |
| Latitude              |       | Gender                |       | ContactNumber         |
| Longitude             |       | ArrestStatus          |       +-----------------------+
| OffenseDate           |       | KnownAliases          |
| CrimeGroup            |       +-----------------------+
| CrimeHead             |
| ModusOperandi         |
+-----------------------+
```

---

## 7. Verification & Build Integrity

Sentinel-KSP undergoes dual-tier validation prior to release:

1. **Backend Verification**: `python -m unittest discover -s functions/sentinel_api/tests -v`
   - 21/21 Unit & Integration tests passing cleanly.
   - Enforces zero demo-password fallback, single-session eviction, and cryptographic hash verification.
2. **Frontend Compilation**: `cd client && npm run build`
   - Production bundle compiles with zero syntax or module resolution errors.
