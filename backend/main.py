import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from dotenv import load_dotenv
import uvicorn

# Import routes
from auth import router as auth_router
from user_routes import router as user_router
from analysis_routes import router as analysis_router
from websocket_routes import router as ws_router, start_background_tasks, stop_background_tasks

# Import database and models
from database import Base, engine, get_db
import models

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events."""
    # Startup: create database tables
    logger.info("Starting application...")
    Base.metadata.create_all(bind=engine)
    
    # Start background tasks
    logger.info("Starting background tasks...")
    start_background_tasks()
    
    try:
        yield
    finally:
        # Shutdown: clean up resources
        logger.info("Shutting down...")
        stop_background_tasks()
        logger.info("Background tasks stopped")

# Create FastAPI app with lifespan events
app = FastAPI(
    title="Spot95 API",
    description="Backend API for Spot' 95 - Real-time mood analysis for Spotify",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(analysis_router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(ws_router, prefix="/ws", tags=["WebSockets"])

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "spot95-backend",
        "version": "0.1.0"
    }

# WebSocket test endpoint
@app.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):
    """Test WebSocket connection."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data.strip().lower() == 'ping':
                await websocket.send_json({
                    "type": "pong",
                    "message": "WebSocket connection is working!",
                    "timestamp": "2025-06-19T00:00:00Z"
                })
    except WebSocketDisconnect:
        logger.info("WebSocket test client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    # Run with auto-reload for development
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        workers=1  # Required for WebSockets with auto-reload
    )
