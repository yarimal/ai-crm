"""
Appointment Model - Scheduled meetings between Providers and Clients
"""
from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class Appointment(Base):
    """Appointment Model - Links Provider + Client + Time"""
    
    __tablename__ = "appointments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Title (auto-generated or custom)
    title = Column(String(255), nullable=True)
    
    # Time
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    
    # Links
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    
    # Details
    service_type = Column(String(255), nullable=True)  # Consultation, Checkup, etc.
    notes = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), default=AppointmentStatus.SCHEDULED.value)
    
    # Display
    color = Column(String(20), nullable=True)  # Override provider color if needed
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Appointment(id={self.id}, provider={self.provider_id}, client={self.client_id})>"
    
    def to_dict(self, provider=None, client=None):
        """Convert to dictionary for JSON serialization"""
        start_str = self.start_time.strftime("%Y-%m-%dT%H:%M:%S")
        end_str = self.end_time.strftime("%Y-%m-%dT%H:%M:%S")
        
        # Build title
        display_title = self.title
        if not display_title and client:
            display_title = f"{client.name}"
        if not display_title:
            display_title = "Appointment"
        
        # Use provider color if no override
        display_color = self.color
        if not display_color and provider:
            display_color = provider.color
        if not display_color:
            display_color = "#1a73e8"
        
        return {
            "id": str(self.id),
            "title": display_title,
            "start": start_str,
            "end": end_str,
            "providerId": str(self.provider_id),
            "clientId": str(self.client_id),
            "providerName": provider.get_display_name() if provider else None,
            "clientName": client.name if client else None,
            "serviceType": self.service_type,
            "notes": self.notes,
            "status": self.status,
            "color": display_color,
            "extendedProps": {
                "providerId": str(self.provider_id),
                "clientId": str(self.client_id),
                "providerName": provider.get_display_name() if provider else None,
                "clientName": client.name if client else None,
                "serviceType": self.service_type,
                "status": self.status,
                "notes": self.notes
            }
        }
