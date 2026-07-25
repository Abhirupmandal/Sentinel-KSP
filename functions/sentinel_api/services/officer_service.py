"""Officer management service for Sentinel-KSP.

Handles officer creation, lock/unlock, disable, admin password reset, and listing.
All persistence operations execute directly against live Catalyst Data Store.
"""

import secrets
import string
from typing import Any, Dict, List, Optional
from constants.account_states import AccountState
from core.catalyst_client import catalyst_client
from core.exceptions import CatalystError, NotFoundError, ValidationError
from core.logger import get_logger
from core.password_manager import PasswordManager
from repositories.officer_repository import officer_repository, OfficerRepository
from services.session_service import session_service, SessionService
from utils.id_generator import generate_officer_id

logger = get_logger(__name__)


def _generate_temp_password(length: int = 12) -> str:
    """Generate a secure random temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


class OfficerService:
    """Service layer for officer administration operations."""

    def __init__(
        self,
        officer_repo: Optional[OfficerRepository] = None,
        sess_service: Optional[SessionService] = None,
    ) -> None:
        self.officer_repo = officer_repo or officer_repository
        self.session_service = sess_service or session_service

    def create_officer(self, validated_data: Dict[str, Any], admin_officer_id: str) -> Dict[str, Any]:
        """Create a new officer account directly in Catalyst Data Store.

        Args:
            validated_data: Validated officer creation payload containing:
                full_name, employee_id, role, district, rank, station, department.
            admin_officer_id: OfficerID of the creating admin.

        Returns:
            Created officer profile dictionary including temporary password.

        Raises:
            ValidationError: If EmployeeID already exists.
            CatalystError: If live Catalyst insertion fails.
        """
        existing = self.officer_repo.get_by_employee_id(
            validated_data["employee_id"], for_duplicate_check=True
        )
        if existing:
            raise ValidationError(f"Officer with EmployeeID '{validated_data['employee_id']}' already exists")

        officer_id = generate_officer_id()
        temp_password = _generate_temp_password()
        password_hash = PasswordManager.hash_password(temp_password)

        officer_data = {
            "OfficerID": officer_id,
            "FullName": validated_data["full_name"],
            "EmployeeID": validated_data["employee_id"],
            "PasswordHash": password_hash,
            "TempPasswordFlag": True,
            "Role": validated_data["role"],
            "District": validated_data["district"],
            "Rank": validated_data["rank"],
            "Station": validated_data["station"],
            "Department": validated_data["department"],
            "AccountState": AccountState.PENDING.value,
            "CreatedBy": admin_officer_id,
        }

        # Persist directly to Catalyst Data Store (fails loudly on error)
        created_row = self.officer_repo.create(officer_data)
        logger.info("Officer %s created in Catalyst Data Store by admin %s", officer_id, admin_officer_id)

        return {
            "officer_id": officer_id,
            "employee_id": validated_data["employee_id"],
            "full_name": validated_data["full_name"],
            "role": validated_data["role"],
            "temp_password": temp_password,
            "account_state": AccountState.PENDING.value,
        }

    def lock_officer(self, officer_id: str) -> bool:
        """Lock an officer account and terminate any active session."""
        officer = self.officer_repo.get_by_officer_id(officer_id)
        if not officer:
            raise NotFoundError(f"Officer '{officer_id}' not found in Catalyst Data Store")

        self.officer_repo.update_account_state(officer_id, AccountState.LOCKED.value)
        self._terminate_active_session(officer_id)
        logger.info("Officer %s locked", officer_id)
        return True

    def unlock_officer(self, officer_id: str) -> bool:
        """Unlock an officer account."""
        officer = self.officer_repo.get_by_officer_id(officer_id)
        if not officer:
            raise NotFoundError(f"Officer '{officer_id}' not found in Catalyst Data Store")

        self.officer_repo.update_account_state(officer_id, AccountState.ACTIVE.value)
        logger.info("Officer %s unlocked", officer_id)
        return True

    def disable_officer(self, officer_id: str) -> bool:
        """Disable an officer account and terminate any active session."""
        officer = self.officer_repo.get_by_officer_id(officer_id)
        if not officer:
            raise NotFoundError(f"Officer '{officer_id}' not found in Catalyst Data Store")

        self.officer_repo.update_account_state(officer_id, AccountState.DISABLED.value)
        self._terminate_active_session(officer_id)
        logger.info("Officer %s disabled", officer_id)
        return True

    def admin_reset_password(self, officer_id: str) -> Dict[str, str]:
        """Admin-initiated password reset: generates new temp password in Catalyst Data Store."""
        officer = self.officer_repo.get_by_officer_id(officer_id)
        if not officer:
            raise NotFoundError(f"Officer '{officer_id}' not found in Catalyst Data Store")

        temp_password = _generate_temp_password()
        password_hash = PasswordManager.hash_password(temp_password)
        self.officer_repo.update_password_hash(officer_id, password_hash, temp_flag=True)
        logger.info("Password reset for officer %s in Catalyst Data Store", officer_id)

        return {"officer_id": officer_id, "temp_password": temp_password}

    def _terminate_active_session(self, officer_id: str) -> None:
        """Terminate any active session for an officer."""
        from repositories.session_repository import session_repository
        session = session_repository.get_active_session_for_officer(officer_id)
        if session and session.get("SessionID"):
            self.session_service.end_session(session["SessionID"])

    def list_all_officers(self) -> List[Dict[str, Any]]:
        """List all registered officers directly from Catalyst Data Store (safe view, excludes password hashes).

        Returns:
            List of officer dictionaries excluding sensitive credential hashes.

        Raises:
            CatalystError: If query fails.
        """
        officers = []
        seen_ids = set()

        query = "SELECT * FROM Officers"
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                for row in results:
                    officer = row.get("Officers", row) if isinstance(row, dict) else row
                    oid = officer.get("OfficerID")
                    if oid and oid not in seen_ids:
                        seen_ids.add(oid)
                        safe_copy = {k: v for k, v in officer.items() if k != "PasswordHash"}
                        officers.append(safe_copy)
            logger.info("[LIST OFFICERS SUCCESS] Retrieved %d officers from Catalyst Data Store", len(officers))
            return officers
        except Exception as exc:
            logger.error("[LIST OFFICERS ERROR] Failed to query Officers: %s", exc)
            raise CatalystError(f"Failed to retrieve officer list from Catalyst Data Store: {exc}") from exc


# Default service instance
officer_service = OfficerService()
