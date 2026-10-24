# CIVICVOICE - COMPREHENSIVE PROJECT DOCUMENTATION

## 1. ABSTRACT
CivicVoice is a citizen-engagement web application bridging citizens and local government. It enables reporting community issues with photos and geolocation, voting, commenting, and tracking resolution status. Google Gemini AI analyzes issues (priority 1-10, suggestions, solutions). Features OpenStreetMap visualization, role-based access (Resident/Official/Admin), notifications, and CivicBot. Built with React 18, Vite 6, Node.js, Express, MongoDB, Tailwind CSS 4.

## 2. INTRODUCTION
Web-based platform empowering residents to report civic issues (infrastructure, safety, environment, utilities, transportation, other), visualize on maps, engage via votes/comments, and track lifecycle Pending -> In Progress -> Resolved -> Closed.

## 3. OBJECTIVES (Implemented)
1. Issue reporting with location and images (up to 5)
2. Community voting and commenting
3. Interactive map with clustering and priority colors
4. AI-powered analysis via Gemini
5. Status tracking with update logs
6. Role-based access control
7. Secure JWT auth with OTP verification
8. In-app notifications
9. Admin dashboard for management

## 4. SCOPE
IN SCOPE: Auth (OTP), issue CRUD, maps, AI analysis, voting/comments, notifications, admin, profile, contact, chatbot widget, themes, responsive design.
OUT OF SCOPE: SMS, payments, multi-language, native mobile apps, external govt API integration.

## 5. TARGET AUDIENCE
Citizens/Residents, Government Officials, System Administrators, Community Members

## 6. TECHNOLOGY STACK
### Frontend
React 18.3.1, Vite 6.0.7, React Router 7.1.1, Tailwind CSS 4.3.3, Axios 1.7.9, Leaflet 1.9.4, React-Leaflet 4.2.1, leaflet.markercluster, Lucide React
### Backend
Node.js (>=18), Express 4.22.2, Mongoose 8.9.5, MongoDB
### Auth/Security
JWT (jsonwebtoken), bcryptjs, express-validator, express-rate-limit, CORS
### AI/Uploads/Email
@google/generative-ai, Multer, Nodemailer, ImageKit (optional)

## 7. DATABASE MODELS (Implemented)
- User: firstName, middleName, lastName, name, email(unique), password, countryCode, mobile, avatar, address{street,pincode,state,district}, consent, role, otp, otpExpires
- Issue: title, description, category, status, location{type:Point,coordinates,address}, state, author(ref User), votes[], voteCount, aiPriority, aiSuggestions[], aiSolution, images[], statusUpdates[], comments[], timestamps; 2dsphere index on location
- Otp: email, purpose, otp(hashed), expiresAt
- Notification: user(ref), issue(ref), message, type, isRead
- Contact: name, email, subject, message

## 8. API ENDPOINTS (Key)
Auth: POST /api/auth/send-register-otp, /register, /login, GET/PUT /api/auth/me, POST/DELETE /api/auth/avatar, POST /api/auth/forgot-password, /verify-otp, /reset-password, /send-password-otp, PUT /api/auth/password
Issues: GET/POST /api/issues, GET /api/issues/stats, /my, /nearby/:lng/:lat, GET/PUT/DELETE /api/issues/:id, POST /api/issues/:id/analyze, /vote, /comments
Notifications: GET /api/notifications, PUT /read, /read/:id, DELETE /:id
Admin: GET /api/admin/stats, /users, PUT /api/admin/users/:id/role, DELETE /api/admin/users/:id, /api/admin/issues/:id
Other: POST /api/contact, /api/upload, /api/chat

## 9. USER ROLES
resident (default), official (update status), admin (full management). Admin safeguards: cannot demote/delete last admin, cannot self-demote/delete.

## 10. SDLC
Planning -> Feasibility -> Requirement Gathering -> Analysis -> System Design -> Development -> Testing -> Implementation -> Deployment -> Maintenance. Followed iteratively.

## 11. DEPLOYMENT
Frontend: https://civicvoice-12.onrender.com | Backend: https://civicvoice-znpn.onrender.com | Repo: https://github.com/Atulpandey8100/civicvoice.git

## 12. LIMITATIONS & FUTURE ENHANCEMENTS (Proposed)
Limitations: ephemeral local uploads without disk, AI/chat fallbacks, in-app notifications only. Proposed: push/email notifications, advanced search, govt API integration, mobile apps, multi-language, issue assignment, real-time updates.

Note: This documentation is based strictly on the implemented codebase in C:\Users\atulp_5y4afxd\civicvoice-mine
