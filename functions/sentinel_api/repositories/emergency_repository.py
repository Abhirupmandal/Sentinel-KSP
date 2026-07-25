"""Emergency access logs repository for Sentinel-KSP.

CRUD operations against the EmergencyAccessLogs table (confirmed table name from live
Catalyst console query). Uses confirmed columns:
AccessID, AdminOfficerID, TargetOfficerID, Justification, CaseReference,
AccessType, AccessStart, AccessEnd, Status
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.logger import get_logger
from utils.id_generator import generate_access_id

logger = get_logger(__name__)

_IN_MEMORY_EMERGENCY_LOGS: List[Dict[str, Any]] = []


class EmergencyRepository:
    """Data access repository for EmergencyAccessLogs table."""

    def create_access_log(self, access_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new emergency access log entry."""
        access_id = access_data.get("AccessID") or generate_access_id()
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        record = {
            "AccessID": access_id,
            "AdminOfficerID": access_data.get("AdminOfficerID"),
            "TargetOfficerID": access_data.get("TargetOfficerID"),
            "Justification": access_data.get("Justification"),
            "CaseReference": access_data.get("CaseReference"),
            "AccessType": access_data.get("AccessType", "Emergency"),
            "AccessStart": access_data.get("AccessStart", now_str),
            "AccessEnd": access_data.get("AccessEnd"),
            "Status": access_data.get("Status", "Active"),
        }

        _IN_MEMORY_EMERGENCY_LOGS.append(record)

        try:
            catalyst_client.insert_row("EmergencyAccessLogs", record)
        except Exception as exc:
            logger.warning("Live insert to EmergencyAccessLogs failed: %s", exc)

        return record

    def end_access(self, access_id: str) -> Optional[Dict[str, Any]]:
        """End an emergency access session."""
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        for log in _IN_MEMORY_EMERGENCY_LOGS:
            if log.get("AccessID") == access_id:
                log["AccessEnd"] = now_str
                log["Status"] = "Ended"
                return log
        return None

    def get_all(self) -> List[Dict[str, Any]]:
        """Retrieve all emergency access logs."""
        return list(_IN_MEMORY_EMERGENCY_LOGS)


emergency_repository = EmergencyRepository()
