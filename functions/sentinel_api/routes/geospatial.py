"""Geospatial API routes for Sentinel-KSP.

Accessible by SCRB Data Analyst.
"""

from flask import Blueprint, g, request
from constants.permissions import Permission
from core.responses import success_response
from middleware.auth_middleware import require_auth
from middleware.rbac import require_permission
from middleware.session import require_session
from schemas.geospatial_schema import GeospatialSchema
from services.geospatial_service import geospatial_service

geospatial_bp = Blueprint("geospatial_bp", __name__, url_prefix="/api/geospatial")


@geospatial_bp.route("/drilldown", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.GEOSPATIAL_VIEW)
def get_drilldown():
    """Hierarchical drilldown query (state -> district -> station)."""
    params = GeospatialSchema.validate_drilldown_params(request.args)
    data = geospatial_service.get_drilldown(
        officer_id=getattr(g, "officer_id"),
        level=params.get("level", "district"),
        district=params.get("district"),
        station=params.get("station"),
    )
    return success_response(data=data, message="Geospatial drilldown retrieved")


@geospatial_bp.route("/hotspots", methods=["GET"])
@geospatial_bp.route("/spatial/hotspots", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.GEOSPATIAL_VIEW)
def get_hotspots():
    """Hotspot clustering by shift/hour bucket and geography."""
    params = GeospatialSchema.validate_hotspot_params(request.args)
    data = geospatial_service.get_hotspots(
        officer_id=getattr(g, "officer_id"),
        district=params.get("district"),
        station=params.get("station"),
        start_date=params.get("start_date"),
        end_date=params.get("end_date"),
        shift=params.get("shift"),
    )
    return success_response(data=data, message="Hotspot clusters retrieved")


@geospatial_bp.route("/spikes", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.GEOSPATIAL_VIEW)
def detect_spikes():
    """Spike detection comparing current period against historic baseline (trailing 90 days)."""
    params = GeospatialSchema.validate_spike_params(request.args)
    data = geospatial_service.detect_spikes(
        officer_id=getattr(g, "officer_id"),
        district=params.get("district"),
        baseline_days=params.get("baseline_days", 90),
    )
    return success_response(data=data, message="Spike detection analysis completed")
