from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from random import choice, sample
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv
import os, requests, statistics, json
from collections import defaultdict, Counter

load_dotenv()
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

from database import get_db
import models

router = APIRouter(prefix="/analyze", tags=["analysis"])

@dataclass
class MoodProfile:
    name: str
    description: str
    emoji: str
    valence_range: tuple[float, float]
    energy_range: tuple[float, float]
    danceability_range: tuple[float, float]
    tempo_range: tuple[float, float] = (0, 200)
    acousticness_range: tuple[float, float] = (0, 1)
    instrumentalness_range: tuple[float, float] = (0, 1)
    
    def match_score(self, features: dict) -> float:
        """Calculate how well the audio features match this mood (0-1)"""
        score = 0.0
        total_weights = 0
        
        # Valence (happiness) is most important
        score += self._normalized_match(features['valence'], self.valence_range) * 0.4
        total_weights += 0.4
        
        # Energy is also very important
        score += self._normalized_match(features['energy'], self.energy_range) * 0.3
        total_weights += 0.3
        
        # Other features add nuance
        score += self._normalized_match(features['danceability'], self.danceability_range) * 0.15
        score += self._normalized_match(features.get('tempo', 120)/200, (self.tempo_range[0]/200, self.tempo_range[1]/200)) * 0.1
        score += self._normalized_match(features.get('acousticness', 0.5), self.acousticness_range) * 0.05
        score += self._normalized_match(features.get('instrumentalness', 0.5), self.instrumentalness_range) * 0.05
        total_weights += 0.3
        
        return score / total_weights
    
    def _normalized_match(self, value: float, target_range: tuple[float, float]) -> float:
        """Normalize how well a value fits within a target range"""
        low, high = target_range
        if value < low:
            return value / low
        elif value > high:
            return 1 - ((value - high) / (1 - high))
        return 1.0

# Define mood profiles with their characteristics
MOOD_PROFILES = [
    MoodProfile(
        name="Upbeat",
        description="Bright and cheerful tunes to lift your spirits",
        emoji="😊",
        valence_range=(0.7, 1.0),
        energy_range=(0.5, 1.0),
        danceability_range=(0.5, 1.0),
        tempo_range=(90, 160)
    ),
    MoodProfile(
        name="Chill",
        description="Relaxed and mellow tracks for unwinding",
        emoji="😌",
        valence_range=(0.4, 0.8),
        energy_range=(0.1, 0.5),
        danceability_range=(0.2, 0.7),
        tempo_range=(60, 100)
    ),
    MoodProfile(
        name="Melancholic",
        description="Thoughtful and emotional melodies",
        emoji="😔",
        valence_range=(0.0, 0.4),
        energy_range=(0.1, 0.7),
        danceability_range=(0.0, 0.5),
        tempo_range=(60, 120)
    ),
    MoodProfile(
        name="Energetic",
        description="High-energy tracks to get you moving",
        emoji="⚡",
        valence_range=(0.6, 1.0),
        energy_range=(0.8, 1.0),
        danceability_range=(0.7, 1.0),
        tempo_range=(120, 180)
    ),
    MoodProfile(
        name="Romantic",
        description="Intimate and passionate songs",
        emoji="💝",
        valence_range=(0.5, 0.9),
        energy_range=(0.3, 0.8),
        danceability_range=(0.4, 0.9),
        tempo_range=(70, 120)
    ),
    MoodProfile(
        name="Focused",
        description="Ideal for concentration and flow",
        emoji="🎯",
        valence_range=(0.3, 0.7),
        energy_range=(0.4, 0.8),
        danceability_range=(0.3, 0.7),
        instrumentalness_range=(0.7, 1.0),
        tempo_range=(90, 140)
    ),
    MoodProfile(
        name="Party",
        description="High-energy bangers perfect for dancing",
        emoji="🎉",
        valence_range=(0.7, 1.0),
        energy_range=(0.8, 1.0),
        danceability_range=(0.8, 1.0),
        tempo_range=(110, 180)
    )
]

# Simple mood mapping for fallback
MOODS = [mood.name for mood in MOOD_PROFILES]

