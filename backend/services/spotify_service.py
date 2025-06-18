"""
Spotify service for fetching track data and audio features.
"""
import os
import json
import logging
from typing import Dict, Optional, Any, List, Tuple
import httpx
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models

logger = logging.getLogger(__name__)

class SpotifyService:
    """Service for interacting with the Spotify Web API."""
    
    BASE_URL = "https://api.spotify.com/v1"
    
    def __init__(self, db: Session):
        """Initialize with a database session."""
        self.db = db
        self.client = httpx.AsyncClient()
        self.last_request_time: Dict[str, datetime] = {}
        self.rate_limit_remaining = 10  # Safe default
        self.rate_limit_reset = 0

    async def get_access_token(self, user_id: str) -> Optional[str]:
        """Get a valid access token for the user."""
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.spotify_access_token:
            return None
            
        # Check if token needs refresh
        if user.spotify_token_expires_at <= datetime.utcnow():
            if not await self.refresh_access_token(user):
                return None
                
        return user.spotify_access_token

    async def refresh_access_token(self, user: models.User) -> bool:
        """Refresh the user's access token."""
        try:
            # This is a simplified version - you'll need to implement the actual refresh logic
            # using your Spotify app credentials and the refresh token
            logger.info(f"Refreshing token for user {user.id}")
            # TODO: Implement token refresh logic
            return False
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return False

    async def get_currently_playing(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the currently playing track for a user."""
        token = await self.get_access_token(user_id)
        if not token:
            return None
            
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            await self._check_rate_limit()
            response = await self.client.get(
                f"{self.BASE_URL}/me/player/currently-playing",
                headers=headers
            )
            
            self._update_rate_limits(response)
            
            if response.status_code == 204:  # No content (not playing)
                return None
                
            if response.status_code != 200:
                logger.error(f"Error getting currently playing: {response.text}")
                return None
                
            return response.json()
            
        except Exception as e:
            logger.error(f"Error in get_currently_playing: {e}")
            return None

    async def get_audio_features(self, track_id: str, token: str) -> Optional[Dict[str, Any]]:
        """Get audio features for a track."""
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            await self._check_rate_limit()
            response = await self.client.get(
                f"{self.BASE_URL}/audio-features/{track_id}",
                headers=headers
            )
            
            self._update_rate_limits(response)
            
            if response.status_code != 200:
                logger.error(f"Error getting audio features: {response.text}")
                return None
                
            return response.json()
            
        except Exception as e:
            logger.error(f"Error in get_audio_features: {e}")
            return None

    async def get_recently_played(self, user_id: str, limit: int = 1) -> Optional[Dict[str, Any]]:
        """Get recently played tracks for a user."""
        token = await self.get_access_token(user_id)
        if not token:
            return None
            
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            await self._check_rate_limit()
            response = await self.client.get(
                f"{self.BASE_URL}/me/player/recently-played?limit={limit}",
                headers=headers
            )
            
            self._update_rate_limits(response)
            
            if response.status_code != 200:
                logger.error(f"Error getting recently played: {response.text}")
                return None
                
            return response.json()
            
        except Exception as e:
            logger.error(f"Error in get_recently_played: {e}")
            return None

    async def get_current_track_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the current track data with audio features."""
        # First try to get currently playing track
        current = await self.get_currently_playing(user_id)
        
        if current and 'item' in current and current['item']:
            track = current['item']
            is_playing = current.get('is_playing', False)
            progress_ms = current.get('progress_ms', 0)
        else:
            # Fall back to recently played track
            recently_played = await self.get_recently_played(user_id, 1)
            if not recently_played or not recently_played.get('items'):
                return None
                
            track = recently_played['items'][0]['track']
            is_playing = False
            progress_ms = 0
        
        if not track:
            return None
            
        # Get audio features
        token = await self.get_access_token(user_id)
        if not token:
            return None
            
        audio_features = await self.get_audio_features(track['id'], token)
        if not audio_features:
            return None
            
        # Format track info
        track_info = {
            'id': track['id'],
            'name': track['name'],
            'artists': [artist['name'] for artist in track['artists']],
            'album_name': track['album']['name'],
            'album_image': track['album']['images'][0]['url'] if track['album']['images'] else None,
            'duration_ms': track['duration_ms'],
            'progress_ms': progress_ms,
            'is_playing': is_playing,
            'external_url': track['external_urls']['spotify']
        }
        
        return {
            'track_info': track_info,
            'audio_features': audio_features
        }

    def _update_rate_limits(self, response: httpx.Response) -> None:
        """Update rate limit information from response headers."""
        headers = response.headers
        self.rate_limit_remaining = int(headers.get('X-RateLimit-Remaining', 10))
        reset_time = int(headers.get('X-RateLimit-Reset', 0))
        if reset_time > 0:
            self.rate_limit_reset = reset_time

    async def _check_rate_limit(self) -> None:
        """Check if we're approaching rate limits and sleep if needed."""
        now = datetime.utcnow().timestamp()
        
        # If we're close to rate limit, sleep until reset
        if self.rate_limit_remaining < 5 and now < self.rate_limit_reset:
            sleep_time = self.rate_limit_reset - now + 1  # Add 1 second buffer
            logger.warning(f"Approaching rate limit. Sleeping for {sleep_time:.2f} seconds")
            await asyncio.sleep(sleep_time)

    async def close(self):
        """Clean up resources."""
        await self.client.aclose()
