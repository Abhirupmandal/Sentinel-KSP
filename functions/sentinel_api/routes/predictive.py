"""Predictive API routes for Sentinel-KSP.

Accessible by SCRB Data Analyst.
"""

from flask import Blueprint, g, request
from constants.permissions import Permission
from core.responses import success_response
from middleware.auth_middleware import require_auth
from middleware.rbac import require_permission
from middleware.session import require_session
from schemas.predictive_schema import PredictiveSchema
from services.predictive_service import predictive_service

predictive_bp = Blueprint("predictive_bp", __name__, url_prefix="/api/predictive")


@predictive_bp.route("/risk-score", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.PREDICTIVE_VIEW)
def get_risk_score():
    """Retrieve predictive risk score for a district via QuickML."""
    params = PredictiveSchema.validate_risk_params(request.args)
    data = predictive_service.calculate_district_risk_score(
        officer_id=getattr(g, "officer_id"),
        district=params["district"],
        crime_group=params.get("crime_group"),
    )
    return success_response(data=data, message="Predictive risk score calculated successfully")


@predictive_bp.route("/anomalies", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.PREDICTIVE_VIEW)
def get_anomalies():
    """Detect crime pattern anomalies using predictive model algorithms."""
    params = PredictiveSchema.validate_anomaly_params(request.args)
    data = predictive_service.detect_anomalies(
        officer_id=getattr(g, "officer_id"),
        district=params.get("district"),
        threshold=params.get("threshold", 0.75),
    )
    return success_response(data=data, message="Anomaly detection analysis completed")


@predictive_bp.route("/socio-economic", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.PREDICTIVE_VIEW)
def get_socio_economic():
    """Retrieve socio-demographic correlation metrics against regional crime data."""
    data = predictive_service.get_socio_economic_correlations(
        officer_id=getattr(g, "officer_id"),
        district=request.args.get("district"),
    )
    return success_response(data=data, message="Socio-economic correlation layer retrieved successfully")