def get_witty_description(mood: str, top_artists: List[Dict], top_genres: List[str], mood_history: List[str]) -> str:
    """Generate a witty description based on user's listening habits"""
    # Mood-specific templates
    mood_templates = {
        "Upbeat": [
            "Feeling the good vibes! {emoji}",
            "Someone's in a great mood! {emoji}",
            "All smiles with these tunes! {emoji}"
        ],
        "Chill": [
            "Taking it easy, I see. {emoji}",
            "Chill vibes only. {emoji}",
            "Relaxation station! {emoji}"
        ],
        "Melancholic": [
            "Feeling the feels, huh? {emoji}",
            "Need a hug? {emoji}",
            "It's okay to feel things. {emoji}"
        ],
        "Energetic": [
            "Someone's got energy to burn! {emoji}",
            "Pump it up! {emoji}",
            "Who needs coffee when you have these jams? {emoji}"
        ],
        "Romantic": [
            "Ooo la la, someone's feeling romantic! {emoji}",
            "Love is in the air! {emoji}",
            "All you need is love... and these songs. {emoji}"
        ]
    }
    
    # Get mood emoji
    mood_emoji = next((m.emoji for m in MOOD_PROFILES if m.name == mood), "🎵")
    
    # Select a random template for the mood
    template = choice(mood_templates.get(mood, ["Enjoy your {mood} mood! {emoji}"]))
    
    # Add artist/genre specific comments
    artist_comments = []
    if top_artists:
        artist_names = ", ".join([a['name'] for a in top_artists[:2]])
        if any(genre in ["pop", "dance", "edm"] for genre in top_genres):
            artist_comments.append(f"Loving those {top_genres[0]} vibes with {artist_names}?")
        elif any(genre in ["indie", "alternative"] for genre in top_genres):
            artist_comments.append(f"{artist_names}? Someone's got great taste!")
    
    # Add mood pattern detection
    if mood_history and len(mood_history) > 5:
        mood_counter = Counter(mood_history[-10:])  # Last 10 moods
        most_common_mood, count = mood_counter.most_common(1)[0]
        if most_common_mood == mood and count > 5:  # If this mood is >50% of recent listens
            if mood == "Melancholic":
                artist_comments.append("Get heartbroken much? It's okay, we've all been there. 💔")
            elif mood == "Energetic":
                artist_comments.append("Someone's been hitting the gym! 💪")
    
    # Combine everything
    description = template.format(emoji=mood_emoji, mood=mood)
    if artist_comments:
        description += " " + " ".join(artist_comments)
    
    return description

def analyze_audio_features(features: dict) -> Tuple[str, float]:
    """Analyze audio features and return the best matching mood"""
    if not features:
        return choice([m.name for m in MOOD_PROFILES]), 0.0
    
    # Calculate scores for each mood profile
    mood_scores = []
    for mood in MOOD_PROFILES:
        score = mood.match_score(features)
        mood_scores.append((mood.name, score))
    
    # Sort by score and return the best match
    mood_scores.sort(key=lambda x: x[1], reverse=True)
    return mood_scores[0]  # (mood_name, confidence)

