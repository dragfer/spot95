from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import requests
import models 

router = APIRouter(prefix="/users", tags=["user"])  # noqa: E305


@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # attempt to fetch fresh profile to get avatar url
    avatar_url = None
    followers = None
    playlists = None
    try:
        if user.access_token:
            resp = requests.get(
                "https://api.spotify.com/v1/me",
                headers={"Authorization": f"Bearer {user.access_token}"},
                timeout=5,
            )
            if resp.status_code == 200:
                followers = resp.json().get("followers", {}).get("total")
                profile = resp.json()
                images = profile.get("images") or []
                if images:
                    avatar_url = images[0].get("url")
                    # fetch playlists count quickly
                pl_resp = requests.get(
                    "https://api.spotify.com/v1/me/playlists?limit=1",
                    headers={"Authorization": f"Bearer {user.access_token}"},
                    timeout=5,
                )
                if pl_resp.status_code == 200:
                    playlists = pl_resp.json().get("total")
    except Exception:
        pass

    return {
        "id": user.id,
        "display_name": user.display_name,
        "avatar_url": avatar_url,
        "followers": followers,
        "playlists": playlists,
    }


@router.get("/{user_id}/playlists")
async def list_playlists(user_id: int, db: Session = Depends(get_db)):
    """Return a simple list of the user’s playlist names and cover images (first 20)."""
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user or not user.access_token:
        raise HTTPException(status_code=404, detail="User not authorized")

    try:
        resp = requests.get(
            "https://api.spotify.com/v1/me/playlists?limit=20",
            headers={"Authorization": f"Bearer {user.access_token}"},
            timeout=5,
        )
    except Exception:
        raise HTTPException(status_code=502, detail="Spotify request failed")

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    items = [
        {
            "id": p["id"],
            "name": p["name"],
            "image": (p.get("images") or [{}])[0].get("url"),
        }
        for p in resp.json().get("items", [])
    ]
    return {"playlists": items}
