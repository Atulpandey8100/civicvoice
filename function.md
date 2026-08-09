# CivicVoice — Function Reference & How Everything Works

This document explains **every function, every file, and how the whole system works** in the CivicVoice project. It is written for a college project report / viva, so it goes function-by-function through both the backend (Node.js + Express + MongoDB) and the frontend (React + Vite).

---

## 1. What the Project Does

CivicVoice is a **community issue-reporting platform**. Residents report problems in their neighborhood (broken streetlights, potholes, garbage dumps, etc.), mark them on a map, upload photos, and describe them. The system then:

1. Uses **Google Gemini AI** to automatically score the urgency of the issue (priority 1–10) and suggest 2–3 practical solutions.
2. Shows every issue on an **interactive OpenStreetMap** (colored pins = AI priority).
3. Lets the community **vote** on issues (one vote per user, toggle on/off). Each vote re-runs the AI analysis.
4. Lets **government officials / admins** change the issue **status** (Pending → In Progress → Resolved → Closed).
5. Sends the issue author **notifications** for votes, comments, and status changes.
6. Gives **admins** a dashboard to see statistics and manage user roles.

---

## 2. Tech Stack

| Layer | Technology | Used For |
|-------|-----------|----------|
| Frontend | React 18, Vite, React Router v7 | UI pages, routing |
| Maps | React Leaflet + Leaflet + Leaflet.markercluster | Interactive OpenStreetMap |
| Styling | Tailwind CSS v4 + custom CSS | Styling / dark & light theme |
| Icons | lucide-react | UI icons |
| Backend | Node.js, Express | REST API server |
| Database | MongoDB + Mongoose | Storing users, issues, notifications, contact messages |
| AI | Google Gemini (`@google/generative-ai`) | Priority score + solution suggestions |
| Auth | JWT (`jsonwebtoken`) + bcryptjs | Login sessions, password hashing |
| Validation | express-validator | Input validation |
| File upload | Multer | Uploading issue photos (max 5, 5MB each) |
| Rate limiting | express-rate-limit | Prevents spam / brute force |

---

## 3. How the Whole System Works (High-Level Flow)

```
[Browser]  ──HTTP──►  [Vite dev server :3000]  ──proxy──►  [Express API :5000]  ──►  [MongoDB]
                         │ (React app)                             │
                         │                                        └──►  [Gemini AI]  (fire-and-forget analysis)
                         ▼
              JWT stored in localStorage, attached to every API call as
              `Authorization: Bearer <token>`
```

1. A user **registers/logs in**. Backend hashes the password with bcrypt and returns a **JWT** (7-day expiry). The token is stored in `localStorage`.
2. Every API call made by the frontend goes through an **Axios interceptor** (`utils/api.js`) that adds the JWT header automatically.
3. The **Express server** mounts route groups: `/api/auth`, `/api/issues`, `/api/notifications`, `/api/admin`, `/api/contact`.
4. When an issue is created, the backend saves it, responds immediately, and then calls Gemini **in the background** (`runAnalysis`). The AI result (priority + suggestions) is written back to the same issue document, so the user isn't blocked waiting for AI.
5. Frontend pages fetch issues through the API and render them as cards + map markers, filtered/sorted by the user.
6. Votes/comments/status changes trigger **Notification documents** so issue authors are informed.

---

# PART A — BACKEND

## A.1 `backend/src/server.js` — Entry point

| Function / block | What it does |
|---|---|
| `dotenv.config()` | Loads environment variables from `.env`. |
| `app.set('trust proxy', 1)` | Trusts the first proxy hop so rate limiting sees real client IPs behind the Vite dev proxy. |
| CORS setup | Reads `CORS_ORIGIN` env var (comma-separated list) or allows all origins. |
| `express.json({ limit: '1mb' })` | Parses JSON request bodies (max 1 MB). |
| `express.static('/uploads')` | Serves uploaded images at `/uploads/<filename>`. |
| Route mounting | `app.use('/api/auth', authRoutes)`, `/api/issues`, `/api/notifications`, `/api/admin`, `/api/contact`. |
| 404 handler `(req,res)` | Returns `{ error: 'Not found' }` for unknown routes. |
| Global error handler `(err, req, res, next)` | Handles Multer upload errors (file too large / too many files), oversized JSON bodies (413), Mongoose `ValidationError`/`CastError` (400), and any other error (500). |
| `connectDB().then(...)` | Connects to MongoDB, then starts the server on `PORT` (default 5000). |

## A.2 `backend/src/utils/db.js`

