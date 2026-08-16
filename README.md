# CivicVoice

<p align="center">
  <img src="frontend/public/logo.png" alt="CivicVoice logo" width="260" />
</p>

A citizen-engagement platform where residents report community issues, vote on priorities, and track official progress — all mapped on an interactive OpenStreetMap view, with Gemini AI providing priority scores, solution suggestions, and a conversational assistant (CivicBot).

Local governments often overlook community concerns. CivicVoice lets residents submit issues with photos and geolocation, vote on what matters most, and follow issues from Pending → In Progress → Resolved → Closed, while officials and administrators triage and manage them.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, React Router 7, Tailwind CSS 4 |
| Maps | React Leaflet + Leaflet + marker clustering |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose (GeoJSON `2dsphere` indexes) |
| AI | Google Gemini (`@google/generative-ai`) |
| Auth | JWT + bcryptjs + OTP email verification (nodemailer) |
| Uploads | Multer (local `backend/uploads` or optional ImageKit cloud) |
| Validation & Safety | express-validator, express-rate-limit, CORS |

## Features

### User Registration & Authentication
- Register with **first name, last name, mobile, email, state & district**, and required consent
- Email must end with **@gmail.com** and is verified via a **6-digit OTP** (sent by email or logged to console in dev)
- Strong-password policy enforced on register/reset/change
- JWT-based session with 7-day expiry; passwords hashed with bcryptjs
- **Forgot / reset password** via OTP flow
- **Profile page**: update name/mobile/state/district, upload/remove avatar, change password (OTP confirmed)
- Roles: `resident` (default), `official`, `admin` — assigned by an administrator

### Issue Reporting
- Submit issues with title, description, category, geolocation (browser geolocation or manual map pin), and **up to 5 photos**
- Six categories: Infrastructure, Safety, Environment, Utilities, Transportation, Other
- Reported issues appear on the map and in the Explore feed

### AI-Powered Analysis (Gemini)
- Every new issue is analyzed by Gemini (priority **1–10**, 2–3 **action suggestions**, and one step-by-step **solution**)
- Priority is **re-calculated** each time a vote is cast, reflecting growing community demand
- Manual re-analysis available (`POST /api/issues/:id/analyze`)

### Interactive Map
- Full-page OpenStreetMap view (React Leaflet) with **marker clustering**
- Color-coded markers by AI priority: 🔴 Critical (8–10), 🟡 Medium (5–7), 🟢 Low (1–4)
- Landing page and Community Map show live issues with category/status/priority badges

### Voting & Comments
- One vote per user per issue (toggle on/off); vote count drives ranking
- Comment threads for community discussion
- Authors and community get notified on votes and comments

### Issue Lifecycle & Notifications
- Status flow: `pending` → `in-progress` → `resolved` → `closed`, with a **status update log** (officials/admins can attach photos per update)
- In-app **notifications** (votes, new comments, status changes, resolution) with unread counts and mark-as-read

### Filtering, Sorting & Dashboards
- Explore page: filter by **category, status, and state**; sort by Most Voted / Highest Priority / Newest / Oldest; paginated
- Real-time issue count display
- **Resident Dashboard**: track your reported issues and their progress
- **Admin Dashboard**: platform stats, user management (assign roles, delete users), issue moderation (remove spam), full status control

### CivicBot (AI Assistant)
- Chat widget powered by Gemini that answers questions about the platform and current issues (trending issues, status breakdown, how-to)

### Contact & Info Pages
- Contact form (stored in DB), plus About, How It Works, Privacy, Help, and 404 pages
- Light/dark theme, mobile bottom navigation, splash screen

### Geospatial Search
- `/api/issues/nearby/:lng/:lat` using MongoDB `$near` geospatial query with configurable max distance

## Project Structure

