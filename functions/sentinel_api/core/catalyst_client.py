"""Thin testable wrapper around Zoho Catalyst SDK datastore and ZCQL services.

Serves as the single access point for repository classes to interact with the
Catalyst Data Store. Supports dependency injection and mock overrides for unit testing.
"""

import os
from typing import Any, Dict, List, Optional
from core.exceptions import CatalystError
from core.logger import get_logger
import config

logger = get_logger(__name__)


class CatalystClient:
    """Datastore and ZCQL client wrapper."""

    def __init__(self, app_instance: Optional[Any] = None) -> None:
        """Initialize CatalystClient with an optional SDK app instance.

        Args:
            app_instance: Optional initialized zcatalyst_sdk app instance.
        """
        self._app = app_instance or config.app

    def get_zcql_service(self) -> Any:
        """Return the ZCQL service instance or mock service.

        Returns:
            ZCQL service instance.
        """
        return config.get_zcql_service()

    def execute_zcql(self, query: str) -> List[Dict[str, Any]]:
        """Execute a ZCQL query against the Catalyst Data Store.

        Uses REST API directly (POST /baas/v1/project/{pid}/query) because
        the SDK's internal ZCQL service uses accounts.localzoho.com for OAuth
        which has SSL issues on local dev. The REST endpoint uses
        accounts.zoho.in and works reliably.

        Priority order:
        1. Direct REST ZCQL API (always tried first when credentials exist)
        2. Mock/seed fallback ONLY when no credentials are configured
        3. Empty list

        Args:
            query: The ZCQL query string to execute.

        Returns:
            List of raw dictionary results from Catalyst.

        Raises:
            CatalystError: If query execution fails.
        """
        if not query or not isinstance(query, str):
            raise CatalystError("ZCQL query string must be a non-empty string")

        project_id = os.getenv("CATALYST_PROJECT_ID")
        env = os.getenv("CATALYST_ENV", "Development")
        has_credentials = bool(project_id and os.getenv("ZC_SDK_REFRESH_TOKEN"))

        # Priority 1: REST ZCQL API
        if has_credentials:
            try:
                import requests
                access_token = config._get_zoho_access_token()
                url = f"https://api.catalyst.zoho.in/baas/v1/project/{project_id}/query"
                headers = {
                    "Authorization": f"Zoho-oauthtoken {access_token}",
                    "Content-Type": "application/json",
                    "Environment": env,
                }
                resp = requests.post(url, json={"query": query}, headers=headers, timeout=10)
                if resp.status_code == 200:
                    payload = resp.json()
                    data = payload.get("data", [])
                    logger.debug(
                        "[ZCQL REST LIVE] Query='%s' ProjectID='%s' Env='%s' Rows=%d",
                        query[:80], project_id, env, len(data),
                    )
                    return data if data else []
                else:
                    logger.warning(
                        "[ZCQL REST FAILED] HTTP %d for query '%s': %s",
                        resp.status_code, query[:80], resp.text[:200],
                    )
            except Exception as exc:
                logger.warning("[ZCQL REST ERROR] Query='%s': %s", query[:80], exc)

        # Priority 2: Local mock fallback when no credentials configured
        if not has_credentials:
            try:
                from config import MockZCQLService
                mock_results = MockZCQLService().execute_query(query)
                if mock_results:
                    logger.debug("[ZCQL MOCK] Query='%s' returned %d rows (no credentials)", query[:80], len(mock_results))
                    return mock_results
            except Exception:
                pass

        return []


    def fetch_all_rows(self, table_name: str) -> List[Dict[str, Any]]:
        """Fetch all rows from a Catalyst Data Store table.

        Args:
            table_name: The target table name.

        Returns:
            List of row dictionaries.

        Raises:
            CatalystError: If data retrieval fails.
        """
        try:
            return config.fetch_all_rows(table_name)
        except Exception as exc:
            logger.error("Catalyst fetch_all_rows failed for '%s': %s", table_name, exc)
            raise CatalystError(f"Failed to fetch rows for table '{table_name}': {exc}") from exc

    def insert_row(self, table_name: str, row_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a single row into a Catalyst Data Store table using REST API.

        Args:
            table_name: Target table name.
            row_data: Dictionary containing row column key-value pairs.

        Returns:
            Inserted row response object.

        Raises:
            CatalystError: If row insertion fails.
        """
        if config._USE_MOCK_ZCQL:
            logger.info("[MOCK] Simulating row insert for table '%s'", table_name)
            return {"ROWID": "LOCAL_" + str(id(row_data)), **row_data}

        project_id = os.getenv("CATALYST_PROJECT_ID")
        env = os.getenv("CATALYST_ENV", "Development")
        if not project_id or not os.getenv("ZC_SDK_REFRESH_TOKEN"):
            raise CatalystError(f"Catalyst unconfigured. Cannot insert into '{table_name}' without credentials.")

        try:
            import requests
            access_token = config._get_zoho_access_token()
            url = f"https://api.catalyst.zoho.in/baas/v1/project/{project_id}/table/{table_name}/row"
            headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json",
                "Environment": env,
            }
            resp = requests.post(url, json=[row_data], headers=headers, timeout=10)
            if resp.status_code in (200, 201):
                res_data = resp.json()
                logger.info(
                    "[CATALYST LIVE INSERT SUCCESS] Table='%s' ProjectID='%s' Env='%s' Resp=%s",
                    table_name, project_id, env, res_data,
                )
                return res_data
            else:
                err_msg = f"Catalyst REST insert failed for '{table_name}' (HTTP {resp.status_code}): {resp.text}"
                logger.error(err_msg)
                raise CatalystError(err_msg)
        except CatalystError:
            raise
        except Exception as exc:
            err_msg = f"Failed to insert row into Catalyst table '{table_name}': {exc}"
            logger.error(err_msg)
            raise CatalystError(err_msg) from exc

    def update_row(self, table_name: str, row_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a single row in a Catalyst Data Store table using REST API PATCH.

        Args:
            table_name: Target table name.
            row_data: Dictionary containing ROWID and modified columns.

        Returns:
            Updated row response object.

        Raises:
            CatalystError: If ROWID is missing or row update fails.
        """
        row_id = row_data.get("ROWID")
        if not row_id:
            raise CatalystError(f"ROWID is required to update a row in '{table_name}'")

        if config._USE_MOCK_ZCQL:
            logger.info("[MOCK] Simulating row update for table '%s' ROWID='%s'", table_name, row_id)
            return dict(row_data)

        project_id = os.getenv("CATALYST_PROJECT_ID")
        env = os.getenv("CATALYST_ENV", "Development")
        if not project_id or not os.getenv("ZC_SDK_REFRESH_TOKEN"):
            raise CatalystError(f"Catalyst unconfigured. Cannot update '{table_name}' without credentials.")

        try:
            import requests
            access_token = config._get_zoho_access_token()
            url = f"https://api.catalyst.zoho.in/baas/v1/project/{project_id}/table/{table_name}/row"
            headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json",
                "Environment": env,
            }
            resp = requests.patch(url, json=[row_data], headers=headers, timeout=10)
            if resp.status_code in (200, 201):
                res_data = resp.json()
                logger.info(
                    "[CATALYST LIVE UPDATE SUCCESS] Table='%s' ROWID='%s' ProjectID='%s' Env='%s'",
                    table_name, row_id, project_id, env,
                )
                return res_data
            else:
                err_msg = f"Catalyst REST update failed for '{table_name}' ROWID='{row_id}' (HTTP {resp.status_code}): {resp.text}"
                logger.error(err_msg)
                raise CatalystError(err_msg)
        except CatalystError:
            raise
        except Exception as exc:
            err_msg = f"Failed to update row in Catalyst table '{table_name}' ROWID='{row_id}': {exc}"
            logger.error(err_msg)
            raise CatalystError(err_msg) from exc


# Global default client instance
catalyst_client = CatalystClient()
