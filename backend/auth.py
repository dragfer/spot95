from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from urllib.parse import urlencode
from dotenv import load_dotenv
import requests, os

from database import get_db
import models

load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")
SCOPE = "user-read-currently-playing user-read-recently-played user-top-read playlist-modify-public"
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"

router = APIRouter(tags=["auth"])

@router.get("/login")
async def login():
    query = urlencode({
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
    })
    return RedirectResponse(f"{AUTH_URL}?{query}")

@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)):
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    token_res = requests.post(TOKEN_URL, data=token_data, headers={
        "Content-Type": "application/x-www-form-urlencoded"
    })

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get token")

    token_info = token_res.json()
    access_token = token_info["access_token"]
    refresh_token = token_info.get("refresh_token")
    expires_in = token_info["expires_in"]
    token_expires = datetime.utcnow() + timedelta(seconds=expires_in)

    # Get user profile
    profile_res = requests.get("https://api.spotify.com/v1/me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    profile = profile_res.json()

    spotify_id = profile["id"]

    # DB handling
    user = db.query(models.User).filter_by(spotify_id=spotify_id).first()
    if not user:
        user = models.User(spotify_id=spotify_id)
        db.add(user)

    user.display_name = profile.get("display_name")
    user.access_token = access_token
    user.refresh_token = refresh_token
    user.token_expires = token_expires
    db.commit()

    # Redirect to frontend with UID
    redirect_url = f"{FRONTEND_URL}/dashboard?uid={user.id}"
    print(f"[AUTH] Redirecting to: {redirect_url}")  # Debug log
    return RedirectResponse(redirect_url, status_code=302)
