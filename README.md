# Pizza SRE Midterm Project

This repository evolves an existing React pizza app into a full-stack SRE/observability project with:
- Frontend (React + Nginx)
- Backend (Node.js + Express)
- Database (PostgreSQL)
- Monitoring stack (Prometheus + Grafana + Node Exporter)

## Services and Ports
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- Node Exporter: `http://localhost:9100/metrics`

## Quick Start
1. Create env file:
```bash
cp .env.example .env
```
2. Start stack:
```bash
docker compose up --build -d
```
3. Open app and dashboards:
- App: `http://localhost:3000`
- Grafana: `http://localhost:3001` (default: `admin/admin123`)

## Backend Endpoints
- `GET /health`
- `GET /api/pizzas`
- `POST /api/orders`
- `GET /metrics` (Prometheus scrape endpoint)

## Data Migration
The backend seeds PostgreSQL pizzas table from the existing frontend file:
- `src/libs/api.json`

Seed is automatic on backend startup when `pizzas` table is empty.

## Observability
- Prometheus config: `observability/prometheus/prometheus.yml`
- Alert rules: `observability/prometheus/alert_rules.yml`
- Grafana provisioning: `observability/grafana/provisioning/*`
- Grafana dashboard: `observability/grafana/dashboards/pizza-observability.json`
