# CricPredic — AI-Powered Cricket Match Prediction System

> A full-stack, microservices-based web application that uses **Gradient Boosting Machine Learning** to predict cricket match outcomes with calibrated win probabilities and explainable key factors.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Node](https://img.shields.io/badge/Node.js-18+-green) ![Python](https://img.shields.io/badge/Python-3.10+-yellow) ![License](https://img.shields.io/badge/license-MIT-brightgreen)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [ML Model Details](#ml-model-details)
- [Feature Engineering Pipeline](#feature-engineering-pipeline)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Frontend Pages](#frontend-pages)
- [Installation & Setup](#installation--setup)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Design Decisions](#design-decisions)
- [Future Scope](#future-scope)

---

## Overview

CricPredic is an end-to-end cricket match prediction system that accepts user-defined match conditions (teams, pitch, weather, toss) and returns AI-generated win probabilities with explainable reasoning. The system follows a **three-tier microservices architecture**:

1. **Frontend** — Static HTML/CSS/JS dashboard with Tailwind CSS
2. **Node.js API** — Express.js REST API handling business logic, feature engineering, and data persistence
3. **Python ML Service** — FastAPI microservice running a trained Gradient Boosting model

The prediction pipeline works as follows:
```
User Input → Node.js API → Feature Engineering → ML Service → Calibrated Probabilities → Response
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Port 3000)                        │
│  HTML5 + TailwindCSS + Vanilla JS                                  │
│  Pages: Dashboard | Predict | Analytics | History                  │
│  JS: api.js → ui-integration.js → analytics-charts.js             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP (fetch)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NODE.JS API (Port 5000)                          │
│  Express.js + Mongoose + Swagger                                   │
│  ┌──────────────┐ ┌───────────────────┐ ┌────────────────────┐     │
│  │ Controllers  │ │ Services          │ │ Models (Mongoose)  │     │
│  │ prediction   │ │ predictionService │ │ Team               │     │
│  │ match        │ │ featureEngService │ │ Player             │     │
│  │ analytics    │ │ mlService         │ │ Match              │     │
│  │ team/player  │ │ analyticsService  │ │ Prediction         │     │
│  └──────────────┘ └─────────┬─────────┘ └────────────────────┘     │
│                             │ HTTP (axios)                          │
│  Middleware: Helmet, CORS, Rate Limit, Morgan, Error Handler       │
└─────────────────────────────┼──────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PYTHON ML SERVICE (Port 8000)                     │
│  FastAPI + scikit-learn + Pydantic v2                               │
│  ┌─────────────────────────────────────────────────┐                │
│  │ CricketPredictor                                │                │
│  │ Pipeline: StandardScaler → CalibratedGBM        │                │
│  │ 200 estimators, max_depth=4, lr=0.08            │                │
│  │ Isotonic calibration (5-fold CV)                │                │
│  │ 18-feature input vector                         │                │
│  │ Output: P(TeamA), P(TeamB), key_factors         │                │
│  └─────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     MONGODB (Atlas / Local)                         │
│  Database: cricketDB                                                │
│  Collections: teams, players, matches, predictions                  │
│  Connection pooling: maxPoolSize=10                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend — Node.js API Service
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express.js | 4.18 | HTTP framework |
| Mongoose | 8.0 | MongoDB ODM |
| Axios | 1.6 | HTTP client (ML service calls) |
| Helmet | 7.1 | Security headers |
| express-rate-limit | 7.1 | API rate limiting |
| Swagger UI Express | 5.0 | API documentation |
| Winston | 3.11 | Structured logging |
| Morgan | 1.10 | HTTP request logging |
| bcryptjs | 2.4 | Password hashing (future auth) |
| jsonwebtoken | 9.0 | JWT tokens (future auth) |

### Backend — Python ML Service
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Runtime |
| FastAPI | 0.109 | Async web framework |
| Uvicorn | 0.27 | ASGI server |
| scikit-learn | 1.4 | ML model (GBM + calibration) |
| NumPy | 1.26 | Numerical computation |
| Pandas | 2.1 | Data manipulation |
| Pydantic | 2.5 | Request/response validation |
| Joblib | 1.3 | Model serialization |
| Loguru | 0.7 | Structured logging |

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 | Semantic structure |
| TailwindCSS (CDN) | Utility-first styling |
| Vanilla JavaScript (ES Modules) | Application logic |
| Chart.js | Analytics visualizations |
| Google Fonts (Lexend, Space Grotesk) | Typography |
| Material Symbols | Icons |

### Infrastructure
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Docker Compose | Container orchestration |
| npx serve | Static frontend server |

---

## Features

### Core Prediction Engine
- **18-feature ML model** using Gradient Boosting with isotonic calibration
- **Feature engineering pipeline** that computes team strength differentials, form scores, H2H ratios, venue advantages, toss impact, and environmental biases
- **Explainable predictions** with top-3 key factors and signed directional impact
- **Probability clamping** to [5%, 95%] — model never claims certainty
- **Fallback prediction** via sigmoid approximation when ML service is unavailable

### Team & Match Management
- 6 international cricket teams with full statistics (India, Australia, England, South Africa, Pakistan, New Zealand)
- Player roster management with batting/bowling stats
- Match tracking with scorecards, venues, umpires, and series data
- ICC ranking integration for T20, ODI, and Test formats

### Analytics & History
- System-wide analytics dashboard (total predictions, accuracy, resolved count)
- Per-team analytics with match breakdowns by format
- Per-player analytics with performance ratings
- Full prediction history with confidence bars and resolution tracking
- Brier score calibration measurement

### Frontend Dashboard
- **Dashboard** — Latest prediction hero, system stats row
- **Predict** — Interactive match configuration with pitch/weather/toss selectors, real-time form validation
- **Analytics** — Three Chart.js visualizations (line, bar, radar) populated from API
- **History** — Paginated prediction log with confidence meters

### Security & Performance
- Helmet.js security headers with CSP
- Rate limiting: 100 req/15min global, 20 req/min for predictions
- Request body size limit: 10KB
- MongoDB connection pooling (maxPoolSize=10)
- ML model pre-warming on startup

---

## Project Structure

```
CricPredic/
├── run.js                          # One-command system orchestrator
├── run.bat                         # Windows shortcut
├── package.json                    # Root: concurrently for parallel start
├── requirements.txt                # Python dependencies
│
├── backend/
│   ├── docker-compose.yml          # Full Docker orchestration
│   │
│   ├── ml_service/                 # Python ML Microservice
│   │   ├── main.py                 # FastAPI app, lifespan, routes
│   │   ├── Dockerfile              # Python container
│   │   ├── requirements.txt        # Python deps
│   │   ├── models/
│   │   │   ├── predictor.py        # CricketPredictor class (367 lines)
│   │   │   └── trained/
│   │   │       └── cricket_gbm.joblib  # Serialized model
│   │   └── utils/
│   │       ├── schemas.py          # Pydantic v2 request/response models
│   │       └── logger_config.py    # Loguru configuration
│   │
│   └── node_service/               # Node.js API Service
│       ├── server.js               # Entry point, DB connect, graceful shutdown
│       ├── app.js                  # Express app, middleware, routes
│       ├── Dockerfile              # Node container
│       ├── package.json            # Node deps (17 packages)
│       ├── .env / .env.example     # Environment configuration
│       │
│       ├── config/
│       │   └── database.js         # Mongoose connection with pooling
│       │
│       ├── models/                 # Mongoose schemas
│       │   ├── Team.js             # Team: strength, ICC ranking, form, stats
│       │   ├── Player.js           # Player: batting/bowling stats, ratings
│       │   ├── Match.js            # Match: venue, scorecard, live data
│       │   └── Prediction.js       # Prediction: input snapshot, result, accuracy
│       │
│       ├── controllers/            # Route handlers
│       │   ├── prediction.controller.js
│       │   ├── match.controller.js
│       │   ├── analytics.controller.js
│       │   ├── team.controller.js
│       │   └── player.controller.js
│       │
│       ├── services/               # Business logic
│       │   ├── predictionService.js        # Core prediction pipeline
│       │   ├── featureEngineeringService.js # 18-feature vector builder
│       │   ├── mlService.js                # ML microservice client + fallback
│       │   └── analyticsService.js         # System/team/player analytics
│       │
│       ├── middleware/
│       │   ├── errorHandler.js     # Global error handler with AppError
│       │   ├── notFoundHandler.js  # 404 handler
│       │   └── requestLogger.js    # Request ID + timing
│       │
│       ├── routes/                 # Express route definitions
│       │   ├── prediction.routes.js
│       │   ├── match.routes.js
│       │   ├── analytics.routes.js
│       │   ├── team.routes.js
│       │   └── player.routes.js
│       │
│       ├── utils/
│       │   ├── AppError.js         # Custom error class
│       │   ├── responseHelper.js   # Standardized JSON responses
│       │   └── logger.js           # Winston logger
│       │
│       ├── scripts/
│       │   └── seed.js             # Database seeder (6 teams + players)
│       │
│       └── docs/
│           └── swagger.js          # OpenAPI 3.0 spec
│
└── frontend/                       # Static Frontend
    ├── index.html                  # Dashboard page
    ├── predictions.html            # Prediction engine page
    ├── analytics.html              # Analytics & charts page
    ├── history.html                # Prediction history page
    ├── legal.html                  # Legal/methodology page
    │
    ├── js/
    │   ├── api.js                  # API client (fetch wrapper)
    │   ├── ui-integration.js       # Page initialization & data binding
    │   ├── analytics-charts.js     # Chart.js chart management
    │   ├── responsive-nav.js       # Mobile navigation toggle
    │   └── theme-system.js         # Dark theme stub
    │
    └── css/
        ├── theme-system.css        # Option buttons, form styles
        └── responsive-system.css   # Sidebar, responsive overrides
```

---

## ML Model Details

### Algorithm: Gradient Boosting Classifier (GBM)

| Parameter | Value | Rationale |
|---|---|---|
| n_estimators | 200 | Balance of accuracy vs inference time |
| max_depth | 4 | Prevent overfitting on 18 features |
| learning_rate | 0.08 | Slow learning for better generalization |
| subsample | 0.85 | Stochastic gradient boosting (reduces variance) |
| min_samples_split | 10 | Regularization |
| min_samples_leaf | 5 | Prevents small leaf nodes |
| max_features | sqrt | Feature subsampling per split |
| random_state | 42 | Reproducibility |

### Calibration
- **Method**: Isotonic regression via `CalibratedClassifierCV(cv=5)`
- **Why**: Raw GBM probabilities are often overconfident. Isotonic calibration maps predicted probabilities to observed frequencies, optimizing Brier score
- **Pipeline**: `StandardScaler → GradientBoostingClassifier → IsotonicCalibration`

### Training Data
- **10,000 synthetic samples** generated with realistic statistical distributions
- Win probability follows a logistic model: `P(A wins) = σ(2.5·strength_diff + 1.8·form_diff + 1.2·h2h + 1.0·venue + 0.8·toss + 1.0·win_pct + 0.7·ranking + noise)`
- Gaussian noise (σ=0.5) models match uncertainty
- Form scores use Beta(5,3) distribution (right-skewed, reflecting real cricket form)

### Output
- **Clamped probabilities**: [0.05, 0.95] — never predicts certainty
- **Top-3 key factors** with signed direction (positive_A / positive_B / neutral) and weight
- **Model version tracking** for audit trail

---

## Feature Engineering Pipeline

The Node.js `featureEngineeringService.js` constructs an **18-dimensional feature vector** from raw match inputs:

| # | Feature | Type | Range | Source |
|---|---|---|---|---|
| 1 | `team_a_strength` | Float | [0,1] | Team.strengthScore/100 + environmental bias |
| 2 | `team_b_strength` | Float | [0,1] | Team.strengthScore/100 + environmental bias |
| 3 | `strength_diff` | Float | [-1,1] | strength_a - strength_b |
| 4 | `team_a_form` | Float | [0,1] | Exponentially-weighted recent results |
| 5 | `team_b_form` | Float | [0,1] | Exponentially-weighted recent results |
| 6 | `form_diff` | Float | [-1,1] | form_a - form_b |
| 7 | `team_a_win_pct` | Float | [0,1] | Historical win percentage |
| 8 | `team_b_win_pct` | Float | [0,1] | Historical win percentage |
| 9 | `h2h_ratio_a` | Float | [0,1] | Head-to-head win ratio from Match history |
| 10 | `venue_win_ratio_a` | Float | [0,1] | Venue-specific win rate for team A |
| 11 | `venue_win_ratio_b` | Float | [0,1] | Venue-specific win rate for team B |
| 12 | `venue_advantage_diff` | Float | [-1,1] | venue_a - venue_b |
| 13 | `toss_advantage_a` | Float | [0,1] | Computed from toss winner, decision, pitch type |
| 14 | `pitch_condition` | Categorical | [0,4] | Encoded: batting=0, bowling=1, spin=2, pace=3, neutral=4 |
| 15 | `weather_condition` | Categorical | [0,5] | Encoded: sunny=0, cloudy=1, overcast=2, rainy=3, windy=4, humid=5 |
| 16 | `match_type` | Categorical | [0,2] | T20/T20I/IPL=0, ODI=1, Test=2 |
| 17 | `icc_ranking_a_t20` | Float | [0,1] | Normalized ICC T20 ranking |
| 18 | `icc_ranking_b_t20` | Float | [0,1] | Normalized ICC T20 ranking |

### Environmental Bias System
Teams are classified by bowling archetype:
- **Spin**: India, Sri Lanka, Afghanistan, Pakistan, Bangladesh (+0.08 on spin-friendly pitches)
- **Pace**: Australia, South Africa, West Indies (+0.08 on pace-friendly pitches)
- **Swing**: England, New Zealand (+0.10 in overcast conditions)

---

## API Reference

Base URL: `http://localhost:5000/api`

### Predictions
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predictions` | Generate a new prediction |
| `GET` | `/predictions/history` | Get paginated prediction history |
| `GET` | `/predictions/accuracy` | Get overall accuracy statistics |
| `GET` | `/predictions/:id` | Get a specific prediction |
| `PUT` | `/predictions/:id/resolve` | Resolve prediction after match completion |

### Teams
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/teams` | List all teams |
| `GET` | `/teams/:id` | Get team details |
| `POST` | `/teams` | Create a new team |
| `PUT` | `/teams/:id` | Update team |

### Matches
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/matches/live` | Get live matches |
| `GET` | `/matches/upcoming` | Get upcoming matches |
| `GET` | `/matches/:id` | Get match details |
| `POST` | `/matches` | Create a match |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/system` | System-wide statistics |
| `GET` | `/analytics/team/:id` | Team-specific analytics |
| `GET` | `/analytics/player/:id` | Player-specific analytics |

### ML Service (Port 8000)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/model/info` | Model metadata |
| `POST` | `/predict` | Raw prediction endpoint |
| `POST` | `/model/retrain` | Retrain on synthetic data |

Swagger docs: `http://localhost:5000/api/docs`

---

## Database Schema

### Teams Collection
```javascript
{
  name: String,           // "India"
  shortName: String,      // "IND"
  country: String,        // "India"
  teamType: enum,         // international | ipl | domestic
  strengthScore: Number,  // 0-100
  iccRanking: { test, odi, t20 },
  stats: { totalMatches, wins, losses, draws, winPercentage },
  recentForm: ["W","W","L","W","W"],
  homeRecord: { matches, wins },
  awayRecord: { matches, wins },
  players: [ObjectId → Player]
}
```

### Predictions Collection
```javascript
{
  input: {
    teamA: { id, name, strengthScore, formScore, recentForm },
    teamB: { id, name, strengthScore, formScore, recentForm },
    pitchCondition, weather, tossWinner, tossDecision, venue, matchType
  },
  result: {
    teamAWinProbability: Number,  // 0.0-1.0
    teamBWinProbability: Number,
    predictedWinner: { id, name },
    confidence: enum,             // low | medium | high
    keyFactors: [{ factor, description, impact, weight }],
    modelVersion: String,
    featureVector: Mixed
  },
  accuracy: {
    actualWinner: { id, name },
    wasCorrect: Boolean,
    probabilityScore: Number,     // Brier score
    resolvedAt: Date
  }
}
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (Atlas or local)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/your-username/CricPredic.git
cd CricPredic

# 2. Install Node dependencies
npm install
cd backend/node_service && npm install && cd ../..

# 3. Set up Python virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# 4. Configure environment
cp backend/node_service/.env.example backend/node_service/.env
# Edit .env with your MongoDB URI

# 5. Seed the database
cd backend/node_service && node scripts/seed.js && cd ../..

# 6. Start everything
node run.js
```

The orchestrator starts all 3 services, runs health checks, and opens the browser.

### Ports
| Service | Port |
|---|---|
| Frontend | 3000 |
| Node.js API | 5000 |
| ML Service | 8000 |

---

## Docker Deployment

```bash
cd backend
docker-compose up --build -d
```

This starts MongoDB, ML Service, and Node API with health checks and auto-restart.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 5000 | Node API port |
| `MONGODB_URI` | — | MongoDB connection string |
| `ML_SERVICE_URL` | http://localhost:8000 | ML service URL |
| `ML_SERVICE_TIMEOUT` | 30000 | ML request timeout (ms) |
| `JWT_SECRET` | — | JWT signing key |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `LOG_LEVEL` | info | Logging level |

---

## Design Decisions

1. **Microservices over monolith**: Python ML and Node.js API are separate for independent scaling and technology-appropriate tooling
2. **Calibrated probabilities**: Isotonic calibration ensures output probabilities match observed frequencies — critical for trustworthy predictions
3. **Feature engineering in Node.js**: Business logic (H2H queries, form computation) stays near the database; only normalized vectors go to Python
4. **Fallback prediction**: If ML service is down, a sigmoid approximation ensures the system remains functional
5. **Truthful UI**: No fake data or loading illusions — empty states shown when no real data exists
6. **Dark-only theme**: Single theme eliminates CSS conflicts and improves performance

---

## Future Scope

- Real-time live match data integration via CricAPI
- User authentication and personalized prediction history
- Model retraining pipeline with real match outcome data
- WebSocket support for live prediction updates
- Mobile responsive PWA
- A/B testing framework for model versions
- Advanced analytics: momentum graphs, player impact scoring

---

## License

MIT License — © 2026 CricPredic

---

*Built with ❤️ for cricket and machine learning*
