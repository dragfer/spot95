"""
WebSocket routes for real-time mood analysis.
"""
from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi import APIRouter
from sqlalchemy.orm import Session
import asyncio
import logging
from typing import Dict, Any, Optional
import json
import time

from services.websocket_manager import manager
from services.spotify_service import SpotifyService
from services.mood_service import mood_service
from database import get_db
import models

logger = logging.getLogger(__name__)
router = APIRouter()

# Track active user sessions
active_sessions: Dict[str, Dict[str, Any]] = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time mood updates."""
    await manager.connect(user_id, websocket)
    
    try:
        # Send initial connection confirmation
        await manager.send_personal_message({
            "type": "connection_established",
            "message": "Connected to Spot' 95 real-time service",
            "timestamp": int(time.time() * 1000)
        }, user_id)
        
        # Main message loop
        while True:
            # Keep connection alive - we don't expect messages from client
            # but we need to handle disconnection
            data = await websocket.receive_text()
            
            # Client can send ping to check connection
            if data.strip().lower() == 'ping':
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": int(time.time() * 1000)
                }, user_id)
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
        await manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(user_id)
    finally:
        # Clean up
        if user_id in active_sessions:
            del active_sessions[user_id]
        await manager.disconnect(user_id)

async def check_user_activity():
    """Background task to check user activity and send updates."""
    while True:
        try:
            current_time = time.time()
            
            # Get a list of connected user IDs
            connected_users = list(manager.active_connections.keys())
            
            for user_id in connected_users:
                await process_user_activity(user_id, current_time)
            
            # Sleep before next check
            await asyncio.sleep(1)
            
        except Exception as e:
            logger.error(f"Error in check_user_activity: {e}")
            await asyncio.sleep(5)  # Prevent tight loop on errors

async def process_user_activity(user_id: str, current_time: float):
    """Process activity for a single user."""
    try:
        # Get or create user session
        if user_id not in active_sessions:
            active_sessions[user_id] = {
                'last_check': 0,
                'last_track_id': None
            }
        
        session = active_sessions[user_id]
        
        # Only check every 5 seconds per user
        if current_time - session['last_check'] < 5:
            return
        
        # Update last check time
        session['last_check'] = current_time
        
        # Get database session
        db = next(get_db())
        try:
            # Get current track data
            spotify = SpotifyService(db)
            track_data = await spotify.get_current_track_data(user_id)
            
            if not track_data:
                # No track data available
                return
                
            current_track_id = track_data['track_info']['id']
            
            # Skip if same track and still playing
            if (session['last_track_id'] == current_track_id and 
                track_data['track_info']['is_playing']):
                return
            
            # Update last track ID
            session['last_track_id'] = current_track_id
            
            # Analyze mood
            mood_data = mood_service.analyze_mood(track_data['audio_features'])
            
            # Generate witty description
            description = mood_service.get_witty_description(
                mood_data['mood'],
                track_data['track_info']
            )
            
            # Prepare update message
            message = {
                "type": "mood_update",
                "data": {
                    "mood": mood_data['mood'],
                    "emoji": mood_data['emoji'],
                    "confidence": mood_data['confidence'],
                    "description": description,
                    "track": track_data['track_info'],
                    "audio_features": mood_data['audio_features'],
                    "timestamp": int(current_time * 1000)
                }
            }
            
            # Send update to user
            await manager.send_personal_message(message, user_id)
            
        except Exception as e:
            logger.error(f"Error processing user {user_id}: {e}")
            # Try to send error to client
            try:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Error analyzing track"
                }, user_id)
            except:
                pass
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error in user session {user_id}: {e}")

# Background task reference
background_task = None

def start_background_tasks():
    """Start background tasks for WebSocket handling."""
    global background_task
    if background_task is None or background_task.done():
        background_task = asyncio.create_task(check_user_activity())

def stop_background_tasks():
    """Stop background tasks."""
    global background_task
    if background_task and not background_task.done():
        background_task.cancel()
