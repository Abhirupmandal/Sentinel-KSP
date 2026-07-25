"""Link analysis API routes for Sentinel-KSP.

Accessible by FieldInvestigator only (read-only).

PRD scope: "read-only access to criminological link analysis workspaces,
individual offender profiles, and historical case timelines."
"""

from flask import Blueprint, g, request
from constants.permissions import Permission
from core.responses import success_response
from middleware.auth_middleware import require_auth
from middleware.rbac import require_permission
from middleware.session import require_session
from schemas.link_analysis_schema import LinkAnalysisSchema
from services.link_analysis_service import link_analysis_service

link_analysis_bp = Blueprint("link_analysis_bp", __name__, url_prefix="/api/link-analysis")


@link_analysis_bp.route("/graph", methods=["GET"])
@link_analysis_bp.route("/network", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.LINK_ANALYSIS_VIEW)
def get_graph():
    """Retrieve network graph structure with enforced hard node cap and pagination."""
    params = LinkAnalysisSchema.validate_graph_params(request.args)
    data = link_analysis_service.build_network_graph(
        officer_id=getattr(g, "officer_id"),
        case_id=params.get("case_id"),
        accused_id=params.get("accused_id"),
        node_cap=params.get("node_cap", 100),
        page=params.get("page", 1),
    )
    return success_response(data=data, message="Link analysis network graph generated")


@link_analysis_bp.route("/offender/<accused_id>", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.LINK_ANALYSIS_VIEW)
def get_offender_profile(accused_id: str):
    """Retrieve repeat-offender cross-case profile for a given AccusedID."""
    data = link_analysis_service.get_repeat_offender_profile(
        officer_id=getattr(g, "officer_id"),
        accused_id=accused_id,
    )
    return success_response(data=data, message="Repeat offender profile retrieved")


@link_analysis_bp.route("/mo-match", methods=["GET"])
@link_analysis_bp.route("/mo-clusters", methods=["GET"])
@require_auth
@require_session
@require_permission(Permission.LINK_ANALYSIS_VIEW)
def match_mo():
    """Perform Modus Operandi similarity matching across cases."""
    params = LinkAnalysisSchema.validate_mo_params(request.args)
    data = link_analysis_service.match_modus_operandi(
        officer_id=getattr(g, "officer_id"),
        crime_group=params.get("crime_group"),
        min_similarity=params.get("min_score", 0.5),
    )
    return success_response(data=data, message="MO signature matching analysis completed")
