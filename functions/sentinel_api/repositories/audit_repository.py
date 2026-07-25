"""Audit log repository for Sentinel-KSP.

Handles queries and inserts into the AuditLogs table using ZCQL/REST.
Strictly adheres to confirmed AuditLogs schema columns:
- ActorOfficerID, Action, ResourceType, ResourceID, Inference, IPAddress,
  DeviceFingerprint, MetaData, AuditID, Time_Stamp

NO local fallback, in-memory list, or mock persistence is used.
All operations execute directly against live Catalyst Data Store.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from core.catalyst_client import catalyst_client
from core.exceptions import CatalystError
from core.logger import get_logger
from utils.id_generator import generate_audit_id

logger = get_logger(__name__)


class AuditRepository:
    """Data access repository for AuditLogs table in Zoho Catalyst Data Store."""

    def _normalize_audit_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Extract inner AuditLogs dict if nested by ZCQL."""
        if isinstance(row, dict) and "AuditLogs" in row:
            return row["AuditLogs"]
        return row

    def insert_audit_log(self, audit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new audit log record into Catalyst Data Store.

        Must persist directly to live Catalyst Data Store and fail loudly on error.

        Args:
            audit_data: Dictionary matching AuditLogs confirmed columns:
                ActorOfficerID, Action, ResourceType, ResourceID, Inference,
                IPAddress, DeviceFingerprint, MetaData, AuditID, Time_Stamp.

        Returns:
            Inserted audit record dictionary including returned ROWID.

        Raises:
            CatalystError: If insertion fails.
        """
        audit_id = audit_data.get("AuditID") or generate_audit_id()
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        metadata_raw = audit_data.get("MetaData")
        if isinstance(metadata_raw, dict):
            metadata_str = json.dumps(metadata_raw)
        elif metadata_raw is not None:
            metadata_str = str(metadata_raw)
        else:
            metadata_str = ""

        record = {
            "AuditID": audit_id,
            "ActorOfficerID": audit_data.get("ActorOfficerID", "SYSTEM"),
            "Action": audit_data.get("Action", "UNKNOWN"),
            "ResourceType": audit_data.get("ResourceType", "System"),
            "ResourceID": audit_data.get("ResourceID", ""),
            "Inference": audit_data.get("Inference", "SUCCESS"),
            "IPAddress": audit_data.get("IPAddress", ""),
            "DeviceFingerprint": audit_data.get("DeviceFingerprint", ""),
            "MetaData": metadata_str,
            "Time_Stamp": audit_data.get("Time_Stamp") or now_str,
        }

        res = catalyst_client.insert_row("AuditLogs", record)
        logger.info("[AUDIT REPO INSERT SUCCESS] AuditID='%s' Action='%s'", audit_id, record["Action"])

        created_record = dict(record)
        if isinstance(res, dict) and "ROWID" in res:
            created_record["ROWID"] = res["ROWID"]

        return created_record

    def get_recent_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent audit log entries directly from Catalyst Data Store.

        Args:
            limit: Maximum number of entries to return.

        Returns:
            List of audit log dictionaries.

        Raises:
            CatalystError: If Catalyst query fails.
        """
        query = f"SELECT * FROM AuditLogs ORDER BY Time_Stamp DESC"
        try:
            results = catalyst_client.execute_zcql(query)
            logs = []
            if results:
                for r in results[:limit]:
                    normalized = self._normalize_audit_row(r)
                    logs.append(normalized)
            logger.info("[AUDIT REPO GET LOGS] Retrieved %d logs from Catalyst", len(logs))
            return logs
        except Exception as exc:
            logger.error("get_recent_logs query error: %s", exc)
            raise CatalystError(f"Failed to query AuditLogs from Catalyst Data Store: {exc}") from exc


# Default instance
audit_repository = AuditRepository()
