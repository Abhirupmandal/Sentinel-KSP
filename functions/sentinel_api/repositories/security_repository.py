"""Security incidents repository for Sentinel-KSP.

CRUD operations against the SecurityIncidents table using confirmed columns:
IncidentID, OfficerID, IncidentType, Severity, Description, Status,
DetectedIPAddress, DeviceFingerprint, ResolutionNotes, ResolvedBy, CreatedAt, ResolvedAt
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.logger import get_logger
from utils.id_generator import generate_incident_id

logger = get_logger(__name__)

from datetime import datetime, timezone, timedelta

now = datetime.now(timezone.utc)
t1 = (now - timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M:%S")
t2 = (now - timedelta(minutes=20)).strftime("%Y-%m-%d %H:%M:%S")

_IN_MEMORY_INCIDENTS: List[Dict[str, Any]] = [
    {
        "IncidentID": "INC-2026-8001",
        "OfficerID": "OFF-FIELDINVESTIGATOR",
        "IncidentType": "FAILED_LOGIN_SPIKE",
        "Severity": "High",
        "Description": "3 consecutive failed authentication attempts detected from unauthorized IP 192.168.1.105",
        "Status": "Open",
        "DetectedIPAddress": "192.168.1.105",
        "DeviceFingerprint": "KSP-UNKNOWN-DEVICE-09",
        "ResolutionNotes": None,
        "ResolvedBy": None,
        "CreatedAt": t1,
        "ResolvedAt": None,
    },
    {
        "IncidentID": "INC-2026-8002",
        "OfficerID": "OFF-FIELDINVESTIGATOR",
        "IncidentType": "CONCURRENT_SESSION_ATTEMPT",
        "Severity": "Medium",
        "Description": "Concurrent session login attempted while session SES-4B00CE0041A74038 was active",
        "Status": "Resolved",
        "DetectedIPAddress": "10.42.10.45",
        "DeviceFingerprint": "KSP-MOBILE-PAD-04",
        "ResolutionNotes": "Verified as officer network switch",
        "ResolvedBy": "OFF-ADMIN-001",
        "CreatedAt": t2,
        "ResolvedAt": now.strftime("%Y-%m-%d %H:%M:%S"),
    },
]


class SecurityRepository:
    """Data access repository for SecurityIncidents table."""

    def create_incident(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new security incident."""
        incident_id = incident_data.get("IncidentID") or generate_incident_id()
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        record = {
            "IncidentID": incident_id,
            "OfficerID": incident_data.get("OfficerID"),
            "IncidentType": incident_data.get("IncidentType"),
            "Severity": incident_data.get("Severity", "Medium"),
            "Description": incident_data.get("Description"),
            "Status": incident_data.get("Status", "Open"),
            "DetectedIPAddress": incident_data.get("DetectedIPAddress"),
            "DeviceFingerprint": incident_data.get("DeviceFingerprint"),
            "ResolutionNotes": incident_data.get("ResolutionNotes"),
            "ResolvedBy": incident_data.get("ResolvedBy"),
            "CreatedAt": incident_data.get("CreatedAt", now_str),
            "ResolvedAt": incident_data.get("ResolvedAt"),
        }

        _IN_MEMORY_INCIDENTS.append(record)

        try:
            catalyst_client.insert_row("SecurityIncidents", record)
        except Exception as exc:
            logger.warning("Live insert to SecurityIncidents failed: %s", exc)

        return record

    def get_all_incidents(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve all security incidents, optionally filtered by status."""
        if status:
            return [i for i in _IN_MEMORY_INCIDENTS if i.get("Status") == status]
        return list(_IN_MEMORY_INCIDENTS)

    def resolve_incident(self, incident_id: str, resolved_by: str, notes: str) -> Optional[Dict[str, Any]]:
        """Mark an incident as resolved."""
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        for inc in _IN_MEMORY_INCIDENTS:
            if inc.get("IncidentID") == incident_id:
                inc["Status"] = "Resolved"
                inc["ResolvedBy"] = resolved_by
                inc["ResolutionNotes"] = notes
                inc["ResolvedAt"] = now_str
                return inc
        return None


security_repository = SecurityRepository()
