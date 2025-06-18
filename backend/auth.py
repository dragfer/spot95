"""Spotify OAuth helpers"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os, requests
from urllib.parse import urlencode
from database import get_db
from sqlalchemy.orm import Session
import models

load_dotenv()
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
# Request additional scopes needed for mood analysis of the currently-playing
# track. Note: playlist-modify-public retained for future features.
SCOPE = "user-read-currently-playing user-read-recently-played user-top-read playlist-modify-public"
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"

router = APIRouter(tags=["auth"])

@router.get("/login")
async def login():
    qs = urlencode({
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
    })
    return RedirectResponse(f"{AUTH_URL}?{qs}")

@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)):
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }
    resp = requests.post(TOKEN_URL, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get token")
    token_info = resp.json()
    access_token = token_info["access_token"]
    refresh_token = token_info.get("refresh_token")
    expires_in = token_info["expires_in"]
    token_expires = datetime.utcnow() + timedelta(seconds=expires_in)

    # Fetch user profile to map Spotify ID
    profile = requests.get("https://api.spotify.com/v1/me", headers={"Authorization": f"Bearer {access_token}"}).json()
    spotify_id = profile["id"]

    user = db.query(models.User).filter_by(spotify_id=spotify_id).first()
    if not user:
        user = models.User(spotify_id=spotify_id)
        db.add(user)
    user.display_name = profile.get("display_name")
    user.access_token = access_token
    user.refresh_token = refresh_token
    user.token_expires = token_expires
    db.commit()

    # Simple client-side session via query param (front-end will persist)
    front_uri = f"http://localhost:5173/dashboard?uid={user.id}"
    return RedirectResponse(front_uri, status_code=status.HTTP_302_FOUND)
