"""
Mood analysis service for determining mood from audio features.
"""
import random
from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

class MoodService:
    """Service for analyzing audio features and determining mood."""
    
    def __init__(self):
        """Initialize the mood service with mood profiles."""
        self.mood_profiles = {
            "Upbeat": {
                "weight": 1.0,
                "features": {
                    "valence": (0.7, 1.0),
                    "energy": (0.7, 1.0),
                    "danceability": (0.7, 1.0),
                    "tempo": (120, 200)
                },
                "emojis": ["🎉", "✨", "🥳", "😄", "🌟"]
            },
            "Chill": {
                "weight": 1.0,
                "features": {
                    "energy": (0.1, 0.5),
                    "valence": (0.5, 0.8),
                    "acousticness": (0.5, 1.0),
                    "tempo": (60, 100)
                },
                "emojis": ["🌿", "🌊", "😌", "🧘", "🎧"]
            },
            "Melancholic": {
                "weight": 1.0,
                "features": {
                    "valence": (0.0, 0.3),
                    "energy": (0.0, 0.4),
                    "danceability": (0.0, 0.4),
                    "acousticness": (0.4, 1.0)
                },
                "emojis": ["🌧️", "🖤", "🎻", "💔", "🎹"]
            },
            "Energetic": {
                "weight": 1.0,
                "features": {
                    "energy": (0.8, 1.0),
                    "loudness": (-5, 0),
                    "danceability": (0.7, 1.0),
                    "tempo": (100, 200)
                },
                "emojis": ["⚡", "🔥", "💪", "🚀", "🤘"]
            },
            "Focused": {
                "weight": 1.0,
                "features": {
                    "energy": (0.4, 0.7),
                    "valence": (0.3, 0.7),
                    "instrumentalness": (0.5, 1.0),
                    "speechiness": (0.1, 0.5)
                },
                "emojis": ["🎯", "📚", "🎧", "🧠", "✍️"]
            }
        }
        
        # Feature weights for mood calculation
        self.feature_weights = {
            "valence": 0.3,
            "energy": 0.3,
            "danceability": 0.2,
            "tempo": 0.1,
            "acousticness": 0.1,
            "instrumentalness": 0.1,
            "loudness": 0.05,
            "speechiness": 0.05
        }
    
    def analyze_mood(self, audio_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze audio features and return mood with confidence.
        
        Args:
            audio_features: Dictionary of audio features from Spotify API
            
        Returns:
            Dictionary containing:
            - mood: The detected mood (string)
            - confidence: Confidence score (0-1)
            - emoji: Mood emoji
            - audio_features: The input audio features
        """
        if not audio_features:
            return {
                "mood": "Unknown",
                "confidence": 0.0,
                "emoji": "🎵",
                "audio_features": {}
            }
        
        # Normalize features
        normalized = self._normalize_features(audio_features)
        
        # Calculate mood scores
        mood_scores = {}
        for mood, profile in self.mood_profiles.items():
            score = 0.0
            total_weight = 0.0
            
            for feature, (min_val, max_val) in profile["features"].items():
                if feature not in normalized:
                    continue
                    
                value = normalized[feature]
                
                # Calculate how well this feature matches the mood (0-1)
                if min_val <= value <= max_val:
                    feature_score = 1.0
                else:
                    # Calculate distance from the nearest bound
                    distance = min(abs(value - min_val), abs(value - max_val))
                    feature_score = max(0, 1 - (distance * 2))
                
                # Apply feature weight
                weight = self.feature_weights.get(feature, 0.1)
                score += feature_score * weight
                total_weight += weight
            
            if total_weight > 0:
                # Apply mood weight and normalize
                mood_scores[mood] = (score / total_weight) * profile["weight"]
        
        # Get the mood with highest score
        if not mood_scores:
            return {
                "mood": "Neutral",
                "confidence": 0.0,
                "emoji": "🎵",
                "audio_features": audio_features
            }
        
        best_mood, confidence = max(mood_scores.items(), key=lambda x: x[1])
        
        # Get a random emoji for the mood
        emojis = self.mood_profiles[best_mood]["emojis"]
        emoji = random.choice(emojis)
        
        return {
            "mood": best_mood,
            "confidence": confidence,
            "emoji": emoji,
            "audio_features": audio_features
        }
    
    def get_witty_description(self, mood: str, track_info: Dict[str, Any]) -> str:
        """
        Generate a witty description based on mood and track info.
        
        Args:
            mood: The detected mood
            track_info: Dictionary containing track information
            
        Returns:
            A witty description string
        """
        track_name = track_info.get('name', 'this track')
        artist = track_info.get('artists', ['your favorite artist'])[0]
        
        descriptions = {
            "Upbeat": [
                f"Feeling the good vibes with {track_name} by {artist}! Perfect for dancing! 💃",
                f"Can't help but move to {track_name}! {artist} knows how to keep it upbeat! 🎵",
                f"Your energy is contagious! {track_name} is keeping the party alive! 🎉"
            ],
            "Chill": [
                f"Kicking back with {track_name} by {artist}. Perfect chill vibes. 🌿",
                f"Take a deep breath and relax with {track_name}. {artist} always knows how to mellow things out. 😌",
                f"Chill mode activated with {track_name}. Let the smooth sounds of {artist} wash over you. 🌊"
            ],
            "Melancholic": [
                f"Getting in your feels with {track_name} by {artist}. It's okay to feel. 💔",
                f"{track_name} hits different when you're in this mood. {artist} understands. 🖤",
                f"Let it out with {track_name}. Sometimes you just need to sit with these emotions. 🌧️"
            ],
            "Energetic": [
                f"Pumping energy with {track_name}! {artist} really knows how to get you moving! ⚡",
                f"Can't stop, won't stop! {track_name} is your workout anthem! 💪",
                f"Turn it up! {track_name} by {artist} is pure energy! 🔥"
            ],
            "Focused": [
                f"In the zone with {track_name}. {artist} helps you stay focused. 🎯",
                f"Deep work mode activated with {track_name}. {artist} keeps you in the flow. ✍️",
                f"Finding your rhythm with {track_name}. Perfect concentration music. 🎧"
            ]
        }
        
        # Return a random description for the mood, or a default one
        return random.choice(descriptions.get(mood, ["Enjoying your music! 🎶"]))
    
    def _normalize_features(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Normalize audio features to a consistent 0-1 scale."""
        normalized = {}
        
        for key, value in features.items():
            if key == 'tempo':
                # Normalize tempo (assuming max 200 BPM)
                normalized[key] = min(value / 200, 1.0)
            elif key == 'loudness':
                # Normalize loudness (-60 to 0 dB to 0-1)
                normalized[key] = (value + 60) / 60
            elif key in ['key', 'mode', 'time_signature']:
                # Skip these as they're not continuous
                continue
            elif isinstance(value, (int, float)):
                # Ensure value is between 0 and 1
                normalized[key] = max(0.0, min(1.0, float(value)))
        
        return normalized

# Global instance
mood_service = MoodService()
