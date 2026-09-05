# Job Portal — 3-Tier DevOps Project

A containerized, 3-tier Job Portal application built to demonstrate real-world DevOps practices: Docker multi-stage builds, Docker Compose orchestration, service networking, persistent storage, health checks, and cloud deployment on AWS EC2.

This is an original open-source-style application (not a forked/cloned project), built specifically to practice and showcase a complete DevOps workflow from local development through production deployment.

---

## Architecture

![alt text](<Untitled Diagram.drawio.png>)

```
Internet
   │  (port 80 only)
   ▼
┌─────────────────────────────────────────────┐
│  EC2 Instance (t2.micro)                     │
│  Security Group: SSH 22 (admin IP only),     │
│                   HTTP 80 (public)           │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Docker Network: jobportal-network       │ │
│  │                                           │ │
│  │  ┌───────────────────────────────────┐  │ │
│  │  │  Frontend (Nginx)                  │  │ │
│  │  │  Port 80 — public                  │  │ │
│  │  └────────────────┬────────────────────┘ │ │
│  │                    ▼                      │ │
│  │  ┌───────────────────────────────────┐  │ │
│  │  │  Backend (Node/Express)            │  │ │
│  │  │  Port 5000 — internal only         │  │ │
│  │  └────────────────┬────────────────────┘ │ │
│  │                    ▼                      │ │
│  │  ┌───────────────────────────────────┐  │ │
│  │  │  PostgreSQL 17                     │  │ │
│  │  │  Port 5432 — internal only         │  │ │
│  │  └────────────────┬────────────────────┘ │ │
│  │                    ▼                      │ │
│  │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │ │
│  │    Named volume: postgres-data          │ │
│  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

Only port 80 is publicly reachable. The backend and database never leave the internal Docker network — the security group has no rule for 5000 or 5432.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, served via Nginx |
| Backend | Node.js + Express, REST API |
| Database | PostgreSQL 17 |
| Auth | JWT |
| Containerization | Docker, multi-stage builds |
| Orchestration | Docker Compose |
| Cloud | AWS EC2 (Ubuntu) |

---

## Project Structure

```
job-portal-3tier/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── middleware/
│       └── routes/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   ├── package.json
│   └── src/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   └── architecture-diagram.png
├── .dockerignore
├── .env                  # not committed — see setup below
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Local Setup

### Prerequisites
- Docker Engine + Docker Compose plugin
- Git

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/job-portal-3tier.git
cd job-portal-3tier
```

### 2. Create the root `.env` file
This file is intentionally excluded from git. Create it manually:
```env
POSTGRES_DB=jobportal
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your-secure-password>
JWT_SECRET=<your-jwt-secret>
```

### 3. Build and start the stack
```bash
docker compose up -d --build
```

### 4. Verify containers are healthy
```bash
docker compose ps
```
All three services (`frontend`, `backend`, `db`) should show `healthy`.

### 5. Open the app
```
http://localhost
```

---

## Docker Design Decisions

### Multi-stage frontend build
The frontend Dockerfile uses a two-stage build: a Node stage compiles the Vite app, and only the static output (`dist/`) is copied into a final `nginx:alpine` image. This keeps the final image at **~29MB** instead of shipping `node_modules` and build tooling.

### Non-root backend container
The backend runs as a dedicated non-root user (`appuser`), not root, reducing the container's attack surface.

### Layer caching
Both Dockerfiles copy `package*.json` and install dependencies *before* copying application source code, so dependency layers are cached and only rebuild when `package.json` actually changes.

### Nginx as reverse proxy
The frontend container doesn't just serve static files — it also proxies any request under `/api/` to the backend container over the internal Docker network:
```nginx
location /api/ {
    proxy_pass http://backend:5000/api/;
}
```
This means the frontend never needs to know the backend's real network location — it always calls a relative `/api` path, and Nginx handles the routing.

### Service-name networking
Containers communicate using Docker Compose service names, not `localhost` or hardcoded IPs:
- Frontend → `backend:5000`
- Backend → `db:5432`

This only works because all three services share the custom `jobportal-network` bridge network, which provides internal DNS resolution.

### Port exposure
- `frontend`: `ports: "80:80"` — the only publicly published port
- `backend`: `expose: "5000"` — reachable only from other containers, never from the host
- `db`: `expose: "5432"` — reachable only from other containers, never from the host

### Persistent storage
PostgreSQL data is stored in a named Docker volume (`postgres-data`), decoupled from the container's lifecycle. Running `docker compose down && docker compose up -d` (without `-v`) recreates all containers while preserving all database data — verified during testing (row counts matched before and after).

### Health checks
All three services define a `healthcheck`:
- `db`: `pg_isready`
- `backend`: HTTP check against `/api/health`
- `frontend`: HTTP check against `127.0.0.1:80`

Compose's `depends_on: condition: service_healthy` ensures the backend doesn't start until Postgres is actually ready to accept connections, and the frontend doesn't start until the backend is confirmed healthy — avoiding race conditions during startup.

---

## EC2 Deployment

### Security Group Configuration

| Type | Protocol | Port | Source |
|---|---|---|---|
| SSH | TCP | 22 | Admin IP only (`x.x.x.x/32`) |
| HTTP | TCP | 80 | `0.0.0.0/0` (public) |

No inbound rule exists for ports 5000 or 5432 — the database and backend are never reachable from outside the EC2 instance, by design.

### Deployment Steps

1. Launch an Ubuntu EC2 instance with the security group above and a key pair for SSH access.
2. SSH into the instance:
   ```bash
   ssh -i your-key.pem ubuntu@<ec2-public-ip>
   ```
3. Install Docker:
   ```bash
   sudo apt-get update -y
   sudo apt-get install -y docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   ```
   Log out and back in for the group change to apply.
4. Clone the repository and recreate the `.env` file (same as local setup, step 2).
5. Build and start:
   ```bash
   docker compose up -d --build
   ```
6. Verify:
   ```bash
   docker compose ps
   ```
7. Access the live app at `http://<ec2-public-ip>`.

---

## Verifying Persistence

To prove the database survives container recreation:
```bash
docker compose down
docker compose up -d
docker exec -it jobportal-db psql -U postgres -d jobportal -c "SELECT COUNT(*) FROM jobs;"
```
Row counts should be identical before and after — the named volume is untouched by `docker compose down` (only `docker compose down -v` would delete it).

---

## Database Schema

Database name: `jobportal`

| Table | Purpose |
|---|---|
| `users` | User accounts and authentication |
| `companies` | Employer/company profiles |
| `jobs` | Job postings |
| `applications` | Job applications linking users to jobs |

Schema and seed data are automatically applied on first container startup via PostgreSQL's `docker-entrypoint-initdb.d/` mechanism (`database/schema.sql`, `database/seed.sql`).

---

## Brownie Points Implemented

- ✅ Non-root backend container
- ✅ Health checks on all three services with proper startup sequencing
- ✅ Multi-stage build with minimal final image sizes (frontend ~29MB, backend ~102MB)
- ✅ Dockerfile layer caching via sensible `COPY` order

---

## Author

Built as part of a DevOps practical exam to demonstrate containerization, orchestration, networking, and cloud deployment fundamentals.