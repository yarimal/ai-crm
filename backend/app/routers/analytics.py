from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.services.analytics_service import AnalyticsService


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
def get_overview(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    db: Session = Depends(get_db)
):
    """
    Get overview statistics for the dashboard.

    If no dates provided, defaults to last 30 days.
    """
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date_dt = datetime.now(timezone.utc)
    else:
        end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

    if not start_date:
        start_date_dt = end_date_dt - timedelta(days=30)
    else:
        start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))

    provider_uuid = UUID(provider_id) if provider_id else None
    stats = AnalyticsService.get_overview_stats(db, start_date_dt, end_date_dt, provider_uuid)

    return {
        "start_date": start_date_dt.isoformat(),
        "end_date": end_date_dt.isoformat(),
        **stats
    }


@router.get("/appointments-over-time")
def get_appointments_over_time(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    db: Session = Depends(get_db)
):
    """
    Get appointment counts grouped by date.

    Returns a time series of appointment counts.
    """
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date_dt = datetime.now(timezone.utc)
    else:
        end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

    if not start_date:
        start_date_dt = end_date_dt - timedelta(days=30)
    else:
        start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))

    provider_uuid = UUID(provider_id) if provider_id else None
    data = AnalyticsService.get_appointments_over_time(db, start_date_dt, end_date_dt, provider_uuid)

    return {
        "start_date": start_date_dt.isoformat(),
        "end_date": end_date_dt.isoformat(),
        "data": data
    }


@router.get("/appointments-by-provider")
def get_appointments_by_provider(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    db: Session = Depends(get_db)
):
    """
    Get appointment counts grouped by provider.

    Returns provider names and their appointment counts.
    """
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date_dt = datetime.now(timezone.utc)
    else:
        end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

    if not start_date:
        start_date_dt = end_date_dt - timedelta(days=30)
    else:
        start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))

    data = AnalyticsService.get_appointments_by_provider(db, start_date_dt, end_date_dt)

    return {
        "start_date": start_date_dt.isoformat(),
        "end_date": end_date_dt.isoformat(),
        "data": data
    }


@router.get("/appointments-by-status")
def get_appointments_by_status(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    db: Session = Depends(get_db)
):
    """
    Get appointment counts grouped by status.

    Returns status types and their counts.
    """
    # Default to last 30 days if no dates provided
    if not end_date:
        end_date_dt = datetime.now(timezone.utc)
    else:
        end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

    if not start_date:
        start_date_dt = end_date_dt - timedelta(days=30)
    else:
        start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))

    provider_uuid = UUID(provider_id) if provider_id else None
    data = AnalyticsService.get_appointments_by_status(db, start_date_dt, end_date_dt, provider_uuid)

    return {
        "start_date": start_date_dt.isoformat(),
        "end_date": end_date_dt.isoformat(),
        "data": data
    }


@router.get("/realtime")
def get_realtime_metrics(
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    db: Session = Depends(get_db)
):
    """
    Get real-time metrics for live dashboard updates.

    Returns current appointment, next appointment, today's count, and occupancy rate.
    """
    provider_uuid = UUID(provider_id) if provider_id else None
    metrics = AnalyticsService.get_realtime_metrics(db, provider_uuid)

    return metrics
