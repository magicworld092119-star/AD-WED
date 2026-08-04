from pydantic import BaseModel, Field

class StageProbability(BaseModel):
    cn: float = Field(..., description="Cognitively Normal probability")
    mci: float = Field(..., description="Mild Cognitive Impairment probability")
    ad: float = Field(..., description="Alzheimer's Disease probability")

class PredictionResponse(BaseModel):
    prediction_id: str
    filename: str
    predicted_stage: str
    confidence_score: float
    probabilities: StageProbability
    gradcam_heatmap_url: str
    processed_mri_url: str
    message: str = "Inference completed successfully"
