"""Application configuration and Zoho Catalyst SDK initialization."""



import os

import time

from typing import Any, Dict, List, Optional



import requests

import zcatalyst_sdk



# ---------------------------------------------------------------------------

# SDK Initialization

# ---------------------------------------------------------------------------

app = None
_USE_MOCK_ZCQL = False  # Set True after first SSL/network failure to skip retries



# ---------------------------------------------------------------------------

# OAuth token cache for direct Zoho Catalyst REST API calls

# ---------------------------------------------------------------------------

_ZOHO_ACCESS_TOKEN: Optional[str] = None

_ZOHO_ACCESS_TOKEN_EXPIRES_AT: float = 0.0

_ZOHO_TOKEN_EXPIRY_SAFETY_SECONDS = 120

_ZOHO_DEFAULT_TOKEN_TTL_SECONDS = 3600





def _init_sdk():
    """Initialize the Catalyst SDK while preserving cloud-context fallback behavior."""
    global app

    if os.getenv("TESTING", "").lower() == "true":
        print("[CONFIG] Testing mode active - bypassing live Catalyst SDK init.")
        return None

    # Priority 1: Check if app already initialized in memory

    try:

        app = zcatalyst_sdk.get_app()

        if app:

            return app

    except Exception:

        pass



    # Priority 2: Local initialization with Self Client Refresh Token

    client_id = os.getenv("ZC_SDK_CLIENT_ID")

    client_secret = os.getenv("ZC_SDK_CLIENT_SECRET")

    refresh_token = os.getenv("ZC_SDK_REFRESH_TOKEN")

    project_id = os.getenv("CATALYST_PROJECT_ID")

    project_key = os.getenv("CATALYST_PROJECT_KEY") or os.getenv("ZAID")



    if project_id and refresh_token and project_key:

        try:

            from zcatalyst_sdk import credentials

            from zcatalyst_sdk.types import ICatalystOptions



            cred_dict = {

                "refresh_token": refresh_token,

                "client_id": client_id,

                "client_secret": client_secret,

            }

            catalyst_credential = credentials.RefreshTokenCredential(cred_dict)



            options = ICatalystOptions(

                project_id=str(project_id),

                project_key=str(project_key),

                environment=os.getenv("CATALYST_ENV", "Development"),

                project_domain=f"https://api.catalyst.zoho.in/baas/v1/project/{project_id}",

            )

            app = zcatalyst_sdk.initialize_app(catalyst_credential, options)

            print(f"[CONFIG] Zoho Catalyst SDK initialized locally (Project ID: {project_id})")

            return app

        except Exception as exc:

            print(f"[CONFIG] Local SDK init failed: {exc}")



    # Priority 3: Cloud Context Initialization

    try:

        app = zcatalyst_sdk.initialize()

        print("[CONFIG] Zoho Catalyst SDK initialized via Cloud context.")

        return app

    except Exception as exc:

        print(f"[CONFIG] Cloud SDK init bypassed: {exc}")



    return None





app = _init_sdk()


# ---------------------------------------------------------------------------
# Proactive SSL connectivity check at startup
# If Zoho OAuth endpoint is unreachable (SSL cert issues on local dev),
# immediately switch to MockZCQLService to avoid multi-minute retry hangs.
# ---------------------------------------------------------------------------
def _probe_zoho_connectivity() -> bool:
    """Quick 2-second probe to check if Zoho OAuth endpoint is reachable."""
    global _USE_MOCK_ZCQL
    if os.getenv("TESTING", "").lower() == "true":
        _USE_MOCK_ZCQL = True
        return False
    try:
        # Probe the real Zoho OAuth endpoint
        resp = requests.head("https://accounts.zoho.in/oauth/v2/token", timeout=3, verify=True)
        print(f"[CONFIG] Zoho Catalyst OAuth endpoint reachable (HTTP {resp.status_code})")
        _USE_MOCK_ZCQL = False
        return True
    except Exception as exc:
        print(f"[CONFIG] Zoho Catalyst OAuth endpoint probe failed: {type(exc).__name__}: {exc}")
        print("[CONFIG] Switching to local MockZCQLService for all data queries.")
        _USE_MOCK_ZCQL = True
        return False

_probe_zoho_connectivity()




