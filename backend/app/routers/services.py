"""
Services API Router - Manage services offered by providers
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.service import Service
from app.models.provider import Provider
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("", response_model=List[ServiceResponse])
async def get_services(
    provider_id: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all services, optionally filtered by provider"""
    query = db.query(Service)

    if provider_id:
        try:
            provider_uuid = UUID(provider_id)
            query = query.filter(Service.provider_id == provider_uuid)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid provider ID format"
            )

    if active_only:
        query = query.filter(Service.is_active == True)

    services = query.order_by(Service.name).all()
    return [ServiceResponse(**s.to_dict()) for s in services]


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific service by ID"""
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service {service_id} not found"
        )

    return ServiceResponse(**service.to_dict())


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db)
):
    """Create a new service"""
    # Verify provider exists
    provider = db.query(Provider).filter(Provider.id == service_data.provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider {service_data.provider_id} not found"
        )

    # Create service
    service = Service(
        provider_id=service_data.provider_id,
        name=service_data.name,
        description=service_data.description,
        duration_minutes=service_data.duration_minutes,
        price=service_data.price,
        is_active=service_data.is_active
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return ServiceResponse(**service.to_dict())


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: UUID,
    service_data: ServiceUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing service"""
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service {service_id} not found"
        )

    # Update fields
    update_data = service_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    return ServiceResponse(**service.to_dict())


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete a service (mark as inactive)"""
    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service {service_id} not found"
        )

    service.is_active = False
    db.commit()

    return None
