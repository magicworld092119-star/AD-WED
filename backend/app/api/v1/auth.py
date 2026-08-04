import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from config.settings import settings
from backend.app.db.database import db, verify_password

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    hospital_affiliation: Optional[str] = ""
    role: Optional[str] = "Neuro-Radiologist"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    hospital_affiliation: str
    token: str

@router.post("/login", response_model=UserResponse, tags=["Authentication"])
async def login(credentials: LoginRequest):
    email_clean = credentials.email.strip().lower()
    if not email_clean or not credentials.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide both email address and password."
        )
    
    user = await db.get_user_by_email(email_clean)
    
    # Real user lookup check
    if not user or not verify_password(credentials.password, user.get("password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password. Please check your credentials."
        )
    
    token = f"adweb_jwt_{uuid.uuid4().hex}"
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        hospital_affiliation=user["hospital_affiliation"],
        token=token
    )

@router.post("/register", response_model=UserResponse, tags=["Authentication"])
async def register(user_data: RegisterRequest):
    email_clean = user_data.email.strip().lower()
    if not email_clean or not user_data.password or not user_data.full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name, email address, and password are required."
        )
    
    user_exists = await db.get_user_by_email(email_clean)
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in instead."
        )
    
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    token = f"adweb_jwt_{uuid.uuid4().hex}"
    
    new_user = {
        "id": user_id,
        "email": email_clean,
        "full_name": user_data.full_name.strip(),
        "password": user_data.password,
        "role": user_data.role or "Radiologist",
        "hospital_affiliation": user_data.hospital_affiliation or "Medical Center",
        "created_at": str(Path(__file__).stat().st_mtime)
    }
    
    await db.save_user(new_user)
    
    return UserResponse(
        id=user_id,
        email=email_clean,
        full_name=new_user["full_name"],
        role=new_user["role"],
        hospital_affiliation=new_user["hospital_affiliation"],
        token=token
    )
