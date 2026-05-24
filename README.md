# Webingo Project Management Platform

A **production-ready Real-Time Collaborative Project Management Platform** built with the MERN stack. Features JWT authentication with refresh tokens, role-based access control (RBAC), real-time collaboration via Socket.io, file uploads to Cloudinary, and a responsive dark-mode UI.

---

## 🏗️ Architecture

```
webingo-project-management/
├── server/                   # Express.js REST API + Socket.io
│   ├── config/               # Database connection
│   ├── controllers/          # Route handlers (thin — business logic in services)
│   ├── middlewares/          # auth, RBAC, upload, error handler
│   ├── models/               # Mongoose schemas (User, Project, Task, ActivityLog, Invitation)
│   ├── routes/               # Express routers
│   ├── services/             # Socket.io, Cloudinary, Email
│   ├── utils/                # AppError, asyncHandler, paginate
│   └── __tests__/            # Jest + Supertest integration tests
└── client/                   # React.js SPA (Create React App)
    └── src/
        ├── components/       # Sidebar, Modal, Toast, Skeleton, ErrorBoundary, ActivityLog
        ├── hooks/            # useSocket (Socket.io client with auto-reconnect)
        ├── pages/            # Login, Register, Dashboard, Projects, ProjectDetail, Invite, ...
        ├── services/         # Axios instance with auto token refresh interceptor
        └── store/            # Redux Toolkit (auth, projects, tasks slices)
```

### Architectural Decisions

| Decision | Rationale |
|---|---|
| Separate JWT access + refresh tokens | Short-lived access tokens (1h) minimize exposure; refresh tokens (7d) stored server-side for revocation |
| Socket.io rooms per project | Broadcasts only reach relevant users — efficient, no global subscriptions |
| Cloudinary for file storage | Avoids filesystem complexity on cloud hosts; provides CDN delivery |
| Redux Toolkit slices | Normalized state with `createAsyncThunk` keeps async logic clean and testable |
| Multer memory storage | Files are streamed directly to Cloudinary without touching disk |
| RBAC per project (not global) | Users can have different roles in different projects — true multi-tenant RBAC |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account (free tier)
- Gmail account with App Password enabled

### 1. Clone the repository
```bash
git clone https://github.com/Bhim-Mridha62/webingo-project-management.git
cd webingo-project-management
```

### 2. Backend setup
```bash
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Frontend setup
```bash
cd client
cp .env.example .env
# Ensure REACT_APP_API_URL points to your backend
npm install
npm start
```

---

## 🔐 Environment Variables

### `server/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Access token signing secret | any long random string |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | any long random string |
| `JWT_EXPIRES_IN` | Access token expiry | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `dr0r0utwp` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `411713...` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `tgOFGH...` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Gmail address | `you@gmail.com` |
| `SMTP_PASS` | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_FROM` | From address in emails | `you@gmail.com` |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:3000` |

### `client/.env`

| Variable | Description | Example |
|---|---|---|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `REACT_APP_SOCKET_URL` | Socket.io server URL | `http://localhost:5000` |

---

## 📡 API Documentation

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT pair |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Invalidate refresh token |
| GET  | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/forgot-password` | ❌ | Send password reset email |
| PUT  | `/api/auth/reset-password/:token` | ❌ | Reset password |

### Projects
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/projects` | ✅ | Any |
| GET  | `/api/projects` | ✅ | Any |
| GET  | `/api/projects/:id` | ✅ | Member |
| PUT  | `/api/projects/:id` | ✅ | Admin |
| DELETE | `/api/projects/:id` | ✅ | Admin |
| POST | `/api/projects/:id/members` | ✅ | Admin |
| DELETE | `/api/projects/:id/members/:memberId` | ✅ | Admin |
| POST | `/api/projects/:id/invite` | ✅ | Admin |
| GET  | `/api/projects/invite/:token` | ✅ | Any |
| GET  | `/api/projects/:id/activity` | ✅ | Member |
| GET  | `/api/projects/:id/stats` | ✅ | Member |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/tasks` | ✅ | Create task (multipart/form-data) |
| GET  | `/api/tasks?projectId=` | ✅ | Get tasks with optional filters |
| PUT  | `/api/tasks/:id` | ✅ | Update task + attachments |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |
| PUT  | `/api/tasks/bulk/status` | ✅ | Bulk status update |
| POST | `/api/tasks/bulk/delete` | ✅ | Bulk delete |

#### Example: Create Task (multipart)
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -F "projectId=<id>" \
  -F "title=Fix login bug" \
  -F "priority=High" \
  -F "status=Todo" \
  -F "attachments=@/path/to/file.pdf"
```

---

## 🔄 Real-Time Events (Socket.io)

| Event (Client → Server) | Payload | Description |
|---|---|---|
| `join_project` | `projectId` | Join project room |
| `leave_project` | `projectId` | Leave project room |
| `editing_task` | `{ projectId, taskId }` | Broadcast editing indicator |
| `stop_editing_task` | `{ projectId, taskId }` | Clear editing indicator |

| Event (Server → Client) | Payload | Description |
|---|---|---|
| `task_created` | Task object | New task added to project |
| `task_updated` | Task object | Task modified |
| `task_deleted` | `taskId` | Task removed |
| `active_users` | Array of users | Who's in the room |
| `user_joined` | `{ userName }` | User joined project room |
| `user_left` | `{ userName }` | User left room |
| `user_editing` | `{ taskId, userName }` | Collaboration indicator |

---

## 🧪 Running Tests

```bash
cd server
npm test
```

Tests cover:
- ✅ User registration + duplicate detection
- ✅ Login with valid/invalid credentials
- ✅ JWT refresh token flow
- ✅ Protected route authorization
- ✅ Task CRUD (create, read, update, delete)
- ✅ File upload size limit enforcement
- ✅ File type validation (MIME check)

---

## 🚀 Deployment Guide

### Backend (Railway / Render)
1. Push code to GitHub
2. Create new service → connect repo → set root to `/server`
3. Add all environment variables from `server/.env`
4. Set start command: `node index.js`

### Frontend (Vercel / Netlify)
1. Create new project → connect repo → set root to `/client`
2. Add `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` pointing to deployed backend
3. Deploy (build command: `npm run build`, output: `build/`)

---

## ⚡ Trade-offs & What I'd Improve

### Trade-offs made under time constraints
- **No Redis caching** — in-memory fallback is fine for < 1000 users; Redis would be added for production scale
- **No WebRTC** — cursor-level collaboration not implemented; activity indicators via Socket.io suffice
- **No task comments** — the data model supports it (add a `comments` field) but UI not built

### What I'd add with more time
1. **Redis** for refresh token blacklisting and API response caching
2. **Task comments with @mentions** + mention notifications
3. **CSV / JSON export** of tasks per project
4. **E2E tests** with Cypress / Playwright
5. **Docker Compose** for local dev (mongo + server + client)
6. **Optimistic updates** on more operations (currently on task events from socket)
7. **File preview** in task modal for images

---

## 🛡️ Security Measures

- Passwords hashed with bcrypt (12 salt rounds)
- JWT access tokens expire in 1 hour
- Rate limiting: 10 requests / 15 min on auth endpoints
- Helmet.js security headers on all responses
- CORS restricted to `CLIENT_URL` only
- File type whitelist (images, PDFs, Word docs only)
- File size limit: 5 MB per file
- XSS protection via Helmet `xssFilter`
- Input validation on critical endpoints via express-validator
- RBAC enforced server-side on every protected route
