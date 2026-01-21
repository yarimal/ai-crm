"""
AI Context Service - Build context data for AI assistant
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.provider import Provider
from app.models.client import Client
from app.models.appointment import Appointment, AppointmentStatus
from app.models.blocked_time import BlockedTime
from app.models.service import Service


def build_context_data(db: Session) -> str:
    """
    Get all relevant data for AI context.

    This builds a text summary of:
    - Active providers
    - Active clients
    - Available services
    - Upcoming appointments (next 14 days)
    - Blocked times (next 14 days)

    Returns:
        str: Formatted context string for AI
    """
    providers_text = _build_providers_context(db)
    clients_text = _build_clients_context(db)
    services_text = _build_services_context(db)
    appointments_text = _build_appointments_context(db)
    blocked_text = _build_blocked_times_context(db)

    return providers_text + clients_text + services_text + appointments_text + blocked_text


def _build_providers_context(db: Session) -> str:
    """Build providers section of context"""
    providers = db.query(Provider).filter(Provider.is_active == True).all()

    text = "PROVIDERS (Staff/Doctors):\n"
    if providers:
        for p in providers:
            text += f"- {p.get_display_name()} [ID: {p.id}] - {p.specialty or 'General'}, Hours: {p.working_hours}\n"
    else:
        text += "- No providers registered yet\n"

    return text


def _build_clients_context(db: Session) -> str:
    """Build clients section of context (limited to 50)"""
    clients = db.query(Client).filter(
        Client.is_active == True
    ).order_by(Client.name).limit(50).all()

    text = "\nCLIENTS:\n"
    if clients:
        for c in clients:
            text += f"- {c.name} [ID: {c.id}]"
            if c.phone:
                text += f" - Phone: {c.phone}"
            text += "\n"
    else:
        text += "- No clients registered yet\n"

    return text


def _build_services_context(db: Session) -> str:
    """Build services section of context with provider mapping"""
    services = db.query(Service).filter(Service.is_active == True).all()

    text = "\nSERVICES:\n"
    if services:
        for s in services:
            price_str = f"${float(s.price):.2f}" if s.price else "No price"
            duration_str = f"{s.duration_minutes} min" if s.duration_minutes else ""
            text += f"- {s.name} [ID: {s.id}] - {price_str}"
            if duration_str:
                text += f", {duration_str}"
            if s.description:
                text += f" - {s.description}"

            # Add provider information if available
            if s.provider_id:
                provider = db.query(Provider).filter(Provider.id == s.provider_id).first()
                if provider:
                    text += f" (Provider: {provider.get_display_name()})"

            text += "\n"
    else:
        text += "- No services available\n"

    return text


def _build_appointments_context(db: Session) -> str:
    """Build upcoming appointments section (next 14 days)"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    two_weeks = today + timedelta(days=14)

    appointments = db.query(Appointment).filter(
        Appointment.status != AppointmentStatus.CANCELLED.value,
        Appointment.start_time >= today,
        Appointment.start_time < two_weeks
    ).order_by(Appointment.start_time).all()

    # Get related data efficiently
    provider_ids = set(a.provider_id for a in appointments)
    client_ids = set(a.client_id for a in appointments)

    providers_map = {}
    if provider_ids:
        providers_map = {
            p.id: p for p in db.query(Provider).filter(Provider.id.in_(provider_ids)).all()
        }

    clients_map = {}
    if client_ids:
        clients_map = {
            c.id: c for c in db.query(Client).filter(Client.id.in_(client_ids)).all()
        }

    text = "\nUPCOMING APPOINTMENTS (Next 2 weeks):\n"
    if appointments:
        for a in appointments:
            provider = providers_map.get(a.provider_id)
            client = clients_map.get(a.client_id)
            text += (
                f"- [ID: {a.id}] {a.start_time.strftime('%Y-%m-%d %H:%M')}-{a.end_time.strftime('%H:%M')} | "
                f"Provider: {provider.get_display_name() if provider else 'Unknown'} | "
                f"Client: {client.name if client else 'Unknown'}\n"
            )
    else:
        text += "- No upcoming appointments\n"

    return text


def _build_blocked_times_context(db: Session) -> str:
    """Build blocked times section (next 14 days)"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    two_weeks = today + timedelta(days=14)

    blocked_times = db.query(BlockedTime).filter(
        BlockedTime.is_active == True,
        BlockedTime.start_time >= today,
        BlockedTime.start_time < two_weeks
    ).order_by(BlockedTime.start_time).all()

    text = "\nBLOCKED TIMES (Provider unavailable):\n"
    if blocked_times:
        # Get provider names efficiently
        provider_ids = set(bt.provider_id for bt in blocked_times)
        providers_map = {}
        if provider_ids:
            providers_map = {
                p.id: p for p in db.query(Provider).filter(Provider.id.in_(provider_ids)).all()
            }

        for bt in blocked_times:
            provider = providers_map.get(bt.provider_id)
            reason = bt.reason or bt.block_type or "blocked"
            text += (
                f"- {bt.start_time.strftime('%Y-%m-%d %H:%M')}-{bt.end_time.strftime('%H:%M')} | "
                f"Provider: {provider.get_display_name() if provider else 'Unknown'} | "
                f"Reason: {reason}"
            )
            if bt.is_recurring:
                text += f" (Recurring: {bt.recurrence_pattern})"
            text += "\n"
    else:
        text += "- No blocked times\n"

    return text