| Function | What it does |
|---|---|
| `connectDB()` | Calls `mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })`. On success logs `MongoDB connected`; on failure logs the error and calls `process.exit(1)`. |

## A.3 `backend/src/utils/gemini.js` — Gemini AI integration

| Function | What it does |
|---|---|
| `extractJson(text)` | Cleans up the AI response: strips Markdown code fences (```json ... ```), then tries `JSON.parse`. If that fails, it extracts the first `{...}` block and parses that. Returns `null` if no valid JSON. |
| `sanitize(result)` | Validates the parsed result. Converts `priority` to a number, clamps it to **1–10** and rounds it; filters `suggestions` down to at most **3 non-empty strings**. Returns `null` if priority is not a number. |
| `analyzeIssue(issue)` | Main AI function. If no `GEMINI_API_KEY` is configured it logs a warning and returns `null`. Otherwise builds a prompt containing the issue title, description, category and current vote count, asks the model for `{ "priority": number, "suggestions": ["string", ...] }` in JSON format, with a **15-second timeout** (`AbortSignal.timeout`). Returns `{ priority, suggestions }` (or `null` on any error/timeout). |

## A.4 `backend/src/utils/validate.js`

| Function | What it does |
|---|---|
| `validate(req, res, next)` | Express-validator middleware. If validation errors exist, it deletes any uploaded files (`req.files`) so failed submissions don't leave orphan files, and returns HTTP 400 with the first error message. Otherwise calls `next()`. |

## A.5 `backend/src/middleware/auth.js`

| Function | What it does |
|---|---|
| `auth(req, res, next)` | JWT authentication middleware. Reads the `Authorization: Bearer <token>` header, verifies the token with `JWT_SECRET`, loads the user from the DB, and attaches `req.userId` (user id string) and `req.user` (`{ id, role }`). Returns 401 if there's no token, an invalid token, or the account no longer exists. |

## A.6 `backend/src/middleware/upload.js`

| Function | What it does |
|---|---|
| Multer storage config | Saves files to `backend/uploads/` with a unique filename: `Date.now()-random.ext`. |
| `fileFilter(req, file, cb)` | Only allows image files (`jpeg | jpg | png | gif | webp`) — checks both the file extension and MIME type. Rejects anything else. |
| `upload` export | The configured Multer instance with a **5 MB** per-file limit. Used as `upload.array('images', 5)`. |

## A.7 Data Models (`backend/src/models/`)

### `User.js`
| Field / function | What it does |
|---|---|
| Schema fields | `name`, `email` (unique), `password`, `role` (`resident` / `official` / `admin`, default `resident`), timestamps. |
| `userSchema.pre('save', ...)` | Mongoose middleware hook. Runs before every save; if the password was modified it hashes it with `bcrypt.hash(password, 10)`. |
| `userSchema.methods.comparePassword(candidatePassword)` | Compares a plain-text password with the stored hash using `bcrypt.compare`. Returns true/false. |

### `Issue.js`
| Field / function | What it does |
|---|---|
| `title`, `description` | The report text. |
| `category` | One of `infrastructure, safety, environment, utilities, transportation, other`. |
| `status` | One of `pending, in-progress, resolved, closed` (default `pending`). |
| `location` | GeoJSON Point: `{ type: 'Point', coordinates: [lng, lat], address }`. |
| `author` | ObjectId reference to the User who created it. |
| `votes` | Array of User ObjectIds who voted. |
| `voteCount` | Denormalized number of votes (default 0) — makes sorting fast. |
| `aiPriority` | AI score, **1–10**, default 5. |
| `aiSuggestions` | Array of strings (AI solutions, max 3). |
| `images` | Array of `/uploads/...` URLs. |
| `comments` | Embedded subdocuments `{ user, text, createdAt }`. |
| `issueSchema.index({ location: '2dsphere' })` | Creates a geospatial index so `$near` queries work. |

### `Notification.js`
| Field / function | What it does |
|---|---|
| Schema fields | `user` (recipient), `issue` (optional reference), `message`, `type` (`status-change`, `new-comment`, `issue-resolved`, `vote`, `system`), `isRead`, timestamps. |
| Index | `{ user: 1, createdAt: -1 }` — speeds up "my notifications, newest first". |

### `Contact.js`
| Field / function | What it does |
|---|---|
| Schema fields | `name`, `email`, `subject`, `message`, `isRead` (default false), timestamps. Stores the "Contact Us" form submissions. |

---

## A.8 Routes — `backend/src/routes/auth.js`

