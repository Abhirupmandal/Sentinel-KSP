"""Geospatial request schemas for Sentinel-KSP.

Validates filter parameters for hotspot/drilldown queries.
"""

from typing import Any, Dict, Optional
from core.exceptions import ValidationError


class GeospatialSchema:
    """Validator for geospatial query parameters."""

    @staticmethod
    def validate_hotspot_params(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate hotspot clustering query parameters."""
        return {
            "district": args.get("district"),
            "station": args.get("station"),
            "start_date": args.get("start_date"),
            "end_date": args.get("end_date"),
            "shift": args.get("shift"),
            "hour_bucket": args.get("hour_bucket"),
        }

    @staticmethod
    def validate_drilldown_params(args: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """Validate geographic drilldown parameters (state -> district -> station)."""
        level = args.get("level", "district")
        if level not in ("state", "district", "station"):
            raise ValidationError("'level' must be 'state', 'district', or 'station'")
        return {
            "level": level,
            "district": args.get("district"),
            "station": args.get("station"),
        }

    @staticmethod
    def validate_spike_params(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate spike detection parameters."""
        baseline_days = args.get("baseline_days", 90)
        try:
            baseline_days = max(7, int(baseline_days))
        except (TypeError, ValueError):
            baseline_days = 90
        return {
            "district": args.get("district"),
            "baseline_days": baseline_days,
        }
