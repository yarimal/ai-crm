"""
Appointments API Router - Book and manage appointments
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime, timedelta

from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.provider import Provider
from app.models.client import Client
from app.models.service import Service

router = APIRouter(prefix="/appointments", tags=["Appointments"])


# Schemas
class AppointmentCreate(BaseModel):
    provider_id: UUID
    client_id: UUID
    service_id: Optional[UUID] = None
    start_time: datetime = Field(..., alias="start")
    end_time: datetime = Field(..., alias="end")
    title: Optional[str] = None
    service_type: Optional[str] = None
    notes: Optional[str] = None
    revenue: Optional[float] = None
    color: Optional[str] = None

    class Config:
        populate_by_name = True


class AppointmentUpdate(BaseModel):
    provider_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    start_time: Optional[datetime] = Field(None, alias="start")
    end_time: Optional[datetime] = Field(None, alias="end")
    title: Optional[str] = None
    service_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    revenue: Optional[float] = None
    color: Optional[str] = None

    class Config:
        populate_by_name = True


def get_appointment_with_details(db: Session, appointment: Appointment):
    """Get appointment with provider and client details"""
    provider = db.query(Provider).filter(Provider.id == appointment.provider_id).first()
    client = db.query(Client).filter(Client.id == appointment.client_id).first()
    return appointment.to_dict(provider=provider, client=client)


@router.get("")
async def get_appointments(
    provider_id: Optional[UUID] = None,
    client_id: Optional[UUID] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get appointments with optional filters"""
    query = db.query(Appointment)
    
    if provider_id:
        query = query.filter(Appointment.provider_id == provider_id)
    
    if client_id:
        query = query.filter(Appointment.client_id == client_id)
    
    if start_date:
        query = query.filter(Appointment.start_time >= start_date)
    
    if end_date:
        query = query.filter(Appointment.start_time <= end_date)
    
    if status:
        query = query.filter(Appointment.status == status)
    
    appointments = query.order_by(Appointment.start_time).all()
    
    # Get all related providers and clients in one query
    provider_ids = set(a.provider_id for a in appointments)
    client_ids = set(a.client_id for a in appointments)
    
    providers = {p.id: p for p in db.query(Provider).filter(Provider.id.in_(provider_ids)).all()}
    clients = {c.id: c for c in db.query(Client).filter(Client.id.in_(client_ids)).all()}
    
    return [
        a.to_dict(provider=providers.get(a.provider_id), client=clients.get(a.client_id))
        for a in appointments
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new appointment"""
    # Verify provider exists
    provider = db.query(Provider).filter(Provider.id == data.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Verify client exists
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # If service_id is provided, verify service exists and get price
    service_revenue = data.revenue
    if data.service_id:
        service = db.query(Service).filter(Service.id == data.service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        # Use service price if revenue not explicitly provided
        if service_revenue is None:
            service_revenue = float(service.price)

    # Check for conflicts
    conflict = db.query(Appointment).filter(
        Appointment.provider_id == data.provider_id,
        Appointment.status != AppointmentStatus.CANCELLED.value,
        Appointment.start_time < data.end_time,
        Appointment.end_time > data.start_time
    ).first()
    
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Provider has another appointment at this time"
        )
    
    appointment = Appointment(
        provider_id=data.provider_id,
        client_id=data.client_id,
        service_id=data.service_id,
        start_time=data.start_time,
        end_time=data.end_time,
        title=data.title,
        service_type=data.service_type,
        notes=data.notes,
        revenue=service_revenue,
        color=data.color
    )
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    return appointment.to_dict(provider=provider, client=client)


@router.get("/availability")
async def check_availability(
    provider_id: Optional[UUID] = None,
    date: datetime = Query(..., description="Date to check (YYYY-MM-DD)"),
    duration_minutes: int = Query(30, description="Appointment duration"),
    db: Session = Depends(get_db)
):
    """Check available slots for a provider or all providers on a date"""
    
    # Get providers
    if provider_id:
        providers = db.query(Provider).filter(
            Provider.id == provider_id,
            Provider.is_active == True
        ).all()
    else:
        providers = db.query(Provider).filter(Provider.is_active == True).all()
    
    if not providers:
        return {"date": date.strftime("%Y-%m-%d"), "slots": []}
    
    # Set date range
    day_start = datetime(date.year, date.month, date.day, 0, 0, 0)
    day_end = day_start + timedelta(days=1)
    
    result = []
    
    for provider in providers:
        # Parse working hours
        try:
            start_hour, end_hour = provider.working_hours.split("-")
            work_start = int(start_hour.split(":")[0])
            work_end = int(end_hour.split(":")[0])
        except:
            work_start, work_end = 9, 17
        
        # Get existing appointments for this provider on this day
        appointments = db.query(Appointment).filter(
            Appointment.provider_id == provider.id,
            Appointment.status != AppointmentStatus.CANCELLED.value,
            Appointment.start_time >= day_start,
            Appointment.start_time < day_end
        ).order_by(Appointment.start_time).all()
        
        # Find available slots
        available_slots = []
        current_time = day_start.replace(hour=work_start, minute=0)
        end_work_time = day_start.replace(hour=work_end, minute=0)
        
        for appt in appointments:
            # Add slot before this appointment if there's room
            if current_time + timedelta(minutes=duration_minutes) <= appt.start_time:
                available_slots.append({
                    "start": current_time.strftime("%H:%M"),
                    "end": appt.start_time.strftime("%H:%M")
                })
            current_time = max(current_time, appt.end_time)
        
        # Add remaining time after last appointment
        if current_time + timedelta(minutes=duration_minutes) <= end_work_time:
            available_slots.append({
                "start": current_time.strftime("%H:%M"),
                "end": end_work_time.strftime("%H:%M")
            })
        
        result.append({
            "provider": provider.to_dict(),
            "availableSlots": available_slots,
            "appointmentCount": len(appointments)
        })
    
    return {
        "date": date.strftime("%Y-%m-%d"),
        "durationMinutes": duration_minutes,
        "providers": result
    }


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return get_appointment_with_details(db, appointment)


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: UUID,
    data: AppointmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Update fields
    if data.provider_id is not None:
        appointment.provider_id = data.provider_id
    if data.client_id is not None:
        appointment.client_id = data.client_id
    if data.service_id is not None:
        appointment.service_id = data.service_id
        # If service changed, update revenue from service price
        if data.revenue is None:
            service = db.query(Service).filter(Service.id == data.service_id).first()
            if service:
                appointment.revenue = float(service.price)
    if data.revenue is not None:
        appointment.revenue = data.revenue
    if data.start_time is not None:
        appointment.start_time = data.start_time
    if data.end_time is not None:
        appointment.end_time = data.end_time
    if data.title is not None:
        appointment.title = data.title
    if data.service_type is not None:
        appointment.service_type = data.service_type
    if data.notes is not None:
        appointment.notes = data.notes
    if data.status is not None:
        appointment.status = data.status
    if data.color is not None:
        appointment.color = data.color

    db.commit()
    db.refresh(appointment)
    
    return get_appointment_with_details(db, appointment)


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: UUID,
    db: Session = Depends(get_db)
):
    """Cancel an appointment"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = AppointmentStatus.CANCELLED.value
    db.commit()
    
    return None