| Function / endpoint | What it does |
|---|---|
| `authLimiter` | Rate limit: **100 requests per 15 minutes** per IP on auth routes. |
| `POST /register` | Validates `name` (2–80 chars), `email`, `password` (min 6). Creates a new `User` — **role is always `resident`** (self-registration can never be official/admin). Signs a JWT (`expiresIn: '7d'`), returns `{ token, user }` with status 201. Handles duplicate email (MongoDB error code `11000`). |
| `POST /login` | Validates email + password, finds the user by email, calls `comparePassword`. On success signs a 7-day JWT and returns `{ token, user }`; otherwise returns 401 `Invalid credentials`. |

## A.9 Routes — `backend/src/routes/issues.js` (the biggest route file)

**Constants & helpers:**

| Function / constant | What it does |
|---|---|
| `CATEGORIES`, `STATUSES`, `SORT_FIELDS` | Whitelists for valid category / status / sort values. |
| `apiLimiter` | 300 requests / 15 min per IP, applied to all issue routes via `router.use(apiLimiter)`. |
| `validId(id)` | Returns true if the id is a valid MongoDB ObjectId. |
| `removeImages(issue)` | Deletes all uploaded image files of an issue from disk (best-effort, errors ignored). |
| `removeUploadedFiles(files)` | Deletes files that were just uploaded to disk (used on validation/submission failure). |
| `parseLocation(location)` | If `location` is a JSON string (as sent by multipart forms), parses it; otherwise returns it as-is. |
| `isValidLocation(loc)` | Checks `location.coordinates` is an array of 2 finite numbers within valid lat/lng ranges. |
| `runAnalysis(issue)` | **Fire-and-forget** AI analysis. Calls `analyzeIssue(issue)` in a promise; if a valid result comes back it updates the issue's `aiPriority` and `aiSuggestions` with `Issue.findByIdAndUpdate`. Errors are swallowed so the main request is never blocked. |

**Endpoints:**

| Endpoint | Function | What it does |
|---|---|---|
| `GET /` | list handler | Filters by `category` and `status` query params, sorts by `sort` (whitelisted — falls back to `-createdAt`), paginates via `page`/`limit` (default 20, max 100). Populates `author` with name + role. Returns `{ issues, total, pages }`. |
| `GET /stats` | stats handler | Runs 4 queries in parallel (`Promise.all`): total count, aggregation grouped by status, aggregation grouped by category, and the 6 most recent issues. Returns a single stats object. |
| `GET /my` | my issues handler | `auth` protected. Returns all issues where `author === req.userId`, newest first. |
| `GET /nearby/:lng/:lat` | nearby handler | Uses MongoDB `$near` with `$geometry` and `$maxDistance` (default 5000 m). Validates coordinates and distance; returns issues within that radius. |
| `GET /:id` | detail handler | Validates id, finds the issue, populates `author` and each comment's `user`. 400 on invalid id, 404 if not found. |
| `POST /` | create handler | `auth` + `upload.array('images', 5)` + validation. Requires a valid location. Saves the issue, populates author, returns 201, then calls `runAnalysis(issue)` in the background. On failure, deletes any uploaded files. |
| `PUT /:id` | update handler | `auth` + image upload + validation. Only the **owner**, an **official**, or an **admin** may edit. Owner can change title/description/category/location; only officials/admins can change `status`. New images are appended (max 5 kept, extras deleted from disk). If status changed, it creates a `status-change` Notification for the author (and a second `issue-resolved` Notification if the new status is `resolved`). |
| `POST /:id/vote` | vote handler | `auth`. If the user already voted, removes their vote (toggle OFF, `voteCount--`); otherwise adds it (`voteCount++`) and creates a `vote` Notification for the author **unless the voter is the author**, and only if there isn't already an unread vote notification. Then saves and **re-runs AI analysis** (vote count feeds into the prompt). Returns the updated issue. |
| `POST /:id/comments` | comment handler | `auth` + validation (1–1000 chars). Appends a comment subdocument, creates a `new-comment` Notification for the author (if commenter isn't the author), returns the populated issue. |
| `DELETE /:id` | delete handler | `auth`. Only the **owner** or an **admin** may delete. Removes the issue's image files from disk, then deletes the document. |

## A.10 Routes — `backend/src/routes/notifications.js`

| Endpoint | Function | What it does |
|---|---|---|
| `GET /` | list handler | `auth`. Returns the user's latest 50 notifications (newest first), populating the related issue title, plus an `unreadCount`. |
| `PUT /read` | mark-all-read | `auth`. Sets `isRead: true` on all the user's unread notifications. |
| `PUT /read/:id` | mark-one-read | `auth`. Marks a single notification read, but only if it belongs to the current user. 404 if not found. |
| `DELETE /:id` | delete one | `auth`. Deletes a single notification, again scoped to the current user. |

## A.11 Routes — `backend/src/routes/admin.js`

| Helper | What it does |
|---|---|
| `validId(id)` | Same ObjectId validation as in issues.js. |
| `removeImages(issue)` | Deletes an issue's image files from disk (used when an admin deletes a user's issues). |

