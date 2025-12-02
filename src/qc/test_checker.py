"""
Tests for the Quality Control Checker.
"""

import unittest
from checker import QCChecker


class TestQCChecker(unittest.TestCase):
    """Test cases for QC checker functionality."""

    def setUp(self):
        """Initialize a QC checker instance for each test."""
        self.checker = QCChecker()

    def test_safe_content(self):
        """Test that normal, safe content passes."""
        safe_texts = [
            "I'm feeling great today!",
            "Had a productive day at work.",
            "Enjoying time with friends.",
        ]
        for text in safe_texts:
            status, message = self.checker.check_text(text)
            self.assertEqual(status, "safe", f"Failed for: {text}")

    def test_profanity_blocked(self):
        """Test that profanity is blocked."""
        profanity_texts = [
            "This is fucking annoying",
            "What the shit is this",
            "This is crap",
        ]
        for text in profanity_texts:
            status, message = self.checker.check_text(text)
            self.assertEqual(status, "blocked", f"Failed to block: {text}")
            self.assertIn("inappropriate language", message)

    def test_negative_sentiment_blocked(self):
        """Test that very negative sentiment is blocked."""
        negative_texts = [
            "I hate myself and everything around me",
            "Life is impossible and pointless",
            "Nobody cares about me, I'm completely alone",
        ]
        for text in negative_texts:
            status, message = self.checker.check_text(text)
            self.assertEqual(status, "blocked", f"Failed to block: {text}")
            self.assertIn("PennCAPS", message)

    def test_empty_text(self):
        """Test that empty text is safe."""
        status, message = self.checker.check_text("")
        self.assertEqual(status, "safe")


if __name__ == "__main__":
    unittest.main()

