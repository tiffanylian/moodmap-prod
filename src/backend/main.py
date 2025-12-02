"""
Main FastAPI application for Mood Map backend.
Handles pin submission with quality control checking.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import os
from dotenv import load_dotenv

from ..qc.checker import QCChecker

load_dotenv()

app = FastAPI(
    title="Mood Map API",
    description="Backend API for mood pin submission with quality control",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize QC checker
qc_checker = QCChecker(sentiment_threshold=-0.5)


class PinSubmission(BaseModel):
    """Schema for pin submission request."""
    lat: float
    lng: float
    mood: str
    message: str | None = None
    user_id: str

    @validator('lat')
    def validate_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @validator('lng')
    def validate_lng(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v

    @validator('mood')
    def validate_mood(cls, v):
        valid_moods = ['HYPED', 'VIBING', 'MID', 'STRESSED', 'TIRED']
        if v not in valid_moods:
            raise ValueError(f'Mood must be one of {valid_moods}')
        return v

    @validator('message')
    def validate_message(cls, v):
        if v and len(v) > 200:
            raise ValueError('Message must be 200 characters or less')
        return v


class QCCheckResponse(BaseModel):
    """Schema for QC check response."""
    status: str
    message: str


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "mood-map-backend"}


@app.post("/qc/check", response_model=QCCheckResponse)
async def check_content(text: str):
    """
    Check text content for profanity and concerning content.
    """
    status, message = qc_checker.check_text(text)
    
    return QCCheckResponse(
        status=status,
        message=message
    )


@app.post("/pins/submit")
async def submit_pin(submission: PinSubmission):
    """
    Submit a new mood pin.
    Performs QC checking on message before saving.
    Blocks profanity and concerning content.
    """
    # Check message content if provided
    if submission.message:
        status, message = qc_checker.check_text(submission.message)
        
        if status == "blocked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": message,
                }
            )
    
    # Here we would insert into Supabase
    # This is handled by the frontend for now, but can be moved here
    return {
        "success": True,
        "message": "Pin submitted successfully",
        "data": {
            "lat": submission.lat,
            "lng": submission.lng,
            "mood": submission.mood,
            "message": submission.message,
            "user_id": submission.user_id
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