| Endpoint | Function | What it does |
|---|---|---|
| `GET /stats` | stats handler | Admin only (403 otherwise). Returns `totalIssues`, `totalUsers`, counts per status, an aggregation of issues **grouped by category** (count + average AI priority), and the 5 most recent issues (author populated). |
| `GET /users` | list users | Admin only. Returns all users without passwords, newest first. |
| `PUT /users/:id/role` | change role | Admin only. Validates the target role. Admins **cannot change their own role**. The **last admin cannot be demoted** or deleted (safety rule). Returns the updated user (without password). |
| `DELETE /users/:id` | delete user | Admin only. Cannot delete yourself; cannot delete the last admin. Deletes the user's uploaded images, their issues, removes their id from other issues' `votes` arrays and `comments`, deletes their notifications, then the user. |
| `DELETE /issues/:id` | delete issue | Admin only. Spam removal: deletes the issue's images and the document. |

## A.12 Routes — `backend/src/routes/contact.js`

| Function / endpoint | What it does |
|---|---|
| `contactLimiter` | 20 messages / 15 min per IP. |
| `POST /` | Validates name, email, subject (3–120), message (10–2000), saves a `Contact` document, returns a success message. |

## A.13 Script — `backend/scripts/seedAdmin.js`

| Function | What it does |
|---|---|
| `run()` | Bootstrap script (`npm run seed:admin`). Reads `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. Connects to MongoDB, and either creates a new admin user or updates the existing one with that email (assigning role `admin`). Exits after disconnecting. |

---

# PART B — FRONTEND

## B.1 `frontend/vite.config.js`

| Function | What it does |
|---|---|
| `defineConfig` | Registers the React and Tailwind plugins, runs the dev server on **port 3000**, and proxies `/api` and `/uploads` to `http://localhost:5000` (so the browser only ever talks to :3000). |

## B.2 `frontend/src/main.jsx`

| Function | What it does |
|---|---|
| `main.jsx` | React entry point. Renders `<App />` inside `<ThemeProvider>` (for dark/light theme) into the `#root` element. Uses `<React.StrictMode>`. |

## B.3 `frontend/src/App.jsx` — Router

| Function | What it does |
|---|---|
| `PrivateRoute({ children })` | Guard component. Reads auth state; while `loading` returns nothing; if logged in renders `children`, otherwise `<Navigate to="/auth" />`. Wraps the protected pages (edit, create, notifications, profile, admin). |
| `App()` | Renders `<AuthProvider>` → `<ToastProvider>` → `<BrowserRouter>` with the `Navbar`, all routes, and `Footer`. Route list: `/` (Landing), `/community`, `/auth`, `/issues/:id`, `/issues/:id/edit`, `/create`, `/notifications`, `/profile`, `/admin`, `/report`, `/issues`, `/map`, `/dashboard`, `/about`, `/how-it-works`, `/privacy`, `/contact`, `*` (NotFound). |

## B.4 Contexts

### `frontend/src/context/AuthContext.jsx`
| Function | What it does |
|---|---|
| `AuthProvider` | Holds `user` state + `loading`. On mount, reads `token` and `user` from `localStorage` and restores the session. Listens for the `civicvoice:unauthorized` window event (fired by the axios interceptor on 401) to log the user out. Exposes `login`, `register`, `logout`. |
| `login(email, password)` | POSTs `/auth/login`, stores `token` + `user` in localStorage, sets React state. |
| `register(name, email, password, role)` | POSTs `/auth/register`, same storage logic. |
| `logout()` | Clears localStorage and user state. |
| `useAuth()` | Context hook to access auth anywhere. |

