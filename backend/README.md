# 🏏 Cricket Match Prediction System

A production-level backend for predicting cricket match outcomes using Machine Learning.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT / FRONTEND                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP REST
┌────────────────────────────▼────────────────────────────────────┐
│               Node.js + Express API  (Port 5000)                │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Prediction │  │ Match Data   │  │  Analytics Service    │  │
│  │  Service    │  │ Service      │  │  (Team & Player)      │  │
│  └──────┬──────┘  └──────────────┘  └───────────────────────┘  │
│         │                                                        │
│  ┌──────▼──────────────────────────────────────────────────┐   │
│  │          Feature Engineering Service                     │   │
│  │  (Strength • Form • H2H • Venue • Toss • Conditions)    │   │
│  └──────┬──────────────────────────────────────────────────┘   │
└─────────┼───────────────────────────────────────────────────────┘
          │ HTTP (internal)
┌─────────▼───────────────────────────────────────────────────────┐
│            Python FastAPI ML Service  (Port 8000)               │
│                                                                  │
│  Gradient Boosting Classifier (scikit-learn)                    │
│  + Isotonic Probability Calibration                             │
│  + Feature Importance → Key Factors explanation                 │
└─────────────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                    MongoDB  (Port 27017)                         │
│    Teams • Players • Matches • Predictions                      │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
cricket-prediction-system/
├── node_service/               # Node.js + Express backend
│   ├── controllers/            # Route handler logic
│   │   ├── prediction.controller.js
│   │   ├── match.controller.js
│   │   ├── analytics.controller.js
│   │   ├── team.controller.js
│   │   └── player.controller.js
│   ├── routes/                 # Express routers + validation
│   │   ├── prediction.routes.js
│   │   ├── match.routes.js
│   │   ├── analytics.routes.js
│   │   ├── team.routes.js
│   │   └── player.routes.js
│   ├── services/               # Business logic layer
│   │   ├── predictionService.js       # Orchestrates prediction pipeline
│   │   ├── featureEngineeringService.js  # ML feature computation
│   │   ├── mlService.js               # Python microservice client
│   │   └── analyticsService.js        # Analytics aggregations
│   ├── models/                 # Mongoose schemas
│   │   ├── Team.js
│   │   ├── Player.js
│   │   ├── Match.js
│   │   └── Prediction.js
│   ├── middleware/             # Express middleware
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── notFoundHandler.js
│   │   └── requestLogger.js
│   ├── utils/                  # Shared utilities
│   │   ├── logger.js           # Winston rotating logger
│   │   ├── responseHelper.js   # Standardized API responses
│   │   └── AppError.js         # Custom error class
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── docs/
│   │   └── swagger.js          # Swagger/OpenAPI spec
│   ├── scripts/
│   │   └── seed.js             # Database seeder
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── ml_service/                 # Python FastAPI ML service
│   ├── models/
│   │   ├── predictor.py        # GBM model class
│   │   └── trained/            # Persisted model artifacts
│   ├── utils/
│   │   ├── schemas.py          # Pydantic schemas
│   │   └── logger_config.py
│   ├── main.py                 # FastAPI app
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Option A: Docker Compose (Recommended)

```bash
# Clone and enter the project
cd cricket-prediction-system

# Configure environment
cp node_service/.env.example node_service/.env
# Edit .env if needed

# Start all services
docker-compose up --build

# Seed the database (in a new terminal)
docker exec cricket_node_api node scripts/seed.js
```

Services available at:
- **Node.js API**: http://localhost:5000
- **ML Service**: http://localhost:8000
- **Swagger Docs**: http://localhost:5000/api/v1/docs
- **ML Docs**: http://localhost:8000/docs

---

### Option B: Manual Setup

#### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB 7.0+

#### 1. MongoDB
```bash
# macOS
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod
```

#### 2. Python ML Service
```bash
cd ml_service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the service (auto-trains model on first run)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Node.js API Service
```bash
cd node_service
npm install

# Configure environment
cp .env.example .env
# Edit .env: set MONGODB_URI and ML_SERVICE_URL

# Seed database with sample teams, players, matches
node scripts/seed.js

