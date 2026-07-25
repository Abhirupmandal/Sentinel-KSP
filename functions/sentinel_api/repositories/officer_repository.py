"""Officer repository for Sentinel-KSP.

Handles all datastore queries against the Officers table using ZCQL/REST.
Strictly adheres to confirmed Officers schema columns:
- OfficerID, FullName, EmployeeID, PasswordHash, TempPasswordFlag, PasswordLastChanged,
  Role, District, Rank, Station, Department, AccountState, CreatedBy

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


class OfficerRepository:
    """Data access repository for Officers table in Zoho Catalyst Data Store.

    Source-of-truth integrity: The Officers table in Zoho Catalyst is the ONLY
    credential source of truth. No auth-critical path may rely on local fallback
    or mock data.
    """

    def _normalize_officer_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Extract inner Officers dict if nested by ZCQL."""
        if isinstance(row, dict) and "Officers" in row:
            return row["Officers"]
        return row

    def get_by_officer_id(self, officer_id: str) -> Optional[Dict[str, Any]]:
        """Fetch an Officer record by OfficerID directly from Catalyst Data Store.

        Args:
            officer_id: The unique OfficerID string.

        Returns:
            Officer record dictionary directly from Catalyst, or None if not found.
            NEVER returns fallback or mock data.
        """
        if not officer_id:
            return None

        query = f"SELECT * FROM Officers WHERE OfficerID = {escape_zcql_string(officer_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                row = self._normalize_officer_row(results[0])
                logger.debug("get_by_officer_id('%s'): found in live Catalyst Data Store", officer_id)
                return row
            logger.debug("get_by_officer_id('%s'): not found in live Catalyst Data Store", officer_id)
            return None
        except Exception as exc:
            logger.error("get_by_officer_id('%s') Catalyst query error: %s", officer_id, exc)
            raise CatalystError(f"Failed to query Officer by OfficerID '{officer_id}': {exc}") from exc

    def get_by_employee_id(
        self, employee_id: str, *, for_duplicate_check: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Fetch an Officer record by EmployeeID (Badge Number) directly from Catalyst Data Store.

        Args:
            employee_id: The badge/employee number string.
            for_duplicate_check: Interface compatibility flag; queries live Catalyst only.

        Returns:
            Officer record dictionary directly from Catalyst, or None if not found.
            NEVER returns fallback or mock data.
        """
        if not employee_id:
            return None

        query = f"SELECT * FROM Officers WHERE EmployeeID = {escape_zcql_string(employee_id)}"
        try:
            results = catalyst_client.execute_zcql(query)
            if results:
                row = self._normalize_officer_row(results[0])
                logger.info(
                    "get_by_employee_id('%s'): found in live Catalyst Data Store (for_duplicate_check=%s)",
                    employee_id, for_duplicate_check,
                )
                return row
            logger.info(
                "get_by_employee_id('%s'): not found in live Catalyst Data Store (for_duplicate_check=%s)",
                employee_id, for_duplicate_check,
            )
            return None
        except Exception as exc:
            logger.error("get_by_employee_id('%s') Catalyst query error: %s", employee_id, exc)
            raise CatalystError(f"Failed to query Officer by EmployeeID '{employee_id}': {exc}") from exc

    def create(self, officer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Officer record in Catalyst Data Store.

        Must persist directly to live Catalyst Data Store and fail loudly on error.

        Args:
            officer_data: Dictionary containing confirmed Officers columns:
                OfficerID, FullName, EmployeeID, PasswordHash, TempPasswordFlag,
                PasswordLastChanged, Role, District, Rank, Station, Department,
                AccountState, CreatedBy.

        Returns:
            Created Officer record dictionary including returned ROWID.

        Raises:
            CatalystError: If OfficerID is missing or insert fails.
        """
        officer_id = officer_data.get("OfficerID")
        if not officer_id:
            raise CatalystError("OfficerID is required to insert an Officer")

        # Live insert to Catalyst Data Store
        res = catalyst_client.insert_row("Officers", officer_data)
        logger.info("[OFFICER REPO CREATE SUCCESS] OfficerID='%s' Response=%s", officer_id, res)

        created_record = dict(officer_data)
        if isinstance(res, dict) and "ROWID" in res:
            created_record["ROWID"] = res["ROWID"]

        return created_record

    def update_account_state(self, officer_id: str, new_state: str) -> bool:
        """Update an Officer's AccountState in Catalyst Data Store.

        Args:
            officer_id: The OfficerID.
            new_state: Target AccountState string.

        Returns:
            True if updated successfully.

        Raises:
            NotFoundError: If officer doesn't exist.
            CatalystError: If Catalyst update fails.
        """
        officer = self.get_by_officer_id(officer_id)
        if not officer:
            raise NotFoundError(f"Officer '{officer_id}' not found in Catalyst Data Store")

        row_id = officer.get("ROWID")
        if not row_id:
            raise CatalystError(f"Cannot update officer '{officer_id}' because ROWID is missing")

        update_payload = {"ROWID": row_id, "AccountState": new_state}
        catalyst_client.update_row("Officers", update_payload)
        logger.info("[OFFICER REPO UPDATE STATE SUCCESS] OfficerID='%s' ROWID='%s' State='%s'", officer_id, row_id, new_state)
        return True

    def update_password_state(
        self,
        officer_id: str,
        new_hash: str,
        temp_flag: bool = False,
        new_state: str = "Active",
    ) -> bool:
        """Canonical method to transition an Officer's credential state in Catalyst Data Store.

        Persists PasswordHash, TempPasswordFlag (boolean False), PasswordLastChanged (current UTC timestamp),
        and AccountState ('Active') to the live Catalyst Data Store row via REST PATCH targeting ROWID.

        Args:
            officer_id: Target OfficerID.
            new_hash: New bcrypt password hash string.
            temp_flag: Boolean flag (False after password change).
            new_state: Target AccountState string (defaults to 'Active').

        Returns:
            True if update succeeded.

        Raises:
            NotFoundError: If officer does not exist in live Catalyst Data Store.
            CatalystError: If ROWID is missing or Catalyst REST update fails.
        """
        officer = self.get_by_officer_id(officer_id)
        if not officer:
            raise NotFoundError(f"Officer '{officer_id}' not found in Catalyst Data Store")

        row_id = officer.get("ROWID")
        if not row_id:
            raise CatalystError(f"Cannot update password for officer '{officer_id}' because ROWID is missing")

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        update_payload = {
            "ROWID": row_id,
            "PasswordHash": new_hash,
            "TempPasswordFlag": bool(temp_flag),
            "PasswordLastChanged": now_str,
            "AccountState": new_state,
        }

        logger.info(
            "[OFFICER REPO UPDATE PASSWORD STATE INITIATED] OfficerID='%s' ROWID='%s' TempFlag=%s State='%s'",
            officer_id, row_id, temp_flag, new_state,
        )

        res = catalyst_client.update_row("Officers", update_payload)
        logger.info(
            "[OFFICER REPO UPDATE PASSWORD STATE SUCCESS] OfficerID='%s' ROWID='%s' Response=%s",
            officer_id, row_id, res,
        )
        return True

    def update_password_credentials(
        self,
        officer_id: str,
        new_hash: str,
        temp_flag: bool = False,
        new_state: str = "Active",
    ) -> bool:
        """Alias for update_password_state for interface compatibility."""
        return self.update_password_state(
            officer_id=officer_id,
            new_hash=new_hash,
            temp_flag=temp_flag,
            new_state=new_state,
        )

    def update_password_hash(self, officer_id: str, new_hash: str, temp_flag: bool = False) -> bool:
        """Backward-compatible alias for update_password_state."""
        return self.update_password_state(officer_id, new_hash, temp_flag=temp_flag, new_state="Active")


# Default instance
officer_repository = OfficerRepository()