### `frontend/src/context/ThemeContext.jsx`
| Function | What it does |
|---|---|
| `getSystemTheme()` | Returns `dark`/`light` from the OS preference (`matchMedia`). |
| `getInitialTheme()` | Reads `civicvoice-theme` from localStorage; falls back to `system`. |
| `applyTheme(resolved)` | Adds/removes the `dark` class on `<html>`, sets `color-scheme` and the `theme-color` meta tag. |
| `ThemeProvider` | Manages `theme` state (`light`/`dark`/`system`), persists it, listens to OS theme changes when in `system` mode. Exposes `theme`, `setTheme`, `toggleTheme`, `resolvedTheme`. |
| `useTheme()` | Hook to consume the theme context. |

## B.5 `frontend/src/utils/api.js` — Axios setup

| Function | What it does |
|---|---|
| `api` (axios instance) | Base URL `/api` (proxied to the backend). |
| Request interceptor | Reads `token` from localStorage and adds `Authorization: Bearer <token>` to every request. |
| Response interceptor | On a **401** response (and not an auth endpoint), clears `token`/`user` from localStorage and dispatches the `civicvoice:unauthorized` event so the app logs out. |

## B.6 `frontend/src/utils/priority.js`

| Function | What it does |
|---|---|
| `priorityLevel(score)` | Maps a score to `high` (8+), `mid` (5–7), `low` (1–4). |
| `priorityLabel(score)` | Returns `Critical` / `Medium` / `Low`. |
| `priorityColor(score)` | Returns the marker/bar color: red `#dc2626`, amber `#d97706`, green `#16a34a`. |
| `CATEGORIES` / `STATUSES` / `SORTS` | Shared constants (arrays of `{ value, label }`) used by dropdowns all over the app. |

## B.7 Shared Components (`frontend/src/components/`)

### `Navbar.jsx`
| Function | What it does |
|---|---|
| `useClickOutside(onOutside)` | Custom hook. Returns a ref; closes a dropdown when the user clicks/touches outside it. |
| `ThemeToggle` | Dropdown with Light / Dark / System options using `useTheme`. |
| `UserMenu` | Account dropdown showing avatar initials, name/email/role badge, links to Profile and (for admins) Admin Dashboard, plus a Logout button. |
| `Navbar` | Sticky top navigation. Shows logo, links (Home, About, Contact, and for logged-in users: Report Issue, Notifications with a live unread-count badge). Polls `/notifications` every 30 s to refresh the unread badge. Includes a mobile hamburger menu. |

### `IssueCard.jsx`
| Function | What it does |
|---|---|
| `IssueCard({ issue, onVote })` | Card for one issue: title (link to detail page), category, author, date, status badge, 2-line clamped description, location line, a **PriorityBar**, a vote button (toggle, disabled for guests, with a short animation), and an "N AI solutions" link. Uses `hasVoted = issue.votes?.includes(user.id)` to decide button state. |

### `IssueMap.jsx`
| Function | What it does |
|---|---|
| `createIcon(priority)` | Builds a colored circular `L.divIcon` marker showing the priority number, colored by `priorityColor`. |
| `clusterIcon(cluster)` | Icon for clustered markers showing the count, sized by how many issues are clustered. |
| `IssueMap({ issues, ... })` | Full React Leaflet map (OpenStreetMap tiles) with `MarkerClusterGroup` so dense areas group markers. Auto-locates the user via `navigator.geolocation` (defaults to India center [20.59, 78.96]). Filters out issues without valid coordinates. Each marker popup shows title, category, priority, votes, and a "View Details" link. Overlays a priority legend. |

### `LandingMap.jsx`
| Function | What it does |
|---|---|
| `makeIcon(priority)` | Same style colored marker as IssueMap (slightly bigger). |
| `FlyTo({ target })` | Animates the map camera to a location (used after search / locate). |
| `FitIssues({ issues })` | Fits the map bounds to all currently visible issue markers. |
| `handleSearch(e)` | Geocodes a place name via the free **Nominatim** (OpenStreetMap) API and flies to it. |
| `handleLocate()` | Uses the browser geolocation API to fly to the user's position. |
| `toggleFilter(cat)` | Adds/removes a category from the active filter set. |
| `LandingMap` | Big interactive map on the landing page. Supports dark/street tile layers, category filter checkboxes, search, locate-me, a loading overlay, and a floating "Report Issue" button. |

### `LocationPicker.jsx`
| Function | What it does |
|---|---|
| `pinIcon` | A blue pin `L.divIcon` (SVG) shown at the selected point. |
| `ClickToSet` | React Leaflet hook component (`useMapEvents`): when the map is clicked, writes lat/lng into `window.__civicMapSet` so the parent gets the coordinates. |
| `FitView({ coords })` | Centers the small map on the chosen coordinates. |
| `useMyLocation()` | Gets the current GPS position and calls `onChange` with rounded coordinates (or shows an error message). |
| `LocationPicker({ value, onChange })` | Map + lat/lng number inputs used in the Create/Edit issue forms. Clicking the map drops the pin; a button auto-detects location. |

