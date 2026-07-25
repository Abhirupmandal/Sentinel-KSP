"""Accused repository for Sentinel-KSP.

Queries the Accused table using confirmed columns:
AccusedID, CaseID, Name, Age, Gender, ArrestStatus, MODetails
"""

from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.logger import get_logger
from config import escape_zcql_string

logger = get_logger(__name__)


class AccusedRepository:
    """Data access repository for Accused table."""

    def _normalize(self, row: Dict[str, Any]) -> Dict[str, Any]:
        if isinstance(row, dict) and "Accused" in row:
            return row["Accused"]
        return row

    def get_by_case_id(self, case_id: str) -> List[Dict[str, Any]]:
        """Get all accused for a specific CaseID."""
        query = f"SELECT * FROM Accused WHERE CaseID = {escape_zcql_string(case_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query Accused by CaseID '%s' failed: %s", case_id, exc)
        return []

    def list_by_arrest_status(self, arrest_status: str) -> List[Dict[str, Any]]:
        """List accused by ArrestStatus."""
        query = f"SELECT * FROM Accused WHERE ArrestStatus = {escape_zcql_string(arrest_status)}"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query Accused by ArrestStatus '%s' failed: %s", arrest_status, exc)
        return []

    def search_by_name(self, name: str) -> List[Dict[str, Any]]:
        """Search accused by name (for link analysis / repeat-offender tracing).

        Uses LIKE query with % wildcards for substring matching.
        """
        safe_name = name.replace("'", "\\'")
        query = f"SELECT * FROM Accused WHERE Name LIKE '%{safe_name}%'"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Search Accused by Name '%s' failed: %s", name, exc)
        return []

    def get_by_accused_id(self, accused_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single accused by AccusedID."""
        query = f"SELECT * FROM Accused WHERE AccusedID = {escape_zcql_string(accused_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                return self._normalize(results[0])
        except Exception as exc:
            logger.warning("Query Accused by AccusedID '%s' failed: %s", accused_id, exc)
        return None

    def get_all(self) -> List[Dict[str, Any]]:
        """Fetch all Accused records."""
        try:
            rows = catalyst_client.fetch_all_rows("Accused")
            return rows
        except Exception as exc:
            logger.warning("Fetch all Accused rows failed: %s", exc)
        return []


accused_repository = AccusedRepository()
