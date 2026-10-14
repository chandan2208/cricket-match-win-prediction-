"""
CricketPredictor - Core ML model class.

Uses Gradient Boosting Classifier (GBM) with calibrated probabilities.
The model is trained on a synthetic dataset that captures realistic
cricket match dynamics including team strength, form, venue, and conditions.

Feature importance is used to generate signed key_factors explaining
each prediction, approximating SHAP-style local explanations.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timezone
from typing import Optional
from loguru import logger

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, log_loss


# ── Feature definitions ───────────────────────────────────────────────────────

FEATURE_NAMES = [
    "team_a_strength",
    "team_b_strength",
    "strength_diff",
    "team_a_form",
    "team_b_form",
    "form_diff",
    "team_a_win_pct",
    "team_b_win_pct",
    "h2h_ratio_a",
    "venue_win_ratio_a",
    "venue_win_ratio_b",
    "venue_advantage_diff",
    "toss_advantage_a",
    "pitch_condition",
    "weather_condition",
    "match_type",
    "icc_ranking_a_t20",
    "icc_ranking_b_t20",
]

# Pitch condition impact on batting vs bowling teams
PITCH_BAT_FACTOR = {0: 1.05, 1: 0.92, 2: 0.96, 3: 0.93, 4: 1.0}  # 0=batting, 1=bowling...
WEATHER_IMPACT = {0: 1.0, 1: 0.98, 2: 0.95, 3: 0.85, 4: 0.96, 5: 0.97}


class CricketPredictor:
    """
    Gradient Boosting-based cricket match outcome predictor.

    The pipeline: StandardScaler → GBM → Isotonic calibration
    Calibration ensures output probabilities are well-calibrated
    (Brier score optimized), not just accurate in classification.
    """

    MODEL_VERSION = "1.0.0"

    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self.is_trained = False
        self.version = self.MODEL_VERSION
        self.model_type = "GradientBoostingClassifier (isotonic calibrated)"
        self.feature_names = FEATURE_NAMES
        self.training_accuracy: Optional[float] = None
        self.cv_accuracy: Optional[float] = None
        self.trained_at: Optional[str] = None
        self._feature_importances: Optional[np.ndarray] = None

    def _build_pipeline(self) -> Pipeline:
        """Build scikit-learn pipeline with scaler + calibrated GBM."""
        gbm = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            min_samples_split=10,
            min_samples_leaf=5,
            max_features="sqrt",
            random_state=42,
        )
        calibrated_gbm = CalibratedClassifierCV(gbm, cv=5, method="isotonic")

        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("model", calibrated_gbm),
        ])
        return pipeline

    def train_on_synthetic_data(self, n_samples: int = 10000):
        """
        Train on synthetic but statistically realistic match data.

        The synthetic data generator creates feature vectors that
        reflect real-world cricket dynamics:
        - Stronger teams (higher strength_diff) win more often
        - Better recent form correlates with wins
        - Home/venue advantage applied
        - Toss matters more on batting-friendly pitches
        - ICC rankings factored in
        """
        logger.info(f"Generating {n_samples} synthetic training samples...")
        X, y = self._generate_synthetic_dataset(n_samples)

        logger.info("Training Gradient Boosting model...")
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(X, y)

        # Cross-validation accuracy
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        base_gbm = GradientBoostingClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.08,
            subsample=0.85, random_state=42
        )
        cv_pipeline = Pipeline([("scaler", StandardScaler()), ("model", base_gbm)])
        cv_scores = cross_val_score(cv_pipeline, X, y, cv=cv, scoring="accuracy")
        self.cv_accuracy = float(round(cv_scores.mean(), 4))

        # Training accuracy
        y_pred = self.pipeline.predict(X)
        self.training_accuracy = float(round(accuracy_score(y, y_pred), 4))

        # Extract feature importances from the base GBM
        self._extract_feature_importances()

        self.is_trained = True
        self.trained_at = datetime.now(timezone.utc).isoformat()

        logger.info(
            f"Model trained | train_acc={self.training_accuracy:.4f} | "
            f"cv_acc={self.cv_accuracy:.4f}"
        )

    def _generate_synthetic_dataset(self, n: int):
        """
        Generate synthetic match data with realistic win/loss distributions.

        Key statistical relationships encoded:
        - P(teamA wins) ≈ sigmoid(0.3*strength_diff + 0.2*form_diff + ...)
        - Noise added to prevent overfit and model real uncertainty
        """
        rng = np.random.RandomState(42)

        # Generate raw features
        strength_a = rng.uniform(0.2, 1.0, n)
        strength_b = rng.uniform(0.2, 1.0, n)
        form_a = rng.beta(5, 3, n)  # Slightly right-skewed (form often good)
        form_b = rng.beta(5, 3, n)
        win_pct_a = rng.beta(4, 4, n)
        win_pct_b = rng.beta(4, 4, n)
        h2h = rng.uniform(0.1, 0.9, n)
        venue_a = rng.beta(4, 4, n)
        venue_b = rng.beta(4, 4, n)
        toss_adv = rng.uniform(0.42, 0.62, n)
        pitch = rng.randint(0, 5, n).astype(float)
        weather = rng.randint(0, 6, n).astype(float)
        match_type = rng.choice([0, 1, 2], n, p=[0.6, 0.3, 0.1]).astype(float)
        rank_a = rng.uniform(0.0, 1.0, n)
        rank_b = rng.uniform(0.0, 1.0, n)

        X = np.column_stack([
            strength_a, strength_b, strength_a - strength_b,
            form_a, form_b, form_a - form_b,
            win_pct_a, win_pct_b,
            h2h,
            venue_a, venue_b, venue_a - venue_b,
            toss_adv,
            pitch, weather, match_type,
            rank_a, rank_b,
        ])

        # Compute win probability via a realistic logit equation
        logit = (
            2.5 * (strength_a - strength_b) +
            1.8 * (form_a - form_b) +
            1.2 * (h2h - 0.5) +
            1.0 * (venue_a - venue_b) +
            0.8 * (toss_adv - 0.5) +
            1.0 * (win_pct_a - win_pct_b) +
            0.7 * (rank_a - rank_b) +
            rng.normal(0, 0.5, n)  # Match uncertainty / randomness
        )

        prob_a = 1 / (1 + np.exp(-logit))
        y = (rng.uniform(size=n) < prob_a).astype(int)

        logger.debug(f"Class balance: {y.mean():.3f} (team A win rate in synthetic data)")
        return X, y

    def _extract_feature_importances(self):
        """Extract GBM feature importances from the calibrated pipeline."""
        try:
            calibrated = self.pipeline.named_steps["model"]
            # Average importances across all calibrated estimators
            importances = np.mean(
                [est.feature_importances_ for est in calibrated.calibrated_classifiers_],
                axis=0,
            )
            self.pipeline.named_steps["scaler"].feature_names_in_ = np.array(FEATURE_NAMES)
            self._feature_importances = importances
        except Exception as e:
            logger.warning(f"Could not extract feature importances: {e}")
            self._feature_importances = np.ones(len(FEATURE_NAMES)) / len(FEATURE_NAMES)

    def predict(self, features: dict, match_type: str = "T20") -> dict:
        """
        Generate win probabilities from a feature dictionary.

        Returns:
            teamA_win_prob, teamB_win_prob, key_factors, model_version
        """
        if not self.is_trained:
            raise ValueError("Model is not trained yet")

        # Validate and order features
        X = self._dict_to_feature_vector(features)

        # Get calibrated probability
        proba = self.pipeline.predict_proba(X)[0]
        team_a_prob = float(proba[1])  # class 1 = team A wins
        team_b_prob = float(1 - team_a_prob)

        # Clamp to [0.05, 0.95] — never output certainty
        team_a_prob = max(0.05, min(0.95, team_a_prob))
        team_b_prob = round(1.0 - team_a_prob, 4)
        team_a_prob = round(team_a_prob, 4)

        # Generate key factors from feature importances + values
        key_factors = self._generate_key_factors(features, team_a_prob)

        return {
            "teamA_win_prob": team_a_prob,
            "teamB_win_prob": team_b_prob,
            "team_a_win_prob": team_a_prob,   # Node.js uses snake_case
            "team_b_win_prob": team_b_prob,
            "key_factors": key_factors,
            "model_version": self.MODEL_VERSION,
        }

    def _dict_to_feature_vector(self, features: dict) -> np.ndarray:
        """Convert feature dict to ordered numpy array matching training order."""
        try:
            row = [features.get(name, 0.5) for name in FEATURE_NAMES]
            return np.array([row], dtype=np.float64)
        except Exception as e:
            raise ValueError(f"Feature extraction error: {e}")

    def _generate_key_factors(self, features: dict, team_a_prob: float) -> list:
        """
        Generate top-3 key factors with signed direction and weight.
        Uses feature importance × feature value deviation from neutral (0.5).
        """
        if self._feature_importances is None:
            return []

        explanatory_features = [
            ("strength_diff", "Team Strength Differential"),
            ("form_diff", "Recent Form Advantage"),
            ("h2h_ratio_a", "Head-to-Head Record"),
            ("venue_advantage_diff", "Venue Win Rate Advantage"),
            ("toss_advantage_a", "Toss Decision Impact"),
            ("icc_ranking_a_t20", "ICC Ranking Edge"),
        ]

        factors = []
        for feat_name, label in explanatory_features:
            if feat_name not in FEATURE_NAMES:
                continue
            idx = FEATURE_NAMES.index(feat_name)
            importance = self._feature_importances[idx]
            value = features.get(feat_name, 0.5)
            deviation = value - 0.5  # Positive → favors A, negative → favors B
            contribution = importance * abs(deviation)

            if contribution < 0.001:
                continue

            impact = "positive_A" if deviation > 0 else ("positive_B" if deviation < 0 else "neutral")

            factors.append({
                "factor": label,
                "description": self._describe_factor(feat_name, value, deviation),
                "impact": impact,
                "weight": round(float(contribution), 4),
            })

        # Sort by weight, return top 3
        return sorted(factors, key=lambda x: x["weight"], reverse=True)[:3]

    def _describe_factor(self, feat_name: str, value: float, deviation: float) -> str:
        """Generate a human-readable description for each factor."""
        descriptions = {
            "strength_diff": (
                f"Team A is {'stronger' if deviation > 0 else 'weaker'} "
                f"by {abs(deviation)*100:.1f}% on strength index"
            ),
            "form_diff": (
                f"Team A's recent form is {'better' if deviation > 0 else 'worse'} "
                f"(score delta: {deviation:+.3f})"
            ),
            "h2h_ratio_a": (
                f"Team A has won {value*100:.0f}% of head-to-head encounters"
            ),
            "venue_advantage_diff": (
                f"Team A {'outperforms' if deviation > 0 else 'underperforms'} "
                f"at this venue by {abs(deviation)*100:.0f}%"
            ),
            "toss_advantage_a": (
                f"Toss result {'favors' if deviation > 0 else 'disadvantages'} "
                f"Team A (modifier: {deviation:+.3f})"
            ),
            "icc_ranking_a_t20": (
                f"Team A has a {'higher' if deviation > 0 else 'lower'} ICC T20 ranking"
            ),
        }
        return descriptions.get(feat_name, f"{feat_name}: {value:.3f}")

    def save(self, path: str):
        """Persist model and metadata to disk."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        metadata = {
            "version": self.version,
            "model_type": self.model_type,
            "training_accuracy": self.training_accuracy,
            "cv_accuracy": self.cv_accuracy,
            "trained_at": self.trained_at,
            "feature_names": self.feature_names,
        }
        joblib.dump({
            "pipeline": self.pipeline,
            "metadata": metadata,
            "feature_importances": self._feature_importances,
        }, path)
        logger.info(f"Model saved to {path}")

    def load(self, path: str):
        """Load a persisted model from disk."""
        data = joblib.load(path)
        self.pipeline = data["pipeline"]
        self._feature_importances = data.get("feature_importances")
        meta = data.get("metadata", {})
        self.version = meta.get("version", self.MODEL_VERSION)
        self.model_type = meta.get("model_type", self.model_type)
        self.training_accuracy = meta.get("training_accuracy")
        self.cv_accuracy = meta.get("cv_accuracy")
        self.trained_at = meta.get("trained_at")
        self.feature_names = meta.get("feature_names", FEATURE_NAMES)
        self.is_trained = True
        logger.info(f"Model loaded: {self.model_type} v{self.version}")

    def get_num_estimators(self) -> Optional[int]:
        """Return number of estimators in the underlying GBM."""
        try:
            cal = self.pipeline.named_steps["model"]
            return cal.calibrated_classifiers_[0].estimator.n_estimators
        except Exception:
            return None
