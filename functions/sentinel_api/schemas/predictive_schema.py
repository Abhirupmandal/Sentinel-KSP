"""Predictive schemas for Sentinel-KSP.

Validates input parameters for risk score and anomaly detection endpoints.
"""

from typing import Any, Dict, Optional
from core.exceptions import ValidationError


class PredictiveSchema:
    """Validator for predictive analytics request parameters."""

    @staticmethod
    def validate_risk_params(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate risk score calculation parameters."""
        district = args.get("district")
        if not district:
            raise ValidationError("Parameter 'district' is required for risk scoring")
        return {
            "district": str(district),
            "crime_group": args.get("crime_group"),
        }

    @staticmethod
    def validate_anomaly_params(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate anomaly detection parameters."""
        threshold = args.get("threshold", 0.75)
        try:
            threshold = max(0.1, min(float(threshold), 1.0))
        except (TypeError, ValueError):
            threshold = 0.75

        return {
            "district": args.get("district"),
            "threshold": threshold,
        }
