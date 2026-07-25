"""
Verification script: Prints the exact seed data that seed_data.py generates
with random.seed(42), so you can compare against what the API returns.
"""
import sys, os, random

# Add the sentinel_api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "functions", "sentinel_api"))

from scripts.seed_data import generate_mock_cases, generate_mock_accused, UNITS, REGIONAL_HUBS

# Use the EXACT same seed as config.py's _get_fallback_seed_data()
random.seed(42)
cases = generate_mock_cases(count=50, start_id=1021)
case_ids = [c["CaseID"] for c in cases]
accused = generate_mock_accused(case_ids=case_ids, count=100, start_id=2031)

print("=" * 70)
print("  SEED DATA VERIFICATION (random.seed=42, 50 cases, 100 accused)")
print("=" * 70)

# --- Unit Distribution ---
unit_counts = {}
for c in cases:
    uid = c["UnitID"]
    unit_counts[uid] = unit_counts.get(uid, 0) + 1

print("\n--- Unit Distribution (from CaseMaster.UnitID) ---")
for uid, count in sorted(unit_counts.items(), key=lambda x: -x[1]):
    print(f"  {uid}: {count} cases")

# --- District Mapping (same as predictive_service.py) ---
unit_district_map = {
    "UNIT-101 (Delhi NCR)": "Delhi NCR",
    "UNIT-102 (Mumbai Central)": "Mumbai",
    "UNIT-103 (Bengaluru Cyber)": "Bengaluru Urban",
    "UNIT-104 (Kolkata Metro)": "Kolkata",
    "UNIT-105 (Hyderabad East)": "Hyderabad",
    "UNIT-106 (Pune Crime Branch)": "Pune",
}

district_counts = {}
for c in cases:
    d = unit_district_map.get(c["UnitID"], "Unknown")
    district_counts[d] = district_counts.get(d, 0) + 1

print("\n--- District Case Counts (mapped from UnitID) ---")
for d, count in sorted(district_counts.items(), key=lambda x: -x[1]):
    print(f"  {d}: {count} cases")

# --- Crime Group Distribution ---
crime_groups = {}
for c in cases:
    cg = c["CrimeGroup"]
    crime_groups[cg] = crime_groups.get(cg, 0) + 1

print("\n--- Crime Group Distribution ---")
for cg, count in sorted(crime_groups.items(), key=lambda x: -x[1]):
    print(f"  {cg}: {count} cases")

# --- First 5 Cases ---
print("\n--- First 5 CaseMaster Records ---")
for c in cases[:5]:
    print(f"  {c['CaseID']} | {c['FIRNumber']} | {c['UnitID']} | {c['CrimeGroup']} | {c['CrimeHead']}")

# --- First 5 Accused ---
print("\n--- First 5 Accused Records ---")
for a in accused[:5]:
    print(f"  {a['AccusedID']} -> {a['CaseID']} | {a['Name']} | {a['ArrestStatus']}")

# --- Socio-Economic Crime Rate Calculation (same formula as predictive_service.py) ---
demo = {
    "Bengaluru Urban": {"pop_lakhs": 9.6},
    "Delhi NCR": {"pop_lakhs": 16.7},
    "Mumbai": {"pop_lakhs": 12.4},
    "Kolkata": {"pop_lakhs": 14.9},
    "Hyderabad": {"pop_lakhs": 6.8},
    "Pune": {"pop_lakhs": 3.1},
}

print("\n--- Socio-Economic Crime Rate / 100k (SAME formula as API) ---")
for d_name in sorted(district_counts.keys()):
    count = district_counts[d_name]
    pop = demo.get(d_name, {}).get("pop_lakhs", 5.0)
    rate = round((count / pop) * 10, 2)
    print(f"  {d_name}: {count} cases / {pop} lakh pop = {rate} per 100k")

print("\n" + "=" * 70)
print("  Compare these values against the API response & UI dashboard.")
print("  If they match, your data pipeline is verified end-to-end.")
print("=" * 70)
