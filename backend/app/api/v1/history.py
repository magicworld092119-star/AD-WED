from fastapi import APIRouter, Query, Header
from pydantic import BaseModel
from typing import List, Optional
from backend.app.db.database import db

router = APIRouter()

async def save_history_record(record: dict):
    await db.save_history_record(record)

class HistoryItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    patient_id: str
    patient_age: str
    gender: str
    scan_date: str
    filename: str
    predicted_stage: str
    confidence_score: float
    status: str
    hippocampus_volume_mm3: float
    probabilities: dict

@router.get("/history", response_model=List[HistoryItem], tags=["Patient History"])
async def get_scan_history(
    user_id: Optional[str] = Query(None, description="User ID for isolating patient records"),
    user_email: Optional[str] = Query(None, description="User Email for isolating patient records"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Retrieve user-isolated historical sMRI scan diagnostic records stored in system storage.
    """
    uid = user_id or x_user_id
    email = user_email or x_user_email
    if uid in ("null", "undefined", "none", ""):
        uid = None
    if email in ("null", "undefined", "none", ""):
        email = None
    if not uid and not email:
        return []
    records = await db.get_history_records(user_id=uid, user_email=email)
    return records