@router.get("/{user_id}")
async def analyze_user_mood(user_id: int, db: Session = Depends(get_db)):
    """Determine user's mood from the *currently-playing* Spotify track.
    Fallbacks: recently played -> random mood.
    """
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user or not user.access_token:
        raise HTTPException(status_code=404, detail="User auth required")

    _ensure_fresh_token(user, db)
    headers = {"Authorization": f"Bearer {user.access_token}"}
    
    # Track info for description
    track_name = "current track"
    artist_name = ""
    track_id = None
    
    # 1. Try to get currently playing track
    try:
        now_resp = requests.get(
            "https://api.spotify.com/v1/me/player/currently-playing", 
            headers=headers, 
            timeout=5
        )
        if now_resp.status_code == 200 and now_resp.json().get("item"):
            track = now_resp.json()["item"]
            track_id = track["id"]
            track_name = track["name"]
            artist_name = track["artists"][0]["name"] if track["artists"] else ""
    except Exception as e:
        print(f"Error getting currently playing: {e}")

    # 2. Fallback to recently played
    if not track_id:
        try:
            recent = requests.get(
                "https://api.spotify.com/v1/me/player/recently-played?limit=1", 
                headers=headers, 
                timeout=5
            )
            if recent.status_code == 200 and recent.json().get("items"):
                track = recent.json()["items"][0]["track"]
                track_id = track["id"]
                track_name = track["name"]
                artist_name = track["artists"][0]["name"] if track["artists"] else ""
        except Exception as e:
            print(f"Error getting recently played: {e}")

    # 3. If still no track, inform client to start playback
    if not track_id:
        return {
            "user_id": user_id,
            "mood": None,
            "message": "Nothing currently playing — start a song in Spotify and try again.",
            "description": "We couldn't detect any recent music. Play something in Spotify and try again!",
            "confidence": 0.0,
            "track": {
                "name": "No track playing",
                "artist": ""
            }
        }

    # 4. Get audio features
    try:
        af_resp = requests.get(
            f"https://api.spotify.com/v1/audio-features/{track_id}", 
            headers=headers, 
            timeout=5
        )
        
        if af_resp.status_code != 200:
            raise Exception("Failed to get audio features")
            
        audio_features = af_resp.json()
        
        # 5. Get user's top artists and genres for witty description
        top_artists = []
        top_genres = []
        try:
            top_artists_resp = requests.get(
                "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term",
                headers=headers,
                timeout=5
            )
            if top_artists_resp.status_code == 200:
                top_artists = top_artists_resp.json().get("items", [])
                for artist in top_artists:
                    top_genres.extend(artist.get("genres", []))
                # Dedupe genres
                top_genres = list(dict.fromkeys(top_genres))
        except Exception as e:
            print(f"Error getting top artists: {e}")
        
        # 6. Get user's mood history (simplified - in a real app, this would be stored in DB)
        mood_history = []  # This would normally come from the database
        
        # 7. Analyze mood using our enhanced system
        mood, confidence = analyze_audio_features(audio_features)
        
        # 8. Generate witty description
        description = get_witty_description(mood, top_artists, top_genres, mood_history)
        
        # 9. If confidence is low, add a note
        if confidence < 0.6:
            description += " (Not 100% sure about this one, but it's the best match!)"
        
        return {
            "user_id": user_id,
            "mood": mood,
            "confidence": round(confidence, 2),
            "track": {
                "name": track_name,
                "artist": artist_name,
                "id": track_id
            },
            "message": f"Your current track '{track_name}' by {artist_name} feels {mood.lower()}!",
            "description": description,
            "audio_features": {
                "valence": audio_features.get("valence"),
                "energy": audio_features.get("energy"),
                "danceability": audio_features.get("danceability"),
                "tempo": audio_features.get("tempo")
            }
        }
        
    except Exception as e:
        print(f"Error analyzing track: {e}")
        mood = choice(MOODS)
        return {
            "user_id": user_id,
            "mood": mood,
            "confidence": 0.0,
            "track": {
                "name": track_name or "Unknown track",
                "artist": artist_name or "Unknown artist"
            },
            "message": f"Couldn't analyze track — guessing {mood.lower()}!",
            "description": "Our mood detector is feeling a bit off today. Try again in a bit!"
        }

