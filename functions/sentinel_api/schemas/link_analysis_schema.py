"""Link analysis request schemas for Sentinel-KSP.

Validates parameter payloads for graph queries, repeat offender searches, and MO matching.
"""

from typing import Any, Dict, Optional
from core.exceptions import ValidationError

DEFAULT_NODE_CAP = 100
MAX_NODE_CAP = 500


class LinkAnalysisSchema:
    """Validator for link analysis query parameters."""

    @staticmethod
    def validate_graph_params(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate network graph query parameters."""
        cap = args.get("node_cap", DEFAULT_NODE_CAP)
        try:
            cap = max(10, min(int(cap), MAX_NODE_CAP))
        except (TypeError, ValueError):
            cap = DEFAULT_NODE_CAP

        page = args.get("page", 1)
        try:
            page = max(1, int(page))
        except (TypeError, ValueError):
            page = 1

        return {
            "case_id": args.get("case_id"),
            "accused_id": args.get("accused_id"),
            "node_cap": cap,
            "page": page,
        }

    @staticmethod
    def validate_mo_params(args: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Modus Operandi similarity query parameters."""
        min_score = args.get("min_score", 0.5)
        try:
            min_score = max(0.0, min(float(min_score), 1.0))
        except (TypeError, ValueError):
            min_score = 0.5

        return {
            "crime_group": args.get("crime_group"),
            "min_score": min_score,
        }
