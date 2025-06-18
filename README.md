# Spot' 95 – Windows 95 Style Spotify Client

Spot' 95 is a nostalgic Spotify client with a Windows 95-inspired interface. It allows users to explore their listening habits, analyze their music mood, and get personalized recommendations in a retro computing environment.

## Project Structure

```text
spot95/
├── backend/
│   ├── main.py            # FastAPI entrypoint & routing
│   ├── auth.py            # Spotify OAuth2 helpers
│   ├── database.py        # SQLAlchemy + Postgres session
│   ├── models.py          # SQLAlchemy ORM models
│   ├── analysis_routes.py # Mood analysis and recommendations
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── package.json       # React + TypeScript + Vite
│   └── src/
│       ├── App.tsx        # Main application component
│       ├── main.tsx       # Application entry point
│       ├── components/    # Reusable UI components
│       ├── windows/       # Window components for the desktop
│       └── hooks/         # Custom React hooks
└── docker-compose.yml     # Development services
```

## Local Development

1. **Install Dependencies**:

```bash
# Backend (Python 3.9+)
cd backend
pip install -r requirements.txt

# Frontend (Node.js 16+)
cd ../frontend
npm install
```

2. **Start the Development Servers**:

```bash
# In one terminal (backend)
cd backend
uvicorn main:app --reload

# In another terminal (frontend)
cd frontend
npm run dev
```

3. **Run the full stack** (hot-reload everywhere):

```bash
windsurf dev
```

The CLI will:
- launch FastAPI on `http://localhost:8000`
- launch React dev server on `http://localhost:5173`
- proxy `/api/*` calls from the front end to the backend

## Environment Variables
Create a `.env` file at the repo root:

```env
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/auth/callback
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/spot95
REDIS_URL=redis://cache:6379/0
OPENAI_API_KEY=your_key_if_using
```

## Production
`deploy.yml` builds multi-arch Docker images and ships to AWS ECS. Terraform/IaC samples are included under `infra/` (add your own secrets in GitHub Actions).