### `PriorityBar.jsx`
| Function | What it does |
|---|---|
| `PriorityBar({ score, size, showLabel })` | Visual progress bar for the AI priority score. Clamps the score to 0–10, fills the track to `score × 10`%, draws a handle knob at that position, and shows `score/10` + label (Critical/Medium/Low) when `showLabel` is true. Sizes: `sm`, `md`, `lg`. |

### `StatusStepper.jsx`
| Function | What it does |
|---|---|
| `StatusStepper({ status, onSelect })` | 4-step horizontal stepper (Pending → In Progress → Resolved → Closed). Completed steps get a check icon; the current step is highlighted. If `onSelect` is a function, each step is clickable so officials can jump straight to any status. |

### `Toast.jsx`
| Function | What it does |
|---|---|
| `ToastView({ toast, onClose })` | Renders a single toast (icon, title, description, dismiss button). |
| `ToastProvider` | Holds a list of toasts, auto-dismisses them after a duration (default 4 s, max 4 shown). Exposes `push` via context as `useToast()`. |

### `EmptyState.jsx`
| Function | What it does |
|---|---|
| `EmptyState({ icon, title, description, action })` | Reusable "nothing here" card with an icon, title, description, and an optional action (link or button). |

### `LoadingSkeleton.jsx`
| Function | What it does |
|---|---|
| `Skeleton({ className })` | A single shimmering gray block. |
| `LoadingSkeleton({ count, variant })` | Renders skeleton placeholders for `list` (one big block) or `card` (several card-shaped skeletons) variants while data loads. |

### `PlaceholderPage.jsx`
| Function | What it does |
|---|---|
| `PlaceholderPage({ icon, title, description })` | Simple centered EmptyState wrapper with a "Back to Home" link (used for stub pages). |

### `Footer.jsx`
| Function | What it does |
|---|---|
| `FooterColumn({ title, label, links })` | Renders a navigation column of links. |
| `Footer` | Dark footer with brand, description, Platform links (Report, Explore, Map, Dashboard) and Community links (About, How It Works, Privacy, Contact). |

## B.8 Pages (`frontend/src/pages/`)

### `LandingPage.jsx`
Marketing homepage on the dark theme: hero text ("Your Voice. Your Community. Your Impact."), CTA buttons (Report an Issue, Explore Issues), and the interactive `LandingMap`.

### `HomePage.jsx` (`/community`)
The main issue feed + map. Functions:
- `fetchIssues(targetPage)` — fetches `/issues` with the current category/status/sort filters and page size 20; appends pages ("Load more") or replaces the list on a filter change. Uses a `requestIdRef` to ignore stale responses (race-condition guard).
- `handleLoadMore()` — fetches the next page and appends results.
- `handleVote(issueId)` — POSTs a vote and swaps the updated issue into the list.
- Renders a sticky `IssueMap` on the left, and on the right: filter selects (category/status/sort), the issue list (skeletons / error / empty states), and the Load More button.

### `ExploreIssuesPage.jsx` (`/issues`)
Same fetch/filter/vote logic as HomePage but without the map — a full-width browsable list. `fetchIssues`, `handleLoadMore`, `handleVote` work identically.

### `CommunityMapPage.jsx` (`/map`)
Map-focused page. `fetchIssues` loads up to 100 issues sorted by votes; `withCoords` filters to issues that have real coordinates. Left: full-height `IssueMap`; right: a scrollable "Top issues" list linking to each issue.

### `DashboardPage.jsx` (`/dashboard`)
Community analytics. `fetchStats` calls `/issues/stats`. Shows stat cards (total + per status), a category bar chart, a stacked status-breakdown bar with legend, and the most recent issues (each with working vote buttons via `handleVote`). Helper functions `statusLabel`, `categoryLabel`, `totalByStatus`, `totalByCategory` derive the displayed numbers.

### `AuthPage.jsx` (`/auth`)
Login / Register with tabs. `handleSubmit` calls `login` or `register` from AuthContext and navigates to `/community`. Shows server error messages; registration note that new accounts are always Residents.