def _get_zoho_access_token() -> str:

    """

    Return a valid Zoho OAuth access token for direct Catalyst REST API calls.



    The token is generated from the configured self-client refresh token and cached

    in memory until shortly before expiry to avoid unnecessary token requests.

    """

    global _ZOHO_ACCESS_TOKEN, _ZOHO_ACCESS_TOKEN_EXPIRES_AT



    now = time.time()

    if _ZOHO_ACCESS_TOKEN and now < _ZOHO_ACCESS_TOKEN_EXPIRES_AT:

        return _ZOHO_ACCESS_TOKEN



    client_id = os.getenv("ZC_SDK_CLIENT_ID")

    client_secret = os.getenv("ZC_SDK_CLIENT_SECRET")

    refresh_token = os.getenv("ZC_SDK_REFRESH_TOKEN")



    missing = [

        name

        for name, value in (

            ("ZC_SDK_CLIENT_ID", client_id),

            ("ZC_SDK_CLIENT_SECRET", client_secret),

            ("ZC_SDK_REFRESH_TOKEN", refresh_token),

        )

        if not value

    ]

    if missing:

        raise RuntimeError(

            "Cannot generate Zoho OAuth access token. Missing required environment "

            f"variable(s): {', '.join(missing)}."

        )



    token_url = "https://accounts.zoho.in/oauth/v2/token"

    payload = {

        "refresh_token": refresh_token,

        "client_id": client_id,

        "client_secret": client_secret,

        "grant_type": "refresh_token",

    }



    try:

        response = requests.post(token_url, data=payload, timeout=30)

    except requests.RequestException as exc:

        raise RuntimeError(f"Failed to request Zoho OAuth access token: {exc}") from exc



    response_body = response.text

    try:

        token_payload: Dict[str, Any] = response.json()

    except ValueError as exc:

        raise RuntimeError(

            "Zoho OAuth token endpoint returned a non-JSON response "

            f"(HTTP {response.status_code}): {response_body[:500]}"

        ) from exc



    if response.status_code >= 400:

        raise RuntimeError(

            "Zoho OAuth token endpoint rejected the refresh token request "

            f"(HTTP {response.status_code}): {token_payload}"

        )



    access_token = token_payload.get("access_token")

    if not isinstance(access_token, str) or not access_token.strip():

        raise RuntimeError(f"Zoho OAuth token response did not include access_token: {token_payload}")



    expires_in_raw = token_payload.get("expires_in", _ZOHO_DEFAULT_TOKEN_TTL_SECONDS)

    try:

        expires_in = int(expires_in_raw)

    except (TypeError, ValueError):

        expires_in = _ZOHO_DEFAULT_TOKEN_TTL_SECONDS



    cache_ttl = max(0, expires_in - _ZOHO_TOKEN_EXPIRY_SAFETY_SECONDS)

    _ZOHO_ACCESS_TOKEN = access_token.strip()

    _ZOHO_ACCESS_TOKEN_EXPIRES_AT = now + cache_ttl



    return _ZOHO_ACCESS_TOKEN





def _get_fallback_seed_data(table_name: str) -> List[Dict[str, Any]]:
    """Return local seed dataset for CaseMaster / Accused directly from seed_data.py."""
    import random
    try:
        from scripts.seed_data import generate_mock_cases, generate_mock_accused
    except ImportError:
        try:
            from functions.sentinel_api.scripts.seed_data import generate_mock_cases, generate_mock_accused
        except ImportError:
            from sentinel_api.scripts.seed_data import generate_mock_cases, generate_mock_accused

    normalized = table_name.lower().strip()
    state = random.getstate()
    random.seed(42)
    try:
        cases = generate_mock_cases(count=50, start_id=1021)
        for idx, case in enumerate(cases):
            case["ROWID"] = str(1021 + idx)

        if "case" in normalized:
            return cases

        if "accused" in normalized:
            case_ids = [c["CaseID"] for c in cases]
            accused = generate_mock_accused(case_ids=case_ids, count=100, start_id=2031)
            for idx, acc in enumerate(accused):
                acc["ROWID"] = str(2031 + idx)
            return accused

        if "unit" in normalized:
            units_list = []
            unit_names = [
                "UNIT-101 (Delhi NCR)", "UNIT-102 (Mumbai Central)", "UNIT-103 (Bengaluru Cyber)",
                "UNIT-104 (Kolkata Metro)", "UNIT-105 (Hyderabad East)", "UNIT-106 (Pune Crime Branch)"
            ]
            districts = ["Delhi NCR", "Mumbai", "Bengaluru Urban", "Kolkata", "Hyderabad", "Pune"]
            coords = [
                (28.6139, 77.2090), (19.0760, 72.8777), (12.9716, 77.5946),
                (22.5726, 88.3639), (17.3850, 78.4867), (18.5204, 73.8567)
            ]
            for idx, u in enumerate(unit_names):
                lat, lng = coords[idx % len(coords)]
                units_list.append({
                    "ROWID": str(301 + idx),
                    "UnitID": u,
                    "UnitName": u,
                    "District": districts[idx % len(districts)],
                    "Latitude": str(lat),
                    "Longitude": str(lng),
                })
            return units_list
    finally:
        random.setstate(state)

    return []



