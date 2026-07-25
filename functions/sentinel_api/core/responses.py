"""Standardized API response builders for Sentinel-KSP.

Enforces the standardized JSON envelope across all endpoints:
{
    "success": bool,
    "message": str,
    "data": dict | list | None,
    "errors": list
}
"""

from typing import Any, Dict, List, Optional, Union
from flask import Response, jsonify


def success_response(
    data: Optional[Union[Dict[str, Any], List[Any]]] = None,
    message: str = "Operation completed successfully",
    status_code: int = 200,
    headers: Optional[Dict[str, str]] = None,
) -> Response:
    """Build a standardized success HTTP response envelope.

    Args:
        data: Payload data (dictionary, list, or None).
        message: Descriptive success message.
        status_code: HTTP status code (default 200).
        headers: Optional dictionary of HTTP response headers.

    Returns:
        Flask Response object containing the JSON payload.
    """
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
        "errors": [],
    }
    response = jsonify(payload)
    response.status_code = status_code
    if headers:
        for key, value in headers.items():
            response.headers[key] = value
    return response


def error_response(
    errors: Optional[List[Union[Dict[str, Any], str]]] = None,
    message: str = "An error occurred while processing your request",
    status_code: int = 400,
    headers: Optional[Dict[str, str]] = None,
) -> Response:
    """Build a standardized error HTTP response envelope.

    Args:
        errors: List of error details or error strings.
        message: High-level error summary message.
        status_code: HTTP status code (default 400).
        headers: Optional dictionary of HTTP response headers.

    Returns:
        Flask Response object containing the JSON payload.
    """
    formatted_errors = []
    if errors:
        for err in errors:
            if isinstance(err, str):
                formatted_errors.append({"detail": err})
            elif isinstance(err, dict):
                formatted_errors.append(err)
            else:
                formatted_errors.append({"detail": str(err)})

    payload = {
        "success": False,
        "message": message,
        "data": {},
        "errors": formatted_errors,
    }
    response = jsonify(payload)
    response.status_code = status_code
    if headers:
        for key, value in headers.items():
            response.headers[key] = value
    return response