### `CreateIssuePage.jsx` (`/create`)
The issue-reporting form. Functions:
- `handleImageChange(e)` — selects up to 5 images, creates object URLs for previews (tracked in `previewUrlsRef` to revoke them later).
- `removeImage(index)` — removes an image + revokes its preview URL.
- `handleSubmit(e)` — validates lat/lng, builds a `FormData` with title, description, category, JSON location `{ coordinates: [lng, lat], address }`, and images, then POSTs to `/issues`. On success shows a toast and navigates to `/community`.
- Uses `LocationPicker` for the map, category select, address field, and image upload zone with previews.

### `EditIssuePage.jsx` (`/issues/:id/edit`)
Loads the issue, verifies ownership (residents can only edit their own; officials can edit any), and prefills the form. Functions:
- `handleImageChange`, `removeNewImage` — same preview logic as Create page.
- `handleSubmit(e)` — sends a PUT with `FormData` (existing images are preserved server-side; new ones appended).
- Shows current images plus an upload zone for new images, and plain lat/lng inputs.

### `IssueDetailPage.jsx` (`/issues/:id`)
The full issue page. Functions:
- `priorityIcon(priority)` — larger colored circular marker for the mini-map.
- Data loading via `useEffect` → `GET /issues/:id`.
- `handleVote()` — toggles the user's vote.
- `handleComment(e)` — POSTs a comment and refreshes the issue (populated commenters).
- `handleStatusChange(status)` — officials only; PUTs the new status (triggers notifications server-side).
- `handleDelete()` — confirms, then DELETE.
- Renders: header (status badge, category, author, date), vote button, Edit/Delete buttons (based on owner/official/admin), full description, photo grid, address, a mini-map centered on the location, the **AI Analysis panel** (PriorityBar + numbered solution list), the **StatusStepper** (officials only), the comment thread, and a comment form (or a login prompt).

### `ReportIssuePage.jsx` (`/report`)
Wrapper: if not logged in, shows an EmptyState prompting login; if logged in, renders `CreateIssuePage`.

### `NotificationsPage.jsx` (`/notifications`)
Functions:
- `fetchNotifications()` — GETs `/notifications`, stores list + unread count.
- `markAllRead()` — PUT `/notifications/read`, flips all to read locally.
- `markRead(id)` — PUT `/notifications/read/:id`, decrements unread count.
- `deleteNotification(id)` — DELETE one and adjusts the unread count.
- `getIcon(type)` — maps notification type to an emoji icon.
- Renders each notification card with a "View Issue" link (auto-marks read on click), Mark Read, and Delete buttons.

### `ProfilePage.jsx` (`/profile`)
Functions:
- `fetchMyIssues()` — GETs `/issues/my`.
- `handleDelete(issueId)` — deletes one of the user's own issues and removes it from the list.
- Renders the user's name/email/role card, a Logout button, "My Issues" list with Edit/Delete actions, votes and AI priority per issue.

### `AdminDashboard.jsx` (`/admin`)
Admin-only (redirects non-admins). Functions:
- `fetchData()` — `Promise.all` of GET `/admin/stats` + GET `/admin/users`.
- `changeRole(userId, role)` — PUT `/admin/users/:id/role` and updates the local user list.
- `deleteUser(userId)` — confirms, then DELETE `/admin/users/:id` and removes from the list.
- Renders 6 stat cards, an **Analytics** tab (category bar chart + recent issues) and a **Manage Users** tab (table with a role dropdown per user and a delete button — disabled for your own row).

### `ContactPage.jsx` (`/contact`)
Functions:
- `handleChange(e)` — updates the form state by input `name`.
- `handleSubmit(e)` — POSTs to `/contact`, shows success/error toasts, clears the form.
- Renders contact info cards and the validated contact form.

### `AboutPage.jsx` (`/about`)
Static content page: mission statement, three values (Community-first, AI-powered insight, Transparent & open) from the `VALUES` array, three "how it works" steps from `STEPS`, and a CTA to report an issue.

### `HowItWorksPage.jsx` (`/how-it-works`)
Static timeline page from the `STEPS` array: Report → AI analysis → Community votes → Officials act → Resolved, with a CTA.

### `PrivacyPage.jsx` (`/privacy`)
Static privacy policy rendered from the `SECTIONS` array (8 sections covering data collection, usage, AI analysis, sharing, photos/locations, retention, rights, contact).

### `NotFoundPage.jsx` (`*`)
Simple EmptyState: "Page not found" with a back-to-home action.

---

# PART C — DATABASE SCHEMAS (Summary)

