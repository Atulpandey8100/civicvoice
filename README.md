# CivicVoice

A platform for crowdsourcing community issues and proposing solutions with AI-driven prioritization.

Local governments often overlook community concerns. CivicVoice lets residents submit issues, vote on priorities, and track progress — all mapped on an interactive OpenStreetMap view with Gemini AI providing priority scores and solution suggestions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Leaflet |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Maps | OpenStreetMap API (free) |
| AI | Google Gemini API |
| Auth | JWT + bcryptjs |

## Features

### Issue Reporting
- Residents submit issues with title, description, category, and geolocation
- Auto-detect current location via browser Geolocation API or manual coordinate entry
- Six categories: Infrastructure, Safety, Environment, Utilities, Transportation, Other

### AI-Powered Analysis (Gemini)
- Every new issue is automatically analyzed by Gemini AI on submission
- AI assigns a **priority score (1–10)** based on urgency, safety impact, and community reach
- AI generates **2–3 practical solution suggestions** for each issue
- Priority score **re-calculates** every time a vote is cast, reflecting growing community demand

### Interactive Map
- Full-page OpenStreetMap view powered by React Leaflet
- Color-coded markers: 🔴 Critical (8–10), 🟡 Medium (5–7), 🟢 Low (1–4)
- Markers display issue title, category, priority, and vote count on click
- Click-through to full issue detail page

### Voting System
- One vote per user per issue (toggle on/off)
- Vote count drives the issue ranking and sort order
- AI priority re-evaluates on every vote change

### Filtering & Sorting
- Filter by category and status
- Sort by Most Voted, Highest AI Priority, Newest, or Oldest
- Real-time issue count display

### User Authentication
- Register as a **Resident** (accounts start as residents)
- **Government Official** accounts are assigned by an administrator from the Admin Dashboard
- JWT-based session with 7-day expiry
- Passwords hashed with bcryptjs

### Role-Based Features
- **Residents**: Submit issues, vote, comment
- **Officials**: All resident features + ability to update issue status (Pending → In Progress → Resolved → Closed)

### Issue Detail Page
- Full issue description with location address
- Embedded mini-map centered on the issue location
- AI Analysis panel showing priority score bar and solution suggestions
- Comment thread for community discussion
- Status update controls (officials only)

### Geospatial Search
- `/api/issues/nearby/:lng/:lat` endpoint using MongoDB `$near` geospatial query
- Configurable max distance radius

## Project Structure

```
civicvoice/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app, CORS, routes
│   │   ├── models/
│   │   │   ├── Issue.js           # Issue schema with GeoJSON, votes, AI fields
│   │   │   └── User.js            # User schema with bcrypt pre-save hook
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /register, POST /login
│   │   │   └── issues.js          # CRUD, vote, comment, nearby search
│   │   ├── middleware/auth.js      # JWT verification middleware
│   │   └── utils/
│   │       ├── db.js              # Mongoose connection
│   │       └── gemini.js          # Gemini AI issue analysis
│   └── .env                       # Environment variables
└── frontend/
    ├── src/
    │   ├── main.jsx               # React entry point
    │   ├── App.jsx                # Router + route definitions
    │   ├── index.css              # Global styles
    │   ├── context/AuthContext.jsx # Auth state + login/register/logout
    │   ├── components/
    │   │   ├── Navbar.jsx         # Top nav with auth-aware links
    │   │   ├── IssueCard.jsx      # Issue list card with vote + priority
    │   │   └── IssueMap.jsx       # React Leaflet map with markers
    │   ├── pages/
    │   │   ├── HomePage.jsx       # Map + filtered/sorted issue list
    │   │   ├── AuthPage.jsx       # Login/Register form
    │   │   ├── CreateIssuePage.jsx # Issue submission form
    │   │   └── IssueDetailPage.jsx # Full issue view + comments
    │   └── utils/api.js           # Axios instance with JWT interceptor
    ├── index.html
    └── vite.config.js             # Vite config with API proxy
```

## API Endpoints

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password }` | Register new user (role is always resident) |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT |

### Issues
| Method | Endpoint | Body/Query | Description |
|--------|----------|------------|-------------|
| GET | `/api/issues` | `?category=&status=&sort=&page=&limit=` | List issues with filters |
| GET | `/api/issues/:id` | — | Get single issue |
| GET | `/api/issues/nearby/:lng/:lat` | `?maxDistance=5000` | Geospatial nearby search |
| POST | `/api/issues` | `{ title, description, category, location }` | Create issue (triggers AI analysis) |
| PUT | `/api/issues/:id` | `{ status }` | Update issue status |
| POST | `/api/issues/:id/vote` | — | Toggle vote (re-triggers AI priority) |
| POST | `/api/issues/:id/comments` | `{ text }` | Add comment |
| DELETE | `/api/issues/:id` | — | Delete issue |

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key

### Backend
```bash
cd backend
cp .env.example .env   # Fill in MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run dev            # Starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # Starts on port 3000, proxies /api to backend
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Backend port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key |

## How It Works

1. **Resident reports an issue** → fills form, optionally auto-detects GPS location
2. **Gemini AI analyzes** the issue → assigns priority 1–10, suggests solutions
3. **Issue appears on map** → color-coded marker at the reported location
4. **Community votes** → issue moves up in priority sorting, AI re-evaluates score
5. **Officials track** → update status from Pending → In Progress → Resolved
6. **Residents follow** → view progress, read AI suggestions, add comments
