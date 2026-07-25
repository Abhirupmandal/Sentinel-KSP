"""Dashboard request schemas for Sentinel-KSP.

Validates filter parameters for dashboard overview/trend endpoints.
"""

from typing import Any, Dict, Optional
from core.exceptions import ValidationError


class DashboardSchema:
    """Validator for dashboard query parameters."""

    @staticmethod
    def validate_overview_params(args: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """Validate overview filter parameters."""
        return {
            "district": args.get("district"),
            "crime_group": args.get("crime_group"),
            "start_date": args.get("start_date"),
            "end_date": args.get("end_date"),
        }

    @staticmethod
    def validate_trend_params(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate trend analysis parameters."""
        period = args.get("period", "monthly")
        if period not in ("daily", "weekly", "monthly"):
            raise ValidationError("'period' must be 'daily', 'weekly', or 'monthly'")
        return {
            "district": args.get("district"),
            "crime_group": args.get("crime_group"),
            "period": period,
        }
