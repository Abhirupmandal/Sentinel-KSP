"""Repository layer unit tests for Sentinel-KSP.

Tests repository operations against Catalyst client layer.
RX.4 Source-of-Truth Credential State Transition Tests included.
"""

import os
os.environ["TESTING"] = "true"
import unittest
import sys
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from repositories.case_repository import case_repository
from repositories.accused_repository import accused_repository
from repositories.victim_repository import victim_repository
from repositories.unit_repository import unit_repository
from repositories.officer_repository import officer_repository


class TestRepository(unittest.TestCase):
    def test_case_repository_queries(self):
        cases = case_repository.get_all()
        self.assertIsInstance(cases, list)
        if cases:
            case_id = cases[0].get("CaseID")
            fetched = case_repository.get_by_case_id(case_id)
            self.assertIsNotNone(fetched)

    def test_accused_search_by_name(self):
        results = accused_repository.search_by_name("Kumar")
        self.assertIsInstance(results, list)

    def test_unit_repository_get_all(self):
        units = unit_repository.get_all()
        self.assertIsInstance(units, list)

    def test_victim_repository_queries(self):
        victims = victim_repository.get_all()
        self.assertIsInstance(victims, list)

    def test_officer_repository_update_password_state_payload(self):
        """RX.4: Verify update_password_state constructs payload with ROWID, PasswordHash, TempPasswordFlag=False, PasswordLastChanged, and AccountState=Active."""
        mock_officer = {
            "ROWID": "51748000000034032",
            "OfficerID": "OFF-KSP-1D7F6E6C",
            "EmployeeID": "KSP-ADMIN-001",
            "AccountState": "Pending",
            "TempPasswordFlag": True,
        }

        with patch.object(officer_repository, "get_by_officer_id", return_value=mock_officer):
            with patch("core.catalyst_client.catalyst_client.update_row") as mock_patch:
                mock_patch.return_value = {"ROWID": "51748000000034032"}

                res = officer_repository.update_password_state(
                    officer_id="OFF-KSP-1D7F6E6C",
                    new_hash="$2b$12$newhashvalue",
                    temp_flag=False,
                    new_state="Active",
                )

                self.assertTrue(res)
                mock_patch.assert_called_once()
                table_name, payload = mock_patch.call_args.args
                self.assertEqual(table_name, "Officers")
                self.assertEqual(payload["ROWID"], "51748000000034032")
                self.assertEqual(payload["PasswordHash"], "$2b$12$newhashvalue")
                self.assertFalse(payload["TempPasswordFlag"])
                self.assertEqual(payload["AccountState"], "Active")
                self.assertIn("PasswordLastChanged", payload)


if __name__ == "__main__":
    unittest.main()