```
civicvoice/
├── backend/
│   ├── server.js                    # Entry point (DB connect + listen)
│   ├── scripts/
│   │   └── seedAdmin.js             # Bootstrap admin account (npm run seed:admin)
│   ├── uploads/                     # Local image storage (when ImageKit not configured)
│   └── src/
│       ├── app.js                   # Express app: CORS, routes, error handlers
│       ├── models/
│       │   ├── Issue.js             # Issue schema: GeoJSON, votes, comments, statusUpdates, AI fields
│       │   ├── User.js              # User schema: bcrypt pre-save hook, roles
│       │   ├── Otp.js               # Email OTP records (register/password flows)
│       │   ├── Notification.js      # In-app notifications
│       │   └── Contact.js           # Contact form messages
│       ├── routes/
│       │   ├── auth.js              # Register/login/OTP/profile/avatar/password
│       │   ├── issues.js            # CRUD, vote, comments, analyze, nearby search
│       │   ├── notifications.js     # List/read/delete notifications
│       │   ├── admin.js             # Stats, user role management, moderation
│       │   ├── contact.js           # Contact form
│       │   ├── chat.js              # CivicBot (Gemini)
│       │   └── upload.js            # Generic image upload endpoint
│       ├── middleware/
│       │   ├── auth.js              # JWT verification middleware
│       │   └── upload.js            # Multer image upload config
│       └── utils/
│           ├── db.js                # Mongoose connection
│           ├── gemini.js            # Gemini issue analysis + chatbot
│           ├── validate.js          # express-validator error collector
│           ├── uploads.js           # Local / ImageKit storage helpers
│           ├── imagekit.js          # ImageKit client (optional)
│           └── mailer.js            # SMTP OTP emails (console fallback in dev)
│   └── .env                         # Environment variables
└── frontend/
    ├── index.html
    ├── vite.config.js               # Vite config: Tailwind plugin, /api + /uploads proxy
    └── src/
        ├── main.jsx                 # React entry point
        ├── App.jsx                  # Router + route definitions
        ├── index.css                # Global styles (Tailwind)
        ├── context/
        │   ├── AuthContext.jsx      # Auth state + login/register/logout
        │   └── ThemeContext.jsx     # Light/dark theme
        ├── components/
        │   ├── Navbar.jsx           # Top nav (auth-aware)
        │   ├── BottomNav.jsx        # Mobile bottom navigation
        │   ├── Footer.jsx           # Site footer
        │   ├── IssueCard.jsx        # Issue list card (vote + priority)
        │   ├── IssueMap.jsx         # React Leaflet map with markers
        │   ├── LandingMap.jsx       # Landing page map
        │   ├── LocationPicker.jsx   # Map pin location picker
        │   ├── StatusStepper.jsx    # Issue status progress stepper
        │   ├── PriorityBar.jsx      # AI priority score bar
        │   ├── Chatbot.jsx          # CivicBot chat widget
        │   ├── SplashScreen.jsx     # App intro splash
        │   ├── Toast.jsx            # Toast notifications
        │   ├── Avatar.jsx           # User avatar
        │   ├── LoadingSkeleton.jsx  # Loading placeholders
        │   └── EmptyState.jsx       # Empty state block
        ├── pages/
        │   ├── LandingPage.jsx      # Public landing with recent issues
        │   ├── HomePage.jsx         # Community feed (filtered/sorted)
        │   ├── ExploreIssuesPage.jsx # Explore with filters + pagination
        │   ├── CommunityMapPage.jsx # Full-page clustered map
        │   ├── AuthPage.jsx         # Login / Register
        │   ├── ForgotPasswordPage.jsx # OTP reset flow
        │   ├── CreateIssuePage.jsx  # Issue submission form
        │   ├── EditIssuePage.jsx    # Edit own issue
        │   ├── IssueDetailPage.jsx  # Full issue view + comments + status
        │   ├── DashboardPage.jsx    # My issues dashboard
        │   ├── ProfilePage.jsx      # Profile & settings
        │   ├── NotificationsPage.jsx # In-app notifications
        │   ├── AdminDashboard.jsx   # Admin stats & user/issue management
        │   ├── ReportIssuePage.jsx  # Alternative report entry
        │   ├── AboutPage.jsx        # About
        │   ├── HowItWorksPage.jsx   # How it works
        │   ├── PrivacyPage.jsx      # Privacy policy
        │   ├── ContactPage.jsx      # Contact form
        │   ├── HelpPage.jsx         # Help/FAQ
        │   └── NotFoundPage.jsx     # 404
        ├── data/india.js            # States & districts for registration
        └── utils/
            ├── api.js               # Axios instance with JWT interceptor
            ├── priority.js          # Priority levels, categories, statuses, sorts
            └── indiaGeo.js          # Reverse geocoding helper (Nominatim)
```

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send-register-otp` | Send registration OTP (email must end with @gmail.com) |
| POST | `/register` | Register resident (firstName, lastName, mobile, email, otp, password, state, district, consent) |
| POST | `/login` | Login, returns JWT + user |
| GET | `/me` | Get current user |
| PUT | `/me` | Update name/mobile/state/district |
| POST | `/avatar` | Upload avatar (multipart `file`) |
| DELETE | `/avatar` | Remove avatar |
| POST | `/forgot-password` | Send reset OTP |
| POST | `/verify-otp` | Verify reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| POST | `/send-password-otp` | Send OTP for password change (auth) |
| PUT | `/password` | Change password with current password + OTP |

### Issues — `/api/issues`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List issues — `?category=&status=&state=&sort=&page=&limit=` |
| GET | `/stats` | Platform stats (totals, status/category breakdown, recent) |
| GET | `/my` | Current user's issues (auth) |
| GET | `/nearby/:lng/:lat` | Geospatial nearby search — `?maxDistance=5000` |
| GET | `/:id` | Get single issue |
| POST | `/` | Create issue (auth, multipart, up to 5 images) — triggers AI analysis |
| POST | `/:id/analyze` | Re-run AI analysis |
| PUT | `/:id` | Update issue (owner or official/admin; status only for official/admin) |
| POST | `/:id/vote` | Toggle vote (auth) — re-triggers AI priority |
| POST | `/:id/comments` | Add comment (auth) |
| DELETE | `/:id` | Delete issue (owner or admin) |

### Notifications — `/api/notifications`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List notifications + unread count (auth) |
| PUT | `/read` | Mark all as read |
| PUT | `/read/:id` | Mark one as read |
| DELETE | `/:id` | Delete a notification |

### Admin — `/api/admin` (admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard stats |
| GET | `/users` | List all users |
| PUT | `/users/:id/role` | Assign role (`resident`/`official`/`admin`) |
| DELETE | `/users/:id` | Delete user + their issues/data |
| DELETE | `/issues/:id` | Delete issue (spam moderation) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |
| POST | `/api/upload` | Generic image upload (multipart `file`) |
| POST | `/api/chat` | CivicBot answer (Gemini, rate-limited) |

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- (Optional) SMTP credentials for OTP emails · ImageKit keys for cloud uploads

### Backend
```bash
cd backend
cp .env.example .env        # Fill in MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, ...
npm install
npm run dev                 # Starts on port 5000 (node --watch)
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # Starts on port 3000, proxies /api and /uploads to backend
```

### Bootstrap an Admin
```bash
cd backend
npm run seed:admin          # Creates/updates admin from ADMIN_* env vars
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Backend port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string (default: `mongodb://localhost:27017/civicvoice`) |
| `JWT_SECRET` | Secret for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-2.5-flash`) |
| `CORS_ORIGIN` | Comma-separated allowed origins (empty = allow all) |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key (optional) |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key (optional) |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint (optional) |
| `SMTP_HOST` | SMTP host for OTP emails (e.g. `smtp-relay.brevo.com`) |
| `SMTP_PORT` | SMTP port (default: 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `MAIL_FROM` | From address for OTP emails |
| `ADMIN_NAME` | Admin bootstrap name (`npm run seed:admin`) |
| `ADMIN_EMAIL` | Admin bootstrap email |
| `ADMIN_PASSWORD` | Admin bootstrap password |

If SMTP is not configured, OTPs are printed to the server console (dev mode). If ImageKit is not configured, images are stored under `backend/uploads` and served at `/uploads`.

## How It Works

1. **Resident registers & reports an issue** → verifies email with OTP, fills the form, optionally auto-detects GPS location, adds up to 5 photos
2. **Gemini AI analyzes** the issue → assigns a priority (1–10), suggests actions, and provides a step-by-step solution
3. **Issue appears on the map** → color-coded, clustered marker at the reported location
4. **Community votes & comments** → issue rises in the ranking, AI re-evaluates the score
5. **Officials act** → update status (Pending → In Progress → Resolved → Closed) with progress photos; residents get notified
6. **Everyone stays informed** → notifications, resident dashboard, admin dashboard, and CivicBot for questions
