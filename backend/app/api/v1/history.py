from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from backend.app.db.database import db

router = APIRouter()

async def save_history_record(record: dict):
    await db.save_history_record(record)

class HistoryItem(BaseModel):
    id: str
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
async def get_scan_history():
    """
    Retrieve real historical sMRI scan diagnostic records stored in system storage.
    """
    records = await db.get_history_records()
    return records
