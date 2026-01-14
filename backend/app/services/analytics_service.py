from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from uuid import UUID

from app.models import Provider, Client, Appointment, Chat


class AnalyticsService:
    """Service for calculating analytics and statistics"""

    @staticmethod
    def get_overview_stats(db: Session, start_date: datetime, end_date: datetime, provider_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Get overview statistics for the dashboard"""

        # Make dates timezone-aware
        start_date = start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date
        end_date = end_date.replace(tzinfo=timezone.utc) if end_date.tzinfo is None else end_date

        # Total appointments in date range
        query = db.query(Appointment).filter(
            Appointment.start_time >= start_date,
            Appointment.start_time <= end_date
        )
        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)
        total_appointments = query.count()

        # Total clients (using is_active field)
        total_clients = db.query(Client).filter(Client.is_active == True).count()

        # Total providers (using is_active field)
        total_providers = db.query(Provider).filter(Provider.is_active == True).count()

        # Appointment status breakdown
        status_query = db.query(
            Appointment.status,
            func.count(Appointment.id).label('count')
        ).filter(
            Appointment.start_time >= start_date,
            Appointment.start_time <= end_date
        )
        if provider_id:
            status_query = status_query.filter(Appointment.provider_id == provider_id)
        status_counts = status_query.group_by(Appointment.status).all()

        status_breakdown = {status: count for status, count in status_counts}

        # Today's appointments - use a 48-hour window to account for timezone differences
        now = datetime.now(timezone.utc)
        today_window_start = now - timedelta(hours=24)
        today_window_end = now + timedelta(hours=24)

        today_query = db.query(Appointment).filter(
            Appointment.start_time >= today_window_start,
            Appointment.start_time < today_window_end
        )
        if provider_id:
            today_query = today_query.filter(Appointment.provider_id == provider_id)
        today_appointments = today_query.count()

        # This week's appointments - use a wider window
        week_window_start = now - timedelta(days=7)
        week_window_end = now + timedelta(days=7)

        week_query = db.query(Appointment).filter(
            Appointment.start_time >= week_window_start,
            Appointment.start_time < week_window_end
        )
        if provider_id:
            week_query = week_query.filter(Appointment.provider_id == provider_id)
        week_appointments = week_query.count()

        return {
            "total_appointments": total_appointments,
            "total_clients": total_clients,
            "total_providers": total_providers,
            "today_appointments": today_appointments,
            "week_appointments": week_appointments,
            "status_breakdown": status_breakdown
        }

    @staticmethod
    def get_appointments_over_time(db: Session, start_date: datetime, end_date: datetime, provider_id: Optional[UUID] = None) -> List[Dict[str, Any]]:
        """Get appointment counts grouped by date"""

        # Make dates timezone-aware
        start_date = start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date
        end_date = end_date.replace(tzinfo=timezone.utc) if end_date.tzinfo is None else end_date

        # Query appointments grouped by date
        query = db.query(
            func.date(Appointment.start_time).label('date'),
            func.count(Appointment.id).label('count')
        ).filter(
            Appointment.start_time >= start_date,
            Appointment.start_time <= end_date
        )
        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)
        appointments = query.group_by(func.date(Appointment.start_time)).order_by('date').all()

        return [{"date": str(date), "count": count} for date, count in appointments]

    @staticmethod
    def get_appointments_by_provider(db: Session, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get appointment counts grouped by provider"""

        # Make dates timezone-aware
        start_date = start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date
        end_date = end_date.replace(tzinfo=timezone.utc) if end_date.tzinfo is None else end_date

        # Query appointments grouped by provider
        appointments = db.query(
            Provider.name,
            func.count(Appointment.id).label('count')
        ).join(
            Appointment, Appointment.provider_id == Provider.id
        ).filter(
            Appointment.start_time >= start_date,
            Appointment.start_time <= end_date,
            Provider.is_active == True
        ).group_by(Provider.name).order_by(func.count(Appointment.id).desc()).all()

        return [{"provider": name, "count": count} for name, count in appointments]

    @staticmethod
    def get_appointments_by_status(db: Session, start_date: datetime, end_date: datetime, provider_id: Optional[UUID] = None) -> List[Dict[str, Any]]:
        """Get appointment counts grouped by status"""

        # Make dates timezone-aware
        start_date = start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date
        end_date = end_date.replace(tzinfo=timezone.utc) if end_date.tzinfo is None else end_date

        # Query appointments grouped by status
        query = db.query(
            Appointment.status,
            func.count(Appointment.id).label('count')
        ).filter(
            Appointment.start_time >= start_date,
            Appointment.start_time <= end_date
        )
        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)
        appointments = query.group_by(Appointment.status).all()

        # Ensure we have all statuses even if count is 0
        status_map = {
            "scheduled": 0,
            "completed": 0,
            "cancelled": 0,
            "no-show": 0
        }

        for status, count in appointments:
            if status in status_map:
                status_map[status] = count

        return [{"status": status, "count": count} for status, count in status_map.items()]

    @staticmethod
    def get_realtime_metrics(db: Session, provider_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Get real-time metrics for live dashboard updates"""

        # Use UTC time - appointments are stored in UTC
        now = datetime.now(timezone.utc)

        # Query a 48-hour window to safely cover "today" in any timezone
        window_start = now - timedelta(hours=24)
        window_end = now + timedelta(hours=24)

        # Get all appointments in this window
        window_query = db.query(Appointment).filter(
            Appointment.start_time >= window_start,
            Appointment.start_time < window_end
        )
        if provider_id:
            window_query = window_query.filter(Appointment.provider_id == provider_id)
        window_appointments = window_query.all()

        # Count today's appointments by status
        today_by_status = {}
        for appt in window_appointments:
            status = appt.status
            today_by_status[status] = today_by_status.get(status, 0) + 1

        total_today = len(window_appointments)

        # Find current appointment (happening right now)
        current_query = db.query(Appointment, Provider, Client).join(
            Provider, Appointment.provider_id == Provider.id
        ).join(
            Client, Appointment.client_id == Client.id
        ).filter(
            Appointment.start_time <= now,
            Appointment.end_time >= now
        )
        if provider_id:
            current_query = current_query.filter(Appointment.provider_id == provider_id)
        current_appointment = current_query.first()

        current_appt_data = None
        if current_appointment:
            appt, provider, client = current_appointment
            minutes_remaining = int((appt.end_time - now).total_seconds() / 60)
            current_appt_data = {
                "id": str(appt.id),
                "title": appt.title or client.name,
                "provider": provider.get_display_name(),
                "client": client.name,
                "start": appt.start_time.isoformat(),
                "end": appt.end_time.isoformat(),
                "status": appt.status,
                "minutesRemaining": minutes_remaining
            }

        # Find next upcoming appointment
        next_query = db.query(Appointment, Provider, Client).join(
            Provider, Appointment.provider_id == Provider.id
        ).join(
            Client, Appointment.client_id == Client.id
        ).filter(
            Appointment.start_time > now
        )
        if provider_id:
            next_query = next_query.filter(Appointment.provider_id == provider_id)
        next_appointment = next_query.order_by(Appointment.start_time.asc()).first()

        next_appt_data = None
        if next_appointment:
            appt, provider, client = next_appointment
            minutes_until = int((appt.start_time - now).total_seconds() / 60)
            next_appt_data = {
                "id": str(appt.id),
                "title": appt.title or client.name,
                "provider": provider.get_display_name(),
                "client": client.name,
                "start": appt.start_time.isoformat(),
                "end": appt.end_time.isoformat(),
                "status": appt.status,
                "minutesUntil": minutes_until
            }

        # Calculate occupancy rate for the 48-hour window
        total_working_minutes = 8 * 60  # Assume 8-hour work day
        occupancy_query = db.query(
            func.sum(
                func.extract('epoch', Appointment.end_time - Appointment.start_time) / 60
            )
        ).filter(
            Appointment.start_time >= window_start,
            Appointment.start_time < window_end,
            Appointment.status.in_(['scheduled', 'confirmed', 'completed'])
        )
        if provider_id:
            occupancy_query = occupancy_query.filter(Appointment.provider_id == provider_id)
        scheduled_minutes = occupancy_query.scalar() or 0

        occupancy_rate = min(100, (scheduled_minutes / total_working_minutes) * 100) if total_working_minutes > 0 else 0

        return {
            "totalToday": total_today,
            "todayByStatus": today_by_status,
            "currentAppointment": current_appt_data,
            "nextAppointment": next_appt_data,
            "occupancyRate": round(occupancy_rate, 1),
            "timestamp": now.isoformat()
        }
