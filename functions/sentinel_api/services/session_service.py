"""Session management service for Sentinel-KSP.

Contains business logic for user session lifecycle management, single-active-session
enforcement, session activity updating, and session expiry sweeping.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from core.exceptions import ConcurrentSessionError, SessionError
from core.logger import get_logger
from repositories.session_repository import session_repository, SessionRepository
from utils.id_generator import generate_session_id

logger = get_logger(__name__)

DEFAULT_SESSION_TIMEOUT_MINUTES = 15


class SessionService:
    """Service layer orchestrating ActiveSessions business logic."""

    def __init__(self, repository: Optional[SessionRepository] = None) -> None:
        """Initialize SessionService with repository dependency injection."""
        self.repo = repository or session_repository

    def create_session(
        self,
        officer_id: str,
        ip_address: Optional[str] = None,
        device_fingerprint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new session for an officer.

        Enforces PRD Design Decision: Concurrent logins are prohibited.
        If an active session already exists for the officer, raises ConcurrentSessionError.

        Args:
            officer_id: Target OfficerID.
            ip_address: Client IP address string.
            device_fingerprint: Client device fingerprint string.

        Returns:
            Created ActiveSessions record dictionary.

        Raises:
            ConcurrentSessionError: If officer already has an active session.
        """
        existing = self.repo.get_active_session_for_officer(officer_id)
        if existing and existing.get("IsActive"):
            old_sid = existing.get("SessionID")
            # Verify if existing session has expired due to 15-minute inactivity
            if not self.is_session_valid(old_sid):
                logger.info("Deactivating expired session %s for officer %s", old_sid, officer_id)
                self.end_session(old_sid)
            else:
                logger.warning("Concurrent login rejected for officer_id=%s", officer_id)
                try:
                    from services.audit_service import audit_service
                    audit_service.record(
                        action="CONCURRENT_LOGIN_REJECTED",
                        actor_officer_id=officer_id,
                        resource_type="Session",
                        resource_id=old_sid,
                        inference="FAILURE",
                        ip_address=ip_address or "127.0.0.1",
                        device_fingerprint=device_fingerprint or "unknown_device",
                        extra_metadata={"remarks": f"Concurrent login attempt rejected for officer {officer_id}"},
                    )
                except Exception as audit_exc:
                    logger.warning("Failed to record concurrent login audit: %s", audit_exc)

                raise ConcurrentSessionError(
                    f"Officer '{officer_id}' already has an active session. Please log out from other devices first."
                )

        session_id = generate_session_id()
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        # Strictly matching confirmed ActiveSessions columns:
        # OfficerID, SessionID, IsActive, LastActivityTime, IPAddress, DeviceFingerprint
        session_data = {
            "OfficerID": officer_id,
            "SessionID": session_id,
            "IsActive": True,
            "LastActivityTime": now_str,
            "IPAddress": ip_address or "127.0.0.1",
            "DeviceFingerprint": device_fingerprint or "unknown_device",
        }

        created = self.repo.create_session(session_data)
        logger.info("Created session %s for officer %s", session_id, officer_id)
        return created

    def end_session(self, session_id: str) -> bool:
        """Deactivate an active session (sets IsActive = False in Catalyst Data Store).

        Args:
            session_id: Target SessionID.

        Returns:
            True if session was found and deactivated.
        """
        if not session_id:
            return False
        success = self.repo.deactivate_session(session_id)
        if success:
            logger.info("Ended session %s", session_id)
        return success

    def touch_session(self, session_id: str) -> bool:
        """Update LastActivityTime to current timestamp for an active session.

        Args:
            session_id: Target SessionID.

        Returns:
            True if touch succeeded.
        """
        if not session_id:
            return False
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        return self.repo.update_last_activity(session_id, now_str)

    def is_session_valid(
        self, session_id: str, timeout_minutes: int = DEFAULT_SESSION_TIMEOUT_MINUTES
    ) -> bool:
        """Verify that a session exists, is active, and has not timed out.

        Args:
            session_id: Target SessionID string.
            timeout_minutes: Max allowed inactivity in minutes (default 15).

        Returns:
            True if valid, False if invalid or expired.
        """
        session = self.repo.get_by_session_id(session_id)
        if not session or not session.get("IsActive"):
            return False

        last_activity_raw = session.get("LastActivityTime")
        if not last_activity_raw:
            return False

        try:
            if isinstance(last_activity_raw, datetime):
                last_act = last_activity_raw
            else:
                clean_str = str(last_activity_raw).strip()
                # Handle Catalyst timestamp formats like "2026-07-25 20:07:53:155" or "2026-07-25 20:07:53.155"
                if len(clean_str) > 19 and clean_str[19] in (":", "."):
                    clean_str = clean_str[:19]
                try:
                    last_act = datetime.strptime(clean_str[:19], "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    last_act = datetime.strptime(clean_str[:10], "%Y-%m-%d")
                last_act = last_act.replace(tzinfo=timezone.utc)

            now = datetime.now(timezone.utc)
            if last_act.tzinfo is None:
                last_act = last_act.replace(tzinfo=timezone.utc)

            elapsed_minutes = (now - last_act).total_seconds() / 60.0
            if elapsed_minutes > timeout_minutes:
                logger.info("Session %s expired due to inactivity (%.1f mins)", session_id, elapsed_minutes)
                self.end_session(session_id)
                return False
        except Exception as exc:
            logger.error("Error parsing LastActivityTime for session %s: %s", session_id, exc)
            self.end_session(session_id)
            return False

        return True

    def sweep_expired_sessions(self, timeout_minutes: int = DEFAULT_SESSION_TIMEOUT_MINUTES) -> int:
        """Scan and deactivate all sessions exceeding inactivity threshold directly in Catalyst Data Store.

        Args:
            timeout_minutes: Max inactivity threshold.

        Returns:
            Number of sessions deactivated.
        """
        expired_count = 0
        from core.catalyst_client import catalyst_client

        try:
            query = "SELECT * FROM ActiveSessions WHERE IsActive = true"
            results = catalyst_client.execute_zcql(query)
            if results:
                for row in results:
                    sess = row.get("ActiveSessions", row) if isinstance(row, dict) else row
                    sess_id = sess.get("SessionID")
                    if sess_id and not self.is_session_valid(sess_id, timeout_minutes):
                        expired_count += 1
        except Exception as exc:
            logger.error("Error sweeping expired sessions from Catalyst Data Store: %s", exc)

        logger.info("Expired session sweep completed. Deactivated %d session(s)", expired_count)
        return expired_count


# Default service instance
session_service = SessionService()
