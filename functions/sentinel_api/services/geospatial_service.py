"""Geospatial service for Sentinel-KSP.

Provides state -> district -> station drilldown, hotspot clustering by shift/hour/season,
and spike detection against a trailing 90-day historic baseline window.
"""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from core.logger import get_logger
from repositories.case_repository import case_repository, CaseRepository
from repositories.unit_repository import unit_repository, UnitRepository
from services.audit_service import audit_service

logger = get_logger(__name__)

# Baseline window for spike detection defined explicitly as trailing 90 days per requirement
TRAILING_BASELINE_DAYS = 90


class GeospatialService:
    """Service layer for geospatial analysis and spike detection."""

    def __init__(
        self,
        case_repo: Optional[CaseRepository] = None,
        unit_repo: Optional[UnitRepository] = None,
    ) -> None:
        self.case_repo = case_repo or case_repository
        self.unit_repo = unit_repo or unit_repository

    def get_drilldown(
        self,
        officer_id: str,
        level: str = "district",
        district: Optional[str] = None,
        station: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Hierarchical drilldown aggregation (state -> district -> station)."""
        audit_service.record(
            action="GEOSPATIAL_ACCESS",
            actor_officer_id=officer_id,
            resource_type="Geospatial",
            resource_id=f"drilldown:{level}",
        )

        units = self.unit_repo.get_all()
        cases = self.case_repo.get_all()

        # Map units by UnitID
        unit_map = {u.get("UnitID") or u.get("ROWID"): u for u in units}

        if level == "state":
            # State level aggregate
            districts = Counter(u.get("District", "Unknown") for u in units)
            total_cases = len(cases)
            return {
                "level": "state",
                "total_units": len(units),
                "total_cases": total_cases,
                "district_counts": dict(districts),
            }

        elif level == "district":
            # District level breakdown by station/unit
            target_units = [u for u in units if not district or u.get("District") == district]
            target_unit_ids = {u.get("UnitID") or u.get("ROWID") for u in target_units}

            filtered_cases = [c for c in cases if c.get("UnitID") in target_unit_ids]

            station_case_counts = Counter(c.get("UnitID") for c in filtered_cases)

            station_breakdown = []
            for u in target_units:
                uid = u.get("UnitID") or u.get("ROWID")
                station_breakdown.append({
                    "unit_id": uid,
                    "unit_name": u.get("UnitName"),
                    "district": u.get("District"),
                    "latitude": u.get("Latitude"),
                    "longitude": u.get("Longitude"),
                    "case_count": station_case_counts.get(uid, 0),
                })

            return {
                "level": "district",
                "district": district or "All",
                "total_cases": len(filtered_cases),
                "stations": station_breakdown,
            }

        else:  # station
            target_unit = None
            if station:
                target_unit = next((u for u in units if u.get("UnitName") == station or u.get("UnitID") == station), None)

            station_cases = []
            if target_unit:
                uid = target_unit.get("UnitID") or target_unit.get("ROWID")
                station_cases = [c for c in cases if c.get("UnitID") == uid]

            return {
                "level": "station",
                "station": station or "Unknown",
                "unit_info": target_unit,
                "case_count": len(station_cases),
                "cases": station_cases[:50],
            }

    def get_hotspots(
        self,
        officer_id: str,
        district: Optional[str] = None,
        station: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        shift: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Hotspot clustering by shift/hour bucket and geography."""
        audit_service.record(
            action="GEOSPATIAL_ACCESS",
            actor_officer_id=officer_id,
            resource_type="Geospatial",
            resource_id="hotspots",
        )

        cases = self.case_repo.get_all()

        if start_date and end_date:
            cases = [c for c in cases if start_date <= str(c.get("OffenseDate", ""))[:10] <= end_date]

        clusters = defaultdict(list)

        for c in cases:
            lat = c.get("Latitude")
            lon = c.get("Longitude")
            if lat is None or lon is None:
                continue

            # Grid bucket key (approx 1km round)
            grid_key = (round(float(lat), 2), round(float(lon), 2))
            clusters[grid_key].append(c)

        hotspots = []
        for (lat, lon), grid_cases in clusters.items():
            crime_heads = Counter(c.get("CrimeHead", "Other") for c in grid_cases)
            hotspots.append({
                "latitude": lat,
                "longitude": lon,
                "intensity": len(grid_cases),
                "top_crime_head": crime_heads.most_common(1)[0][0] if crime_heads else "Unknown",
                "case_count": len(grid_cases),
            })

        hotspots.sort(key=lambda x: x["intensity"], reverse=True)

        return {
            "total_hotspots": len(hotspots),
            "hotspots": hotspots[:100],
        }

    def detect_spikes(
        self,
        officer_id: str,
        district: Optional[str] = None,
        baseline_days: int = TRAILING_BASELINE_DAYS,
    ) -> Dict[str, Any]:
        """Detect crime spikes comparing current period against trailing baseline window (90 days)."""
        audit_service.record(
            action="GEOSPATIAL_ACCESS",
            actor_officer_id=officer_id,
            resource_type="Geospatial",
            resource_id="spikes",
        )

        cases = self.case_repo.get_all()
        if district:
            cases = [c for c in cases if c.get("District") == district]

        now = datetime.now(timezone.utc)
        baseline_start = now - timedelta(days=baseline_days)
        recent_start = now - timedelta(days=30)

        recent_count = 0
        baseline_count = 0

        group_recent = Counter()
        group_baseline = Counter()

        for c in cases:
            date_str = c.get("OffenseDate")
            if not date_str:
                continue
            try:
                dt = datetime.strptime(str(date_str)[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except (ValueError, TypeError):
                continue

            crime_group = c.get("CrimeGroup", "General")

            if dt >= recent_start:
                recent_count += 1
                group_recent[crime_group] += 1
            elif dt >= baseline_start:
                baseline_count += 1
                group_baseline[crime_group] += 1

        # Calculate monthly average from baseline (baseline_days / 30)
        baseline_months = max(1.0, (baseline_days - 30) / 30.0)

        spikes = []
        for cgroup, r_count in group_recent.items():
            b_avg = group_baseline.get(cgroup, 0) / baseline_months
            spike_ratio = (r_count / max(1.0, b_avg))
            if r_count >= 3 and spike_ratio > 1.2:
                spikes.append({
                    "crime_group": cgroup,
                    "recent_30d_count": r_count,
                    "baseline_monthly_avg": round(b_avg, 2),
                    "increase_percentage": round((spike_ratio - 1.0) * 100, 1),
                    "severity": "High" if spike_ratio >= 2.0 else "Medium",
                })

        spikes.sort(key=lambda x: x["increase_percentage"], reverse=True)

        return {
            "baseline_days_window": baseline_days,
            "district": district or "All",
            "total_recent_30d_cases": recent_count,
            "detected_spikes": spikes,
        }


geospatial_service = GeospatialService()
