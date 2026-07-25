"""Audit service for Sentinel-KSP.

Single centralized path for recording audit events across all services.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from core.logger import get_logger
from repositories.audit_repository import audit_repository, AuditRepository

logger = get_logger(__name__)

    
class AuditService:
    """Service layer for recording audit log events."""

    def __init__(self, repository: Optional[AuditRepository] = None) -> None:
        self.repo = repository or audit_repository

    def record(
        self,
        action: str,
        actor_officer_id: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        inference: str = "SUCCESS",
        ip_address: Optional[str] = None,
        device_fingerprint: Optional[str] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Record an audit log entry.

        Args:
            action: AuditAction enum value string.
            actor_officer_id: OfficerID of the actor.
            resource_type: e.g. "Session", "Officer", "Case".
            resource_id: Optional resource identifier.
            inference: "SUCCESS" or "FAILURE".
            ip_address: Client IP address.
            device_fingerprint: Client device fingerprint.
            extra_metadata: Additional context dict (role, remarks, etc.).

        Returns:
            Created audit log record dictionary.
        """
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        audit_data = {
            "ActorOfficerID": actor_officer_id or "SYSTEM",
            "Action": action,
            "ResourceType": resource_type,
            "ResourceID": resource_id,
            "Inference": inference,
            "IPAddress": ip_address,
            "DeviceFingerprint": device_fingerprint,
            "MetaData": extra_metadata or {},
            "Time_Stamp": now_str,
        }

        record = self.repo.insert_audit_log(audit_data)
        logger.info(
            "Audit recorded: action=%s actor=%s resource=%s/%s inference=%s",
            action, actor_officer_id, resource_type, resource_id, inference,
        )
        return record


audit_service = AuditService()
