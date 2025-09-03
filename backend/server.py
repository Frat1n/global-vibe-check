"""
MoodMaps Backend Server

Enhanced FastAPI backend for the MoodMaps social emotional sharing platform.
Provides comprehensive API endpoints for:
- Mood tracking and analytics
- Social features (followers, likes, comments)
- Video uploads and recommendations (Moodies)
- AI-powered mood analysis and recommendations
- Private messaging system

Dependencies:
- FastAPI for REST API
- MongoDB for data persistence
- EmergentIntegrations for AI capabilities
- Supabase integration for user management
"""

from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import json

# Import AI capabilities
from emergentintegrations.llm import openai_assistant

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AI Integration setup
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(
    title="MoodMaps API",
    description="Social emotional sharing platform with AI-powered recommendations",
    version="2.0.0"
)

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Authentication
security = HTTPBearer()


# Pydantic Models for API requests/responses
class MoodEntry(BaseModel):
    """Model for mood tracking entries"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood: str  # happy, sad, excited, stressed, calm, anxious
    message: Optional[str] = None
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    likes_count: int = 0
    comments_count: int = 0

class MoodCreate(BaseModel):
    """Request model for creating mood entries"""
    mood: str
    message: Optional[str] = None
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None

class VideoMoodie(BaseModel):
    """Model for video moodies (TikTok-style videos)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    video_data: str  # Base64 encoded video
    thumbnail_data: Optional[str] = None  # Base64 encoded thumbnail
    mood_tags: List[str] = []  # Associated mood tags
    duration: float  # Video duration in seconds
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_public: bool = True

class MoodieCreate(BaseModel):
    """Request model for creating video moodies"""
    title: str
    description: Optional[str] = None
    mood_tags: List[str] = []
    is_public: bool = True

class UserFollow(BaseModel):
    """Model for user follow relationships"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    follower_id: str
    following_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Like(BaseModel):
    """Model for likes on content"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str  # Can be mood_entry_id or moodie_id
    content_type: str  # 'mood' or 'moodie'
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    """Model for comments on content"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str
    content_type: str  # 'mood' or 'moodie'
    text: str
    parent_comment_id: Optional[str] = None  # For nested comments
    likes_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PrivateMessage(BaseModel):
    """Model for private messages"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    recipient_id: str
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIRecommendation(BaseModel):
    """Model for AI-powered recommendations"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    recommendation_type: str  # 'moodie', 'activity', 'content'
    content: Dict[str, Any]
    reasoning: str
    mood_context: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Helper Functions
async def verify_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verify user authentication token and return user_id
    In a real implementation, this would validate JWT tokens
    For now, we'll use a simple token format: "user_id"
    """
    try:
        # Simple token validation - in production, use proper JWT validation
        user_id = credentials.credentials
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

async def get_ai_mood_recommendations(user_id: str, recent_moods: List[str]) -> List[Dict]:
    """
    Get AI-powered recommendations based on user's recent moods
    Uses Emergent LLM integration for personalized suggestions
    """
    try:
        if not EMERGENT_LLM_KEY:
            return []
        
        # Create prompt for mood-based recommendations
        mood_context = ", ".join(recent_moods[-5:])  # Last 5 moods
        prompt = f"""
        Based on a user's recent moods: {mood_context}
        
        Provide 3 personalized recommendations for improving their emotional well-being.
        Each recommendation should include:
        1. Activity suggestion
        2. Brief explanation (max 50 words)
        3. Mood benefit (which mood it helps with)
        
        Format as JSON array with keys: activity, explanation, mood_benefit
        """
        
        # Call AI service
        response = await openai_assistant.create_completion(
            messages=[{"role": "user", "content": prompt}],
            api_key=EMERGENT_LLM_KEY,
            model="gpt-4o-mini"
        )
        
        # Parse AI response
        recommendations = json.loads(response.choices[0].message.content)
        return recommendations[:3]  # Limit to 3 recommendations
        
    except Exception as e:
        logging.error(f"AI recommendation error: {e}")
        return []

