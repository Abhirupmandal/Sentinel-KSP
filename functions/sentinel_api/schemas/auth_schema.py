"""Authentication request validation schemas for Sentinel-KSP.

Validates payload structures for Login, Logout, and Change Password requests.
Strictly enforces payload validation rules while accepting flexible client field keys.
"""

from typing import Any, Dict
from core.exceptions import ValidationError


class AuthSchema:
    """Validator class for authentication API payloads."""

    @staticmethod
    def validate_login_request(data: Dict[str, Any]) -> Dict[str, str]:
        """Validate a login payload.

        Supports flexible client field keys (identifier, officer_id, officerId,
        OfficerID, employee_id, employeeId, EmployeeID).

        Args:
            data: Raw request JSON object.

        Returns:
            Validated dictionary containing 'identifier' (OfficerID/EmployeeID) and 'password'.

        Raises:
            ValidationError: If payload is missing required fields or empty.
        """
        if not isinstance(data, dict):
            raise ValidationError("Invalid payload format: expected JSON object")

        identifier = (
            data.get("identifier")
            or data.get("officer_id")
            or data.get("officerId")
            or data.get("OfficerID")
            or data.get("employee_id")
            or data.get("employeeId")
            or data.get("EmployeeID")
        )
        if not identifier or not str(identifier).strip():
            raise ValidationError("Either 'identifier', 'officer_id', or 'employee_id' must be provided")

        password = data.get("password") or data.get("Password")
        if not password or not str(password).strip():
            raise ValidationError("Field 'password' is required and cannot be empty")

        return {
            "identifier": str(identifier).strip(),
            "password": str(password),
        }

    @staticmethod
    def validate_change_password_request(data: Dict[str, Any]) -> Dict[str, str]:
        """Validate a change password payload.

        Supports both snake_case (current_password, new_password) and camelCase
        (currentPassword, newPassword, old_password, oldPassword) client field keys.

        Args:
            data: Raw request JSON object.

        Returns:
            Validated dictionary containing 'current_password' and 'new_password'.

        Raises:
            ValidationError: If required fields are missing, empty, new password matches current,
                            or new password is less than 8 characters long.
        """
        if not isinstance(data, dict):
            raise ValidationError("Invalid payload format: expected JSON object")

        current_pw = (
            data.get("current_password")
            or data.get("currentPassword")
            or data.get("old_password")
            or data.get("oldPassword")
        )
        if not current_pw or not str(current_pw).strip():
            raise ValidationError("Field 'current_password' (or 'currentPassword') is required and cannot be empty")

        new_pw = (
            data.get("new_password")
            or data.get("newPassword")
            or data.get("password")
            or data.get("Password")
        )
        if not new_pw or not str(new_pw).strip():
            raise ValidationError("Field 'new_password' (or 'newPassword') is required and cannot be empty")

        current_pw_str = str(current_pw)
        new_pw_str = str(new_pw)

        if current_pw_str == new_pw_str:
            raise ValidationError("New password cannot be identical to the current password")

        if len(new_pw_str) < 8:
            raise ValidationError("New password must be at least 8 characters long")

        return {
            "current_password": current_pw_str,
            "new_password": new_pw_str,
        }
