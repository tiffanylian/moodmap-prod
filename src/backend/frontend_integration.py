"""
Frontend API integration utilities for the backend.
"""

import os

# Backend URL configuration
BACKEND_URL = os.getenv("VITE_BACKEND_URL", "http://localhost:8000")


async def check_content_quality(text: str) -> dict:
    """
    Check text content quality via backend QC endpoint.
    
    Args:
        text: The text to check
    
    Returns:
        Dict with is_acceptable, severity, issues, and user_message
    """
    try:
        # This would be called from frontend, here's the endpoint structure
        return {
            "endpoint": f"{BACKEND_URL}/qc/check",
            "method": "POST",
            "params": {"text": text}
        }
    except Exception as e:
        return {"error": str(e)}
