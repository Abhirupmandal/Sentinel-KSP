"""Link analysis service for Sentinel-KSP.

Builds node/edge network graph structures (Accused, Victims, Units connected by shared CaseID),
enforces hard caps on returned node counts with pagination metadata, generates repeat-offender
profiles, and performs MO-signature matching (using exact normalized word-overlap token similarity
given the 3-day scope constraint).
"""

from collections import defaultdict
import re
from typing import Any, Dict, List, Optional, Set, Tuple
from core.exceptions import NotFoundError
from core.logger import get_logger
from repositories.accused_repository import accused_repository, AccusedRepository
from repositories.case_repository import case_repository, CaseRepository
from repositories.victim_repository import victim_repository, VictimRepository
from repositories.unit_repository import unit_repository, UnitRepository
from services.audit_service import audit_service

logger = get_logger(__name__)

HARD_NODE_CAP = 100  # PRD hard constraint


def _calculate_text_similarity(text1: str, text2: str) -> float:
    """Exact-token word overlap Jaccard similarity for MO-signature matching.

    Chosen for deterministic behavior and zero external dependency within 3-day scope.
    """
    if not text1 or not text2:
        return 0.0

    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))

    if not words1 or not words2:
        return 0.0

    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)


class LinkAnalysisService:
    """Service layer for Link Analysis module."""

    def __init__(
        self,
        case_repo: Optional[CaseRepository] = None,
        accused_repo: Optional[AccusedRepository] = None,
        victim_repo: Optional[VictimRepository] = None,
        unit_repo: Optional[UnitRepository] = None,
    ) -> None:
        self.case_repo = case_repo or case_repository
        self.accused_repo = accused_repo or accused_repository
        self.victim_repo = victim_repo or victim_repository
        self.unit_repo = unit_repo or unit_repository

    def build_network_graph(
        self,
        officer_id: str,
        case_id: Optional[str] = None,
        accused_id: Optional[str] = None,
        node_cap: int = HARD_NODE_CAP,
        page: int = 1,
    ) -> Dict[str, Any]:
        """Build node/edge graph structure with a mandatory hard cap on returned node count.

        Nodes = Accused, Victim, Case, Unit.
        Edges = Shared CaseID or UnitID connections.
        """
        audit_service.record(
            action="LINK_ANALYSIS_ACCESS",
            actor_officer_id=officer_id,
            resource_type="LinkAnalysis",
            resource_id="graph",
        )

        effective_cap = min(node_cap, HARD_NODE_CAP)

        cases = self.case_repo.get_all()
        accused_list = self.accused_repo.get_all()
        victims = self.victim_repo.get_all()
        units = self.unit_repo.get_all()

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []
        node_ids: Set[str] = set()

        # Helper to add node safely
        def add_node(nid: str, label: str, ntype: str, details: Dict[str, Any]):
            if nid not in node_ids:
                node_ids.add(nid)
                nodes.append({
                    "id": nid,
                    "label": label,
                    "type": ntype,
                    "details": details,
                })

        # Filter seed node if provided
        if case_id:
            cases = [c for c in cases if c.get("CaseID") == case_id or c.get("ROWID") == case_id]

        for c in cases:
            cid = c.get("CaseID") or c.get("ROWID")
            if not cid:
                continue
            add_node(cid, f"FIR-{c.get('FIRNumber', cid)}", "Case", {
                "CrimeHead": c.get("CrimeHead"),
                "CrimeGroup": c.get("CrimeGroup"),
                "OffenseDate": c.get("OffenseDate"),
            })

            # Connect unit
            uid = c.get("UnitID")
            if uid:
                add_node(uid, f"Unit-{uid}", "Unit", {})
                edges.append({"source": cid, "target": uid, "relation": "HANDLED_BY"})

        for a in accused_list:
            aid = a.get("AccusedID") or a.get("ROWID")
            cid = a.get("CaseID")
            if not aid:
                continue
            add_node(aid, a.get("Name", "Unknown Accused"), "Accused", {
                "ArrestStatus": a.get("ArrestStatus"),
                "MODetails": a.get("MODetails"),
            })
            if cid and cid in node_ids:
                edges.append({"source": aid, "target": cid, "relation": "ACCUSED_IN"})

        for v in victims:
            vid = v.get("VictimID") or v.get("ROWID")
            cid = v.get("CaseID")
            if not vid:
                continue
            add_node(vid, f"Victim-{vid}", "Victim", {
                "InjuryType": v.get("InjuryType"),
            })
            if cid and cid in node_ids:
                edges.append({"source": vid, "target": cid, "relation": "VICTIM_IN"})

        # Enforce hard cap with pagination metadata
        total_nodes = len(nodes)
        start_idx = (page - 1) * effective_cap
        paginated_nodes = nodes[start_idx:start_idx + effective_cap]
        paginated_node_ids = {n["id"] for n in paginated_nodes}

        # Filter edges to only include nodes present in the paginated set
        paginated_edges = [
            e for e in edges
            if e["source"] in paginated_node_ids and e["target"] in paginated_node_ids
        ]

        return {
            "graph": {
                "nodes": paginated_nodes,
                "edges": paginated_edges,
            },
            "pagination": {
                "total_nodes": total_nodes,
                "returned_nodes": len(paginated_nodes),
                "hard_cap": HARD_NODE_CAP,
                "page": page,
                "has_more": start_idx + len(paginated_nodes) < total_nodes,
            },
        }

    def get_repeat_offender_profile(self, officer_id: str, accused_id: str) -> Dict[str, Any]:
        """Join an accused's records across CaseIDs/UnitIDs into one view."""
        audit_service.record(
            action="LINK_ANALYSIS_ACCESS",
            actor_officer_id=officer_id,
            resource_type="LinkAnalysis",
            resource_id=f"offender:{accused_id}",
        )

        accused_record = self.accused_repo.get_by_accused_id(accused_id)
        if not accused_record:
            # Fallback search by name or ROWID
            all_accused = self.accused_repo.get_all()
            accused_record = next(
                (a for a in all_accused if a.get("AccusedID") == accused_id or a.get("ROWID") == accused_id),
                None
            )

        if not accused_record:
            raise NotFoundError(f"Accused profile '{accused_id}' not found")

        accused_name = accused_record.get("Name")
        matching_accused = self.accused_repo.search_by_name(accused_name) if accused_name else [accused_record]

        associated_case_ids = [a.get("CaseID") for a in matching_accused if a.get("CaseID")]
        cases = []
        for cid in set(associated_case_ids):
            c = self.case_repo.get_by_case_id(cid)
            if c:
                cases.append(c)

        return {
            "accused_id": accused_id,
            "name": accused_name,
            "primary_record": accused_record,
            "total_associated_cases": len(cases),
            "cases": cases,
            "repeat_offender_flag": len(cases) > 1,
        }

    def match_modus_operandi(
        self,
        officer_id: str,
        crime_group: Optional[str] = None,
        min_similarity: float = 0.4,
    ) -> Dict[str, Any]:
        """Group by Accused.MODetails / CaseMaster.ModusOperandi similarity."""
        audit_service.record(
            action="LINK_ANALYSIS_ACCESS",
            actor_officer_id=officer_id,
            resource_type="LinkAnalysis",
            resource_id="mo_match",
        )

        cases = self.case_repo.get_all()
        if crime_group:
            cases = [c for c in cases if c.get("CrimeGroup") == crime_group]

        matches = []
        n_cases = len(cases)
        for i in range(n_cases):
            for j in range(i + 1, n_cases):
                c1 = cases[i]
                c2 = cases[j]
                mo1 = c1.get("ModusOperandi") or ""
                mo2 = c2.get("ModusOperandi") or ""

                score = _calculate_text_similarity(mo1, mo2)
                if score >= min_similarity:
                    matches.append({
                        "case_1": {"case_id": c1.get("CaseID"), "fir": c1.get("FIRNumber"), "mo": mo1},
                        "case_2": {"case_id": c2.get("CaseID"), "fir": c2.get("FIRNumber"), "mo": mo2},
                        "similarity_score": round(score, 2),
                        "matching_method": "exact_token_jaccard_similarity",
                    })

        matches.sort(key=lambda x: x["similarity_score"], reverse=True)

        return {
            "matching_method": "exact_token_jaccard_similarity",
            "total_matches_found": len(matches),
            "matches": matches[:50],
        }


link_analysis_service = LinkAnalysisService()
