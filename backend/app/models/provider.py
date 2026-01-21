"""
Provider Model - Staff members who provide services (Doctors, Consultants, etc.)
"""
from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Provider(Base):
    """Provider/Staff Model - Doctors, Consultants, Therapists, etc."""
    
    __tablename__ = "providers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic Info
    name = Column(String(255), nullable=False)
    title = Column(String(100), nullable=True)  # Dr., Prof., etc.
    specialty = Column(String(255), nullable=True)  # Cardiologist, Dentist, etc.
    
    # Contact
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Display
    color = Column(String(20), default="#1a73e8")  # Calendar color
    
    # Working hours (stored as JSON string for simplicity)
    # Format: "09:00-17:00" or more complex scheduling
    working_hours = Column(String(500), default="09:00-17:00")
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    blocked_times = relationship("BlockedTime", back_populates="provider", lazy="dynamic")
    services = relationship("Service", back_populates="provider", lazy="dynamic")
    
    def __repr__(self):
        return f"<Provider(id={self.id}, name='{self.name}')>"
    
    def get_display_name(self):
        """Get full display name with title"""
        if self.title:
            return f"{self.title} {self.name}"
        return self.name
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "id": str(self.id),
            "name": self.name,
            "title": self.title,
            "displayName": self.get_display_name(),
            "specialty": self.specialty,
            "email": self.email,
            "phone": self.phone,
            "color": self.color,
            "workingHours": self.working_hours,
            "notes": self.notes,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }