"""Victim repository for Sentinel-KSP.

Queries the Victim table using confirmed columns:
VictimID, CaseID, Age, Gender, InjuryType
"""

from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.logger import get_logger
from config import escape_zcql_string

logger = get_logger(__name__)


class VictimRepository:
    """Data access repository for Victim table."""

    def _normalize(self, row: Dict[str, Any]) -> Dict[str, Any]:
        if isinstance(row, dict) and "Victim" in row:
            return row["Victim"]
        return row

    def get_by_case_id(self, case_id: str) -> List[Dict[str, Any]]:
        """Get all victims for a specific CaseID."""
        query = f"SELECT * FROM Victim WHERE CaseID = {escape_zcql_string(case_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query Victim by CaseID '%s' failed: %s", case_id, exc)
        return []

    def list_by_injury_type(self, injury_type: str) -> List[Dict[str, Any]]:
        """List victims by InjuryType."""
        query = f"SELECT * FROM Victim WHERE InjuryType = {escape_zcql_string(injury_type)}"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query Victim by InjuryType '%s' failed: %s", injury_type, exc)
        return []

    def get_all(self) -> List[Dict[str, Any]]:
        """Fetch all Victim records."""
        try:
            rows = catalyst_client.fetch_all_rows("Victim")
            return rows
        except Exception as exc:
            logger.warning("Fetch all Victim rows failed: %s", exc)
        return []


victim_repository = VictimRepository()
