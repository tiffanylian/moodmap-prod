"""
Main FastAPI application for Mood Map backend.
Handles pin submission with quality control checking.

Version: 1.0.1 - Fixed environment variable loading
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

from ..qc.checker import QCChecker

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Mood Map API",
    description="Backend API for mood pin submission with quality control",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://moodmap-prod.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

logger.info(f"Supabase URL: {supabase_url}")
logger.info(f"Supabase Key present: {bool(supabase_key)}")

supabase = None
if supabase_url and supabase_key:
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        supabase = None
else:
    logger.warning("Supabase URL or KEY not configured")

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


class PinReportRequest(BaseModel):
    """Schema for pin report request."""
    pin_id: int
    reporter_id: str


class PinReportResponse(BaseModel):
    """Schema for pin report response."""
    success: bool
    message: str
    pin_deleted: bool = False
    user_suspended: bool = False


def get_deletion_threshold(moderation_level: int) -> int:
    """
    Get the report threshold for pin deletion based on user's moderation level.
    
    Moderation levels:
    - 0: Normal user (3 reports to delete pin)
    - 1: 1 pin removed (2 reports to delete next pin)
    - 2: 2 pins removed (1 report to delete next pin)
    - 3+: Suspended
    """
    if moderation_level == 0:
        return 3
    elif moderation_level == 1:
        return 2
    elif moderation_level == 2:
        return 1
    else:
        return 0  # Suspended, no pins allowed



@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "mood-map-backend"}


@app.get("/pins/test")
async def test_pins():
    """Test endpoint to check pins in database."""
    if not supabase:
        return {"error": "Database not connected"}
    
    try:
        result = supabase.table("mood_pins").select("*").limit(5).execute()
        return {
            "count": result.count,
            "data": result.data
        }
    except Exception as e:
        return {"error": str(e)}


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


@app.post("/pins/report", response_model=PinReportResponse)
async def report_pin(report: PinReportRequest):
    """
    Report a mood pin for inappropriate content.
    Implements progressive moderation: 3 reports -> 2 reports -> 1 report -> suspension.
    """
    logger.debug(f"Received report request for pin {report.pin_id} from {report.reporter_id}")
    
    if not supabase:
        logger.error("Supabase not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection not configured"
        )
    
    try:
        logger.debug("Starting report processing")
        # Get the pin to find its owner
        pin_result = supabase.table("mood_pins").select("user_id").eq("id", report.pin_id).execute()
        logger.debug(f"Pin result: {pin_result}")
        
        if not pin_result.data or len(pin_result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pin not found"
            )
        
        pin_owner_id = pin_result.data[0]["user_id"]
        logger.debug(f"Pin owner: {pin_owner_id}")
        
        # Get the pin owner's moderation level
        user_result = supabase.table("users").select("moderation_level").eq("id", pin_owner_id).execute()
        logger.debug(f"User result: {user_result}")
        
        moderation_level = 0
        if user_result.data and len(user_result.data) > 0:
            moderation_level = user_result.data[0].get("moderation_level", 0)
        
        # Check if user is suspended
        if moderation_level >= 3:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This user's account has been suspended"
            )
        
        # Insert the report
        report_result = supabase.table("pin_reports").insert({
            "pin_id": report.pin_id,
            "reporter_id": report.reporter_id
        }).execute()
        logger.debug(f"Report inserted: {report_result}")
        
        # Check how many reports this pin now has
        report_count_result = supabase.table("pin_reports").select(
            "id", count="exact"
        ).eq("pin_id", report.pin_id).execute()
        
        report_count = report_count_result.count or 0
        threshold = get_deletion_threshold(moderation_level)
        pin_deleted = False
        user_suspended = False
        
        if report_count >= threshold and threshold > 0:
            # Delete the pin
            supabase.table("mood_pins").delete().eq("id", report.pin_id).execute()
            pin_deleted = True
            
            # Increment the user's moderation level
            new_moderation_level = moderation_level + 1
            supabase.table("users").update({
                "moderation_level": new_moderation_level
            }).eq("id", pin_owner_id).execute()
            
            # Check if user should be suspended (moderation_level >= 3)
            if new_moderation_level >= 3:
                user_suspended = True
            
            return PinReportResponse(
                success=True,
                message=f"Pin removed due to multiple reports (threshold: {threshold})",
                pin_deleted=True,
                user_suspended=user_suspended
            )
        
        return PinReportResponse(
            success=True,
            message=f"Pin reported successfully ({report_count}/{threshold} reports)",
            pin_deleted=False,
            user_suspended=False
        )
    
    except Exception as e:
        logger.error(f"Error in report_pin: {str(e)}", exc_info=True)
        error_str = str(e).lower()
        # Check if it's a unique constraint violation (duplicate report)
        if "duplicate" in error_str or "unique" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reported this pin"
            )
        
        # Re-raise HTTPExceptions
        if isinstance(e, HTTPException):
            raise
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reporting pin: {str(e)}"
        )



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
