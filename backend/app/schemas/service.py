"""
Service Schemas - Request/Response Validation
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class ServiceCreate(BaseModel):
    """Schema for creating a new service"""
    provider_id: UUID
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    duration_minutes: int = Field(..., gt=0, description="Duration in minutes")
    price: Decimal = Field(..., ge=0, description="Price for the service")
    is_active: bool = True


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    price: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    """Schema for service response"""
    id: UUID
    providerId: UUID
    name: str
    description: Optional[str]
    durationMinutes: int
    price: float
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
