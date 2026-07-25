"""Password hashing and verification utility for Sentinel-KSP using bcrypt.

Provides secure password hashing and verification functionality without ever
exposing or logging plaintext passwords.
"""

import logging
import bcrypt

logger = logging.getLogger(__name__)


class PasswordManager:
    """Utility class for bcrypt password hashing and comparison."""

    @staticmethod
    def hash_password(plaintext_password: str) -> str:
        """Generate a secure bcrypt hash for a plaintext password.

        Args:
            plaintext_password: The raw password string to hash.

        Returns:
            The UTF-8 decoded bcrypt hash string suitable for database storage.

        Raises:
            ValueError: If the plaintext_password is empty or invalid.
        """
        if not plaintext_password:
            raise ValueError("Password cannot be empty")

        password_bytes = plaintext_password.encode("utf-8")
        salt = bcrypt.gensalt(rounds=12)
        hashed_bytes = bcrypt.hashpw(password_bytes, salt)

        return hashed_bytes.decode("utf-8")

    @staticmethod
    def verify_password(plaintext_password: str, hashed_password: str) -> bool:
        """Verify a plaintext password against a stored bcrypt hash.

        Args:
            plaintext_password: The raw password string to check.
            hashed_password: The stored bcrypt hash string from the database.

        Returns:
            True if the password matches the hash, False otherwise.
        """
        if not plaintext_password or not hashed_password:
            return False

        try:
            password_bytes = plaintext_password.encode("utf-8")
            hash_bytes = hashed_password.encode("utf-8")
            return bcrypt.checkpw(password_bytes, hash_bytes)
        except Exception as exc:
            logger.error("Error during password verification check: %s", type(exc).__name__)
            return False
