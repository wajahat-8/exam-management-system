# Exam Management System

## New machine setup

```bash
# From project root — installs backend + frontend deps
npm install

# One-time: create .env + copy face-detector models
npm run setup
```

**Do not commit `backend/.env`** — copy from `backend/.env.example` on each PC (or use `npm run setup`).

### Run

```bash
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:5173
```

### Database (pick one)

| Option | Command |
|--------|---------|
| **Docker MongoDB** (persistent) | `docker compose up -d` then `MONGO_URI=mongodb://127.0.0.1:27017/examdb` in `.env` |
| **In-memory** (zero setup) | Leave defaults; backend auto-starts embedded Mongo if nothing else connects |

Node.js 18+ recommended.
