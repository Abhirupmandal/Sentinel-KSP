"""Service layer unit tests for Sentinel-KSP.

Tests business logic including single-session enforcement, emergency access validation,
session expiry batch processing, and password credentials persistence.
"""

import os
os.environ["TESTING"] = "true"
import unittest
import sys
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.exceptions import ValidationError
from services.session_service import session_service
from services.emergency_service import emergency_service
from repositories.session_repository import session_repository
from repositories.officer_repository import officer_repository


class TestServices(unittest.TestCase):
    def setUp(self):
        pass

    def test_emergency_access_mandatory_field_validation(self):
        with self.assertRaises(ValidationError):
            emergency_service.grant_emergency_access(
                admin_officer_id="OFF-ADMIN-1",
                target_officer_id="OFF-TARGET-1",
                justification="Emergency investigation",
                case_reference="",
            )

    def test_session_batch_expiry(self):
        with patch.object(session_repository, "get_by_session_id", return_value={"SessionID": "SES-EXPIRY-1", "IsActive": True, "LastActivityTime": "2020-01-01 00:00:00"}):
            with patch.object(session_repository, "deactivate_session", return_value=True):
                self.assertFalse(session_service.is_session_valid("SES-EXPIRY-1", timeout_minutes=15))

    def test_officer_repository_update_password_state_payload(self):
        """Verify update_password_state constructs payload with ROWID, PasswordHash, TempPasswordFlag=False, PasswordLastChanged, and AccountState=Active."""
        officer = {
            "ROWID": "ROW-CATALYST-999",
            "OfficerID": "OFF-CAT-999",
            "AccountState": "Pending",
        }
        with patch.object(officer_repository, "get_by_officer_id", return_value=officer):
            with patch("core.catalyst_client.catalyst_client.update_row") as mock_update:
                mock_update.return_value = {"ROWID": "ROW-CATALYST-999"}
                success = officer_repository.update_password_state(
                    officer_id="OFF-CAT-999",
                    new_hash="$2b$12$testnewhashstring",
                    temp_flag=False,
                    new_state="Active",
                )
                self.assertTrue(success)
                mock_update.assert_called_once()
                table_name, payload = mock_update.call_args[0]
                self.assertEqual(table_name, "Officers")
                self.assertEqual(payload["ROWID"], "ROW-CATALYST-999")
                self.assertEqual(payload["PasswordHash"], "$2b$12$testnewhashstring")
                self.assertFalse(payload["TempPasswordFlag"])
                self.assertEqual(payload["AccountState"], "Active")
                self.assertIn("PasswordLastChanged", payload)


if __name__ == "__main__":
    unittest.main()
