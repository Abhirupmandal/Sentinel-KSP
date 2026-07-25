"""Emergency access service for Sentinel-KSP.

Manages emergency access grant/end lifecycle. Enforces CaseReference as mandatory
per PRD even though the DB column allows null (Design Decision #5).
"""

from typing import Any, Dict, Optional
from core.exceptions import NotFoundError, ValidationError
from core.logger import get_logger
from repositories.emergency_repository import emergency_repository, EmergencyRepository

logger = get_logger(__name__)


class EmergencyService:
    """Service layer for emergency access operations."""

    def __init__(self, repository: Optional[EmergencyRepository] = None) -> None:
        self.repo = repository or emergency_repository

    def grant_emergency_access(
        self,
        admin_officer_id: str,
        target_officer_id: str,
        justification: str,
        case_reference: str,
        access_type: str = "Emergency",
    ) -> Dict[str, Any]:
        """Grant emergency access for an officer.

        Enforces mandatory CaseReference at service layer per Design Decision #5.
        """
        if not justification or not justification.strip():
            raise ValidationError("Justification is required for emergency access")

        if not case_reference or not case_reference.strip():
            raise ValidationError(
                "CaseReference is required for emergency access (PRD mandatory rule)"
            )

        if not target_officer_id or not target_officer_id.strip():
            raise ValidationError("TargetOfficerID is required")

        record = self.repo.create_access_log({
            "AdminOfficerID": admin_officer_id,
            "TargetOfficerID": target_officer_id.strip(),
            "Justification": justification.strip(),
            "CaseReference": case_reference.strip(),
            "AccessType": access_type,
        })

        logger.info(
            "Emergency access granted: admin=%s target=%s case=%s",
            admin_officer_id, target_officer_id, case_reference,
        )
        return record

    def end_emergency_access(self, access_id: str) -> Dict[str, Any]:
        """End an active emergency access session."""
        if not access_id or not access_id.strip():
            raise ValidationError("AccessID is required")

        result = self.repo.end_access(access_id.strip())
        if not result:
            raise NotFoundError(f"Emergency access record '{access_id}' not found")

        logger.info("Emergency access ended: %s", access_id)
        return result


emergency_service = EmergencyService()
