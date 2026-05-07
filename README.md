<div align="center">

# TaskFlow - Team Task Manager

A full-stack team task management application with role-based access control, Kanban boards, real-time progress tracking, and collaborative workflows.

**[🌐 Live Demo](https://taskflow-frontend-production-6a65.up.railway.app)** · **[🎥 Demo Video](#)** ·
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb&logoColor=white)
![Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=flat&logo=railway&logoColor=white)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Role-Based Access Control](#role-based-access-control)
- [Deployment](#deployment)

---

## Overview

TaskFlow lets teams create projects, assign tasks, and track progress — all with proper role-based access control. Admins manage the project and team, Members handle tasks. Every change is logged, overdue tasks are auto-detected, and the dashboard gives a live summary across all your projects.

Built with a clean separation between backend and frontend inside a single monorepo, deployed independently on Railway.

---

## Features

### Authentication
- JWT-based signup and login
- Protected routes on both frontend and backend
- Persistent sessions via localStorage
- Auto-logout on token expiry

### Projects
- Create projects with name, description, color, and due date
- Per-project completion progress bar (auto-calculated from task statuses)
- View all projects you're a member of at a glance
- Archive or delete projects (Admin only)

### Team Management
- Invite members by email
- Two roles: **Admin** and **Member**
- Admins can change member roles or remove them
- Project owner is protected from removal

### Tasks
- Create tasks with title, description, priority, assignee, due date, and tags
- Four status stages: **To Do → In Progress → In Review → Done**
- Kanban board view and List view per project
- Inline task editing — update any field without a page reload
- Comment threads directly on tasks
- Full activity log per task — every status, priority, and assignee change recorded

### Dashboard
- Stats across all projects: total tasks, assigned to you, completed, overdue
- Live overall progress bar
- Recent activity feed across all your projects

### My Tasks
- Personal view of every task assigned to you across all projects
- Filter by All, Active, Overdue, Done

### Overdue Detection
- Tasks past their due date are auto-flagged with a pulsing red indicator
- Overdue counts shown on the dashboard, project cards, and My Tasks view

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Custom CSS with CSS variables — no UI framework |
| HTTP Client | Axios with token interceptor |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Authentication | JSON Web Tokens (JWT) + bcryptjs |
| Validation | express-validator |
| Deployment | Railway (backend + frontend as separate services) |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   ├── User.js               # Schema with bcrypt password hashing
│   │   ├── Project.js            # Schema with embedded members array
│   │   └── Task.js               # Schema with comments + activity log
│   ├── routes/
│   │   ├── auth.js               # POST /signup, /login  GET /me
│   │   ├── projects.js           # Full CRUD + member management
│   │   ├── tasks.js              # Full CRUD + comments + dashboard stats
│   │   └── users.js              # User search + profile update
│   ├── middleware/
│   │   └── auth.js               # protect, requireProjectAdmin, requireProjectMember
│   ├── .env.example
│   ├── package.json
│   ├── railway.toml
│   └── server.js                 # Entry point — DB connect + middleware + routes
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Axios instance — attaches JWT, handles 401
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   └── Layout.jsx    # Sidebar navigation + page outlet
│   │   │   ├── tasks/
│   │   │   │   ├── TaskModal.jsx        # Full task detail — edit, comment, activity
│   │   │   │   └── CreateTaskModal.jsx  # New task form
│   │   │   └── ui/
│   │   │       └── Icons.jsx     # SVG icon components + badge/status helpers
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state + login/logout/signup
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ProjectPage.jsx   # Kanban board + list view + members tab
│   │   │   └── MyTasksPage.jsx
│   │   ├── App.jsx               # Route definitions + auth guards
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Full design system via CSS custom properties
│   ├── index.html
│   ├── vite.config.js            # Dev proxy /api → localhost:5000
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB URI — [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier works fine

### 1. Clone the repo

```bash
git clone https://github.com/arnavashta21/taskflow.git
cd taskflow
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Open .env and fill in MONGO_URI and JWT_SECRET
npm install
npm run dev
# API running at http://localhost:5000
```

### 3. Set up the frontend

```bash
# Open a new terminal
cd frontend
cp .env.example .env
# Leave VITE_API_URL empty for local dev — Vite proxies /api to :5000
npm install
npm run dev
# App running at http://localhost:5173
```

---

## Environment Variables

### `backend/.env`

```bash
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskflow
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### `frontend/.env`

```bash
VITE_API_URL=https://your-backend.railway.app/api
```

> Leave `VITE_API_URL` blank during local development. The Vite dev server automatically proxies all `/api` requests to `localhost:5000`.

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Private | Get current authenticated user |

### Projects

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | List all projects for current user |
| POST | `/api/projects` | Private | Create a new project |
| GET | `/api/projects/:id` | Member | Get single project with stats |
| PATCH | `/api/projects/:id` | Admin | Update project details |
| DELETE | `/api/projects/:id` | Admin | Delete project and all its tasks |
| POST | `/api/projects/:id/members` | Admin | Invite a member by email |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove a member |
| PATCH | `/api/projects/:id/members/:userId` | Admin | Change a member's role |

### Tasks

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks?project=id` | Member | Get all tasks for a project |
| GET | `/api/tasks/my` | Private | Get tasks assigned to current user |
| GET | `/api/tasks/dashboard` | Private | Get dashboard stats and recent activity |
| POST | `/api/tasks` | Member | Create a task |
| GET | `/api/tasks/:id` | Member | Get single task with full detail |
| PATCH | `/api/tasks/:id` | Member | Update task fields |
| DELETE | `/api/tasks/:id` | Member / Admin | Delete a task |
| POST | `/api/tasks/:id/comments` | Member | Add a comment to a task |

### Users

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users/search?email=` | Private | Search users by email for invites |
| PATCH | `/api/users/me` | Private | Update own profile |

---

## Role-Based Access Control

| Action | Admin | Member |
|--------|:-----:|:------:|
| View project and tasks | ✅ | ✅ |
| Create tasks           | ✅ | ✅ |
| Update any task        | ✅ | ✅ |
| Delete own task        | ✅ | ✅ |
| Delete any task        | ✅ | ❌ |
| Add comments           | ✅ | ✅ |
| Invite members         | ✅ | ❌ |
| Remove members         | ✅ | ❌ |
| Change member roles    | ✅ | ❌ |
| Update project details | ✅ | ❌ |
| Delete project         | ✅ | ❌ |

Access is enforced on the backend via middleware — not just hidden in the UI.

---

## Deployment

Both services are deployed separately on [Railway](https://railway.app) from this monorepo.

### Backend

1. New Railway project → **Deploy from GitHub** → select this repo
2. Set **Root Directory** to `backend`
3. Railway auto-detects Node.js and runs `npm start`
4. Add environment variables:

```
MONGO_URI        your MongoDB Atlas connection string
JWT_SECRET       a long random secret string
JWT_EXPIRES_IN   7d
CLIENT_URL       https://your-frontend.railway.app
```

### Frontend

1. New Railway service → same repo
2. Set **Root Directory** to `frontend`
3. Set build command to `npm run build`, publish directory to `dist`
4. Add environment variable:

```
VITE_API_URL     https://your-backend.railway.app/api
```

> Make sure to set `CLIENT_URL` on the backend to match your frontend's Railway URL, otherwise CORS will block requests.

---

<div align="center">

Built by **Arnav Ashta**

</div>
