"""Bootstrap script to create the first Cyber Security Administrator officer in Catalyst Data Store.

Bypasses the normal admin-creates-officer flow since no admin exists yet.
Uses officer_repository directly to insert into live Officers table in Catalyst Data Store.
"""

import sys
import os

# Ensure the sentinel_api package is importable
api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

from dotenv import load_dotenv
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
if not os.path.exists(env_path):
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(env_path)

from constants.account_states import AccountState
from constants.roles import Role
from constants.departments import Department
from constants.ranks import Rank
from core.password_manager import PasswordManager
from repositories.officer_repository import officer_repository
from utils.id_generator import generate_officer_id


def create_initial_admin() -> None:
    """Create the bootstrap Cyber Security Administrator account directly in Catalyst Data Store."""
    employee_id = "KSP-ADMIN-001"
    temp_password = "KSPAdmin@2026!"

    # Check if admin already exists in Catalyst Data Store
    try:
        existing = officer_repository.get_by_employee_id(employee_id)
        if existing:
            print(f"[!] Admin with EmployeeID '{employee_id}' already exists in Catalyst Data Store: {existing.get('OfficerID')}")
            return
    except Exception as exc:
        print(f"[!] Live query check for '{employee_id}' threw exception: {exc}")

    officer_id = generate_officer_id()
    password_hash = PasswordManager.hash_password(temp_password)

    officer_data = {
        "OfficerID": officer_id,
        "FullName": "System Administrator",
        "EmployeeID": employee_id,
        "PasswordHash": password_hash,
        "TempPasswordFlag": True,
        "Role": Role.CYBER_SECURITY_ADMINISTRATOR.value,
        "District": "Bengaluru Urban",
        "Rank": Rank.CYBER_ADMIN.value,
        "Station": "Cyber Crime HQ",
        "Department": Department.CYBER_CRIME.value,
        "AccountState": AccountState.ACTIVE.value,
        "CreatedBy": "SYSTEM_BOOTSTRAP",
    }

    result = officer_repository.create(officer_data)
    print("=" * 60)
    print("  INITIAL ADMIN ACCOUNT CREATED SUCCESSFULLY IN CATALYST DATA STORE")
    print("=" * 60)
    print(f"  OfficerID:     {officer_id}")
    print(f"  EmployeeID:    {employee_id}")
    print(f"  Temp Password: {temp_password}")
    print(f"  Role:          {Role.CYBER_SECURITY_ADMINISTRATOR.value}")
    print(f"  AccountState:  {AccountState.ACTIVE.value}")
    print(f"  ROWID:         {result.get('ROWID')}")
    print("=" * 60)
    print("  ⚠ CHANGE THIS PASSWORD ON FIRST LOGIN")
    print("=" * 60)


if __name__ == "__main__":
    create_initial_admin()
