from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'ignitron-2k25-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="IGNITRON 2K25 API")
api_router = APIRouter(prefix="/api")

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            self.active_connections[room].remove(websocket)
    
    async def broadcast(self, message: dict, room: str):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "coordinator"  # admin, coordinator
    event_ids: List[str] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    role: str
    event_ids: List[str] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class CollegeCreate(BaseModel):
    name: str
    code: str

class College(BaseModel):
    id: str
    name: str
    code: str
    total_points: int = 0

class EventCreate(BaseModel):
    title: str
    code: str
    coordinator_ids: List[str] = []

class Event(BaseModel):
    id: str
    title: str
    code: str
    coordinator_ids: List[str] = []

# Updated Result models to support manual points and achievement statements
class ResultCreate(BaseModel):
    event_id: str
    college_id: str
    points: int = Field(..., ge=0, description="Points must be a positive number")
    achievement_statement: str = Field(..., min_length=1, description="Achievement description is required")

class Result(BaseModel):
    id: str
    event_id: str
    college_id: str
    points: int
    achievement_statement: str
    recorded_by: str
    timestamp: str

class LeaderboardEntry(BaseModel):
    rank: int
    college_name: str
    college_code: str
    total_points: int

# Utility Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate, current_user: dict = Depends(get_admin_user)):
    """Admin only: Register new users"""
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "event_ids": user_data.event_ids,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    return User(id=user_id, username=user_data.username, email=user_data.email, role=user_data.role, event_ids=user_data.event_ids)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    user_obj = User(id=user["id"], username=user["username"], email=user["email"], role=user["role"], event_ids=user.get("event_ids", []))
    return TokenResponse(access_token=access_token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# College Routes
@api_router.post("/colleges", response_model=College)
async def create_college(college: CollegeCreate, current_user: dict = Depends(get_admin_user)):
    college_id = str(uuid.uuid4())
    college_doc = {
        "id": college_id,
        "name": college.name,
        "code": college.code,
        "total_points": 0
    }
    await db.colleges.insert_one(college_doc)
    return College(**college_doc)

@api_router.get("/colleges", response_model=List[College])
async def get_colleges():
    colleges = await db.colleges.find({}, {"_id": 0}).to_list(1000)
    return colleges

@api_router.delete("/colleges/{college_id}")
async def delete_college(college_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.colleges.delete_one({"id": college_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="College not found")
    return {"message": "College deleted successfully"}

# Event Routes
@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate, current_user: dict = Depends(get_admin_user)):
    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        "title": event.title,
        "code": event.code,
        "coordinator_ids": event.coordinator_ids
    }
    await db.events.insert_one(event_doc)
    return Event(**event_doc)

@api_router.get("/events", response_model=List[Event])
async def get_events(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        events = await db.events.find({}, {"_id": 0}).to_list(1000)
    else:
        events = await db.events.find({"coordinator_ids": current_user["id"]}, {"_id": 0}).to_list(1000)
    return events

@api_router.get("/events/all", response_model=List[Event])
async def get_all_events():
    """Public endpoint to get all events"""
    events = await db.events.find({}, {"_id": 0}).to_list(1000)
    return events

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Result Routes - Updated for manual points and achievement statements
@api_router.post("/results", response_model=Result)
async def create_result(result_data: ResultCreate, current_user: dict = Depends(get_current_user)):
    # Check if user has permission for this event
    event = await db.events.find_one({"id": result_data.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user["role"] != "admin" and current_user["id"] not in event["coordinator_ids"]:
        raise HTTPException(status_code=403, detail="You don't have permission for this event")
    
    # Check if college exists
    college = await db.colleges.find_one({"id": result_data.college_id}, {"_id": 0})
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    
    # Create result with manual points and achievement statement
    result_id = str(uuid.uuid4())
    result_doc = {
        "id": result_id,
        "event_id": result_data.event_id,
        "college_id": result_data.college_id,
        "points": result_data.points,
        "achievement_statement": result_data.achievement_statement,
        "recorded_by": current_user["id"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.results.insert_one(result_doc)
    
    # Update college total points
    await db.colleges.update_one(
        {"id": result_data.college_id},
        {"$inc": {"total_points": result_data.points}}
    )
    
    # Broadcast update
    await manager.broadcast({
        "type": "leaderboard_update",
        "data": await get_leaderboard_data()
    }, "leaderboard")
    
    return Result(**result_doc)

@api_router.get("/results", response_model=List[Result])
async def get_results(event_id: Optional[str] = None):
    query = {"event_id": event_id} if event_id else {}
    results = await db.results.find(query, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return results

@api_router.delete("/results/{result_id}")
async def delete_result(result_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.results.find_one({"id": result_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    # Check permissions
    if current_user["role"] != "admin":
        event = await db.events.find_one({"id": result["event_id"]}, {"_id": 0})
        if current_user["id"] not in event["coordinator_ids"]:
            raise HTTPException(status_code=403, detail="No permission to delete this result")
    
    # Delete result
    await db.results.delete_one({"id": result_id})
    
    # Update college points
    await db.colleges.update_one(
        {"id": result["college_id"]},
        {"$inc": {"total_points": -result["points"]}}
    )
    
    # Broadcast update
    await manager.broadcast({
        "type": "leaderboard_update",
        "data": await get_leaderboard_data()
    }, "leaderboard")
    
    return {"message": "Result deleted successfully"}

# Leaderboard
async def get_leaderboard_data():
    colleges = await db.colleges.find({}, {"_id": 0}).sort("total_points", -1).to_list(1000)
    leaderboard = []
    for idx, college in enumerate(colleges, 1):
        leaderboard.append({
            "rank": idx,
            "college_name": college["name"],
            "college_code": college["code"],
            "total_points": college["total_points"]
        })
    return leaderboard

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    return await get_leaderboard_data()

# WebSocket
@app.websocket("/ws/leaderboard")
async def websocket_leaderboard(websocket: WebSocket):
    await manager.connect(websocket, "leaderboard")
    try:
        # Send initial data
        await websocket.send_json({
            "type": "leaderboard_update",
            "data": await get_leaderboard_data()
        })
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, "leaderboard")

# Admin - Get all users
@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [User(**u) for u in users]

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()