"""RBAC unit tests for Sentinel-KSP.

Tests role and permission decorators against different roles.
"""

import os
os.environ["TESTING"] = "true"
import unittest
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from constants.roles import Role
from constants.account_states import AccountState
from core.jwt_manager import JWTManager
from repositories.officer_repository import officer_repository
from repositories.session_repository import session_repository


class TestRBAC(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def create_authenticated_header(self, role: str) -> dict:
        officer_id = f"OFF-{role.upper()}"
        session_id = f"SES-{role.upper()}"
        token = JWTManager.issue_token(officer_id=officer_id, session_id=session_id, role=role)
        return {
            "Authorization": f"Bearer {token}",
            "OfficerID": officer_id,
            "SessionID": session_id,
        }

    def test_admin_access_to_admin_route(self):
        ctx = self.create_authenticated_header(Role.CYBER_SECURITY_ADMINISTRATOR.value)
        officer = {
            "OfficerID": ctx["OfficerID"],
            "Role": Role.CYBER_SECURITY_ADMINISTRATOR.value,
            "AccountState": AccountState.ACTIVE.value,
        }
        from datetime import datetime, timezone
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        session = {
            "ROWID": "ROW-SESS-1",
            "SessionID": ctx["SessionID"],
            "OfficerID": ctx["OfficerID"],
            "IsActive": True,
            "LastActivityTime": now_str,
        }

        with patch.object(officer_repository, "get_by_officer_id", return_value=officer):
            with patch.object(session_repository, "get_by_session_id", return_value=session):
                with patch.object(session_repository, "update_last_activity", return_value=True):
                    with patch.object(officer_repository, "create", return_value={"ROWID": "ROW-1", "OfficerID": "OFF-NEW"}):
                        with patch.object(officer_repository, "get_by_employee_id", return_value=None):
                            res = self.client.post(
                                "/api/admin/officers",
                                headers={"Authorization": ctx["Authorization"]},
                                json={
                                    "employee_id": "KSP-NEW-001",
                                    "full_name": "New Officer",
                                    "role": "FieldInvestigator",
                                    "district": "Bengaluru Urban",
                                    "rank": "Inspector",
                                    "station": "HQ",
                                    "department": "Cyber Crime",
                                },
                            )
                            self.assertEqual(res.status_code, 201)

    def test_unauthorized_role_denied_on_admin_route(self):
        ctx = self.create_authenticated_header(Role.FIELD_INVESTIGATOR.value)
        officer = {
            "OfficerID": ctx["OfficerID"],
            "Role": Role.FIELD_INVESTIGATOR.value,
            "AccountState": AccountState.ACTIVE.value,
        }
        from datetime import datetime, timezone
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        session = {
            "ROWID": "ROW-SESS-2",
            "SessionID": ctx["SessionID"],
            "OfficerID": ctx["OfficerID"],
            "IsActive": True,
            "LastActivityTime": now_str,
        }

        with patch.object(officer_repository, "get_by_officer_id", return_value=officer):
            with patch.object(session_repository, "get_by_session_id", return_value=session):
                with patch.object(session_repository, "update_last_activity", return_value=True):
                    res = self.client.post(
                        "/api/admin/officers",
                        headers={"Authorization": ctx["Authorization"]},
                        json={},
                    )
                    self.assertEqual(res.status_code, 403)


if __name__ == "__main__":
    unittest.main()
