from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    spotify_id = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    token_expires = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    metrics = relationship("ListeningMetric", back_populates="user")

class ListeningMetric(Base):
    __tablename__ = "listening_metrics"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric_type = Column(String)  # top_artists, top_tracks, etc.
    captured_at = Column(DateTime, default=datetime.utcnow)
    payload = Column(JSON)

    user = relationship("User", back_populates="metrics")
    __table_args__ = (UniqueConstraint("user_id", "metric_type", "captured_at", name="uix_metric_dedupe"),)