# Start the API
npm run dev        # Development (nodemon)
npm start          # Production
```

---

## API Reference

### Base URL
```
http://localhost:5000/api/v1
```

All responses follow the envelope format:
```json
{
  "success": true,
  "message": "Description",
  "data": { ... },
  "meta": { "pagination": { ... } }
}
```

---

### 1. Prediction API

#### `POST /api/v1/predict`
Generate a win probability prediction for a match.

**Request Body:**
```json
{
  "teamA": "64f1a2b3c4d5e6f7a8b9c001",
  "teamB": "64f1a2b3c4d5e6f7a8b9c002",
  "pitch_condition": "batting-friendly",
  "weather": "sunny",
  "toss_winner": "64f1a2b3c4d5e6f7a8b9c001",
  "toss_decision": "bat",
  "match_type": "T20",
  "venue": "Wankhede Stadium"
}
```

**Sample Response (201):**
```json
{
  "success": true,
  "message": "Prediction generated successfully",
  "data": {
    "predictionId": "65a2f1b3c4d5e6f7a8b9d001",
    "teamA": {
      "name": "India",
      "winProbability": 67.3
    },
    "teamB": {
      "name": "Australia",
      "winProbability": 32.7
    },
    "predictedWinner": "India",
    "confidence": "high",
    "keyFactors": [
      {
        "factor": "Team Strength Differential",
        "description": "India is stronger by 3.0% on strength index",
        "impact": "positive_A",
        "weight": 0.3124
      },
      {
        "factor": "Recent Form Advantage",
        "description": "India's recent form is better (score delta: +0.214)",
        "impact": "positive_A",
        "weight": 0.2180
      },
      {
        "factor": "Venue Win Rate Advantage",
        "description": "India outperforms at this venue by 22%",
        "impact": "positive_A",
        "weight": 0.1450
      }
    ],
    "modelVersion": "1.0.0",
    "generatedAt": "2025-04-25T14:30:00.000Z"
  }
}
```

#### `GET /api/v1/predict/history`
```
GET /api/v1/predict/history?page=1&limit=10&resolved=true
```

#### `GET /api/v1/predict/accuracy`
```json
{
  "success": true,
  "data": {
    "total": 142,
    "correct": 101,
    "accuracy": 71.13,
    "avgBrierScore": 0.1842
  }
}
```

#### `PATCH /api/v1/predict/:id/resolve`
After a match completes, resolve the prediction accuracy.

```json
{
  "actual_winner_id": "64f1a2b3c4d5e6f7a8b9c001",
  "actual_winner_name": "India"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictionId": "65a2f1b3c4d5e6f7a8b9d001",
    "wasCorrect": true,
    "brierScore": 0.1089,
    "actualWinner": "India",
    "predictedWinner": "India"
  }
}
```

---

### 2. Match Data API

#### `GET /api/v1/matches/live`
```json
{
  "success": true,
  "message": "2 live match(es) found",
  "data": [
    {
      "_id": "65a2f1b3c4d5e6f7a8b9c099",
      "title": "India vs Australia - 1st T20I",
      "matchType": "T20I",
      "status": "live",
      "teamA": { "name": "India", "shortName": "IND" },
      "teamB": { "name": "Australia", "shortName": "AUS" },
      "venue": {
        "name": "Wankhede Stadium",
        "city": "Mumbai",
        "pitchType": "batting-friendly"
      },
      "liveData": {
        "currentInnings": 2,
        "currentScore": { "runs": 124, "wickets": 3, "overs": 14.2 },
        "requiredRunRate": 9.87,
        "currentRunRate": 8.65
      }
    }
  ]
}
```

#### `GET /api/v1/matches/history`
```
GET /api/v1/matches/history?page=1&limit=10&matchType=T20
```

#### `GET /api/v1/matches/upcoming`

---

### 3. Analytics API

#### `GET /api/v1/analytics/team/:id`
```json
{
  "success": true,
  "data": {
    "team": {
      "_id": "64f1a2b3c4d5e6f7a8b9c001",
      "name": "India",
      "shortName": "IND",
      "strengthScore": 88,
      "iccRanking": { "test": 2, "odi": 1, "t20": 1 }
    },
    "overallStats": {
      "totalMatches": 420,
      "wins": 285,
      "losses": 110,
      "draws": 25,
      "winPercentage": 67.86
    },
    "recentForm": ["W", "W", "W", "L", "W", "W", "D", "W"],
    "matchBreakdown": [
      { "_id": "T20", "total": 180, "wins": 128 },
      { "_id": "ODI", "total": 160, "wins": 102 },
      { "_id": "Test", "total": 80, "wins": 55 }
    ],
    "recentMatches": [
      {
        "matchId": "65a2f1b3c4d5e6f7a8b9c099",
        "title": "India vs Australia - 1st T20I",
        "opponent": "Australia",
        "result": "W",
        "resultDescription": "India won by 14 runs",
        "date": "2024-01-15T23:15:00.000Z"
      }
    ],
    "predictionAccuracy": {
      "total": 48,
      "correct": 35,
      "accuracyPct": 72.92,
      "avgBrierScore": 0.1734
    },
    "topBatsmen": [
      {
        "name": "Virat Kohli",
        "role": "batsman",
        "battingStats": { "average": 57.2, "hundreds": 47, "fifties": 65 }
      }
    ],
    "topBowlers": [
      {
        "name": "Jasprit Bumrah",
        "role": "bowler",
        "bowlingStats": { "wickets": 232, "economy": 4.5, "average": 21.3 }
      }
    ]
  }
}
```

#### `GET /api/v1/analytics/player/:id`
```json
{
  "success": true,
  "data": {
    "player": {
      "_id": "64f1a2b3c4d5e6f7a8b9p001",
      "name": "Virat Kohli",
      "role": "batsman",
      "performanceRating": 95,
      "iccRanking": { "batting": 1 }
    },
    "battingStats": {
      "matches": 285,
      "runs": 13848,
      "average": 57.2,
      "strikeRate": 93.2,
      "hundreds": 47,
      "fifties": 65
    },
    "recentForm": {
      "batting": [88, 22, 45, 101, 67],
      "recentBattingAvg": 64.6
    },
    "playerOfTheMatchAwards": 3
  }
}
```

#### `GET /api/v1/analytics/system`
```json
{
  "success": true,
  "data": {
    "teams": 6,
    "players": 42,
    "matches": { "total": 180, "live": 2 },
    "predictions": {
      "total": 312,
      "resolved": 142,
      "overallAccuracy": 71.13,
      "avgBrierScore": 0.1842
    }
  }
}
```

---

### 4. Team & Player APIs

```
GET    /api/v1/teams                 # List teams (paginated, filterable)
GET    /api/v1/teams/:id             # Team details with roster
POST   /api/v1/teams                 # Create team
PATCH  /api/v1/teams/:id             # Update team
PATCH  /api/v1/teams/:id/form        # Add match result to form

