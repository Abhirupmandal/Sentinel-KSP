"""Authentication service for Sentinel-KSP.

Orchestrates user authentication, password validation, JWT generation, session creation,
logout, forced first-login password change flows, and security audit recording.

Source-of-truth integrity: All credential checks and password updates operate
exclusively against live Catalyst Data Store records. No fallback or mock data is used.
"""

from typing import Any, Dict, Optional
from constants.account_states import AccountState
from core.exceptions import AccountStateError, AuthenticationError, ValidationError
from core.jwt_manager import JWTManager
from core.logger import get_logger
from core.password_manager import PasswordManager
from repositories.officer_repository import officer_repository, OfficerRepository
from services.session_service import session_service, SessionService

logger = get_logger(__name__)


class AuthService:
    """Service layer orchestrating officer authentication flows."""

    def __init__(
        self,
        officer_repo: Optional[OfficerRepository] = None,
        sess_service: Optional[SessionService] = None,
    ) -> None:
        """Initialize AuthService with dependencies."""
        self.officer_repo = officer_repo or officer_repository
        self.session_service = sess_service or session_service

    def _record_auth_audit(
        self,
        action: str,
        actor_id: str,
        inference: str,
        ip_address: Optional[str],
        device_fingerprint: Optional[str],
        metadata: Dict[str, Any],
    ) -> None:
        """Helper to record audit logs for auth events without breaking main execution."""
        try:
            from services.audit_service import audit_service
            audit_service.record(
                action=action,
                actor_officer_id=actor_id,
                resource_type="Session",
                resource_id=actor_id,
                inference=inference,
                ip_address=ip_address or "127.0.0.1",
                device_fingerprint=device_fingerprint or "unknown_device",
                extra_metadata=metadata,
            )
        except Exception as exc:
            logger.warning("Failed to record auth audit log: %s", exc)

    def login(
        self,
        identifier: str,
        password: str,
        ip_address: Optional[str] = None,
        device_fingerprint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Authenticate an officer against the live Catalyst Data Store and return JWT token + safe profile.

        Args:
            identifier: OfficerID (starts with 'OFF-') or EmployeeID.
            password: Raw plaintext password string.
            ip_address: Client IP address.
            device_fingerprint: Client device fingerprint string.

        Returns:
            Dictionary containing token, token_type, expires_in, and officer profile data.

        Raises:
            AuthenticationError: If officer not found or password invalid.
            AccountStateError: If officer account is not in Active or Pending state.
            ConcurrentSessionError: If officer already has an active session.
        """
        # Unambiguous lookup directly from live Catalyst Data Store
        if identifier.upper().startswith("OFF-"):
            officer = self.officer_repo.get_by_officer_id(identifier)
        else:
            officer = self.officer_repo.get_by_employee_id(identifier)
            if not officer:
                officer = self.officer_repo.get_by_officer_id(identifier)

        if not officer:
            logger.warning("Login failed: Identifier '%s' not found in Catalyst Data Store", identifier)
            self._record_auth_audit(
                action="LOGIN_FAILED",
                actor_id=identifier,
                inference="FAILURE",
                ip_address=ip_address,
                device_fingerprint=device_fingerprint,
                metadata={"reason": "Officer identifier not found"},
            )
            raise AuthenticationError("Invalid OfficerID/EmployeeID or password")

        officer_id = officer["OfficerID"]

        # Verify AccountState — allow Active and Pending (for first-login password change)
        account_state = officer.get("AccountState", AccountState.ACTIVE.value)
        allowed_login_states = {
            AccountState.ACTIVE, AccountState.ACTIVE.value,
            AccountState.PENDING, AccountState.PENDING.value,
        }
        if account_state not in allowed_login_states:
            logger.warning("Login rejected for officer '%s': Account state '%s'", officer_id, account_state)
            self._record_auth_audit(
                action="LOGIN_FAILED",
                actor_id=officer_id,
                inference="FAILURE",
                ip_address=ip_address,
                device_fingerprint=device_fingerprint,
                metadata={"reason": f"Account state restricted: {account_state}"},
            )
            raise AccountStateError(
                f"Account access restricted. Current state: '{account_state}'. Contact your administrator."
            )

        # Verify password hash exclusively against live PasswordHash (NO fallback/demo password checks)
        stored_hash = officer.get("PasswordHash", "")
        is_valid_pwd = PasswordManager.verify_password(password, stored_hash)

        if not is_valid_pwd:
            logger.warning("Login failed: Password mismatch for officer '%s'", officer_id)
            self._record_auth_audit(
                action="LOGIN_FAILED",
                actor_id=officer_id,
                inference="FAILURE",
                ip_address=ip_address,
                device_fingerprint=device_fingerprint,
                metadata={"reason": "Invalid password"},
            )
            raise AuthenticationError("Invalid OfficerID/EmployeeID or password")

        role = officer.get("Role", "FieldInvestigator")

        # Create session (enforces single active session per officer via session eviction)
        session = self.session_service.create_session(
            officer_id=officer_id,
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
        )

        session_id = session["SessionID"]

        # Issue JWT with custom 'sid' claim
        token = JWTManager.issue_token(
            officer_id=officer_id,
            session_id=session_id,
            role=role,
        )

        # Record successful login audit
        self._record_auth_audit(
            action="LOGIN",
            actor_id=officer_id,
            inference="SUCCESS",
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
            metadata={"session_id": session_id, "role": role},
        )

        # Parse TempPasswordFlag safely from live row
        raw_temp_flag = officer.get("TempPasswordFlag", False)
        temp_flag_bool = True if raw_temp_flag in (True, "true", "True", 1, "1") else False

        # Build clean profile dictionary (never return password hash)
        profile = {
            "officer_id": officer_id,
            "full_name": officer.get("FullName", ""),
            "employee_id": officer.get("EmployeeID", ""),
            "role": role,
            "district": officer.get("District", ""),
            "rank": officer.get("Rank", ""),
            "station": officer.get("Station", ""),
            "department": officer.get("Department", ""),
            "account_state": account_state,
            "temp_password_flag": temp_flag_bool,
        }

        return {
            "token": token,
            "token_type": "Bearer",
            "expires_in": 28800,  # 8 hours in seconds
            "officer": profile,
        }

    def logout(self, session_id: str, officer_id: Optional[str] = None) -> bool:
        """Log out an officer by terminating their session in Catalyst Data Store.

        Args:
            session_id: Target SessionID (from JWT sid claim).
            officer_id: Optional OfficerID for audit logging.

        Returns:
            True if session deactivated.
        """
        success = self.session_service.end_session(session_id)
        if success and officer_id:
            self._record_auth_audit(
                action="LOGOUT",
                actor_id=officer_id,
                inference="SUCCESS",
                ip_address=None,
                device_fingerprint=None,
                metadata={"session_id": session_id},
            )
        return success

    def change_password(
        self, officer_id: str, current_password: str, new_password: str
    ) -> Dict[str, Any]:
        """Change an officer's password, set TempPasswordFlag = false, and transition AccountState to Active.

        Mandatory implementation behavior:
        1. Load authenticated officer from live datastore
        2. Verify current password against live PasswordHash
        3. Hash new password
        4. Call canonical repository update method (update_password_state)
        5. Immediately re-fetch live row from datastore
        6. Cryptographically verify new hash matches new password
        7. Cryptographically verify old password no longer matches
        8. Confirm TempPasswordFlag == false
        9. Confirm AccountState == Active if first-login
        10. Fail loudly if any verification step fails

        Args:
            officer_id: Target OfficerID.
            current_password: Raw current password.
            new_password: Raw new password.

        Returns:
            Dictionary containing updated safe officer profile metadata.

        Raises:
            AuthenticationError: If officer not found, current password incorrect, or post-write verification fails.
        """
        # Step 1: Validate new password is not identical to current password
        if current_password == new_password:
            raise ValidationError("New password cannot be identical to the current password")

        # Step 2: Load officer from live datastore
        officer = self.officer_repo.get_by_officer_id(officer_id)
        if not officer:
            raise AuthenticationError("Officer not found in live Catalyst Data Store")

        # Step 3: Verify current password against live PasswordHash
        stored_hash = officer.get("PasswordHash", "")
        if not PasswordManager.verify_password(current_password, stored_hash):
            raise AuthenticationError("Current password incorrect")

        # Step 4: Hash new password securely with bcrypt
        new_hash = PasswordManager.hash_password(new_password)

        # Step 5: Call canonical repository update method
        success = self.officer_repo.update_password_state(
            officer_id=officer_id,
            new_hash=new_hash,
            temp_flag=False,
            new_state=AccountState.ACTIVE.value,
        )

        if not success:
            raise AuthenticationError("Failed to issue password update to datastore")

        # Step 6: Immediately re-fetch live row from datastore
        refetched = self.officer_repo.get_by_officer_id(officer_id)
        if not refetched:
            raise AuthenticationError("Post-write verification failed: could not re-fetch officer record from datastore")

        refetched_hash = refetched.get("PasswordHash", "")

        # Step 7: Cryptographically verify new hash matches new_password
        if not PasswordManager.verify_password(new_password, refetched_hash):
            logger.error("POST-WRITE FAILURE: New password does not match persisted hash for officer %s", officer_id)
            raise AuthenticationError("Post-write verification failed: persisted password hash does not match new password")

        # Step 8: Cryptographically verify old temp/demo password no longer matches
        if PasswordManager.verify_password(current_password, refetched_hash):
            logger.error("POST-WRITE FAILURE: Old temp password still matches persisted hash for officer %s", officer_id)
            raise AuthenticationError("Post-write verification failed: old temp password still matches persisted hash")

        # Step 9: Confirm TempPasswordFlag == False
        refetched_temp_flag = refetched.get("TempPasswordFlag")
        temp_flag_bool = True if refetched_temp_flag in (True, "true", "True", 1, "1") else False
        if temp_flag_bool is not False:
            logger.error("POST-WRITE FAILURE: TempPasswordFlag is still %s for officer %s", refetched_temp_flag, officer_id)
            raise AuthenticationError("Post-write verification failed: TempPasswordFlag remains true in datastore")

        # Step 10: Confirm AccountState == Active
        refetched_state = refetched.get("AccountState")
        if refetched_state != AccountState.ACTIVE.value:
            logger.error("POST-WRITE FAILURE: AccountState is %s (expected Active) for officer %s", refetched_state, officer_id)
            raise AuthenticationError(f"Post-write verification failed: AccountState is '{refetched_state}' instead of 'Active'")

        logger.info("[DATATTEST VERIFIED SUCCESS] Password credentials fully verified in live Catalyst Data Store for officer %s", officer_id)
        self._record_auth_audit(
            action="PASSWORD_RESET",
            actor_id=officer_id,
            inference="SUCCESS",
            ip_address=None,
            device_fingerprint=None,
            metadata={"remarks": "First-login password change completed and verified against live datastore"},
        )

        return {
            "officer_id": officer_id,
            "full_name": refetched.get("FullName", ""),
            "employee_id": refetched.get("EmployeeID", ""),
            "account_state": AccountState.ACTIVE.value,
            "temp_password_flag": False,
        }


# Default instance
auth_service = AuthService()
