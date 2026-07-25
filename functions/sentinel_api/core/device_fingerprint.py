"""Device fingerprinting helper for Sentinel-KSP audit and session management.

Generates a deterministic hash string based on HTTP request header attributes.
"""

import hashlib
from typing import Optional
from flask import Request


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request headers or remote address.

    Args:
        request: The incoming Flask Request object.

    Returns:
        IP address string.
    """
    if not request:
        return "127.0.0.1"

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "127.0.0.1"


def generate_device_fingerprint(request: Optional[Request] = None) -> str:
    """Generate a SHA-256 fingerprint from stable HTTP headers.

    Args:
        request: Optional Flask Request object.

    Returns:
        A 32-character hex fingerprint string.
    """
    if not request:
        return "fp_system_generated_local_device"

    user_agent = request.headers.get("User-Agent", "Unknown-Agent")
    accept_lang = request.headers.get("Accept-Language", "en-US")
    client_ip = get_client_ip(request)

    raw_string = f"{user_agent}|{accept_lang}|{client_ip}"
    return hashlib.sha256(raw_string.encode("utf-8")).hexdigest()[:32]
