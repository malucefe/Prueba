# Caudo — Personal Finance Manager

A full-stack personal finance management app with automated recommendations, goal
tracking, and n8n-powered workflows. Built with Angular 21 SSR, NestJS,
PostgreSQL, and n8n.

## Architecture

```
Caudo/
├── CaudoFront/            # Angular 21 SSR frontend
│   └── src/
│       └── app/
│           ├── core/      # Services, guards, interceptors, models
│           ├── features/  # Lazy-loaded feature modules
│           │   ├── auth/          # Login / Register
│           │   ├── dashboard/     # Financial dashboard
│           │   ├── transactions/  # Income & expense CRUD
│           │   ├── goals/         # Savings goals tracker
│           │   └── profile/       # User profile
│           └── shared/    # Reusable components & pipes
├── caudo-back/            # NestJS REST API
│   └── src/
│       ├── auth/          # JWT auth (login, register, guards)
│       ├── users/         # User profile & management
│       ├── transactions/  # Income & expense endpoints
│       ├── categories/    # Transaction categories
│       ├── goals/         # Savings goals CRUD
│       ├── recommendations/ # Recommendations endpoints
│       ├── files/         # File upload (receipts, docs)
│       ├── seed/          # Database seeding
│       └── common/        # Filters, shared utilities
├── database/              # SQL seed files (Postgres init scripts)
├── n8n/                   # n8n automation workflows
├── scripts/               # Utility scripts (backup, etc.)
├── docker-compose.yml     # Full-stack orchestration
└── .github/workflows/     # CI/CD pipeline
```

## Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Frontend      | Angular 21, SSR, Standalone Components, Signals, Vitest       |
| Backend       | NestJS 11, TypeORM, PostgreSQL 16, JWT Auth, Swagger          |
| Automation    | n8n workflows (recommendations engine)                        |
| Infrastructure | Docker Compose, Node 22 Alpine                               |

## Prerequisites

- **Node.js** 22+
- **Docker** & Docker Compose V2
- **PostgreSQL** 16 (if running locally without Docker)
- **npm** (comes with Node.js)

## Quick Start

### 1. Clone & Environment

```bash
git clone <repo-url> Caudo
cd Caudo

# Backend environment
cp caudo-back/.env.example caudo-back/.env
# Edit caudo-back/.env with your real secrets
```

### 2. Database

**Option A — Docker (recommended)**

```bash
cp .env.docker.example .env.docker
# Edit .env.docker with your real secrets
docker compose up -d postgres
```

**Option B — Local PostgreSQL**

Create a database named `caudo` and configure `caudo-back/.env` accordingly.

### 3. Backend

```bash
cd caudo-back
npm install
npm run start:dev
```

The API is now running at **http://localhost:3000**.

### 4. Frontend

```bash
cd CaudoFront
npm install
npm start
```

Open **http://localhost:4200** in your browser.

### 5. n8n (optional, for AI-powered recommendations)

```bash
cp .env.docker.example .env.docker
docker compose up -d n8n
```

1. Open **http://localhost:5678** in your browser.
2. Log in with the credentials from `.env.docker`.
3. Import the workflow from `n8n/workflow.json` via **Settings → Import**.
4. Activate the imported workflow.

## Full Docker Deployment

```bash
cp .env.docker.example .env.docker
# Edit .env.docker with real secrets
docker compose --env-file .env.docker up -d
```

| Service | URL                        |
| ------- | -------------------------- |
| API     | http://localhost:3000      |
| App     | http://localhost:4000      |
| n8n     | http://localhost:5678      |

## API Documentation

Once the backend is running, Swagger UI is available at:

```
http://localhost:3000/api/docs
```

## Features

- 🔐 **JWT Authentication** with refresh tokens and rate limiting
- 💰 **Income & expense tracking** with categorized transactions
- 📊 **Financial dashboard** with interactive charts
- 🎯 **Savings goals** with progress tracking and auto-updates
- 🤖 **AI-powered recommendations** via n8n automation workflows
- 📎 **File uploads** (receipts, documents, profile avatars)
- 📱 **Responsive design** — mobile, tablet, and desktop
- 🌐 **SSR (Server-Side Rendering)** for fast initial loads and SEO

## Testing

```bash
# Backend (Jest)
cd caudo-back
npm test                # Unit tests
npm run test:cov        # Coverage report
npm run test:e2e        # End-to-end tests

# Frontend (Vitest via Angular test builder)
cd CaudoFront
npm test                # Unit tests
```

## Environment Variables

### Backend (`caudo-back/.env`)

| Variable          | Purpose                        | Required |
| ----------------- | ------------------------------ | -------- |
| `DB_HOST`         | PostgreSQL host                | Yes      |
| `DB_PORT`         | PostgreSQL port                | Yes      |
| `DB_USERNAME`     | Database user                  | Yes      |
| `DB_PASSWORD`     | Database password              | Yes      |
| `DB_NAME`         | Database name                  | Yes      |
| `JWT_SECRET`      | JWT signing secret (64+ chars) | Yes      |
| `JWT_EXPIRATION`  | Token expiry duration (e.g. `24h`) | Yes  |
| `NODE_ENV`        | Environment (`development`/`production`) | Yes |
| `N8N_WEBHOOK_URL` | n8n webhook endpoint           | No       |

### Docker Compose (`.env.docker`)

| Variable                | Purpose                          | Required   |
| ----------------------- | -------------------------------- | ---------- |
| `POSTGRES_USER`         | PostgreSQL superuser             | Yes        |
| `POSTGRES_PASSWORD`     | PostgreSQL password              | Yes        |
| `N8N_BASIC_AUTH_USER`   | n8n web UI username              | Yes (n8n)  |
| `N8N_BASIC_AUTH_PASSWORD` | n8n web UI password            | Yes (n8n)  |
| `N8N_ENCRYPTION_KEY`    | n8n credential encryption (32 chars) | Yes (n8n) |
| `JWT_SECRET`            | JWT signing secret (64+ chars)   | Yes        |
| `N8N_BASIC_AUTH_HEADER` | Basic auth header for webhook calls | Yes (n8n) |

## Database Backup

```bash
# Windows
.\scripts\backup-db.ps1

# Linux / macOS
./scripts/backup-db.sh
```

## Project Structure (Key Directories)

```
Caudo/
├── CaudoFront/src/app/
│   ├── core/models/              # TypeScript interfaces (Transaction, Goal, User…)
│   ├── core/services/            # HTTP services (auth, transactions, goals…)
│   ├── core/guards/              # Route guards (auth.guard.ts)
│   ├── core/interceptors/        # HTTP interceptors (auth, error)
│   ├── features/                 # Feature modules (lazy-loaded)
│   └── shared/components/        # Reusable UI: navbar, toast, loading, skeleton
├── caudo-back/src/
│   ├── auth/                     # JWT strategy, guards, login/register
│   ├── transactions/             # CRUD + DTOs + entity
│   ├── goals/                    # CRUD + DTOs + entity
│   ├── categories/               # CRUD + entity
│   ├── recommendations/          # Endpoints consumed by n8n
│   ├── users/                    # Profile endpoints
│   ├── files/                    # Multer-based file uploads
│   └── seed/                     # Database seed service
├── database/seed.sql             # Initial schema + seed data
├── n8n/workflow.json             # Recommendations workflow (import into n8n)
└── scripts/
    ├── backup-db.ps1             # Windows backup script
    └── backup-db.sh              # Unix backup script
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/).
4. Open a pull request against `develop`.

**Code style**: Backend uses ESLint + Prettier. Frontend uses Prettier. Run
`npm run lint` before committing.

## License

Private — all rights reserved.
