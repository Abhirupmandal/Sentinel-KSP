"""JWT Manager for Sentinel-KSP authentication.

Provides token issuance and verification functions embedding session ID (sid),
officer ID (sub), and role as custom claims per Section B design decisions.
"""

from datetime import datetime, timedelta, timezone
import os
from typing import Any, Dict
import jwt
from core.exceptions import AuthenticationError
from core.logger import get_logger

logger = get_logger(__name__)

DEFAULT_JWT_ALGORITHM = "HS256"
DEFAULT_EXPIRY_HOURS = 8


class JWTManager:
    """JWT creation and decoding helper class."""

    @staticmethod
    def _get_secret_key() -> str:
        """Retrieve the secret key for signing JWTs."""
        secret = os.getenv("JWT_SECRET_KEY")
        if not secret:
            secret = os.getenv("ZC_SDK_CLIENT_SECRET", "sentinel_ksp_secret_fallback_key_2026")
        return secret

    @classmethod
    def issue_token(
        cls,
        officer_id: str,
        session_id: str,
        role: str,
        expires_in_hours: int = DEFAULT_EXPIRY_HOURS,
    ) -> str:
        """Issue a signed JWT embedding officer ID, session ID, and role.

        Args:
            officer_id: The unique OfficerID.
            session_id: The active session ID (sid).
            role: The officer's role string.
            expires_in_hours: Token lifespan in hours.

        Returns:
            Signed JWT string.

        Raises:
            ValueError: If any required parameter is missing.
        """
        if not officer_id or not session_id or not role:
            raise ValueError("officer_id, session_id, and role are required for token issuance")

        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(officer_id),
            "sid": str(session_id),
            "role": str(role),
            "iat": now,
            "exp": now + timedelta(hours=expires_in_hours),
            "iss": "sentinel-ksp-api",
        }

        secret_key = cls._get_secret_key()
        token = jwt.encode(payload, secret_key, algorithm=DEFAULT_JWT_ALGORITHM)
        logger.info("Issued JWT for officer_id=%s, session_id=%s", officer_id, session_id)
        return token

    @classmethod
    def verify_token(cls, token: str) -> Dict[str, Any]:
        """Verify and decode a JWT.

        Args:
            token: The raw JWT string from Authorization header.

        Returns:
            Decoded payload dictionary containing sub, sid, role, etc.

        Raises:
            AuthenticationError: If the token is invalid, expired, or malformed.
        """
        if not token or not isinstance(token, str):
            raise AuthenticationError("Authorization token is missing or invalid")

        # Strip 'Bearer ' prefix if present
        cleaned_token = token.strip()
        if cleaned_token.lower().startswith("bearer "):
            cleaned_token = cleaned_token[7:].strip()

        secret_key = cls._get_secret_key()

        try:
            payload = jwt.decode(
                cleaned_token,
                secret_key,
                algorithms=[DEFAULT_JWT_ALGORITHM],
                options={"verify_exp": True, "verify_iss": True},
                issuer="sentinel-ksp-api",
            )
            return payload
        except jwt.ExpiredSignatureError as exc:
            logger.warning("JWT expired: %s", exc)
            raise AuthenticationError("Token has expired. Please log in again.") from exc
        except jwt.InvalidTokenError as exc:
            logger.warning("Invalid JWT: %s", exc)
            raise AuthenticationError("Invalid authorization token") from exc
