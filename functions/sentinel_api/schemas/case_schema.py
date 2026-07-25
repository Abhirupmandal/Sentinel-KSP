"""Case filter/listing request schemas for Sentinel-KSP.

Validates request parameters for case endpoints Phase P3 will use.
"""

from typing import Any, Dict, Optional, Tuple
from core.exceptions import ValidationError


class CaseSchema:
    """Validator for case filter/listing request parameters."""

    @staticmethod
    def validate_date_range(data: Dict[str, Any]) -> Tuple[str, str]:
        """Validate date range parameters (start_date, end_date)."""
        start = data.get("start_date")
        end = data.get("end_date")
        if not start or not end:
            raise ValidationError("Both 'start_date' and 'end_date' are required (YYYY-MM-DD)")
        return str(start), str(end)

    @staticmethod
    def validate_bounding_box(data: Dict[str, Any]) -> Dict[str, float]:
        """Validate bounding box parameters for geospatial queries."""
        required = ["lat_min", "lat_max", "lon_min", "lon_max"]
        for key in required:
            if key not in data:
                raise ValidationError(f"Missing bounding box parameter: '{key}'")
            try:
                float(data[key])
            except (TypeError, ValueError):
                raise ValidationError(f"'{key}' must be a valid number")
        return {
            "lat_min": float(data["lat_min"]),
            "lat_max": float(data["lat_max"]),
            "lon_min": float(data["lon_min"]),
            "lon_max": float(data["lon_max"]),
        }

    @staticmethod
    def validate_pagination(data: Dict[str, Any]) -> Dict[str, int]:
        """Validate pagination parameters with safe defaults."""
        page = data.get("page", 1)
        page_size = data.get("page_size", 25)
        try:
            page = max(1, int(page))
            page_size = max(1, min(int(page_size), 100))
        except (TypeError, ValueError):
            page, page_size = 1, 25
        return {"page": page, "page_size": page_size}