# API Endpoints

@api_router.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "MoodMaps API v2.0 - Social Emotional Platform"}

# Mood Tracking Endpoints
@api_router.post("/moods", response_model=MoodEntry)
async def create_mood_entry(
    mood_data: MoodCreate,
    user_id: str = Depends(verify_user_token)
):
    """Create a new mood entry"""
    try:
        mood_entry = MoodEntry(user_id=user_id, **mood_data.dict())
        await db.mood_entries.insert_one(mood_entry.dict())
        return mood_entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create mood entry: {str(e)}")

@api_router.get("/moods", response_model=List[MoodEntry])
async def get_mood_entries(
    limit: int = 50,
    user_id: str = Depends(verify_user_token)
):
    """Get user's mood entries"""
    try:
        cursor = db.mood_entries.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        moods = await cursor.to_list(length=limit)
        return [MoodEntry(**mood) for mood in moods]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mood entries: {str(e)}")

@api_router.get("/moods/public", response_model=List[MoodEntry])
async def get_public_mood_entries(limit: int = 100):
    """Get public mood entries for map visualization"""
    try:
        cursor = db.mood_entries.find({}).sort("timestamp", -1).limit(limit)
        moods = await cursor.to_list(length=limit)
        return [MoodEntry(**mood) for mood in moods]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch public mood entries: {str(e)}")