def _ensure_fresh_token(user: models.User, db: Session):
    if user.token_expires and user.token_expires < datetime.utcnow():
        if not user.refresh_token:
            raise HTTPException(status_code=401, detail="Session expired")
        data = {
            "grant_type": "refresh_token",
            "refresh_token": user.refresh_token,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        }
        resp = requests.post("https://accounts.spotify.com/api/token", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Refresh failed")
        token_info = resp.json()
        user.access_token = token_info["access_token"]
        expires_in = token_info["expires_in"]
        user.token_expires = datetime.utcnow() + timedelta(seconds=expires_in)
        db.commit()

@router.get("/{user_id}/recommendations")
async def mood_recommendations(
    user_id: int,
    mood: str | None = Query(None, description="Optional mood string to force recommendations to use a specific mood"),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user or not user.access_token:
        raise HTTPException(status_code=404, detail="User auth required")
    _ensure_fresh_token(user, db)

    headers = {"Authorization": f"Bearer {user.access_token}"}
    #  Determine mood. If provided via query param and valid, use it; else analyze.
    if mood and mood.capitalize() in MOODS:
        mood = mood.capitalize()
    else:
        mood_resp = await analyze_user_mood(user_id, db)
        mood = mood_resp["mood"]

    # --- 1. Get Spotify Recommendations ---
    top_resp = requests.get("https://api.spotify.com/v1/me/top/tracks?limit=20", headers=headers)
    top_tracks = top_resp.json().get("items", []) if top_resp.status_code == 200 else []
    seed_track_ids = [t["id"] for t in top_tracks][:5]
    top_track_ids_set = set(seed_track_ids)
    mood_map = {
        "Upbeat": {"target_valence": 0.8, "target_energy": 0.7},
        "Chill": {"target_valence": 0.5, "target_energy": 0.3},
        "Melancholic": {"target_valence": 0.3, "target_energy": 0.3},
        "Energetic": {"target_valence": 0.7, "target_energy": 0.9},
        "Romantic": {"target_valence": 0.6, "target_energy": 0.4},
    }
    rec_params = mood_map.get(mood, {})
    rec_url = "https://api.spotify.com/v1/recommendations"
    params = {
        "limit": 20,
        "market": "US",
        **rec_params,
    }
    if seed_track_ids:
        params["seed_tracks"] = ",".join(seed_track_ids)
    params.setdefault("seed_genres", "pop")
    print("Spotify recommendations params (main):", params)
    rec_resp = requests.get(rec_url, headers=headers, params=params)
    spot_tracks = []
    if rec_resp.status_code == 200:
        for item in rec_resp.json().get("tracks", []):
            spot_tracks.append({
                "name": item["name"],
                "artists": ", ".join(artist["name"] for artist in item["artists"]),
                "url": item["external_urls"].get("spotify"),
                "source": "spotify"
            })
    # fallback: just pop genre
    if not spot_tracks:
        fallback_params = {"limit": 20, "seed_genres": "pop"}
        rec_resp2 = requests.get(rec_url, headers=headers, params=fallback_params)
        if rec_resp2.status_code == 200:
            for t in rec_resp2.json().get("tracks", []):
                spot_tracks.append({
                    "name": t["name"],
                    "artists": ", ".join(a["name"] for a in t["artists"]),
                    "url": t["external_urls"].get("spotify"),
                    "image": (t.get("album", {}).get("images") or [{}])[0].get("url"),
                    "source": "spotify"
                })

    # --- 2. Real AI Fallback: Fetch top songs for this mood from the web ---
    ai_tracks = []
    # Song list for each mood (6 songs per mood)
    mood_songs_web = {
        "Upbeat": [
            {"name": "Skyscraper", "artists": "Demi Lovato", "url": "https://open.spotify.com/track/4B3RmT3cGvh8By3WY9pbIx"},
            {"name": "Scars To Your Beautiful", "artists": "Alessia Cara", "url": "https://open.spotify.com/track/3Qd3KA642Z2Srp98N7wp0S"},
            {"name": "Hesitate", "artists": "Jonas Brothers", "url": "https://open.spotify.com/track/7fiFJADUcHwTdYLmnZeLAy"},
            {"name": "Sing", "artists": "Gary Barlow & The Commonwealth Band", "url": "https://open.spotify.com/track/2q5ciklwFOiSCqNHbTQ9dG"},
            {"name": "Heroes", "artists": "Måns Zelmerlöw", "url": "https://open.spotify.com/track/2m7Va8ARDK1yO3tKCPqlBw"},
            {"name": "Angel By The Wings", "artists": "Sia", "url": "https://open.spotify.com/track/4OLVK3kktkdLPp8dDgoCtb"}
        ],
        "Chill": [
            {"name": "Sunset Lover", "artists": "Petit Biscuit", "url": "https://open.spotify.com/track/3DYVWvPh3kGwPasp7yjahc"},
            {"name": "Circles", "artists": "Post Malone", "url": "https://open.spotify.com/track/21jGcNKet2qbytDF5SIo6Y"},
            {"name": "Better Now", "artists": "Post Malone", "url": "https://open.spotify.com/track/7dt6x5M1jzdTEt8oCbisTK"},
            {"name": "Sunflower - Spider-Man: Into the Spider-Verse", "artists": "Post Malone, Swae Lee", "url": "https://open.spotify.com/track/3e9HZxeyfWwjeyPAMmWSSQ"},
            {"name": "Better Days", "artists": "Dermot Kennedy", "url": "https://open.spotify.com/track/2KCOw5XPim4LGc6aGSZn3y"},
            {"name": "All of Me", "artists": "John Legend", "url": "https://open.spotify.com/track/3U4isOIWM3VvDubwSI3yDZ"}
        ],
        "Melancholic": [
            {"name": "Someone Like You", "artists": "Adele", "url": "https://open.spotify.com/track/4kflIGfjdZJW4ot2ioixTB"},
            {"name": "Skinny Love", "artists": "Bon Iver", "url": "https://open.spotify.com/track/2pAvKEwFBn1k7XncvroGzF"},
            {"name": "I Will Follow You into the Dark", "artists": "Death Cab for Cutie", "url": "https://open.spotify.com/track/0t0bSn4P1XZzwwf9ipYWP6"},
            {"name": "Fix You", "artists": "Coldplay", "url": "https://open.spotify.com/track/6V4sbZ4NqGfMs3EGSSpd5h"},
            {"name": "The Night We Met", "artists": "Lord Huron", "url": "https://open.spotify.com/track/1F51GweEf47xy7gzZuNdAe"},
            {"name": "Hurt", "artists": "Johnny Cash", "url": "https://open.spotify.com/track/2gkLs8uzrZKIySLal218Hg"}
        ],
        "Energetic": [
            {"name": "Blinding Lights", "artists": "The Weeknd", "url": "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b"},
            {"name": "Can't Hold Us", "artists": "Macklemore & Ryan Lewis", "url": "https://open.spotify.com/track/1Mrk7tQKRBWmZK0dN3tFdl"},
            {"name": "Don't Start Now", "artists": "Dua Lipa", "url": "https://open.spotify.com/track/6WrI0LAC5M1Rw2MnX2ZvEg"},
            {"name": "Titanium", "artists": "David Guetta, Sia", "url": "https://open.spotify.com/track/2ts98dSVxe9G7nCMv6YHc4"},
            {"name": "Levitating", "artists": "Dua Lipa", "url": "https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9"},
            {"name": "Wake Me Up", "artists": "Avicii", "url": "https://open.spotify.com/track/1lDWb6b6ieDQ2xT7ewTC3G"}
        ],
        "Romantic": [
            {"name": "Perfect", "artists": "Ed Sheeran", "url": "https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v"},
            {"name": "All of Me", "artists": "John Legend", "url": "https://open.spotify.com/track/3U4isOIWM3V5w1LNtC5mpo"},
            {"name": "Just the Way You Are", "artists": "Bruno Mars", "url": "https://open.spotify.com/track/7BqBn9nzAq8spo5e7cZ0dJ"},
            {"name": "Thinking Out Loud", "artists": "Ed Sheeran", "url": "https://open.spotify.com/track/34gCuhDGsG4bRPIf9bb02f"},
            {"name": "Say You Won't Let Go", "artists": "James Arthur", "url": "https://open.spotify.com/track/5uCax9HTNlzGybIStD3vDh"},
            {"name": "Can't Help Falling in Love", "artists": "Kina Grannis", "url": "https://open.spotify.com/track/7Biv89UtyP6YjgVfHdPGqx"}
        ],
    }
    web_tracks = mood_songs_web.get(mood, [])
    for t in web_tracks:
        # attempt to fetch thumbnail via Spotify oEmbed (no auth required)
        thumb = None
        try:
            oe = requests.get(f"https://open.spotify.com/oembed?url={t['url']}", timeout=3)
            if oe.status_code == 200:
                thumb = oe.json().get("thumbnail_url")
        except Exception:
            pass
        ai_tracks.append({
            "name": t["name"],
            "artists": t["artists"],
            "url": t["url"],
            "image": thumb,
            "source": "web-ai"
        })

    # --- 3. Combine and Deduplicate ---
    seen = set()
    combined = []
    for trk in spot_tracks + ai_tracks:
        key = (trk["name"], trk["artists"])
        if key not in seen:
            seen.add(key)
            combined.append(trk)
        if len(combined) == 15:
            break

    return {"mood": mood, "tracks": combined}
