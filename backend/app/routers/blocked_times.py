"""
Blocked Time API Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.blocked_time import BlockedTime, BlockType
from app.models.provider import Provider

router = APIRouter(prefix="/blocked-times", tags=["Blocked Times"])


class BlockedTimeCreate(BaseModel):
    provider_id: str
    start_time: datetime
    end_time: datetime
    block_type: Optional[str] = "other"
    reason: Optional[str] = None
    is_recurring: Optional[bool] = False
    recurrence_pattern: Optional[str] = None  # daily, weekly
    recurrence_end_date: Optional[datetime] = None


class BlockedTimeUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    block_type: Optional[str] = None
    reason: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


@router.get("")
def get_blocked_times(
    provider_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get blocked times, optionally filtered by provider and date range"""
    query = db.query(BlockedTime).filter(BlockedTime.is_active == True)
    
    if provider_id:
        query = query.filter(BlockedTime.provider_id == provider_id)
    
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(BlockedTime.end_time >= start)
    
    if end_date:
        end = datetime.fromisoformat(end_date)
        query = query.filter(BlockedTime.start_time <= end)
    
    blocked_times = query.order_by(BlockedTime.start_time).all()
    
    # Expand recurring blocked times
    result = []
    for bt in blocked_times:
        if bt.is_recurring and bt.recurrence_pattern:
            expanded = expand_recurring_blocked_time(bt, start_date, end_date)
            result.extend(expanded)
        else:
            result.append(bt.to_dict())
    
    return result


def expand_recurring_blocked_time(bt: BlockedTime, start_date: str = None, end_date: str = None):
    """Expand a recurring blocked time into individual instances"""
    instances = []
    
    # Determine date range
    range_start = datetime.fromisoformat(start_date) if start_date else datetime.now()
    range_end = datetime.fromisoformat(end_date) if end_date else range_start + timedelta(days=30)
    
    if bt.recurrence_end_date and bt.recurrence_end_date < range_end:
        range_end = bt.recurrence_end_date
    
    current_start = bt.start_time
    current_end = bt.end_time
    duration = current_end - current_start
    
    while current_start <= range_end:
        if current_end >= range_start:
            instances.append({
                "id": str(bt.id),
                "providerId": str(bt.provider_id),
                "start": current_start.isoformat(),
                "end": current_end.isoformat(),
                "blockType": bt.block_type,
                "reason": bt.reason,
                "isRecurring": True,
                "recurrencePattern": bt.recurrence_pattern,
                "isActive": bt.is_active
            })
        
        # Move to next occurrence
        if bt.recurrence_pattern == "daily":
            current_start += timedelta(days=1)
        elif bt.recurrence_pattern == "weekly":
            current_start += timedelta(weeks=1)
        elif bt.recurrence_pattern == "monthly":
            # Simple monthly - add 30 days
            current_start += timedelta(days=30)
        else:
            break
        
        current_end = current_start + duration
    
    return instances


@router.get("/provider/{provider_id}")
def get_provider_blocked_times(
    provider_id: str,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get blocked times for a specific provider"""
    query = db.query(BlockedTime).filter(
        BlockedTime.provider_id == provider_id,
        BlockedTime.is_active == True
    )
    
    if date:
        date_start = datetime.fromisoformat(date)
        date_end = date_start + timedelta(days=1)
        query = query.filter(
            BlockedTime.start_time < date_end,
            BlockedTime.end_time > date_start
        )
    
    blocked_times = query.order_by(BlockedTime.start_time).all()
    return [bt.to_dict() for bt in blocked_times]


@router.post("")
def create_blocked_time(
    data: BlockedTimeCreate,
    db: Session = Depends(get_db)
):
    """Create a new blocked time"""
    # Verify provider exists
    provider = db.query(Provider).filter(Provider.id == data.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Validate times
    if data.end_time <= data.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    blocked_time = BlockedTime(
        provider_id=data.provider_id,
        start_time=data.start_time,
        end_time=data.end_time,
        block_type=data.block_type,
        reason=data.reason,
        is_recurring=data.is_recurring,
        recurrence_pattern=data.recurrence_pattern,
        recurrence_end_date=data.recurrence_end_date
    )
    
    db.add(blocked_time)
    db.commit()
    db.refresh(blocked_time)
    
    return blocked_time.to_dict()


@router.put("/{blocked_time_id}")
def update_blocked_time(
    blocked_time_id: str,
    data: BlockedTimeUpdate,
    db: Session = Depends(get_db)
):
    """Update a blocked time"""
    blocked_time = db.query(BlockedTime).filter(BlockedTime.id == blocked_time_id).first()
    if not blocked_time:
        raise HTTPException(status_code=404, detail="Blocked time not found")
    
    # Update fields
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(blocked_time, field):
            setattr(blocked_time, field, value)
    
    db.commit()
    db.refresh(blocked_time)
    
    return blocked_time.to_dict()


@router.delete("/{blocked_time_id}")
def delete_blocked_time(
    blocked_time_id: str,
    db: Session = Depends(get_db)
):
    """Delete (soft) a blocked time"""
    blocked_time = db.query(BlockedTime).filter(BlockedTime.id == blocked_time_id).first()
    if not blocked_time:
        raise HTTPException(status_code=404, detail="Blocked time not found")
    
    blocked_time.is_active = False
    db.commit()
    
    return {"message": "Blocked time deleted"}


def check_blocked_time_conflict(
    db: Session,
    provider_id: str,
    start_time: datetime,
    end_time: datetime
) -> Optional[BlockedTime]:
    """Check if a time slot conflicts with any blocked time"""
    conflict = db.query(BlockedTime).filter(
        BlockedTime.provider_id == provider_id,
        BlockedTime.is_active == True,
        BlockedTime.start_time < end_time,
        BlockedTime.end_time > start_time
    ).first()
    
    return conflict