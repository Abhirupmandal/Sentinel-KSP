"""Validation utility functions for Sentinel-KSP requests.

Provides validation helper functions for input fields and dictionary payloads.
"""

from typing import Any, Dict, List, Optional
from core.exceptions import ValidationError


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """Validate that all required field keys exist and are non-empty in data.

    Args:
        data: Payload dictionary to validate.
        required_fields: List of string key names.

    Raises:
        ValidationError: If any required field is missing or empty.
    """
    if not isinstance(data, dict):
        raise ValidationError("Request payload must be a JSON object")

    missing_fields = []
    for field in required_fields:
        val = data.get(field)
        if val is None or (isinstance(val, str) and not val.strip()):
            missing_fields.append(field)

    if missing_fields:
        raise ValidationError(
            f"Missing required field(s): {', '.join(missing_fields)}",
            errors=[{"field": f, "message": "Field is required"} for f in missing_fields],
        )


def validate_non_empty_string(value: Optional[str], field_name: str) -> str:
    """Ensure a value is a non-empty string.

    Args:
        value: Input string to validate.
        field_name: Name of the field for error reporting.

    Returns:
        Stripped non-empty string.

    Raises:
        ValidationError: If validation fails.
    """
    if not value or not isinstance(value, str) or not value.strip():
        raise ValidationError(f"Field '{field_name}' must be a non-empty string")
    return value.strip()
