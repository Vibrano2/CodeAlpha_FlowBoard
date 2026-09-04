# FlowBoard

FlowBoard is a collaborative project management workspace for small teams. It is being built for **CodeAlpha Full Stack Development Task 3** and will let teams organize projects, assign work, track task progress, and communicate around individual tasks.

## Project status

Milestones 1 through 7 establish the technical foundation, secure authentication, project and member management, the task lifecycle, comments, activity history, task discovery, and in-app notifications. Responsive polish, final security QA, and real-time updates remain reserved for their specified milestones.

| Milestone | Status |
| --- | --- |
| 1. Foundation | Complete |
| 2. Authentication | Complete |
| 3. Projects | Complete |
| 4. Members | Complete |
| 5. Board and tasks | Complete |
| 6. Comments and activity | Complete |
| 7. Search and notifications | Complete |
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

## Milestone 2 features

- User database model and PostgreSQL migration
- Secure registration with normalized unique email addresses
- bcrypt password hashing with no password hashes in API responses
- Generic login failures that do not reveal account existence
- Signed JWT sessions stored in HTTP-only, SameSite cookies
- Production-only Secure cookie enforcement
- Current-session and logout endpoints
- Authentication middleware that clears invalid or expired cookies
- Rate limiting on registration and login endpoints
- CORS and Origin validation for browser state-changing requests
- Responsive login and registration screens with accessible form controls
- Protected dashboard routes and automatic unauthenticated redirects
- Authenticated user identity and logout in the application shell
- Honest authenticated-dashboard empty states without fabricated statistics

## Milestone 3 features

- Project, project membership, board, and activity database entities
- Project creation that atomically creates owner membership, the default board, and `PROJECT_CREATED` activity
- Membership-scoped project listing and project detail access
- Owner-only project editing and permanent deletion
- Central project access checks that prevent inaccessible project ID disclosure
- Cascading cleanup for project memberships, boards, and activity records
- Real owned and shared project counts on the dashboard
- Responsive project listing, creation, overview, and settings screens
- Required confirmation before project deletion
- Loading, empty, and error states for project data
- Desktop and mobile project navigation

## Milestone 4 features

- Authenticated registered-user search by email with safe, limited output
- Project member listing for owners and members
- Owner-only member addition and removal enforced by the API
- Duplicate membership and nonexistent-user rejection
- Project owner self-removal protection
- Atomic `MEMBER_ADDED` and `MEMBER_REMOVED` activity recording
- Immediate project access revocation after membership removal
- Responsive Members screen with textual owner/member roles
- Owner-aware user search and add controls
- Removal confirmation and member-list refresh
- Read-only member experience for non-owners

## Milestone 5 features

- PostgreSQL task model with UUID identifiers, workflow enums, relationships, and query indexes
- One main Kanban board per project with To Do, In Progress, Review, and Completed columns
- Membership-authorized board and task APIs with task-level IDOR protection
- Task creation, detail, editing, deletion, assignment, priority, and due dates
- Assignee validation that rejects users outside the project
- Atomic task creation and update activity records
- `completedAt` handling when tasks enter or leave Completed
- Automatic unassignment of a removed member's project tasks
- Always-available status selectors for keyboard, touch, and mobile use
- Compact task cards with textual priority, assignee, due-soon, and overdue indicators
- Full-page responsive task detail and editing experience
- Assigned-task dashboard statistics and a cross-project My Tasks screen
- Loading, empty, error, and destructive-action confirmation states

## Milestone 6 features

- PostgreSQL comment model with task and author relationships
- Project-member-only task comment access
- Comment creation with whitespace rejection and bounded content
- Author-only comment editing and deletion enforced by the API
- Atomic comment creation and server-generated `COMMENT_ADDED` activity
- Project activity endpoint with optional project-validated task filtering
- Bounded activity history with safe actor and task summaries
- Responsive task discussion interface with loading, empty, and error states
- Project-wide and task-specific activity interfaces
- Comment counts on Kanban task cards with cache-safe updates
- Confirmation before comment deletion

## Milestone 7 features

- Project-authorized task title search with case-insensitive matching
- Combinable status, priority, assignee, and due-date-state filters
- Overdue, due-soon, and no-due-date filtering that excludes completed work where appropriate
- Filter-aware board result counts, clear controls, and a distinct no-results state
- PostgreSQL notification model with user ownership and optional project/task references
- Atomic notifications for project invitations, task assignments, status changes, and comments
- Relevant task notifications for distinct creators and assignees without notifying the actor
- Authenticated notification list with unread count and a 100-record response bound
- Ownership-scoped mark-one-read and mark-all-read endpoints
- Responsive Notifications screen with read/unread text, related-resource navigation, and honest empty/error states
- Unread notification badges in desktop and mobile navigation

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
- bcrypt
- JSON Web Tokens in HTTP-only cookies

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
│   │   ├── prisma/              # Prisma schema and versioned migrations
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
| `JWT_SECRET` | Yes | `replace-with-at-least-32-random-characters` | Secret used to sign authentication tokens |
| `AUTH_COOKIE_NAME` | No | `flowboard_session` | HTTP-only session cookie name |
| `AUTH_TOKEN_TTL` | No | `7d` | Authentication token lifetime |

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
npm run db:migrate
npm run db:check
```

The versioned migrations create the user, project, membership, board, task, comment, activity, and notification tables required through Milestone 7.

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

Run the complete verification suite:

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

Controllers remain thin, services contain business logic, and database access is isolated behind the Prisma client. Reusable project access services enforce membership and owner rules before protected operations.

### Authentication endpoints

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public, rate limited | Create an account and authenticated session |
| `POST` | `/api/v1/auth/login` | Public, rate limited | Authenticate with email and password |
| `POST` | `/api/v1/auth/logout` | Cookie optional | Clear the current session cookie |
| `GET` | `/api/v1/auth/me` | Required | Return the authenticated user |

### Project endpoints

| Method | Endpoint | Authorization | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/projects` | Authenticated user | List projects where the user is a member |
| `POST` | `/api/v1/projects` | Authenticated user | Create a project and become its owner |
| `GET` | `/api/v1/projects/:projectId` | Project member | Return an accessible project |
| `PATCH` | `/api/v1/projects/:projectId` | Project owner | Update project name or description |
| `DELETE` | `/api/v1/projects/:projectId` | Project owner | Permanently delete the project |

