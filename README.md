

---

# UtilityWatch

Crowdsourced water & sewer rate transparency for small towns. UtilityWatch lets residents compare monthly utility costs across municipalities, submit rate data from bills, and visualize differences at common usage levels.

**Live site:** [https://utilitywatch.org](https://utilitywatch.org)
**Frontend:** Angular • **Backend:** Spring Boot (Java) • **DB:** PostgreSQL (optionally PostGIS)
**Deploy:** Docker + Nginx on a DigitalOcean Droplet (GitLab CI/CD)

---

## Table of Contents

* [Features](#features)
* [Architecture](#architecture)
* [Tech Stack](#tech-stack)
* [Monorepo Structure](#monorepo-structure)
* [Prerequisites](#prerequisites)
* [Environment Variables](#environment-variables)
* [Local Development](#local-development)
* [Docker & Compose](#docker--compose)
* [Nginx Reverse Proxy](#nginx-reverse-proxy)
* [Database & Migrations](#database--migrations)
* [CI/CD (GitHub)](#cicd-github)
* [Production Deployment (DigitalOcean)](#production-deployment-digitalocean)
* [Security & Hardening](#security--hardening)
* [Troubleshooting](#troubleshooting)


---

## Features

* Compare water/sewer bills at common usage tiers (e.g., 3k, 5k, 7.5k gallons).
* Crowdsource rate data from actual bills with confidence scoring.
* View base rates, tiers, fees, and late-fee policies per municipality.
* Search by ZIP code and radius; find neighboring towns.
* Authenticated user accounts with saved bills and submissions.

---

## Architecture

```
[ Angular SPA ]  <--->  [ Nginx (serves SPA, proxies /api) ]  <--->  [ Spring Boot API ]  <--->  [ PostgreSQL ]
                                |                                          |
                         Static assets                              Flyway migrations,
                         + TLS (Certbot)                             JPA/Hibernate
```

* **Frontend**: Angular app compiled to static assets, served by Nginx.
* **Backend**: Spring Boot REST API exposing rate search, user bills, and submission workflows.
* **Database**: PostgreSQL (optionally PostGIS for geospatial ZIP radius queries).
* **Containerization**: Multi-stage Docker builds for frontend & backend; orchestrated with `docker compose`.

---

## Tech Stack

* **Frontend**: Angular 17+, RxJS, Angular Material (optional)
* **Backend**: Java 21/17, Spring Boot 3, Spring Data JPA, Spring Security
* **Database**: PostgreSQL 15/16 (+ PostGIS if using GIS features)
* **Infra**: Docker, Docker Compose, Nginx, DigitalOcean Droplet
* **CI/CD**: GitLab pipelines building & pushing images, SSH deploys

---

## Monorepo Structure

```
.
├─ README.md
├─ docker/
│  ├─ nginx.conf
│  └─ compose.yml
├─ frontend/
│  ├─ Dockerfile
│  └─ (Angular app)
├─ backend/
│  ├─ Dockerfile
│  ├─ pom.xml
│  └─ src/main/java/... (Spring Boot app)
└─ db/
   └─ init/ (optional SQL seeds)
```

---

## Prerequisites

* Node 20+ and npm (for local frontend dev)
* Java 21 (or 17) and Maven (for local backend dev)
* Docker + Docker Compose v2 (for containerized dev/prod)
* A PostgreSQL instance (local Docker or managed)

---

## Environment Variables

Create `.env` files for local/dev/prod as needed.

**Backend important vars**

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/capstone
SPRING_DATASOURCE_USERNAME=capuser
SPRING_DATASOURCE_PASSWORD=
SERVER_PORT=8080
```

**Frontend build-time (optional)**

```
PUBLIC_API_BASE=/api
```

**Compose overrides**

```
SERVER_FORWARD_HEADERS_STRATEGY=framework
```

---

## Local Development

### Frontend

```bash
cd frontend
npm ci
npm run start   # http://localhost:4200
```

### Backend

```bash
cd backend
./mvnw spring-boot:run  # http://localhost:8080
```

Point the Angular dev proxy to the backend (dev) or use CORS configuration in Spring Security if you’re not proxying.

---

## Docker & Compose

### Backend Dockerfile (multi-stage)

```dockerfile
# ---- build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY src ./src
RUN ./mvnw -q -DskipTests package

# ---- run ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*SNAPSHOT.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

### Frontend Dockerfile (Angular → Nginx)

```dockerfile
# ---- build ----
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- serve ----
FROM nginx:stable
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `docker/compose.yml`

```yaml
name: utilitywatch
services:
  db:
    image: postgres:16
    container_name: cap_db
    environment:
      POSTGRES_DB: capstone
      POSTGRES_USER: capuser
      POSTGRES_PASSWORD: ${SPRING_DATASOURCE_PASSWORD:}
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U capuser -d capstone"]
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    image: docker.io/thatsmypurse/utilitywatch-backend:latest
    container_name: cap_backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/capstone
      SPRING_DATASOURCE_USERNAME: capuser
      SPRING_DATASOURCE_PASSWORD: ${SPRING_DATASOURCE_PASSWORD}
      SERVER_FORWARD_HEADERS_STRATEGY: framework
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/actuator/health"]
      interval: 15s
      timeout: 3s
      retries: 10
      start_period: 20s
    restart: unless-stopped

  frontend:
    image: docker.io/thatsmypurse/utilitywatch-frontend:latest
    container_name: cap_frontend
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "80:80"
    restart: unless-stopped

volumes:
  db_data:
```

Run:

```bash
docker compose -f docker/compose.yml up -d
```

---

## Nginx Reverse Proxy

`docker/nginx.conf`:

```nginx
server {
  listen 80;
  server_name _;

  # Serve Angular
  root /usr/share/nginx/html;
  index index.html;

  # API proxy
  location /api/ {
    proxy_pass http://backend:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

For HTTPS on the droplet, set up a reverse proxy on the host (e.g., Nginx + Certbot) or run an Nginx “edge” container with TLS termination.

---

## Database & Migrations

* Use **Flyway** or **Liquibase** in the backend to apply schema changes on startup.
* For geospatial queries (ZIP radius), enable **PostGIS** and store zip centers as `GEOGRAPHY(POINT)` or `GEOMETRY(POINT, 4326)`.

---



## CI/CD (GitHub Actions → Docker Hub → Droplet)

This repo uses GitHub Actions to build Docker images for **backend** and **frontend**, push them to Docker Hub, and (on `main`) deploy to a DigitalOcean droplet with `docker compose`.

### Prerequisites

* Dockerfiles in `backend/` and `frontend/`
* A Docker Hub account and repository names:

    * `docker.io/thatsmypurse/utilitywatch-backend`
    * `docker.io/thatsmypurse/utilitywatch-frontend`
* A droplet (SSH reachable) with Docker + Docker Compose installed

### Repository Secrets (Settings → Secrets and variables → Actions)

| Name                 | What it is                                 |
| -------------------- | ------------------------------------------ |
| `DOCKERHUB_USERNAME` | Your Docker Hub username                   |
| `DOCKERHUB_TOKEN`    | Docker Hub **access token** (not password) |
| `DEPLOY_HOST`        | Droplet IP or hostname                     |
| `DEPLOY_USER`        | SSH user (e.g., `root` or `deploy`)        |
| `DEPLOY_SSH_KEY`     | **Private** SSH key for that user          |
| `DEPLOY_SSH_PORT`    | (Optional) SSH port, default `22`          |

> Never commit secrets or `.env` files. Keep environment files on the server.

### How it runs

* **On any push**: builds both images, tags with commit SHA, branch, `v1`, and conditionally `latest`.
* **On `v2`**: deploy step SSHes into the droplet, runs `docker compose pull && up -d`.

### Files

* Workflow: `.github/workflows/cicd.yml`
* Remote compose (example path on droplet): `/opt/utilitywatch/docker-compose.prod.yml`

<details>
<summary><strong>Show workflow YAML</strong></summary>
```yaml
name: CI/CD (Build, Push, Deploy)

on:
  push:
    branches: ["**"]
  workflow_dispatch: {}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - name: backend
            context: backend
            image: docker.io/thatsmypurse/utilitywatch-backend
          - name: frontend
            context: frontend
            image: docker.io/thatsmypurse/utilitywatch-frontend

    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DH_USER }}
          password: ${{ secrets.DH_TOKEN }}

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ matrix.image }}
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=v1
            type=raw,value=latest,enable={{is_default_branch}}

      - uses: docker/build-push-action@v6
        with:
          context: ${{ matrix.context }}
          push: true
          pull: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    if: github.ref == 'refs/heads/v2'
    runs-on: ubuntu-latest
    steps:
      - name: Add host key
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -p "${{ secrets.DEPLOY_SSH_PORT || 22 }}" "${{ secrets.DEPLOY_HOST }}" >> ~/.ssh/known_hosts

      - name: Remote deploy (pull new images, restart)
        uses: appleboy/ssh-action@v1.1.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          port: ${{ secrets.DEPLOY_SSH_PORT || 22 }}
          script: |
            set -euo pipefail
            cd /apps/utilitywatch
            ./deploy.sh



### Triggering the pipeline
  </details>
*Push any commit:

  ```bash
  git add -A && git commit -m "trigger build" && git push
  ```
``

---



## Security & Hardening

* Keep DB off public interface; only expose 80/443.
* Store secrets in CI/CD variables or host `.env` (never commit).
* Use `restart: unless-stopped` and healthchecks.
* Regularly snapshot the droplet and back up DB volume.
* Configure CORS only for trusted origins.

---

## Troubleshooting

* **CORS errors**: ensure Nginx proxies `/api` and backend trusts `X-Forwarded-*`. Verify `SPRING_PROFILES_ACTIVE=prod` CORS settings.
* **502/404 behind Nginx**: check container DNS (`backend` service name), and SPA fallback (`try_files ... /index.html`).
* **DB auth failures**: confirm env vars, user/password, and `jdbc:postgresql://db:5432/capstone`.
* **Healthcheck flapping**: make sure `/actuator/health` is enabled and not behind auth.

---

