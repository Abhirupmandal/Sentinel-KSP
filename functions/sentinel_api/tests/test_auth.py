"""Authentication unit & integration tests for Sentinel-KSP.

Tests login success/failure, concurrent session rejection, and forced password change on first login.
RX.4 Source-of-Truth Credential Verification Tests included.
"""

import os
os.environ["TESTING"] = "true"
import unittest
import sys
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from constants.roles import Role
from constants.account_states import AccountState
from core.exceptions import AuthenticationError, ValidationError
from core.password_manager import PasswordManager
from repositories.officer_repository import officer_repository
from repositories.session_repository import session_repository
from services.auth_service import auth_service


class TestAuth(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_login_success(self):
        """Test successful login returns token and profile."""
        pwd_hash = PasswordManager.hash_password("ValidPass@123")
        officer = {
            "ROWID": "ROW-1",
            "OfficerID": "OFF-TEST-1",
            "EmployeeID": "KSP-EMP-1",
            "PasswordHash": pwd_hash,
            "Role": Role.CYBER_SECURITY_ADMINISTRATOR.value,
            "AccountState": AccountState.ACTIVE.value,
            "TempPasswordFlag": False,
        }

        with patch.object(officer_repository, "get_by_employee_id", return_value=officer):
            with patch.object(officer_repository, "get_by_officer_id", return_value=officer):
                with patch.object(session_repository, "get_active_session_for_officer", return_value=None):
                    with patch.object(session_repository, "create_session") as mock_sess:
                        mock_sess.side_effect = lambda data: {"ROWID": "SESS-ROW", **data}
                        res = auth_service.login("KSP-EMP-1", "ValidPass@123")
                        self.assertIn("token", res)
                        self.assertEqual(res["officer"]["officer_id"], "OFF-TEST-1")

    def test_login_invalid_password(self):
        """Test login fails with invalid password."""
        pwd_hash = PasswordManager.hash_password("ValidPass@123")
        officer = {
            "OfficerID": "OFF-TEST-1",
            "EmployeeID": "KSP-EMP-1",
            "PasswordHash": pwd_hash,
            "Role": Role.CYBER_SECURITY_ADMINISTRATOR.value,
            "AccountState": AccountState.ACTIVE.value,
        }

        with patch.object(officer_repository, "get_by_employee_id", return_value=officer):
            with self.assertRaises(AuthenticationError):
                auth_service.login("KSP-EMP-1", "WrongPass@123")

    def test_change_password_persists_hash_and_flag(self):
        """RX.4: Test first-login password change updates PasswordHash, TempPasswordFlag=False, and AccountState=Active in datastore."""
        temp_pwd_hash = PasswordManager.hash_password("TempPass@123")
        officer = {
            "ROWID": "ROW-OFF-100",
            "OfficerID": "OFF-TEST-100",
            "EmployeeID": "KSP-EMP-100",
            "PasswordHash": temp_pwd_hash,
            "Role": Role.FIELD_INVESTIGATOR.value,
            "AccountState": AccountState.PENDING.value,
            "TempPasswordFlag": True,
        }

        # Simulated datastore row state
        updated_officer = dict(officer)

        def mock_update_password_state(officer_id, new_hash, temp_flag=False, new_state="Active"):
            updated_officer["PasswordHash"] = new_hash
            updated_officer["TempPasswordFlag"] = temp_flag
            updated_officer["AccountState"] = new_state
            return True

        def mock_get_by_officer_id(officer_id):
            return updated_officer

        with patch.object(officer_repository, "get_by_officer_id", side_effect=mock_get_by_officer_id):
            with patch.object(officer_repository, "update_password_state", side_effect=mock_update_password_state):
                result = auth_service.change_password(
                    officer_id="OFF-TEST-100",
                    current_password="TempPass@123",
                    new_password="NewSecurePass@2026",
                )

                self.assertEqual(result["account_state"], AccountState.ACTIVE.value)
                self.assertFalse(result["temp_password_flag"])

                # Cryptographic verification of persisted row state
                persisted_hash = updated_officer["PasswordHash"]
                self.assertTrue(PasswordManager.verify_password("NewSecurePass@2026", persisted_hash))
                self.assertFalse(PasswordManager.verify_password("TempPass@123", persisted_hash))
                self.assertFalse(updated_officer["TempPasswordFlag"])
                self.assertEqual(updated_officer["AccountState"], AccountState.ACTIVE.value)

    def test_login_after_password_change_rejects_old_temp_password(self):
        """RX.4: Test login with old temp/demo password fails after password change."""
        new_pwd_hash = PasswordManager.hash_password("NewSecurePass@2026")
        officer = {
            "ROWID": "ROW-OFF-101",
            "OfficerID": "OFF-TEST-101",
            "EmployeeID": "KSP-EMP-101",
            "PasswordHash": new_pwd_hash,  # Already updated
            "Role": Role.FIELD_INVESTIGATOR.value,
            "AccountState": AccountState.ACTIVE.value,
            "TempPasswordFlag": False,
        }

        with patch.object(officer_repository, "get_by_employee_id", return_value=officer):
            with patch.object(officer_repository, "get_by_officer_id", return_value=officer):
                # Attempt login with old password
                with self.assertRaises(AuthenticationError):
                    auth_service.login("KSP-EMP-101", "OldTempPass@123")

    def test_login_after_password_change_accepts_new_password(self):
        """RX.4: Test login with new password succeeds after password change."""
        new_pwd_hash = PasswordManager.hash_password("NewSecurePass@2026")
        officer = {
            "ROWID": "ROW-OFF-102",
            "OfficerID": "OFF-TEST-102",
            "EmployeeID": "KSP-EMP-102",
            "PasswordHash": new_pwd_hash,
            "Role": Role.FIELD_INVESTIGATOR.value,
            "AccountState": AccountState.ACTIVE.value,
            "TempPasswordFlag": False,
        }

        with patch.object(officer_repository, "get_by_employee_id", return_value=officer):
            with patch.object(officer_repository, "get_by_officer_id", return_value=officer):
                with patch.object(session_repository, "get_active_session_for_officer", return_value=None):
                    with patch.object(session_repository, "create_session") as mock_sess:
                        mock_sess.side_effect = lambda data: {"ROWID": "SESS-ROW", **data}
                        res = auth_service.login("KSP-EMP-102", "NewSecurePass@2026")
                        self.assertIn("token", res)
                        self.assertFalse(res["officer"]["temp_password_flag"])
                        self.assertEqual(res["officer"]["account_state"], "Active")

    def test_no_demo_password_fallback(self):
        """RX.4: Ensure no hardcoded or demo password shortcut permits KSPAdmin@2026 when hash changed."""
        new_pwd_hash = PasswordManager.hash_password("ChangedPass@2026")
        admin_officer = {
            "ROWID": "ROW-ADMIN-001",
            "OfficerID": "OFF-KSP-1D7F6E6C",
            "EmployeeID": "KSP-ADMIN-001",
            "PasswordHash": new_pwd_hash,
            "Role": Role.CYBER_SECURITY_ADMINISTRATOR.value,
            "AccountState": AccountState.ACTIVE.value,
            "TempPasswordFlag": False,
        }

        with patch.object(officer_repository, "get_by_employee_id", return_value=admin_officer):
            with patch.object(officer_repository, "get_by_officer_id", return_value=admin_officer):
                # Attempting demo password must fail
                with self.assertRaises(AuthenticationError):
                    auth_service.login("KSP-ADMIN-001", "KSPAdmin@2026")

                with self.assertRaises(AuthenticationError):
                    auth_service.login("KSP-ADMIN-001", "KSPAdmin@2026!")

    def test_same_password_rejected(self):
        """RX.4: Ensure changing password to identical password raises ValidationError."""
        pwd_hash = PasswordManager.hash_password("SamePass@123")
        officer = {
            "ROWID": "ROW-OFF-103",
            "OfficerID": "OFF-TEST-103",
            "EmployeeID": "KSP-EMP-103",
            "PasswordHash": pwd_hash,
            "Role": Role.FIELD_INVESTIGATOR.value,
            "AccountState": AccountState.PENDING.value,
            "TempPasswordFlag": True,
        }

        with patch.object(officer_repository, "get_by_officer_id", return_value=officer):
            with self.assertRaises(ValidationError):
                auth_service.change_password("OFF-TEST-103", "SamePass@123", "SamePass@123")


if __name__ == "__main__":
    unittest.main()