# Video Moodies Endpoints
@api_router.post("/moodies")
async def create_moodie(
    title: str = Form(...),
    description: str = Form(""),
    mood_tags: str = Form(""),  # JSON string of mood tags
    video_file: UploadFile = File(...),
    user_id: str = Depends(verify_user_token)
):
    """Upload a new video moodie"""
    try:
        # Validate video file
        if not video_file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Read and encode video file
        video_content = await video_file.read()
        video_data = base64.b64encode(video_content).decode('utf-8')
        
        # Parse mood tags
        mood_tags_list = json.loads(mood_tags) if mood_tags else []
        
        # Create moodie
        moodie = VideoMoodie(
            user_id=user_id,
            title=title,
            description=description,
            video_data=video_data,
            mood_tags=mood_tags_list,
            duration=10.0  # Default duration, could be calculated
        )
        
        await db.moodies.insert_one(moodie.dict())
        return {"message": "Moodie created successfully", "moodie_id": moodie.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create moodie: {str(e)}")

@api_router.get("/moodies", response_model=List[VideoMoodie])
async def get_moodies(
    limit: int = 20,
    mood_filter: Optional[str] = None,
    user_id: str = Depends(verify_user_token)
):
    """Get moodies feed with optional mood filtering"""
    try:
        query = {"is_public": True}
        if mood_filter:
            query["mood_tags"] = {"$in": [mood_filter]}
        
        cursor = db.moodies.find(query).sort("created_at", -1).limit(limit)
        moodies = await cursor.to_list(length=limit)
        return [VideoMoodie(**moodie) for moodie in moodies]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch moodies: {str(e)}")

# Social Features Endpoints
@api_router.post("/follow/{target_user_id}")
async def follow_user(
    target_user_id: str,
    user_id: str = Depends(verify_user_token)
):
    """Follow another user"""
    try:
        if user_id == target_user_id:
            raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
        # Check if already following
        existing = await db.follows.find_one({
            "follower_id": user_id,
            "following_id": target_user_id
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Already following this user")
        
        follow = UserFollow(follower_id=user_id, following_id=target_user_id)
        await db.follows.insert_one(follow.dict())
        
        return {"message": "Successfully followed user"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to follow user: {str(e)}")

@api_router.post("/like")
async def like_content(
    content_id: str,
    content_type: str,  # 'mood' or 'moodie'
    user_id: str = Depends(verify_user_token)
):
    """Like a mood or moodie"""
    try:
        # Check if already liked
        existing = await db.likes.find_one({
            "user_id": user_id,
            "content_id": content_id,
            "content_type": content_type
        })
        
        if existing:
            # Unlike
            await db.likes.delete_one({"_id": existing["_id"]})
            # Decrement like count
            collection = db.mood_entries if content_type == 'mood' else db.moodies
            await collection.update_one(
                {"id": content_id},
                {"$inc": {"likes_count": -1}}
            )
            return {"message": "Content unliked", "liked": False}
        else:
            # Like
            like = Like(user_id=user_id, content_id=content_id, content_type=content_type)
            await db.likes.insert_one(like.dict())
            # Increment like count
            collection = db.mood_entries if content_type == 'mood' else db.moodies
            await collection.update_one(
                {"id": content_id},
                {"$inc": {"likes_count": 1}}
            )
            return {"message": "Content liked", "liked": True}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to like content: {str(e)}")

@api_router.post("/comments")
async def create_comment(
    content_id: str,
    content_type: str,
    text: str,
    parent_comment_id: Optional[str] = None,
    user_id: str = Depends(verify_user_token)
):
    """Create a comment on mood or moodie"""
    try:
        comment = Comment(
            user_id=user_id,
            content_id=content_id,
            content_type=content_type,
            text=text,
            parent_comment_id=parent_comment_id
        )
        
        await db.comments.insert_one(comment.dict())
        
        # Increment comment count
        collection = db.mood_entries if content_type == 'mood' else db.moodies
        await collection.update_one(
            {"id": content_id},
            {"$inc": {"comments_count": 1}}
        )
        
        return {"message": "Comment created successfully", "comment_id": comment.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create comment: {str(e)}")

# AI Recommendations Endpoint
@api_router.get("/recommendations")
async def get_mood_recommendations(
    user_id: str = Depends(verify_user_token)
):
    """Get AI-powered mood recommendations"""
    try:
        # Get user's recent moods
        cursor = db.mood_entries.find({"user_id": user_id}).sort("timestamp", -1).limit(10)
        recent_entries = await cursor.to_list(length=10)
        recent_moods = [entry["mood"] for entry in recent_entries]
        
        if not recent_moods:
            return {"recommendations": [], "message": "Share some moods to get personalized recommendations!"}
        
        # Get AI recommendations
        recommendations = await get_ai_mood_recommendations(user_id, recent_moods)
        
        return {
            "recommendations": recommendations,
            "mood_context": recent_moods[-5:],  # Last 5 moods for context
            "message": "Recommendations based on your recent mood patterns"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

# Private Messages Endpoint
@api_router.post("/messages")
async def send_private_message(
    recipient_id: str,
    message: str,
    user_id: str = Depends(verify_user_token)
):
    """Send a private message"""
    try:
        private_message = PrivateMessage(
            sender_id=user_id,
            recipient_id=recipient_id,
            message=message
        )
        
        await db.private_messages.insert_one(private_message.dict())
        return {"message": "Message sent successfully", "message_id": private_message.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@api_router.get("/messages")
async def get_private_messages(
    limit: int = 50,
    user_id: str = Depends(verify_user_token)
):
    """Get user's private messages"""
    try:
        cursor = db.private_messages.find({
            "$or": [
                {"sender_id": user_id},
                {"recipient_id": user_id}
            ]
        }).sort("created_at", -1).limit(limit)
        
        messages = await cursor.to_list(length=limit)
        return [PrivateMessage(**msg) for msg in messages]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")

# Legacy status endpoints (keeping for compatibility)
@api_router.post("/status")
async def create_status_check(client_name: str):
    """Legacy status check endpoint"""
    status_data = {
        "id": str(uuid.uuid4()),
        "client_name": client_name,
        "timestamp": datetime.utcnow()
    }
    await db.status_checks.insert_one(status_data)
    return status_data

@api_router.get("/status")
async def get_status_checks():
    """Legacy status check endpoint"""
    cursor = db.status_checks.find().sort("timestamp", -1).limit(1000)
    status_checks = await cursor.to_list(length=1000)
    return status_checks

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown"""
    client.close()
