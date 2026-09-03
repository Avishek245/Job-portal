# Job Portal - 3 Tier Application

A learning-focused three-tier Job Portal application:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL

This project intentionally contains **no Docker, Docker Compose, Kubernetes, Terraform, or CI/CD configuration**. Those are to be added separately as part of the DevOps practical.

## Structure

```text
job-portal-3tier/
├── frontend/
├── backend/
└── database/
```

## Local prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

## Database setup

Create a PostgreSQL database named `job_portal`.

Then run:

```bash
psql -U postgres -d job_portal -f database/schema.sql
psql -U postgres -d job_portal -f database/seed.sql
```

## Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and update the PostgreSQL credentials.

Then:

```bash
npm run dev
```

Backend: `http://localhost:5000`

Health check:

`GET /api/health`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

The frontend reads `VITE_API_URL` from its environment.

## Demo accounts

- Employer: `employer@example.com` / `Password123!`
- Job seeker: `jobseeker@example.com` / `Password123!`

Change these credentials before using the application anywhere public.

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `GET /api/companies`
- `GET /api/companies/:id`
- `POST /api/companies`
- `PUT /api/companies/:id`
- `DELETE /api/companies/:id`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `GET /api/applications`
- `GET /api/applications/:id`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`

