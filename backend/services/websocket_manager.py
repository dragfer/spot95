"""
WebSocket manager for handling real-time connections and broadcasting messages.
"""
from typing import Dict, Set, Optional, Callable, Any
from fastapi import WebSocket
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""
    
    def __init__(self):
        """Initialize the connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {
            "mood_updates": set(),
            "player_state": set()
        }
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """Register a new WebSocket connection."""
        logger.debug(f"Attempting to connect user {user_id}")
        # Close any existing connection for this user
        if user_id in self.active_connections:
            old_ws = self.active_connections[user_id]
            logger.debug(f"Closing existing connection for user {user_id}")
            try:
                await old_ws.close()
                logger.debug(f"Successfully closed old connection for {user_id}")
            except Exception as e:
                logger.warning(f"Error closing old connection for {user_id}: {e}")
        
        self.active_connections[user_id] = websocket
        logger.info(f"New connection registered for user {user_id}")
        logger.debug(f"Current active connections: {len(self.active_connections)}")

    async def disconnect(self, user_id: str) -> None:
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            # Remove from all subscriptions
            for channel in self.subscriptions.values():
                channel.discard(user_id)
            logger.info(f"Disconnected user {user_id}")

    async def send_personal_message(self, message: dict, user_id: str) -> bool:
        """Send a message to a specific user."""
        if user_id not in self.active_connections:
            logger.warning(f"No active connection for user {user_id}")
            return False
            
        websocket = self.active_connections[user_id]
        try:
            logger.debug(f"Sending message to user {user_id}: {message}")
            await websocket.send_json(message)
            logger.debug(f"Successfully sent message to user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error sending message to {user_id}: {e}")
            await self.disconnect(user_id)
            return False

    async def broadcast(self, message: dict, channel: str = "mood_updates") -> None:
        """Broadcast a message to all users subscribed to a channel."""
        if channel not in self.subscriptions:
            logger.warning(f"Unknown channel: {channel}")
            return
            
        for user_id in list(self.subscriptions[channel]):
            await self.send_personal_message(message, user_id)

    async def subscribe(self, user_id: str, channel: str) -> None:
        """Subscribe a user to a channel."""
        if channel in self.subscriptions and user_id in self.active_connections:
            self.subscriptions[channel].add(user_id)
            logger.debug(f"User {user_id} subscribed to {channel}")

    async def unsubscribe(self, user_id: str, channel: str) -> None:
        """Unsubscribe a user from a channel."""
        if channel in self.subscriptions:
            self.subscriptions[channel].discard(user_id)
            logger.debug(f"User {user_id} unsubscribed from {channel}")

# Global instance
manager = ConnectionManager()