GET    /api/v1/players               # List players (paginated, filterable)
GET    /api/v1/players/:id           # Player profile
POST   /api/v1/players               # Create player
PATCH  /api/v1/players/:id           # Update player
PATCH  /api/v1/players/:id/form      # Update recent form
```

---

## ML Model Details

| Attribute | Value |
|-----------|-------|
| Algorithm | Gradient Boosting Classifier |
| Calibration | Isotonic (5-fold CV) |
| Training Samples | 10,000 synthetic match records |
| Cross-Val Accuracy | ~72-76% |
| Features | 18 engineered features |
| Probability Output | Well-calibrated [0.02, 0.98] |
| Fallback | Logistic sigmoid (if ML service down) |

### Feature Importances (approximate)
| Feature | Description | Importance |
|---------|-------------|------------|
| `strength_diff` | Team strength index delta | ~28% |
| `form_diff` | Weighted recent form delta | ~19% |
| `h2h_ratio_a` | Head-to-head win ratio (Team A) | ~13% |
| `venue_advantage_diff` | Venue win rate difference | ~12% |
| `toss_advantage_a` | Toss + pitch + decision factor | ~10% |
| `win_pct_diff` | Historical win % difference | ~9% |
| `icc_ranking_diff` | ICC ranking delta | ~9% |

### Accuracy Tracking
Every prediction is stored with:
- Full feature vector snapshot
- Predicted winner + probability
- **Brier Score** (calibration metric — lower is better)
- Resolved actual winner after match completes
- Running accuracy percentage per team

---

## Error Responses

All errors follow the standard envelope:
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    { "field": "teamB", "message": "teamA and teamB must be different" }
  ]
}
```

| Code | Meaning |
|------|---------|
| 400 | Bad Request / Validation Error |
| 404 | Resource Not Found |
| 409 | Duplicate Resource |
| 422 | ML service rejected feature vector |
| 429 | Rate limit exceeded |
| 503 | ML service unavailable (fallback used) |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Node.js server port |
| `MONGODB_URI` | localhost:27017 | MongoDB connection string |
| `ML_SERVICE_URL` | http://localhost:8000 | Python ML service URL |
| `ML_SERVICE_TIMEOUT` | 30000 | ML service timeout (ms) |
| `JWT_SECRET` | — | JWT signing secret (required in prod) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Requests per window |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `LOG_LEVEL` | info | Winston/loguru log level |

---

## Testing the API

```bash
# Health check
curl http://localhost:5000/health

# Get teams (use seeded IDs)
curl http://localhost:5000/api/v1/teams

# Generate a prediction (replace IDs with seeded values)
curl -X POST http://localhost:5000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{
    "teamA": "TEAM_A_ID",
    "teamB": "TEAM_B_ID",
    "pitch_condition": "batting-friendly",
    "weather": "sunny",
    "toss_winner": "TEAM_A_ID",
    "toss_decision": "bat",
    "match_type": "T20",
    "venue": "Wankhede Stadium"
  }'

# Get overall accuracy stats
curl http://localhost:5000/api/v1/predict/accuracy

# Team analytics
curl http://localhost:5000/api/v1/analytics/team/TEAM_A_ID

# System overview
curl http://localhost:5000/api/v1/analytics/system

# Live matches
curl http://localhost:5000/api/v1/matches/live
```

---

## Production Checklist

- [x] Input validation on all routes (`express-validator`)
- [x] Global error handler (no stack traces in production)
- [x] Winston rotating log files (30-day retention)
- [x] Rate limiting (global + per-prediction)
- [x] Helmet.js security headers
- [x] CORS configuration
- [x] Mongoose connection pooling + reconnect logic
- [x] ML service fallback model (sigmoid approximation)
- [x] Graceful shutdown (SIGTERM/SIGINT)
- [x] Request ID tracking (`X-Request-Id` header)
- [x] Prediction accuracy tracking (Brier score)
- [x] Swagger/OpenAPI documentation
- [x] Docker multi-stage builds (non-root user)
- [x] Health check endpoints
- [x] `.env` configuration (no hardcoded secrets)
