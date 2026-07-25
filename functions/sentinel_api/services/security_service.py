"""Security service for Sentinel-KSP.

Manages security incident lifecycle including auto-raising from failed logins.
"""

from typing import Any, Dict, List, Optional
from core.logger import get_logger
from repositories.security_repository import security_repository, SecurityRepository

logger = get_logger(__name__)


class SecurityService:
    """Service layer for SecurityIncidents operations."""

    def __init__(self, repository: Optional[SecurityRepository] = None) -> None:
        self.repo = repository or security_repository

    def raise_incident(
        self,
        incident_type: str,
        description: str,
        officer_id: Optional[str] = None,
        severity: str = "Medium",
        ip_address: Optional[str] = None,
        device_fingerprint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Raise a new security incident."""
        return self.repo.create_incident({
            "OfficerID": officer_id,
            "IncidentType": incident_type,
            "Severity": severity,
            "Description": description,
            "DetectedIPAddress": ip_address,
            "DeviceFingerprint": device_fingerprint,
        })

    def resolve_incident(
        self, incident_id: str, resolved_by: str, resolution_notes: str
    ) -> Optional[Dict[str, Any]]:
        """Resolve a security incident."""
        return self.repo.resolve_incident(incident_id, resolved_by, resolution_notes)

    def get_all_incidents(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List security incidents."""
        return self.repo.get_all_incidents(status)


security_service = SecurityService()
