"""
Clients API Router - Manage clients/patients
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime

from app.database import get_db
from app.models.client import Client

router = APIRouter(prefix="/clients", tags=["Clients"])


# Schemas
class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("")
async def get_clients(
    search: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all clients, optionally search by name/phone"""
    query = db.query(Client)
    
    if active_only:
        query = query.filter(Client.is_active == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_term)) |
            (Client.phone.ilike(search_term)) |
            (Client.email.ilike(search_term))
        )
    
    clients = query.order_by(Client.name).limit(100).all()
    return [c.to_dict() for c in clients]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db)
):
    """Create a new client"""
    client = Client(
        name=data.name,
        email=data.email,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        address=data.address,
        notes=data.notes
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return client.to_dict()


@router.get("/{client_id}")
async def get_client(
    client_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client.to_dict()


@router.put("/{client_id}")
async def update_client(
    client_id: UUID,
    data: ClientUpdate,
    db: Session = Depends(get_db)
):
    """Update a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    for field, value in data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(client, field, value)
    
    db.commit()
    db.refresh(client)
    
    return client.to_dict()


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client.is_active = False
    db.commit()
    
    return None
