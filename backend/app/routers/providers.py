"""
Providers API Router - Manage staff/doctors
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.provider import Provider

router = APIRouter(prefix="/providers", tags=["Providers"])


# Schemas
class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=1)
    title: Optional[str] = None
    specialty: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    color: str = "#1a73e8"
    working_hours: str = "09:00-17:00"
    notes: Optional[str] = None


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    specialty: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    color: Optional[str] = None
    working_hours: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("")
async def get_providers(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all providers"""
    query = db.query(Provider)
    if active_only:
        query = query.filter(Provider.is_active == True)
    providers = query.order_by(Provider.name).all()
    return [p.to_dict() for p in providers]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_provider(
    data: ProviderCreate,
    db: Session = Depends(get_db)
):
    """Create a new provider"""
    provider = Provider(
        name=data.name,
        title=data.title,
        specialty=data.specialty,
        email=data.email,
        phone=data.phone,
        color=data.color,
        working_hours=data.working_hours,
        notes=data.notes
    )
    
    db.add(provider)
    db.commit()
    db.refresh(provider)
    
    return provider.to_dict()


@router.get("/{provider_id}")
async def get_provider(
    provider_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific provider"""
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider.to_dict()


@router.put("/{provider_id}")
async def update_provider(
    provider_id: UUID,
    data: ProviderUpdate,
    db: Session = Depends(get_db)
):
    """Update a provider"""
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    for field, value in data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(provider, field, value)
    
    db.commit()
    db.refresh(provider)
    
    return provider.to_dict()


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a provider"""
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Soft delete - just deactivate
    provider.is_active = False
    db.commit()
    
    return None
