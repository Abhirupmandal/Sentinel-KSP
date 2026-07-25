"""Collision-safe ID generator utility for Sentinel-KSP.

Generates UUID4-based formatted primary key strings for database tables.
"""

import uuid


def generate_officer_id() -> str:
    """Generate a unique OfficerID string (e.g. OFF-KSP-8f3a12)."""
    return f"OFF-KSP-{uuid.uuid4().hex[:8].upper()}"


def generate_session_id() -> str:
    """Generate a unique SessionID string (e.g. SES-2a4b6c8d1e2f)."""
    return f"SES-{uuid.uuid4().hex[:16].upper()}"


def generate_audit_id() -> str:
    """Generate a unique AuditID string for AuditLogs."""
    return f"AUD-{uuid.uuid4().hex[:16].upper()}"


def generate_incident_id() -> str:
    """Generate a unique IncidentID string for SecurityIncidents."""
    return f"INC-{uuid.uuid4().hex[:16].upper()}"


def generate_access_id() -> str:
    """Generate a unique AccessID string for EmergencyAccessLogs."""
    return f"EMG-{uuid.uuid4().hex[:16].upper()}"
