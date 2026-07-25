"""Admin routes for Sentinel-KSP Cyber Command Center.

All endpoints restricted to CyberSecurityAdministrator role.
Strictly adheres to Architecture Contract: Routes validate via Schema, delegate to
Services/Repositories, and return via core/responses.py.
"""

from flask import Blueprint, g, request
from constants.audit_actions import AuditAction
from constants.roles import Role
from core.catalyst_client import catalyst_client
from core.responses import success_response
from middleware.audit import audit_action
from middleware.auth_middleware import require_auth
from middleware.rbac import require_role
from middleware.session import require_session
from repositories.audit_repository import audit_repository
from repositories.session_repository import session_repository
from schemas.officer_schema import OfficerSchema
from services.emergency_service import emergency_service
from services.officer_service import officer_service
from services.security_service import security_service
from services.session_service import session_service
from utils.validators import validate_required_fields

admin_bp = Blueprint("admin_bp", __name__, url_prefix="/api/admin")


@admin_bp.route("/create-user", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.OFFICER_CREATE.value, "Officer")
def create_user():
    """Create a new officer account directly in Catalyst Data Store."""
    raw = request.get_json(silent=True) or {}
    validated = OfficerSchema.validate_create_officer(raw)
    result = officer_service.create_officer(validated, getattr(g, "officer_id"))
    return success_response(data=result, message="Officer created successfully", status_code=201)


@admin_bp.route("/reset-password", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.PASSWORD_RESET.value, "Officer")
def reset_password():
    """Admin-initiated password reset for an officer."""
    raw = request.get_json(silent=True) or {}
    officer_id = OfficerSchema.validate_reset_password(raw)
    result = officer_service.admin_reset_password(officer_id)
    return success_response(data=result, message="Password reset successfully")


@admin_bp.route("/lock-account", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.OFFICER_LOCK.value, "Officer")
def lock_account():
    """Lock an officer account."""
    raw = request.get_json(silent=True) or {}
    officer_id = OfficerSchema.validate_officer_id_payload(raw)
    officer_service.lock_officer(officer_id)
    return success_response(message=f"Officer '{officer_id}' locked successfully")


@admin_bp.route("/unlock-account", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.OFFICER_UNLOCK.value, "Officer")
def unlock_account():
    """Unlock an officer account."""
    raw = request.get_json(silent=True) or {}
    officer_id = OfficerSchema.validate_officer_id_payload(raw)
    officer_service.unlock_officer(officer_id)
    return success_response(message=f"Officer '{officer_id}' unlocked successfully")


@admin_bp.route("/force-logout", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.FORCE_LOGOUT.value, "Session")
def force_logout():
    """Force logout an officer by terminating their active session."""
    raw = request.get_json(silent=True) or {}
    officer_id = OfficerSchema.validate_officer_id_payload(raw)
    session = session_repository.get_active_session_for_officer(officer_id)
    if session and session.get("SessionID"):
        session_service.end_session(session["SessionID"])
    return success_response(message=f"Officer '{officer_id}' force logged out")


@admin_bp.route("/active-sessions", methods=["GET"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
def get_active_sessions():
    """List all currently active sessions directly from Catalyst Data Store."""
    active_sessions = []
    try:
        query = "SELECT * FROM ActiveSessions WHERE IsActive = true"
        results = catalyst_client.execute_zcql(query)
        if results:
            for row in results:
                sess = row.get("ActiveSessions", row) if isinstance(row, dict) else row
                sess["IsActive"] = True if sess.get("IsActive") in (True, "true", "True", 1, "1") else False
                if sess["IsActive"]:
                    active_sessions.append(sess)
    except Exception as exc:
        pass
    return success_response(data={"sessions": active_sessions, "count": len(active_sessions)})


@admin_bp.route("/audit-logs", methods=["GET"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
def get_audit_logs():
    """Retrieve recent audit log entries directly from Catalyst Data Store."""
    limit = request.args.get("limit", 50, type=int)
    logs = audit_repository.get_recent_logs(limit=min(limit, 200))
    return success_response(data={"logs": logs, "count": len(logs)})


@admin_bp.route("/emergency-access", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.EMERGENCY_ACCESS_GRANTED.value, "EmergencyAccess")
def grant_emergency_access():
    """Grant emergency access for an officer."""
    raw = request.get_json(silent=True) or {}
    validate_required_fields(raw, ["target_officer_id", "justification", "case_reference"])
    result = emergency_service.grant_emergency_access(
        admin_officer_id=getattr(g, "officer_id"),
        target_officer_id=raw["target_officer_id"],
        justification=raw["justification"],
        case_reference=raw["case_reference"],
    )
    return success_response(data=result, message="Emergency access granted", status_code=201)


@admin_bp.route("/emergency-access/end", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.EMERGENCY_ACCESS_ENDED.value, "EmergencyAccess")
def end_emergency_access():
    """End an active emergency access session."""
    raw = request.get_json(silent=True) or {}
    validate_required_fields(raw, ["access_id"])
    result = emergency_service.end_emergency_access(raw["access_id"])
    return success_response(data=result, message="Emergency access ended")


@admin_bp.route("/security-incidents", methods=["GET"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
def get_security_incidents():
    """List security incidents."""
    status = request.args.get("status")
    incidents = security_service.get_all_incidents(status=status)
    return success_response(data={"incidents": incidents, "count": len(incidents)})


# REST-style aliases (match frontend adminClient.js paths)

@admin_bp.route("/officers", methods=["GET"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
def list_officers():
    """List all officer accounts."""
    officers = officer_service.list_all_officers()
    return success_response(data={"officers": officers, "count": len(officers)})


@admin_bp.route("/officers", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.OFFICER_CREATE.value, "Officer")
def create_officer_rest():
    """Create a new officer account (REST alias for /create-user)."""
    raw = request.get_json(silent=True) or {}
    validated = OfficerSchema.validate_create_officer(raw)
    result = officer_service.create_officer(validated, getattr(g, "officer_id"))
    return success_response(data=result, message="Officer created successfully", status_code=201)


@admin_bp.route("/officers/<officer_id>/reset-password", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.PASSWORD_RESET.value, "Officer")
def reset_password_rest(officer_id):
    """Admin-initiated password reset (REST alias)."""
    result = officer_service.admin_reset_password(officer_id)
    return success_response(data=result, message="Password reset successfully")


@admin_bp.route("/officers/<officer_id>/lock", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.OFFICER_LOCK.value, "Officer")
def lock_account_rest(officer_id):
    """Lock an officer account (REST alias)."""
    officer_service.lock_officer(officer_id)
    return success_response(message=f"Officer '{officer_id}' locked successfully")


@admin_bp.route("/officers/<officer_id>/unlock", methods=["POST"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
@audit_action(AuditAction.OFFICER_UNLOCK.value, "Officer")
def unlock_account_rest(officer_id):
    """Unlock an officer account (REST alias)."""
    officer_service.unlock_officer(officer_id)
    return success_response(message=f"Officer '{officer_id}' unlocked successfully")


@admin_bp.route("/sessions", methods=["GET"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
def get_sessions_rest():
    """List all active sessions directly from Catalyst Data Store (REST alias for /active-sessions)."""
    return get_active_sessions()


@admin_bp.route("/incidents", methods=["GET"])
@require_auth
@require_session
@require_role(Role.CYBER_SECURITY_ADMINISTRATOR.value)
def get_incidents_rest():
    """List security incidents (REST alias for /security-incidents)."""
    status = request.args.get("status")
    incidents = security_service.get_all_incidents(status=status)
    return success_response(data={"incidents": incidents, "count": len(incidents)})
