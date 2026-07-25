"""Dashboard API routes for Sentinel-KSP.

Accessible by SCRB Data Analyst (full) and Command Supervisor (read-only).
"""

from flask import Blueprint, g, request
from constants.permissions import Permission
from core.responses import success_response
from middleware.auth_middleware import require_auth
from middleware.rbac import require_permission
from middleware.session import require_session
from schemas.dashboard_schema import DashboardSchema
from services.dashboard_service import dashboard_service

dashboard_bp = Blueprint("dashboard_bp", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/overview", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.DASHBOARD_VIEW)
def get_overview():
    """Retrieve dashboard KPI overview statistics."""
    params = DashboardSchema.validate_overview_params(request.args)
    data = dashboard_service.get_overview(
        officer_id=getattr(g, "officer_id"),
        district=params.get("district"),
        crime_group=params.get("crime_group"),
        start_date=params.get("start_date"),
        end_date=params.get("end_date"),
    )
    return success_response(data=data, message="Dashboard overview retrieved")


@dashboard_bp.route("/trends", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.DASHBOARD_VIEW)
def get_trends():
    """Retrieve dashboard time-series crime trends."""
    params = DashboardSchema.validate_trend_params(request.args)
    data = dashboard_service.get_trend(
        officer_id=getattr(g, "officer_id"),
        period=params.get("period", "monthly"),
        district=params.get("district"),
        crime_group=params.get("crime_group"),
    )
    return success_response(data=data, message="Dashboard trends retrieved")
