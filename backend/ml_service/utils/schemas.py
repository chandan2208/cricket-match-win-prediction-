"""Pydantic v2 request/response schemas for the ML service."""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class FeatureVector(BaseModel):
    """Normalized feature vector produced by Node.js feature engineering."""

    team_a_strength: float = Field(..., ge=0.0, le=1.0)
    team_b_strength: float = Field(..., ge=0.0, le=1.0)
    strength_diff: float = Field(..., ge=-1.0, le=1.0)
    team_a_form: float = Field(..., ge=0.0, le=1.0)
    team_b_form: float = Field(..., ge=0.0, le=1.0)
    form_diff: float = Field(..., ge=-1.0, le=1.0)
    team_a_win_pct: float = Field(..., ge=0.0, le=1.0)
    team_b_win_pct: float = Field(..., ge=0.0, le=1.0)
    h2h_ratio_a: float = Field(..., ge=0.0, le=1.0)
    venue_win_ratio_a: float = Field(..., ge=0.0, le=1.0)
    venue_win_ratio_b: float = Field(..., ge=0.0, le=1.0)
    venue_advantage_diff: float = Field(..., ge=-1.0, le=1.0)
    toss_advantage_a: float = Field(..., ge=0.0, le=1.0)
    pitch_condition: float = Field(..., ge=0.0, le=4.0)
    weather_condition: float = Field(..., ge=0.0, le=5.0)
    match_type: float = Field(..., ge=0.0, le=2.0)
    icc_ranking_a_t20: float = Field(..., ge=0.0, le=1.0)
    icc_ranking_b_t20: float = Field(..., ge=0.0, le=1.0)

    model_config = {"extra": "ignore"}


class PredictRequest(BaseModel):
    features: FeatureVector
    match_type: str = Field(default="T20", pattern="^(T20|T20I|IPL|ODI|Test|Other)$")


class KeyFactor(BaseModel):
    factor: str
    description: str
    impact: str  # positive_A | positive_B | neutral
    weight: float


class PredictResponse(BaseModel):
    team_a_win_prob: float = Field(..., ge=0.0, le=1.0)
    team_b_win_prob: float = Field(..., ge=0.0, le=1.0)
    key_factors: List[KeyFactor]
    model_version: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str] = None


class ModelInfoResponse(BaseModel):
    model_type: str
    version: str
    feature_names: List[str]
    training_accuracy: Optional[float] = None
    cv_accuracy: Optional[float] = None
    trained_at: Optional[str] = None
    num_estimators: Optional[int] = None
