# FlowBoard

A collaborative workspace for small teams to organize projects, assign work, track progress, and communicate around individual tasks.

## Project Overview

FlowBoard is a modern, portfolio-quality project management tool designed for CodeAlpha Full Stack Development Task 3. It enables teams to collaborate in real-time through project boards, task assignment, and team communication features.

### Core Features

- **User Authentication**: Secure registration and login with JWT/session-based auth
- **Project Management**: Create, manage, and share projects with team members
- **Collaborative Boards**: Kanban-style task boards with drag-and-drop support
- **Task Management**: Create, assign, and track tasks with priority and due dates
- **Team Communication**: Comments and activity history on tasks
- **Notifications**: Real-time alerts for task assignments and updates

### Bonus Features

- Real-time updates using WebSockets (Socket.io)
- Advanced filtering and search

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod (validation)

### Infrastructure
- PostgreSQL database
- JWT authentication
- Socket.io (bonus)

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Clone Repository

```bash
git clone https://github.com/Vibrano2/CodeAlpha_FlowBoard.git
cd CodeAlpha_FlowBoard
```

### Environment Configuration

#### Backend (.env)

Create a `.env` file in the `backend` directory:

```env
# Server
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flowboard

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:5173

# Session
SESSION_SECRET=your-session-secret
```

#### Frontend (.env)

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Database Setup

```bash
# From backend directory
cd backend
npm install
npx prisma migrate dev --name init
```

This will:
- Install dependencies
- Create the PostgreSQL database
- Run migrations
- Generate Prisma Client

### Running the Application

#### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Backend runs at `http://localhost:5000`

#### Terminal 2 - Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Project Structure

```
CodeAlpha_FlowBoard/
├── backend/
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── validators/        # Input validation (Zod)
│   │   ├── database/          # Database utilities
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Server entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── .env.example
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## API Overview

All endpoints prefixed with `/api/v1`

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Users

- `GET /users/me` - Get user profile
- `PATCH /users/me` - Update profile
- `GET /users/search` - Search users by email

### Projects

- `GET /projects` - List user projects
- `POST /projects` - Create project
- `GET /projects/:projectId` - Get project details
- `PATCH /projects/:projectId` - Update project
- `DELETE /projects/:projectId` - Delete project

### Members

- `GET /projects/:projectId/members` - List project members
- `POST /projects/:projectId/members` - Add member
- `DELETE /projects/:projectId/members/:userId` - Remove member

### Tasks

- `GET /projects/:projectId/tasks` - List project tasks
- `POST /projects/:projectId/tasks` - Create task
- `GET /tasks/:taskId` - Get task details
- `PATCH /tasks/:taskId` - Update task
- `DELETE /tasks/:taskId` - Delete task
- `PATCH /tasks/:taskId/status` - Change task status
- `PATCH /tasks/:taskId/assignee` - Assign task

### Comments

- `GET /tasks/:taskId/comments` - List comments
- `POST /tasks/:taskId/comments` - Add comment
- `PATCH /comments/:commentId` - Edit comment
- `DELETE /comments/:commentId` - Delete comment

### Activity

- `GET /projects/:projectId/activity` - Get project activity

### Notifications

- `GET /notifications` - List notifications
- `PATCH /notifications/:notificationId/read` - Mark read
- `PATCH /notifications/read-all` - Mark all read

## Security Notes

- Passwords are securely hashed using bcrypt
- Authentication uses HTTP-only cookies with SameSite settings
- All user input is validated server-side using Zod
- Authorization is enforced on every endpoint
- CORS is properly configured
- Sensitive data (passwords, tokens) are never exposed in API responses
- Environment variables are used for secrets

## Testing

Run automated tests:

```bash
cd backend
npm run test

cd ../frontend
npm run test
```

Manual verification checklist in TESTING.md

## Deployment

### Environment Variables

Ensure all production environment variables are properly set before deploying.

### Build Frontend

```bash
cd frontend
npm run build
```

Output in `dist/`

### Build Backend

```bash
cd backend
npm run build
```

## Development Milestones

- [ ] Milestone 1: Foundation ✅
- [ ] Milestone 2: Authentication
- [ ] Milestone 3: Projects
- [ ] Milestone 4: Members
- [ ] Milestone 5: Board and Tasks
- [ ] Milestone 6: Comments and Activity
- [ ] Milestone 7: Search and Notifications
- [ ] Milestone 8: UI Polish
- [ ] Milestone 9: Security and QA
- [ ] Milestone 10: WebSockets (Bonus)

## Demo Credentials

Demo credentials will be provided after full implementation and testing.

## License

Private project for CodeAlpha internship.

## Author

Vibrano2 - CodeAlpha Full Stack Internship

---

**Status**: Milestone 1 - Foundation in progress
