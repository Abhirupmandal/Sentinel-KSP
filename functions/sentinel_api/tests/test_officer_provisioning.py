"""Unit tests for Officer provisioning workflow in Sentinel-KSP.

Tests payload validation (including rank, station, department requirement),
server-generated fields (OfficerID, TempPasswordFlag, AccountState, PasswordHash),
and repository persistence.
"""

import os
os.environ["TESTING"] = "true"
import unittest
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.exceptions import ValidationError
from schemas.officer_schema import OfficerSchema
from services.officer_service import officer_service
from repositories.officer_repository import officer_repository
from constants.account_states import AccountState


class TestOfficerProvisioning(unittest.TestCase):
    def setUp(self):
        pass

    def test_successful_officer_provisioning(self):
        """Test full successful officer provisioning with all required fields."""
        payload = {
            "employee_id": "KSP-TEST-EMP-999",
            "full_name": "Insp. Vikram Singh",
            "role": "FieldInvestigator",
            "district": "Bengaluru Urban",
            "rank": "Inspector",
            "station": "Cyber Crime HQ",
            "department": "Cyber Crime",
        }

        validated = OfficerSchema.validate_create_officer(payload)
        self.assertEqual(validated["employee_id"], "KSP-TEST-EMP-999")
        self.assertEqual(validated["rank"], "Inspector")

        with patch.object(officer_repository, "get_by_employee_id", return_value=None):
            with patch.object(officer_repository, "create") as mock_create:
                mock_create.side_effect = lambda data: {"ROWID": "ROW-123", **data}
                res = officer_service.create_officer(validated, admin_officer_id="OFF-ADMIN-001")
                self.assertIn("officer_id", res)
                self.assertEqual(res["account_state"], AccountState.PENDING.value)
                self.assertIn("temp_password", res)

    def test_missing_rank_field_raises_validation_error(self):
        """Schema must reject creation if rank is missing."""
        payload = {
            "employee_id": "KSP-TEST-EMP-999",
            "full_name": "Insp. Vikram Singh",
            "role": "FieldInvestigator",
            "district": "Bengaluru Urban",
            "station": "Cyber Crime HQ",
            "department": "Cyber Crime",
        }
        with self.assertRaises(ValidationError):
            OfficerSchema.validate_create_officer(payload)

    def test_duplicate_employee_id_raises_validation_error(self):
        """OfficerService must reject creation if EmployeeID already exists."""
        payload = {
            "employee_id": "KSP-EXISTING-001",
            "full_name": "Insp. Duplicate",
            "role": "FieldInvestigator",
            "district": "Bengaluru Urban",
            "rank": "Inspector",
            "station": "Cyber Crime HQ",
            "department": "Cyber Crime",
        }
        validated = OfficerSchema.validate_create_officer(payload)

        with patch.object(officer_repository, "get_by_employee_id", return_value={"OfficerID": "OFF-EXISTING"}):
            with self.assertRaises(ValidationError) as ctx:
                officer_service.create_officer(validated, admin_officer_id="OFF-ADMIN-001")
            self.assertIn("already exists", str(ctx.exception))

    def test_duplicate_check_uses_for_duplicate_check_flag(self):
        """Verify for_duplicate_check=True is passed during create_officer duplicate check."""
        payload = {
            "employee_id": "KSP-FLAG-TEST-001",
            "full_name": "Insp. Flag Test",
            "role": "SCRBDataAnalyst",
            "district": "Bengaluru Urban",
            "rank": "Inspector",
            "station": "HQ Cyber Unit",
            "department": "Cyber Crime",
        }
        validated = OfficerSchema.validate_create_officer(payload)

        with patch.object(officer_repository, "get_by_employee_id", return_value=None) as mock_get:
            with patch.object(officer_repository, "create", return_value={"OfficerID": "OFF-TEST-1"}):
                officer_service.create_officer(validated, admin_officer_id="OFF-ADMIN-001")

            mock_get.assert_called_once_with("KSP-FLAG-TEST-001", for_duplicate_check=True)


if __name__ == "__main__":
    unittest.main()
