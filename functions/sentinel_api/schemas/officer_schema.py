"""Officer request validation schemas for Sentinel-KSP.

Validates payloads for create-officer, lock/unlock, disable, reset-password, and force-logout.
"""

from typing import Any, Dict
from constants.account_states import AccountState
from constants.roles import Role
from core.exceptions import ValidationError
from utils.validators import validate_required_fields, validate_non_empty_string


class OfficerSchema:
    """Validator class for officer administration API payloads."""

    @staticmethod
    def validate_create_officer(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate create-officer payload.

        Enforces all 7 required officer creation fields and validates role against confirmed Role Enum.

        Args:
            data: Raw request JSON payload.

        Returns:
            Validated dictionary containing clean officer metadata strings.

        Raises:
            ValidationError: If missing required fields or role is invalid.
        """
        validate_required_fields(data, [
            "full_name", "employee_id", "role", "district", "rank", "station", "department",
        ])
        role = validate_non_empty_string(data.get("role"), "role")
        if not Role.has_value(role):
            raise ValidationError(f"Invalid role: '{role}'. Must be one of: {[r.value for r in Role]}")

        return {
            "full_name": validate_non_empty_string(data.get("full_name"), "full_name"),
            "employee_id": validate_non_empty_string(data.get("employee_id"), "employee_id"),
            "role": role,
            "district": validate_non_empty_string(data.get("district"), "district"),
            "rank": validate_non_empty_string(data.get("rank"), "rank"),
            "station": validate_non_empty_string(data.get("station"), "station"),
            "department": validate_non_empty_string(data.get("department"), "department"),
        }

    @staticmethod
    def validate_officer_id_payload(data: Dict[str, Any]) -> str:
        """Validate payload containing officer_id for lock/unlock/disable/force-logout.

        Args:
            data: Raw request JSON payload.

        Returns:
            Validated non-empty officer_id string.
        """
        validate_required_fields(data, ["officer_id"])
        return validate_non_empty_string(data.get("officer_id"), "officer_id")

    @staticmethod
    def validate_reset_password(data: Dict[str, Any]) -> str:
        """Validate admin reset-password payload.

        Args:
            data: Raw request JSON payload.

        Returns:
            Validated non-empty officer_id string.
        """
        validate_required_fields(data, ["officer_id"])
        return validate_non_empty_string(data.get("officer_id"), "officer_id")
