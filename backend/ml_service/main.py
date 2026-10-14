"""
Cricket Prediction ML Microservice
FastAPI-based prediction engine using Gradient Boosting (GBM).

The model is trained on synthetic but realistic cricket match data.
Features are engineered by the Node.js backend and passed here as a
normalized feature vector. The model returns win probabilities and
the signed SHAP-like feature importances used to generate key_factors.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from models.predictor import CricketPredictor
from utils.schemas import PredictRequest, PredictResponse, HealthResponse, ModelInfoResponse
from utils.logger_config import configure_logger

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
configure_logger()

# ── Global predictor instance ────────────────────────────────────────────────
predictor: CricketPredictor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, clean up on shutdown."""
    global predictor
    logger.info("🏏 Cricket ML Service starting...")
    predictor = CricketPredictor()

    model_path = os.getenv("MODEL_PATH", "models/trained/cricket_gbm.joblib")
    if os.path.exists(model_path):
        predictor.load(model_path)
        logger.info(f"✅ Model loaded from {model_path}")
    else:
        logger.warning("⚠️  No saved model found — training on synthetic data...")
        predictor.train_on_synthetic_data()
        predictor.save(model_path)
        logger.info(f"✅ Model trained and saved to {model_path}")

    # Warm up scikit-learn tree compilation logic to prevent latency on first real request
    try:
        dummy_vector = {
            "team_a_strength": 0.5, "team_b_strength": 0.5, "strength_diff": 0.0,
            "team_a_form": 0.5, "team_b_form": 0.5, "form_diff": 0.0,
            "team_a_win_pct": 0.5, "team_b_win_pct": 0.5,
            "h2h_ratio_a": 0.5, "venue_win_ratio_a": 0.5, "venue_win_ratio_b": 0.5,
            "venue_advantage_diff": 0.0, "toss_advantage_a": 0.5,
            "pitch_condition": 0.0, "weather_condition": 0.0,
            "match_type": 0.0, "icc_ranking_a_t20": 0.5, "icc_ranking_b_t20": 0.5
        }
        predictor.predict(dummy_vector, "T20")
        logger.info("⚡ ML Model pre-warmed successfully")
    except Exception as e:
        logger.warning(f"⚠️ Failed to pre-warm ML Model: {e}")

    yield  # Application runs

    logger.info("ML Service shutting down...")


app = FastAPI(
    title="Cricket Prediction ML Service",
    description="Gradient Boosting-powered cricket match win probability engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal ML service error", "type": type(exc).__name__},
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Service health check. Returns model readiness status."""
    return HealthResponse(
        status="healthy",
        model_loaded=predictor is not None and predictor.is_trained,
        model_version=predictor.version if predictor else None,
    )


@app.get("/model/info", response_model=ModelInfoResponse, tags=["System"])
async def model_info():
    """Return metadata about the loaded model."""
    if not predictor or not predictor.is_trained:
        raise HTTPException(status_code=503, detail="Model not loaded")

    return ModelInfoResponse(
        model_type=predictor.model_type,
        version=predictor.version,
        feature_names=predictor.feature_names,
        training_accuracy=predictor.training_accuracy,
        cv_accuracy=predictor.cv_accuracy,
        trained_at=predictor.trained_at,
        num_estimators=predictor.get_num_estimators(),
    )


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict(payload: PredictRequest):
    """
    Generate win probabilities for a cricket match.

    Accepts a normalized feature vector from the Node.js service.
    Returns probabilities for both teams plus top contributing factors.
    """
    if not predictor or not predictor.is_trained:
        raise HTTPException(status_code=503, detail="ML model not ready")

    logger.info(f"Prediction request received | match_type={payload.match_type}")
    logger.debug(f"Features: {payload.features}")

    try:
        result = predictor.predict(payload.features.model_dump(), payload.match_type)
        logger.info(
            f"Prediction complete | teamA={result['teamA_win_prob']:.3f} | "
            f"teamB={result['teamB_win_prob']:.3f}"
        )
        return PredictResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/model/retrain", tags=["System"])
async def retrain():
    """Retrain the model on synthetic data (dev/testing endpoint)."""
    global predictor
    logger.warning("Manual retrain triggered")
    predictor.train_on_synthetic_data()
    model_path = os.getenv("MODEL_PATH", "models/trained/cricket_gbm.joblib")
    predictor.save(model_path)
    return {"message": "Model retrained successfully", "accuracy": predictor.training_accuracy}
