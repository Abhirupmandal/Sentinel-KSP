"""Predictive-analysis routes for the Sentinel-KSP API.

Provides the ``predictive_bp`` blueprint exposing endpoints that compute
crime-risk scores for a given district based on historical case volume.
"""

import logging

from flask import Blueprint, jsonify, request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from config import escape_zcql_string, fetch_all_rows, get_zcql_service

logger = logging.getLogger(__name__)

predictive_bp = Blueprint("predictive_bp", __name__, url_prefix="/api")

MAX_CASES = 1000
DEFAULT_MO_SIMILARITY_THRESHOLD = 0.15


def _normalize_rows(rows, table_name):
    """Return Catalyst/ZCQL rows as plain dictionaries."""
    normalized = []
    for row in rows or []:
        if isinstance(row, dict):
            normalized.append(row.get(table_name, row))
    return normalized


def _classify_risk(score):
    """Map a numeric risk score to a categorical risk level."""
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def _extract_mo_case_attributes(case_row, idx):
    """Extract MO clustering attributes from PascalCase or snake_case rows."""
    case_id = (
        case_row.get("CaseID")
        or case_row.get("case_id")
        or case_row.get("ROWID")
        or f"CASE-{idx}"
    )
    mo_text = (
        case_row.get("ModusOperandi")
        or case_row.get("modus_operandi")
        or case_row.get("Description")
        or ""
    )
    crime_group = case_row.get("CrimeGroup") or case_row.get("crime_group") or "Cyber Fraud"

    return {
        "case_id": str(case_id),
        "row_id": case_row.get("ROWID"),
        "fir_number": case_row.get("FIRNumber") or case_row.get("fir_number"),
        "crime_group": crime_group,
        "crime_head": case_row.get("CrimeHead") or case_row.get("crime_head"),
        "offense_date": case_row.get("OffenseDate") or case_row.get("offense_date"),
        "modus_operandi": str(mo_text),
    }


@predictive_bp.route("/predictive/risk-score", methods=["POST"])
def risk_score():
    """Compute a 0-100 crime risk score for a district."""
    body = request.get_json(silent=True) or {}
    district = body.get("district")

    if not district:
        return jsonify({"success": False, "message": "district is required."}), 400

    try:
        zcql = get_zcql_service()
    except RuntimeError as exc:
        logger.exception("ZCQL service unavailable: %s", exc)
        return jsonify({"success": False, "message": "Service unavailable."}), 503

    query = (
        "SELECT COUNT(ROWID) AS CaseCount FROM CaseMaster "
        "WHERE District = {district}"
    ).format(district=escape_zcql_string(district))

    try:
        result = zcql.execute_query(query)
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.exception("Failed to query CaseMaster count: %s", exc)
        return (
            jsonify({"success": False, "message": "Failed to compute risk score."}),
            500,
        )

    case_count = 0
    if result:
        row = result[0]
        count_row = row.get("CaseMaster", row)
        try:
            case_count = int(count_row.get("CaseCount") or 0)
        except (TypeError, ValueError):
            case_count = 0

    risk_value = min(100, int(round((case_count / MAX_CASES) * 100))) if MAX_CASES else 0
    risk_level = _classify_risk(risk_value)

    return (
        jsonify(
            {
                "success": True,
                "district": district,
                "case_count": case_count,
                "risk_score": risk_value,
                "risk_level": risk_level,
            }
        ),
        200,
    )


@predictive_bp.route("/predictive/mo-clusters", methods=["GET"])
@predictive_bp.route("/analytics/mo-clusters", methods=["GET"])
def get_mo_clusters():
    """Return high-similarity case pairs based on ModusOperandi text."""
    threshold_arg = request.args.get("threshold", DEFAULT_MO_SIMILARITY_THRESHOLD)
    try:
        threshold = float(threshold_arg)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "threshold must be numeric."}), 400

    if threshold < 0 or threshold > 1:
        return jsonify({"success": False, "message": "threshold must be between 0 and 1."}), 400

    try:
        cases = _normalize_rows(fetch_all_rows("CaseMaster"), "CaseMaster")
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.exception("Failed to fetch CaseMaster rows for MO clustering: %s", exc)
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Failed to compute MO clusters.",
                    "pairs": [],
                    "summary": {},
                }
            ),
            500,
        )

    analyzable_cases = []
    for idx, case_row in enumerate(cases):
        case_attributes = _extract_mo_case_attributes(case_row, idx)
        if case_attributes["modus_operandi"].strip():
            analyzable_cases.append(case_attributes)

    if len(analyzable_cases) < 2:
        formatted_clusters = []
        return jsonify({
            "status": "success",
            "clusters": formatted_clusters
        }), 200

    corpus = [case_row["modus_operandi"] for case_row in analyzable_cases]

    try:
        vectors = TfidfVectorizer(stop_words="english").fit_transform(corpus)
        similarity_matrix = cosine_similarity(vectors)
    except ValueError as exc:
        logger.exception("Failed to vectorize ModusOperandi text: %s", exc)
        formatted_clusters = []
        return jsonify({
            "status": "success",
            "clusters": formatted_clusters
        }), 200

    formatted_clusters = []
    for left_index in range(len(analyzable_cases)):
        for right_index in range(left_index + 1, len(analyzable_cases)):
            score = float(similarity_matrix[left_index][right_index])
            if score >= threshold:
                left_case = analyzable_cases[left_index]
                right_case = analyzable_cases[right_index]
                formatted_clusters.append(
                    {
                        "cluster_id": f"MO-{len(formatted_clusters) + 1}",
                        "cluster_name": f"{left_case['crime_group']} similarity",
                        "case_count": 2,
                        "crime_group": left_case["crime_group"],
                        "keywords": [left_case["crime_group"], right_case["crime_group"]],
                        "cases": [left_case["case_id"], right_case["case_id"]],
                        "pairs": [
                            {
                                "case_a": left_case,
                                "case_b": right_case,
                                "similarity": round(score, 6),
                            }
                        ],
                    }
                )

    formatted_clusters.sort(
        key=lambda cluster: cluster["pairs"][0]["similarity"],
        reverse=True,
    )

    return jsonify({
        "status": "success",
        "clusters": formatted_clusters
    }), 200