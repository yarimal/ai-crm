"""
Service Model - Services that providers offer (Haircut, Consultation, Massage, etc.)
"""
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class Service(Base):
    """Service Model - Services offered by providers with pricing"""

    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Key
    provider_id = Column(UUID(as_uuid=True), ForeignKey('providers.id'), nullable=False)

    # Basic Info
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    # Pricing and Duration
    duration_minutes = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)  # e.g., 50.00

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("Provider", back_populates="services")

    def __repr__(self):
        return f"<Service(id={self.id}, name='{self.name}', price={self.price})>"

    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "id": str(self.id),
            "providerId": str(self.provider_id),
            "name": self.name,
            "description": self.description,
            "durationMinutes": self.duration_minutes,
            "price": float(self.price),
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


    