### User and member endpoints

| Method | Endpoint | Authorization | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/users/search?email=` | Authenticated user | Search registered users by email |
| `GET` | `/api/v1/projects/:projectId/members` | Project member | List project members |
| `POST` | `/api/v1/projects/:projectId/members` | Project owner | Add a registered user as a member |
| `DELETE` | `/api/v1/projects/:projectId/members/:userId` | Project owner | Remove a project member |

### Board and task endpoints

| Method | Endpoint | Authorization | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/projects/:projectId/board` | Project member | Return the project's main board |
| `GET` | `/api/v1/projects/:projectId/tasks` | Project member | List or filter project tasks by title, status, priority, assignee, and due state |
| `POST` | `/api/v1/projects/:projectId/tasks` | Project member | Create a task on the project board |
| `GET` | `/api/v1/tasks` | Authenticated user | List tasks assigned to the current user in accessible projects |
| `GET` | `/api/v1/tasks/:taskId` | Project member | Return an accessible task |
| `PATCH` | `/api/v1/tasks/:taskId` | Project member | Update task fields through shared service logic |
| `DELETE` | `/api/v1/tasks/:taskId` | Project member | Delete a task |
| `PATCH` | `/api/v1/tasks/:taskId/status` | Project member | Change task status |
| `PATCH` | `/api/v1/tasks/:taskId/assignee` | Project member | Assign or unassign a project member |

### Comment and activity endpoints

| Method | Endpoint | Authorization | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/tasks/:taskId/comments` | Project member | List task comments |
| `POST` | `/api/v1/tasks/:taskId/comments` | Project member | Add a comment and record activity |
| `PATCH` | `/api/v1/comments/:commentId` | Comment author | Edit an owned comment |
| `DELETE` | `/api/v1/comments/:commentId` | Comment author | Delete an owned comment |
| `GET` | `/api/v1/projects/:projectId/activity` | Project member | List server-generated project activity |
| `GET` | `/api/v1/projects/:projectId/activity?taskId=` | Project member | List activity for a task in that project |

### Notification endpoints

| Method | Endpoint | Authorization | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/notifications` | Authenticated user | List the current user's notifications and unread count |
| `PATCH` | `/api/v1/notifications/:notificationId/read` | Notification owner | Mark one owned notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated user | Mark all current-user notifications as read |

## Security foundation

- secrets and local environment files are Git-ignored
- environment input is validated at startup
- CORS accepts only configured client origins
- Helmet applies standard HTTP security headers
- request bodies are limited to 1 MB
- Express implementation details are disabled
- internal stack traces are not returned in production responses
- Prisma uses parameterized database operations
- passwords are hashed with bcrypt and never returned
- signed authentication tokens are stored only in HTTP-only cookies
- authentication cookies use SameSite protection and Secure in production
- registration and login are rate limited
- unsafe browser requests reject untrusted origins
- invalid and expired authentication returns `401` and clears the cookie
- every project lookup is scoped through server-side membership checks
- inaccessible project identifiers return `404` without revealing project existence
- project settings and deletion require both owner membership and matching ownership
- member changes repeat owner authorization on the server
- duplicate memberships and owner removal are rejected
- user search never returns password hashes or authentication data
- task access is derived from the stored task project, never a client-supplied project ID
- task assignees must have a current membership in the same project
- member removal unassigns affected project tasks before revoking access
- comment ownership is verified after project access to avoid disclosing inaccessible records
- activity records are generated by backend services and cannot be submitted directly by clients
- task filters are applied only after project membership authorization
- notification queries and mutations are always scoped to the authenticated user
- notification records are generated only by backend business actions
- notification event transactions avoid unnecessary notifications to the actor

## Deployment

Deployment URLs will be added after the core application passes the security and QA milestone. No production deployment or demo credentials exist yet.

## CodeAlpha submission

- **Program:** CodeAlpha Full Stack Development Internship
- **Task:** Task 3, Project Management Tool
- **Project:** FlowBoard
- **Repository:** `CodeAlpha_FlowBoard`

Screenshots and the final feature/API overview will be added when the corresponding user flows are complete and verified.
