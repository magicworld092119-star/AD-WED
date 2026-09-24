from fastapi import APIRouter, Query, Header
from pydantic import BaseModel
from typing import List, Optional
from backend.app.db.database import db

router = APIRouter()

async def save_history_record(record: dict):
    await db.save_history_record(record)

class HistoryItem(BaseModel):
    id: str
    prediction_id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    patient_id: Optional[str] = "Unknown"
    patient_age: Optional[str] = "70"
    gender: Optional[str] = "Unspecified"
    scan_date: Optional[str] = ""
    filename: Optional[str] = ""
    predicted_stage: Optional[str] = "Unknown"
    confidence_score: Optional[float] = 0.0
    status: Optional[str] = "Inference Completed"
    hippocampus_volume_mm3: Optional[float] = 0.0
    probabilities: Optional[dict] = {}
    peak_slices: Optional[dict] = None
    num_slices: Optional[int] = 96
    gradcam_heatmap_url: Optional[str] = None
    processed_mri_url: Optional[str] = None

@router.get("/history", response_model=List[HistoryItem], tags=["Patient History"])
async def get_scan_history(
    user_id: Optional[str] = Query(None, description="User ID for isolating patient records"),
    user_email: Optional[str] = Query(None, description="User Email for isolating patient records"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    """
    Retrieve historical sMRI scan diagnostic records stored in system storage.
    If user_id or user_email is provided, records are filtered for that user.
    If unauthenticated, returns guest/unassigned session records.
    """
    uid = user_id or x_user_id
    email = user_email or x_user_email
    if uid in ("null", "undefined", "none", ""):
        uid = None
    if email in ("null", "undefined", "none", ""):
        email = None
    records = await db.get_history_records(user_id=uid, user_email=email)
    
    # Ensure backfilled IDs and URLs are populated for frontend compatibility
    for r in records:
        rec_id = r.get("id") or r.get("prediction_id") or "scan_unknown"
        if not r.get("id"):
            r["id"] = rec_id
        if not r.get("prediction_id"):
            r["prediction_id"] = rec_id
        if not r.get("gradcam_heatmap_url"):
            r["gradcam_heatmap_url"] = f"/storage/heatmaps/{rec_id}_heatmap.nii.gz"
        if not r.get("processed_mri_url") and r.get("filename"):
            r["processed_mri_url"] = f"/storage/uploads/{rec_id}_{r['filename']}"

    return records

