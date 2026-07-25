"""Dashboard service for Sentinel-KSP.

Overview/trend aggregation logic built on case, victim, and accused repositories.
Every read is an audited event (Action = DASHBOARD_ACCESS).
"""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from core.logger import get_logger
from repositories.case_repository import case_repository, CaseRepository
from repositories.victim_repository import victim_repository, VictimRepository
from repositories.accused_repository import accused_repository, AccusedRepository
from services.audit_service import audit_service

logger = get_logger(__name__)


class DashboardService:
    """Service layer for dashboard aggregation."""

    def __init__(
        self,
        case_repo: Optional[CaseRepository] = None,
        victim_repo: Optional[VictimRepository] = None,
        accused_repo: Optional[AccusedRepository] = None,
    ) -> None:
        self.case_repo = case_repo or case_repository
        self.victim_repo = victim_repo or victim_repository
        self.accused_repo = accused_repo or accused_repository

    def get_overview(
        self,
        officer_id: str,
        district: Optional[str] = None,
        crime_group: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build the dashboard overview with KPI aggregations.

        Args:
            officer_id: Requesting officer for audit logging.
            district: Optional district filter.
            crime_group: Optional crime group filter.
            start_date: Optional date range start.
            end_date: Optional date range end.

        Returns:
            Dictionary with overview stats.
        """
        audit_service.record(
            action="DASHBOARD_ACCESS",
            actor_officer_id=officer_id,
            resource_type="Dashboard",
            resource_id="overview",
        )

        # Fetch data
        if start_date and end_date:
            cases = self.case_repo.list_by_date_range(start_date, end_date)
        elif crime_group:
            cases = self.case_repo.list_by_crime_group(crime_group)
        else:
            cases = self.case_repo.get_all()

        if district:
            cases = [c for c in cases if c.get("District") == district]

        all_victims = self.victim_repo.get_all()
        all_accused = self.accused_repo.get_all()

        case_ids = {c.get("CaseID") or c.get("ROWID") for c in cases}
        relevant_victims = [v for v in all_victims if v.get("CaseID") in case_ids]
        relevant_accused = [a for a in all_accused if a.get("CaseID") in case_ids]

        # Crime group breakdown
        crime_groups = Counter(c.get("CrimeGroup", "Unknown") for c in cases)
        # District breakdown
        districts = Counter(c.get("District", "Unknown") for c in cases)
        # Arrest status breakdown
        arrest_statuses = Counter(a.get("ArrestStatus", "Unknown") for a in relevant_accused)
        # Injury type breakdown
        injury_types = Counter(v.get("InjuryType", "Unknown") for v in relevant_victims)

        return {
            "total_cases": len(cases),
            "total_victims": len(relevant_victims),
            "total_accused": len(relevant_accused),
            "crime_group_breakdown": dict(crime_groups.most_common(10)),
            "district_breakdown": dict(districts.most_common(15)),
            "arrest_status_breakdown": dict(arrest_statuses),
            "injury_type_breakdown": dict(injury_types.most_common(10)),
        }

    def get_trend(
        self,
        officer_id: str,
        period: str = "monthly",
        district: Optional[str] = None,
        crime_group: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate crime trend data grouped by time period.

        Args:
            officer_id: Requesting officer for audit.
            period: "daily", "weekly", or "monthly".
            district: Optional district filter.
            crime_group: Optional crime group filter.

        Returns:
            Dictionary with trend series data.
        """
        audit_service.record(
            action="DASHBOARD_ACCESS",
            actor_officer_id=officer_id,
            resource_type="Dashboard",
            resource_id="trend",
        )

        if crime_group:
            cases = self.case_repo.list_by_crime_group(crime_group)
        else:
            cases = self.case_repo.get_all()

        if district:
            cases = [c for c in cases if c.get("District") == district]

        # Group by period
        buckets: Dict[str, int] = defaultdict(int)
        for case in cases:
            date_str = case.get("OffenseDate")
            if not date_str:
                continue
            try:
                dt = datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
            except (ValueError, TypeError):
                continue

            if period == "daily":
                key = dt.strftime("%Y-%m-%d")
            elif period == "weekly":
                key = f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
            else:
                key = dt.strftime("%Y-%m")
            buckets[key] += 1

        sorted_data = sorted(buckets.items())
        return {
            "period": period,
            "data": [{"label": k, "count": v} for k, v in sorted_data],
            "total": len(cases),
        }


dashboard_service = DashboardService()
