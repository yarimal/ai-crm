"""
Blocked Time Model - Time slots when a provider is unavailable
"""
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
import enum

from app.database import Base


class BlockType(enum.Enum):
    LUNCH = "lunch"
    BREAK = "break"
    MEETING = "meeting"
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    OTHER = "other"


class BlockedTime(Base):
    __tablename__ = "blocked_times"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False)
    
    # Time range
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    # Details
    block_type = Column(String(50), default=BlockType.OTHER.value)
    reason = Column(String(255), nullable=True)
    
    # Recurring options
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50), nullable=True)  # daily, weekly, monthly
    recurrence_end_date = Column(DateTime, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    provider = relationship("Provider", back_populates="blocked_times")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "providerId": str(self.provider_id),
            "start": self.start_time.isoformat() if self.start_time else None,
            "end": self.end_time.isoformat() if self.end_time else None,
            "blockType": self.block_type,
            "reason": self.reason,
            "isRecurring": self.is_recurring,
            "recurrencePattern": self.recurrence_pattern,
            "isActive": self.is_active
        }