class MockZCQLService:
    """Mock ZCQL Service for local offline execution when Catalyst SDK is unconfigured."""
    def execute_query(self, query: str):
        query_upper = query.upper()
        if "FROM CASEMASTER" in query_upper or "CASEMASTER" in query_upper:
            rows = _get_fallback_seed_data("CaseMaster")
            return [{"CaseMaster": r} for r in rows]
        if "FROM ACCUSED" in query_upper or "ACCUSED" in query_upper:
            rows = _get_fallback_seed_data("Accused")
            return [{"Accused": r} for r in rows]
        if "FROM UNIT" in query_upper or "UNIT" in query_upper:
            rows = _get_fallback_seed_data("Unit")
            return [{"Unit": r} for r in rows]

        if "FROM OFFICERS" in query_upper or "OFFICERS" in query_upper:
            return []
        if "FROM ACTIVESESSIONS" in query_upper or "ACTIVESESSIONS" in query_upper:
            return []
        return []


def get_zcql_service():
    """Return the Catalyst ZCQL service instance or local mock service.

    After the first SSL/network failure, automatically switches to MockZCQLService
    for all subsequent queries to avoid multi-minute retry hangs.
    """
    global app, _USE_MOCK_ZCQL

    # If we already know Catalyst is unreachable, skip immediately
    if _USE_MOCK_ZCQL:
        return MockZCQLService()

    if app is None:
        app = _init_sdk()

    if app is not None:
        try:
            return app.zcql()
        except Exception as exc:
            print(f"[CONFIG] app.zcql() failed, switching to mock service permanently: {exc}")
            _USE_MOCK_ZCQL = True

    return MockZCQLService()


def escape_zcql_string(value):
    """Return a safely-quoted ZCQL string literal for the given value."""
    if value is None:
        return "''"
    safe = str(value).replace("'", "''")
    return f"'{safe}'"


def fetch_all_rows(table_name: str) -> List[Dict[str, Any]]:
    """Fetch all rows from a Catalyst Data Store table using direct REST ZCQL.

    Priority order:
    1. Direct REST ZCQL API (always attempted first if credentials exist)
    2. Seed data fallback ONLY in explicit TESTING mode
    3. Empty list if no data source available

    The _USE_MOCK_ZCQL flag (set when SDK ZCQL fails) does NOT gate REST API
    calls — the REST endpoint at api.catalyst.zoho.in works independently of
    the SDK's accounts.localzoho.com OAuth flow.
    """
    normalized_table_name = str(table_name or "").strip()
    if not normalized_table_name or not normalized_table_name.replace("_", "").isalnum():
        raise ValueError("table_name must be a valid, non-empty table identifier")

    # --- Testing mode only: use seed data ---
    if os.getenv("TESTING", "").lower() == "true":
        print(f"[CONFIG] TESTING mode: using seed data for table '{normalized_table_name}'")
        return _get_fallback_seed_data(normalized_table_name)

    # --- Priority 1: Direct REST ZCQL (always tried when credentials exist) ---
    project_id = os.getenv("CATALYST_PROJECT_ID")
    has_credentials = bool(project_id and os.getenv("ZC_SDK_REFRESH_TOKEN"))

    if has_credentials:
        try:
            access_token = _get_zoho_access_token()
            query_str = f"SELECT * FROM {normalized_table_name}"
            endpoint = f"https://api.catalyst.zoho.in/baas/v1/project/{project_id}/query"
            headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Environment": os.getenv("CATALYST_ENV", "Development"),
                "Content-Type": "application/json",
            }
            payload = {"query": query_str}
            response = requests.post(endpoint, headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                response_payload: Dict[str, Any] = response.json()
                data = response_payload.get("data", [])
                rows: List[Dict[str, Any]] = []
                for item in data or []:
                    if isinstance(item, dict):
                        row = item.get(normalized_table_name, item)
                        if isinstance(row, dict):
                            rows.append(row)
                        else:
                            rows.append({normalized_table_name: row})
                print(f"[REST ZCQL LIVE] Fetched {len(rows)} rows for {normalized_table_name}")
                return rows
            else:
                print(f"[CONFIG] Live Catalyst REST query returned HTTP {response.status_code} for '{normalized_table_name}'")
        except Exception as exc:
            print(f"[CONFIG] Live Catalyst REST fetch failed for '{normalized_table_name}': {exc}")

    # --- No live data available, return empty (never seed data in production) ---
    print(f"[CONFIG] No live data for '{normalized_table_name}' (credentials={'present' if has_credentials else 'missing'})")
    return []

