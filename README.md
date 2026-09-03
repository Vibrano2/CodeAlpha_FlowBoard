# FlowBoard

FlowBoard is a collaborative project management workspace for small teams. It is being built for **CodeAlpha Full Stack Development Task 3** and will let teams organize projects, assign work, track task progress, and communicate around individual tasks.

## Project status

Milestone 1 establishes the technical foundation only. Authentication, projects, members, tasks, comments, activity, notifications, and real-time updates are intentionally reserved for their specified milestones.

| Milestone | Status |
| --- | --- |
| 1. Foundation | Complete |
| 2. Authentication | Not started |
| 3. Projects | Not started |
| 4. Members | Not started |
| 5. Board and tasks | Not started |
| 6. Comments and activity | Not started |
| 7. Search and notifications | Not started |
| 8. UI and responsive polish | Not started |
| 9. Security and QA | Not started |
| 10. WebSockets bonus | Not started |

## Milestone 1 features

- npm workspace monorepo with clearly separated web and API applications
- React, Vite, TypeScript, Tailwind CSS, React Router, and TanStack Query frontend
- Node.js, Express, and TypeScript REST API
- PostgreSQL data source configured through Prisma ORM
- Prisma-generated typed PostgreSQL client
- Zod-based environment validation
- API security foundation with Helmet, explicit CORS, body-size limits, and production-safe errors
- Database-aware `GET /api/v1/health` endpoint
- Responsive, accessible FlowBoard application shell with honest empty states
- Automated API and frontend foundation tests
- Root scripts for development, type checking, testing, linting, and production builds

## Tech stack

### Frontend

- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS 4
- React Router 7
- TanStack Query 5

### Backend

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- Prisma ORM 6
- Zod

### Quality

- Vitest
- Testing Library
- Supertest
- Oxlint

## Repository structure

```text
CodeAlpha_FlowBoard/
├── apps/
│   ├── api/
│   │   ├── prisma/              # Prisma schema and future migrations
│   │   └── src/
│   │       ├── config/          # Validated runtime configuration
│   │       ├── controllers/     # HTTP request handlers
│   │       ├── database/        # Prisma client lifecycle
│   │       ├── middleware/      # Express error and request middleware
│   │       ├── routes/          # Versioned API routes
│   │       ├── services/        # Business and infrastructure logic
│   │       ├── scripts/         # Operational verification scripts
│   │       └── utils/           # Shared backend utilities
│   └── web/
│       └── src/
│           ├── components/      # Reusable UI components
│           ├── lib/             # API client and shared helpers
│           ├── pages/           # Route-level screens
│           ├── test/            # Frontend test setup
│           └── types/           # Frontend TypeScript contracts
├── compose.yaml                 # Optional local PostgreSQL service
├── package.json                 # Workspace scripts and tooling
└── tsconfig.base.json           # Shared strict TypeScript options
```

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- PostgreSQL 15 or newer, or Docker with Docker Compose

## Installation

Clone the repository and install all workspace dependencies:

```bash
git clone https://github.com/Vibrano2/CodeAlpha_FlowBoard.git
cd CodeAlpha_FlowBoard
npm install
```

Create local environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Environment files are ignored by Git. Never commit real credentials or secrets.

## Environment configuration

### API: `apps/api/.env`

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `PORT` | Yes | `4000` | API listen port |
| `DATABASE_URL` | Yes | `postgresql://flowboard:password@localhost:5432/flowboard?schema=public` | PostgreSQL connection string |
| `CLIENT_ORIGIN` | Yes | `http://localhost:5173` | Allowed browser origin; comma-separate multiple origins |

### Web: `apps/web/.env`

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | Yes | `http://localhost:4000/api/v1` | Versioned REST API base URL |

Only variables beginning with `VITE_` are exposed to browser code. Never put secrets in the web environment file.

## Database setup

### Option A: Docker Compose

Start the included local PostgreSQL service:

```bash
docker compose up -d postgres
```

The default API environment example already matches this local service. The password in `compose.yaml` is for local development only.

### Option B: Existing PostgreSQL

Create an empty `flowboard` database and replace `DATABASE_URL` in `apps/api/.env` with its connection string.

Then validate the Prisma schema, generate the client, and check the connection:

```bash
npm run db:validate
npm run db:generate
npm run db:check
```

Domain models and the first migration will be added with their implementation milestones. Milestone 1 uses a direct `SELECT 1` query to verify the database connection without introducing future entities early.

## Running FlowBoard

Start the frontend and backend together:

```bash
npm run dev
```

Or start them separately:

```bash
npm run dev:api
npm run dev:web
```

Local services:

- Web application: `http://localhost:5173`
- REST API: `http://localhost:4000/api/v1`
- Health endpoint: `http://localhost:4000/api/v1/health`

Example health response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "flowboard-api",
    "database": "connected",
    "timestamp": "2026-09-03T18:00:00.000Z",
    "uptime": 12
  }
}
```

The health endpoint returns HTTP `503` and `database: "unavailable"` when PostgreSQL cannot be reached.

## Quality checks

Run the complete Milestone 1 verification suite:

```bash
npm run check
```

Or run checks individually:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## API foundation

All API routes use the `/api/v1` prefix. Responses use a consistent JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found."
  }
}
```

Controllers remain thin, services contain business logic, and database access is isolated behind the Prisma client. Project-scoped authorization middleware and services will be introduced alongside the protected resources they govern.

## Security foundation

- secrets and local environment files are Git-ignored
- environment input is validated at startup
- CORS accepts only configured client origins
- Helmet applies standard HTTP security headers
- request bodies are limited to 1 MB
- Express implementation details are disabled
- internal stack traces are not returned in production responses
- Prisma uses parameterized database operations

Authentication rate limiting, password hashing, secure cookies, CSRF controls, and project authorization belong to Milestone 2 and later protected-resource milestones.

## Deployment

Deployment URLs will be added after the core application passes the security and QA milestone. No production deployment or demo credentials exist at Milestone 1.

## CodeAlpha submission

- **Program:** CodeAlpha Full Stack Development Internship
- **Task:** Task 3, Project Management Tool
- **Project:** FlowBoard
- **Repository:** `CodeAlpha_FlowBoard`

Screenshots and the final feature/API overview will be added when the corresponding user flows are complete and verified.
