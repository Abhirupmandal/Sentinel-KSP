"""Session repository for Sentinel-KSP.

Handles queries and updates against the ActiveSessions table using ZCQL/REST.
Strictly adheres to confirmed ActiveSessions schema columns:
- OfficerID, SessionID, IsActive (boolean), LastActivityTime, IPAddress, DeviceFingerprint

NO local fallback, in-memory dictionary, or mock persistence is used.
All operations execute directly against live Catalyst Data Store.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.exceptions import CatalystError, NotFoundError
from core.logger import get_logger
from config import escape_zcql_string

logger = get_logger(__name__)


class SessionRepository:
    """Data access repository for ActiveSessions table in Zoho Catalyst Data Store."""

    def _normalize_session_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Extract inner ActiveSessions dict if nested by ZCQL."""
        if isinstance(row, dict) and "ActiveSessions" in row:
            return row["ActiveSessions"]
        return row

    def get_active_session_for_officer(self, officer_id: str) -> Optional[Dict[str, Any]]:
        """Fetch the active session row for a given OfficerID (where IsActive = True).

        Args:
            officer_id: Target OfficerID.

        Returns:
            Active session dict or None.

        Raises:
            CatalystError: If query fails.
        """
        if not officer_id:
            return None

        query = (
            f"SELECT * FROM ActiveSessions WHERE OfficerID = {escape_zcql_string(officer_id)} "
            "AND IsActive = true"
        )
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                row = self._normalize_session_row(results[0])
                # Normalize boolean representation
                is_active_raw = row.get("IsActive")
                row["IsActive"] = True if is_active_raw in (True, "true", "True", 1, "1") else False
                if row["IsActive"]:
                    logger.debug("get_active_session_for_officer('%s'): found active session", officer_id)
                    return row
            logger.debug("get_active_session_for_officer('%s'): no active session", officer_id)
            return None
        except Exception as exc:
            logger.error("get_active_session_for_officer('%s') query error: %s", officer_id, exc)
            raise CatalystError(f"Failed to query active session for officer '{officer_id}': {exc}") from exc

    def get_by_session_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a session record by SessionID directly from Catalyst Data Store.

        Args:
            session_id: Target SessionID string.

        Returns:
            Session record dict or None.

        Raises:
            CatalystError: If query fails.
        """
        if not session_id:
            return None

        query = f"SELECT * FROM ActiveSessions WHERE SessionID = {escape_zcql_string(session_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                row = self._normalize_session_row(results[0])
                is_active_raw = row.get("IsActive")
                row["IsActive"] = True if is_active_raw in (True, "true", "True", 1, "1") else False
                logger.debug("get_by_session_id('%s'): found session in Catalyst", session_id)
                return row
            logger.debug("get_by_session_id('%s'): session not found in Catalyst", session_id)
            return None
        except Exception as exc:
            logger.error("get_by_session_id('%s') query error: %s", session_id, exc)
            raise CatalystError(f"Failed to query session by SessionID '{session_id}': {exc}") from exc

    def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new session record into ActiveSessions in Catalyst Data Store.

        Must persist directly to live Catalyst Data Store and fail loudly on error.

        Args:
            session_data: Dictionary containing confirmed ActiveSessions columns:
                OfficerID, SessionID, IsActive, LastActivityTime, IPAddress, DeviceFingerprint.

        Returns:
            Created session dictionary including returned ROWID.

        Raises:
            CatalystError: If insertion fails.
        """
        session_id = session_data.get("SessionID")
        if not session_id or not session_data.get("OfficerID"):
            raise CatalystError("SessionID and OfficerID are required to create a session")

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        record = {
            "OfficerID": session_data["OfficerID"],
            "SessionID": session_id,
            "IsActive": True,
            "LastActivityTime": session_data.get("LastActivityTime") or now_str,
            "IPAddress": session_data.get("IPAddress", ""),
            "DeviceFingerprint": session_data.get("DeviceFingerprint", "unknown_device"),
        }

        res = catalyst_client.insert_row("ActiveSessions", record)
        logger.info("[SESSION REPO CREATE SUCCESS] SessionID='%s' Response=%s", session_id, res)

        created_record = dict(record)
        if isinstance(res, dict) and "ROWID" in res:
            created_record["ROWID"] = res["ROWID"]

        return created_record

    def deactivate_session(self, session_id: str) -> bool:
        """Mark a session as inactive (IsActive = False) in Catalyst Data Store.

        Args:
            session_id: SessionID to deactivate.

        Returns:
            True if deactivated successfully.

        Raises:
            NotFoundError: If session record doesn't exist.
            CatalystError: If Catalyst update fails.
        """
        session = self.get_by_session_id(session_id)
        if not session:
            logger.warning("deactivate_session failed: Session '%s' not found", session_id)
            return False

        row_id = session.get("ROWID")
        if not row_id:
            raise CatalystError(f"Cannot deactivate session '{session_id}' because ROWID is missing")

        update_payload = {"ROWID": row_id, "IsActive": False}
        catalyst_client.update_row("ActiveSessions", update_payload)
        logger.info("[SESSION REPO DEACTIVATE SUCCESS] SessionID='%s' ROWID='%s'", session_id, row_id)
        return True

    def update_last_activity(self, session_id: str, timestamp: Optional[str] = None) -> bool:
        """Update the LastActivityTime for an active session in Catalyst Data Store.

        Args:
            session_id: Target SessionID.
            timestamp: Optional formatted timestamp string (`YYYY-MM-DD HH:MM:SS`).

        Returns:
            True if updated successfully.

        Raises:
            CatalystError: If Catalyst update fails.
        """
        session = self.get_by_session_id(session_id)
        if not session or not session.get("IsActive"):
            logger.warning("update_last_activity skipped: Session '%s' inactive or not found", session_id)
            return False

        row_id = session.get("ROWID")
        if not row_id:
            raise CatalystError(f"Cannot update activity for session '{session_id}' because ROWID is missing")

        now_str = timestamp or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        update_payload = {"ROWID": row_id, "LastActivityTime": now_str}
        catalyst_client.update_row("ActiveSessions", update_payload)
        logger.debug("[SESSION REPO ACTIVITY UPDATED] SessionID='%s' Time='%s'", session_id, now_str)
        return True


# Default instance
session_repository = SessionRepository()
