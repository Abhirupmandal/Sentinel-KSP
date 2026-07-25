"""Case repository for Sentinel-KSP.

Queries the CaseMaster table using confirmed columns:
CaseID, UnitID, FIRNumber, CrimeGroup, CrimeHead, Latitude, Longitude,
OffenseDate, ActSection, ModusOperandi
"""

from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.logger import get_logger
from config import escape_zcql_string

logger = get_logger(__name__)


class CaseRepository:
    """Data access repository for CaseMaster table."""

    def _normalize(self, row: Dict[str, Any]) -> Dict[str, Any]:
        if isinstance(row, dict) and "CaseMaster" in row:
            return row["CaseMaster"]
        return row

    def get_by_case_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single case by CaseID."""
        query = f"SELECT * FROM CaseMaster WHERE CaseID = {escape_zcql_string(case_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                return self._normalize(results[0])
        except Exception as exc:
            logger.warning("Query CaseMaster by CaseID '%s' failed: %s", case_id, exc)
        return None

    def list_by_unit(self, unit_id: str) -> List[Dict[str, Any]]:
        """List cases for a specific UnitID."""
        query = f"SELECT * FROM CaseMaster WHERE UnitID = {escape_zcql_string(unit_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query CaseMaster by UnitID '%s' failed: %s", unit_id, exc)
        return []

    def list_by_crime_group(self, crime_group: str) -> List[Dict[str, Any]]:
        """List cases by CrimeGroup."""
        query = f"SELECT * FROM CaseMaster WHERE CrimeGroup = {escape_zcql_string(crime_group)}"
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query CaseMaster by CrimeGroup '%s' failed: %s", crime_group, exc)
        return []

    def list_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """List cases within a date range on OffenseDate."""
        query = (
            f"SELECT * FROM CaseMaster WHERE OffenseDate >= '{start_date}' "
            f"AND OffenseDate <= '{end_date}'"
        )
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Query CaseMaster by date range failed: %s", exc)
        return []

    def list_by_bounding_box(
        self, lat_min: float, lat_max: float, lon_min: float, lon_max: float
    ) -> List[Dict[str, Any]]:
        """List cases within a geographic bounding box (for geospatial queries)."""
        query = (
            f"SELECT * FROM CaseMaster WHERE Latitude >= {lat_min} AND Latitude <= {lat_max} "
            f"AND Longitude >= {lon_min} AND Longitude <= {lon_max}"
        )
        try:
            results = catalyst_client.execute_zcql(query)
            return [self._normalize(r) for r in (results or [])]
        except Exception as exc:
            logger.warning("Bounding box query failed: %s", exc)
        return []

    def get_all(self) -> List[Dict[str, Any]]:
        """Fetch all CaseMaster records."""
        try:
            rows = catalyst_client.fetch_all_rows("CaseMaster")
            return rows
        except Exception as exc:
            logger.warning("Fetch all CaseMaster rows failed: %s", exc)
        return []


case_repository = CaseRepository()
