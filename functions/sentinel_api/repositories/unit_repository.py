"""Unit repository for Sentinel-KSP.

Queries the Unit table using confirmed columns: UnitID, UnitName, Latitude, Longitude, District
"""

from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.logger import get_logger
from config import escape_zcql_string

logger = get_logger(__name__)


class UnitRepository:
    """Data access repository for Unit table."""

    def _normalize(self, row: Dict[str, Any]) -> Dict[str, Any]:
        if isinstance(row, dict) and "Unit" in row:
            return row["Unit"]
        return row

    def get_by_unit_id(self, unit_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a Unit record by UnitID."""
        query = f"SELECT * FROM Unit WHERE UnitID = {escape_zcql_string(unit_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                return self._normalize(results[0])
        except Exception as exc:
            logger.warning("Query Unit by UnitID '%s' failed: %s", unit_id, exc)
        return None

    def list_by_district(self, district: str) -> List[Dict[str, Any]]:
        """List all units in a district."""
        query = f"SELECT * FROM Unit WHERE District = {escape_zcql_string(district)}"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query Unit by District '%s' failed: %s", district, exc)
        return []

    def get_all(self) -> List[Dict[str, Any]]:
        """Fetch all Unit records."""
        try:
            rows = catalyst_client.fetch_all_rows("Unit")
            return rows
        except Exception as exc:
            logger.warning("Fetch all Unit rows failed: %s", exc)
        return []


unit_repository = UnitRepository()
