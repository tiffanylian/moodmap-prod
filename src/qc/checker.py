"""
Quality Control Checker for text submissions.
Uses profanity filter library and sentiment analysis.
"""

from better_profanity import profanity
from textblob import TextBlob


# Initialize profanity filter with default wordlist
profanity.load_default_wordlist()


class QCChecker:
    """Quality control checker using profanity filter and sentiment analysis."""

    def __init__(self, sentiment_threshold: float = -0.5):
        """
        Initialize the QC checker.

        Args:
            sentiment_threshold: Polarity score below this triggers concerning content.
                                Range: -1.0 (very negative) to 1.0 (very positive)
                                Default: -0.5 (moderately negative)
        """
        self.sentiment_threshold = sentiment_threshold

    def check_text(self, text: str) -> tuple[str, str]:
        """
        Check text for profanity and concerning sentiment.

        Args:
            text: The text to check

        Returns:
            Tuple of (status, message) where status is 'safe' or 'blocked'
        """
        if not text or not isinstance(text, str) or not text.strip():
            return "safe", ""

        # Check for profanity using better-profanity library
        if profanity.contains_profanity(text):
            return "blocked", "Your submission contains inappropriate language and cannot be posted."

        # Check sentiment using TextBlob
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity

            if polarity < self.sentiment_threshold:
                return (
                    "blocked",
                    "Your submission contains concerning content. Please reach out to PennCAPS "
                    "(Penn's counseling services) at 215-898-7021 or visit caps.upenn.edu. "
                    "If you're in crisis, call 988 (Suicide & Crisis Lifeline).",
                )
        except Exception as e:
            # If sentiment analysis fails, log and continue
            print(f"Warning: Sentiment analysis failed: {e}")

        return "safe", ""
