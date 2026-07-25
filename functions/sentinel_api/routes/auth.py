"""Authentication routes for Sentinel-KSP API.

Exposes endpoints for officer login, logout, profile fetching, and password change.
Strictly adheres to Architecture Contract: Routes validate via Schema, delegate to
AuthService, and return via core/responses.py.
"""

from flask import Blueprint, g, request
from core.device_fingerprint import generate_device_fingerprint, get_client_ip
from core.exceptions import AuthenticationError
from core.responses import success_response
from middleware.auth_middleware import require_auth
from middleware.session import require_session
from schemas.auth_schema import AuthSchema
from services.auth_service import auth_service

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate an officer and issue JWT token.

    Public endpoint. Validates payload via AuthSchema, delegates to AuthService,
    and returns token + safe profile response.
    """
    raw_payload = request.get_json(silent=True) or {}
    validated_data = AuthSchema.validate_login_request(raw_payload)

    client_ip = get_client_ip(request)
    fingerprint = generate_device_fingerprint(request)

    login_result = auth_service.login(
        identifier=validated_data["identifier"],
        password=validated_data["password"],
        ip_address=client_ip,
        device_fingerprint=fingerprint,
    )

    return success_response(
        data=login_result,
        message="Authentication successful",
        status_code=200,
    )


@auth_bp.route("/logout", methods=["POST"])
@require_auth
@require_session
def logout():
    """Log out the current officer and terminate active session in Catalyst Data Store."""
    session_id = getattr(g, "session_id", None)
    officer_id = getattr(g, "officer_id", None)

    if session_id:
        auth_service.logout(session_id=session_id, officer_id=officer_id)

    return success_response(
        data={},
        message="Logged out successfully",
        status_code=200,
    )


@auth_bp.route("/profile", methods=["GET"])
@auth_bp.route("/me", methods=["GET"])
@require_auth
@require_session
def get_profile():
    """Retrieve authenticated officer profile from Flask request context.

    Safely parses TempPasswordFlag (avoids Python bool("false") -> True bug).
    """
    officer = getattr(g, "officer", {})
    raw_temp_flag = officer.get("TempPasswordFlag", False)
    temp_flag_bool = True if raw_temp_flag in (True, "true", "True", 1, "1") else False

    clean_profile = {
        "officer_id": officer.get("OfficerID"),
        "full_name": officer.get("FullName"),
        "employee_id": officer.get("EmployeeID"),
        "role": officer.get("Role"),
        "district": officer.get("District"),
        "rank": officer.get("Rank"),
        "station": officer.get("Station"),
        "department": officer.get("Department"),
        "account_state": officer.get("AccountState"),
        "temp_password_flag": temp_flag_bool,
    }
    return success_response(
        data=clean_profile,
        message="Officer profile retrieved",
        status_code=200,
    )


@auth_bp.route("/change-password", methods=["PUT", "POST"])
@require_auth
@require_session
def change_password():
    """Change authenticated officer password.

    Persists new PasswordHash, sets TempPasswordFlag = false, updates PasswordLastChanged,
    and transitions AccountState to Active in Catalyst Data Store.
    """
    raw_payload = request.get_json(silent=True) or {}
    validated_data = AuthSchema.validate_change_password_request(raw_payload)

    officer_id = getattr(g, "officer_id", None)
    if not officer_id:
        raise AuthenticationError("Authentication context missing officer identity")

    result = auth_service.change_password(
        officer_id=officer_id,
        current_password=validated_data["current_password"],
        new_password=validated_data["new_password"],
    )

    return success_response(
        data=result,
        message="Password updated successfully. Account is now fully active.",
        status_code=200,
    )