```
User {
  _id, name, email (unique), password (bcrypt hash),
  role: resident|official|admin,
  createdAt, updatedAt
}

Issue {
  _id,
  title, description,
  category: infrastructure|safety|environment|utilities|transportation|other,
  status: pending|in-progress|resolved|closed,
  location: { type: 'Point', coordinates: [lng, lat], address },
  author: ObjectId(User),
  votes: [ObjectId(User)],
  voteCount: Number,
  aiPriority: Number (1-10),
  aiSuggestions: [String],
  images: [String],
  comments: [{ user: ObjectId(User), text, createdAt }],
  createdAt, updatedAt
  INDEX: 2dsphere on location
}

Notification {
  _id, user: ObjectId(User), issue: ObjectId(Issue)?, message: String,
  type: status-change|new-comment|issue-resolved|vote|system,
  isRead: Boolean,
  createdAt, updatedAt
  INDEX: { user: 1, createdAt: -1 }
}

Contact {
  _id, name, email, subject, message, isRead: Boolean,
  createdAt, updatedAt
}
```

---

# PART D — END-TO-END SCENARIOS (Viva-style explanations)

### Scenario 1: A resident reports an issue
1. User fills the form on `/create` → `handleSubmit` builds a multipart `FormData` (text fields + `location` JSON + images) and POSTs `/api/issues` with the JWT.
2. Server: `auth` middleware verifies the token → `upload.array('images', 5)` saves photos → `validate` checks title/description/category → location is parsed & validated → `Issue` is saved → 201 response with the populated issue.
3. Meanwhile `runAnalysis(issue)` calls Gemini (priority + up to 3 solutions). The AI result is written back to the same issue document asynchronously.
4. The frontend shows a success toast ("Gemini AI is analyzing it now") and navigates to `/community`, where the new issue appears on the map and list (default sort = most voted).

### Scenario 2: AI analysis works
- `analyzeIssue` builds a prompt with title/description/category/voteCount and asks for JSON. `generateContent` returns text → `extractJson` parses it (handles code fences and stray text) → `sanitize` clamps priority to 1–10 and keeps ≤3 non-empty suggestions. If the API key is missing, the request times out, or the response is malformed, the function returns `null` and the issue simply keeps its default priority of 5.

### Scenario 3: Voting
1. `IssueCard`/detail page calls `POST /issues/:id/vote`.
2. Server toggles the user id in `issue.votes` and adjusts `voteCount`. If it's a new vote from someone other than the author, a `vote` Notification is created (only if there isn't an unread one already, to avoid spam).
3. `runAnalysis(issue)` runs again — Gemini now sees the updated `voteCount` (community demand) and may raise the priority score.
4. The client swaps the returned issue into its list, so the vote count and priority bar update instantly.

### Scenario 4: Official changes status
1. On the issue detail page, an official clicks a step in the `StatusStepper` → `handleStatusChange` PUTs `{ status }`.
2. Server checks the editor is official/admin (residents cannot change status), updates the issue, and creates a `status-change` Notification for the author. If the new status is `resolved`, a second `issue-resolved` Notification is created.
3. The author sees the badge update in the navbar (polled every 30 s) and in `/notifications`.

### Scenario 5: Comments & notifications
- Comment POST pushes a subdocument and (if the commenter isn't the author) creates a `new-comment` Notification. The returned issue is fully populated so commenter names render.

### Scenario 6: Admin management
- Admin dashboard loads `/admin/stats` and `/admin/users`. Admins can flip any user between resident/official/admin (except themselves and the last admin), and delete users (cleaning up their issues, images, votes, comments, and notifications). Admin can also delete any issue as spam.

### Scenario 7: Geospatial search
- `GET /api/issues/nearby/:lng/:lat?maxDistance=5000` uses the `2dsphere` index with `$near` to return issues within the radius — the building block for "issues near me".

---

# PART E — ENVIRONMENT VARIABLES (`.env`)

| Variable | Default / Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend port. |
| `MONGODB_URI` | `mongodb://localhost:27017/civicvoice` | MongoDB connection string. |
| `JWT_SECRET` | — | Secret used to sign/verify JWT tokens. |
| `GEMINI_API_KEY` | — | Google Gemini API key (analysis is skipped if missing). |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Which Gemini model to use. |
| `CORS_ORIGIN` | (optional) | Comma-separated allowed origins. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | defaults in seed script | Used by `npm run seed:admin`. |

---

# PART F — HOW TO RUN

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run seed:admin     # optional: create the admin account
npm run dev            # http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev            # http://localhost:3000 (proxies /api to :5000)
```
