"""
AI Function Handlers - Business logic for AI function calls
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.models.provider import Provider
from app.models.client import Client
from app.models.appointment import Appointment, AppointmentStatus
from app.models.blocked_time import BlockedTime
from app.models.service import Service


def _make_aware(dt: datetime) -> datetime:
    """Make a naive datetime timezone-aware (UTC)"""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def create_appointment(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Create a new appointment"""
    try:
        provider_id = args.get("provider_id")
        client_id = args.get("client_id")
        date = args.get("date")
        start_time = args.get("start_time")
        end_time = args.get("end_time")
        notes = args.get("notes", "")

        # Verify provider
        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            return {"success": False, "error": "Provider not found"}

        # Verify client
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            return {"success": False, "error": "Client not found"}

        # Parse times
        start_dt = datetime.fromisoformat(f"{date}T{start_time}:00")
        end_dt = datetime.fromisoformat(f"{date}T{end_time}:00")

        # Check for blocked time conflicts
        blocked = db.query(BlockedTime).filter(
            BlockedTime.provider_id == provider_id,
            BlockedTime.is_active == True,
            BlockedTime.start_time < end_dt,
            BlockedTime.end_time > start_dt
        ).first()

        if blocked:
            reason = blocked.reason or blocked.block_type or "blocked"
            return {"success": False, "error": f"{provider.get_display_name()} is unavailable at this time ({reason})"}

        # Check for appointment conflicts
        conflict = db.query(Appointment).filter(
            Appointment.provider_id == provider_id,
            Appointment.status != AppointmentStatus.CANCELLED.value,
            Appointment.start_time < end_dt,
            Appointment.end_time > start_dt
        ).first()

        if conflict:
            return {"success": False, "error": f"{provider.get_display_name()} already has an appointment at this time"}

        # Get service if provided
        service = None
        revenue = None
        service_name = ""
        if args.get("service_id"):
            service = db.query(Service).filter(Service.id == args.get("service_id")).first()
            if service:
                revenue = service.price
                service_name = f" - {service.name}"

        # Create appointment
        appointment = Appointment(
            provider_id=provider_id,
            client_id=client_id,
            service_id=args.get("service_id"),
            start_time=start_dt,
            end_time=end_dt,
            title=f"{client.name}",
            notes=notes,
            revenue=revenue,
            color=provider.color
        )

        db.add(appointment)
        db.commit()

        # Format nicely
        day_name = start_dt.strftime('%A')
        formatted_date = start_dt.strftime('%B %d')
        formatted_time = start_dt.strftime('%-I:%M %p')  # 3:00 PM format

        return {
            "success": True,
            "message": f"✅ Booked! {client.name} with {provider.get_display_name()}{service_name}\n📅 {day_name}, {formatted_date} at {formatted_time}"
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def get_appointments(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Get appointments with filters"""
    try:
        provider_id = args.get("provider_id")
        client_id = args.get("client_id")
        date = args.get("date")

        query = db.query(Appointment).filter(
            Appointment.status != AppointmentStatus.CANCELLED.value
        )

        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)

        if client_id:
            query = query.filter(Appointment.client_id == client_id)

        date_label = ""
        if date:
            date_obj = datetime.fromisoformat(date)
            date_start = _make_aware(date_obj.replace(hour=0, minute=0, second=0, microsecond=0))
            date_end = date_start + timedelta(days=1)
            query = query.filter(
                Appointment.start_time >= date_start,
                Appointment.start_time < date_end
            )
            date_label = f"{date_start.strftime('%A, %B %d')}"

        appointments = query.order_by(Appointment.start_time).limit(20).all()

        # Get related data
        provider_ids = set(a.provider_id for a in appointments)
        client_ids = set(a.client_id for a in appointments)
        providers = {p.id: p for p in db.query(Provider).filter(Provider.id.in_(provider_ids)).all()} if provider_ids else {}
        clients = {c.id: c for c in db.query(Client).filter(Client.id.in_(client_ids)).all()} if client_ids else {}

        if not appointments:
            if date_label:
                return {"success": True, "message": f"📅 No appointments on {date_label}"}
            return {"success": True, "message": "📅 No appointments found"}

        # Build nice response
        lines = []
        if date_label:
            lines.append(f"📅 **{date_label}** - {len(appointments)} appointment(s):\n")
        else:
            lines.append(f"📅 Found {len(appointments)} appointment(s):\n")

        for a in appointments:
            provider = providers.get(a.provider_id)
            client = clients.get(a.client_id)
            time_str = f"{a.start_time.strftime('%H:%M')}-{a.end_time.strftime('%H:%M')}"

            if date_label:
                lines.append(f"• {time_str} - {client.name if client else 'Unknown'} with {provider.get_display_name() if provider else 'Unknown'}")
            else:
                date_str = a.start_time.strftime('%a %b %d')
                lines.append(f"• {date_str} {time_str} - {client.name if client else 'Unknown'} with {provider.get_display_name() if provider else 'Unknown'}")

        return {"success": True, "message": "\n".join(lines)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def check_availability(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Check provider availability - shows summary for the week"""
    try:
        provider_id = args.get("provider_id")
        date = args.get("date")  # This is the starting date

        # Verify provider
        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            return {"success": False, "error": "Provider not found"}

        # Get working hours
        try:
            if provider.working_hours and '-' in provider.working_hours:
                work_hours = provider.working_hours.split('-')
                work_start = int(work_hours[0].split(':')[0])
                work_end = int(work_hours[1].split(':')[0])
            else:
                work_start, work_end = 9, 17
        except:
            work_start, work_end = 9, 17

        # Parse starting date
        start_date = datetime.fromisoformat(date)
        start_date = _make_aware(start_date.replace(hour=0, minute=0, second=0, microsecond=0))

        # Check availability for the next 7 days (this week)
        week_summary = []

        for day_offset in range(7):
            current_day = start_date + timedelta(days=day_offset)
            next_day = current_day + timedelta(days=1)

            # Get appointments for this day
            appointments = db.query(Appointment).filter(
                Appointment.provider_id == provider_id,
                Appointment.status != AppointmentStatus.CANCELLED.value,
                Appointment.start_time >= current_day,
                Appointment.start_time < next_day
            ).all()

            # Get blocked times for this day
            blocked_times = db.query(BlockedTime).filter(
                BlockedTime.provider_id == provider_id,
                BlockedTime.is_active == True,
                BlockedTime.start_time >= current_day,
                BlockedTime.start_time < next_day
            ).all()

            # Calculate busy time in hours
            busy_minutes = 0
            for a in appointments:
                busy_minutes += (a.end_time - a.start_time).total_seconds() / 60
            for b in blocked_times:
                busy_minutes += (b.end_time - b.start_time).total_seconds() / 60

            # Calculate available hours
            total_work_hours = work_end - work_start
            busy_hours = busy_minutes / 60
            available_hours = total_work_hours - busy_hours

            # Format day info
            day_name = current_day.strftime('%A, %b %d')

            if available_hours > 0:
                # Show available time range if there are appointments/blocks
                if appointments or blocked_times:
                    week_summary.append(f"• {day_name}: {available_hours:.1f}h free (out of {total_work_hours}h)")
                else:
                    week_summary.append(f"• {day_name}: {available_hours:.1f}h free (fully available)")
            else:
                week_summary.append(f"• {day_name}: Fully booked")

        if not week_summary:
            return {"success": True, "message": f"{provider.get_display_name()} has no available time"}

        week_start = start_date.strftime('%b %d')
        week_end = (start_date + timedelta(days=6)).strftime('%b %d')

        response = f"📅 {provider.get_display_name()} availability ({week_start} - {week_end}):\n\n"
        response += "\n".join(week_summary)

        return {"success": True, "message": response}
    except Exception as e:
        return {"success": False, "error": str(e)}


def cancel_appointment(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Cancel an appointment"""
    try:
        appointment_id = args.get("appointment_id")

        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return {"success": False, "error": "Appointment not found"}

        # Get related data for message
        provider = db.query(Provider).filter(Provider.id == appointment.provider_id).first()
        client = db.query(Client).filter(Client.id == appointment.client_id).first()

        # Cancel appointment
        appointment.status = AppointmentStatus.CANCELLED.value
        db.commit()

        time_str = appointment.start_time.strftime('%A, %B %d at %H:%M')
        return {
            "success": True,
            "message": f"❌ Cancelled appointment: {client.name if client else 'Unknown'} with {provider.get_display_name() if provider else 'Unknown'} on {time_str}"
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def create_client(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Create a new client"""
    try:
        name = args.get("name")
        email = args.get("email", "")
        phone = args.get("phone", "")

        # Check if client exists
        existing = db.query(Client).filter(Client.name == name).first()
        if existing:
            return {"success": False, "error": f"Client '{name}' already exists"}

        # Create client
        client = Client(
            name=name,
            email=email,
            phone=phone
        )

        db.add(client)
        db.commit()

        return {
            "success": True,
            "message": f"✅ Created client: {name}"
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def create_provider(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Create a new provider"""
    try:
        name = args.get("name")
        title = args.get("title", "")
        specialty = args.get("specialty", "")
        email = args.get("email", "")
        phone = args.get("phone", "")
        working_hours = args.get("working_hours", "09:00-17:00")

        # Smart name/title handling
        import re

        # Check if name has a prefix like "Dr.", "Prof.", etc.
        has_prefix = bool(re.match(r'^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+', name))

        if has_prefix:
            # Name already has prefix (e.g., "Dr. Cohen")
            final_name = name
            final_title = None  # Don't duplicate the prefix in get_display_name()

            # If no title was provided, infer it from the prefix
            if not title:
                if name.startswith("Dr."):
                    title = "Doctor"
                elif name.startswith("Prof."):
                    title = "Professor"
                else:
                    title = "Provider"
        else:
            # No prefix in name, use title as intended
            final_name = name
            final_title = title if title else "Provider"

        # Check if active provider exists
        existing = db.query(Provider).filter(
            Provider.name == final_name,
            Provider.is_active == True
        ).first()
        if existing:
            return {"success": False, "error": f"Provider '{final_name}' already exists"}

        # Generate a color for the provider (simple hash-based color)
        import hashlib
        color_hash = int(hashlib.md5(final_name.encode()).hexdigest()[:6], 16)
        color = f"#{color_hash % 0xFFFFFF:06x}"

        # Create provider
        provider = Provider(
            name=final_name,
            title=final_title,
            specialty=specialty,
            email=email,
            phone=phone,
            working_hours=working_hours,
            color=color
        )

        db.add(provider)
        db.commit()

        # Build success message
        specialty_text = f" - {specialty}" if specialty else ""
        display_title = title if title else ""
        return {
            "success": True,
            "message": f"✅ Created provider: {final_name} ({display_title}{specialty_text})"
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


def search_clients(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Search for clients"""
    try:
        query_text = args.get("query", "")

        clients = db.query(Client).filter(
            Client.is_active == True,
            Client.name.ilike(f"%{query_text}%")
        ).limit(10).all()

        if not clients:
            return {"success": True, "message": f"No clients found matching '{query_text}'"}

        lines = [f"Found {len(clients)} client(s):\n"]
        for c in clients:
            line = f"• {c.name} [ID: {c.id}]"
            if c.phone:
                line += f" - {c.phone}"
            if c.email:
                line += f" - {c.email}"
            lines.append(line)

        return {"success": True, "message": "\n".join(lines)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_provider_schedule(args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Get a provider's schedule for a specific day"""
    try:
        provider_id = args.get("provider_id")
        date = args.get("date")

        # Verify provider
        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            return {"success": False, "error": "Provider not found"}

        # Parse date and make timezone-aware to match database
        date_obj = datetime.fromisoformat(date)
        date_start = _make_aware(date_obj.replace(hour=0, minute=0, second=0, microsecond=0))
        date_end = date_start + timedelta(days=1)

        # Get appointments
        appointments = db.query(Appointment).filter(
            Appointment.provider_id == provider_id,
            Appointment.status != AppointmentStatus.CANCELLED.value,
            Appointment.start_time >= date_start,
            Appointment.start_time < date_end
        ).order_by(Appointment.start_time).all()

        # Get blocked times
        blocked_times = db.query(BlockedTime).filter(
            BlockedTime.provider_id == provider_id,
            BlockedTime.is_active == True,
            BlockedTime.start_time >= date_start,
            BlockedTime.start_time < date_end
        ).order_by(BlockedTime.start_time).all()

        day_name = date_obj.strftime('%A, %B %d')

        if not appointments and not blocked_times:
            return {"success": True, "message": f"📅 {provider.get_display_name()} has no schedule for {day_name}"}

        lines = [f"📅 **{provider.get_display_name()}** schedule for {day_name}:\n"]

        # Get client names
        client_ids = [a.client_id for a in appointments]
        clients = {c.id: c for c in db.query(Client).filter(Client.id.in_(client_ids)).all()} if client_ids else {}

        if appointments:
            lines.append("**Appointments:**")
            for a in appointments:
                client = clients.get(a.client_id)
                time_str = f"{a.start_time.strftime('%H:%M')}-{a.end_time.strftime('%H:%M')}"
                lines.append(f"• {time_str} - {client.name if client else 'Unknown'}")

        if blocked_times:
            if appointments:
                lines.append("")
            lines.append("**Blocked Times:**")
            for b in blocked_times:
                time_str = f"{b.start_time.strftime('%H:%M')}-{b.end_time.strftime('%H:%M')}"
                reason = b.reason or b.block_type or "Unavailable"
                lines.append(f"• {time_str} - {reason}")

        return {"success": True, "message": "\n".join(lines)}
    except Exception as e:
        return {"success": False, "error": str(e)}


# Function registry
FUNCTION_HANDLERS = {
    "create_appointment": create_appointment,
    "get_appointments": get_appointments,
    "check_availability": check_availability,
    "cancel_appointment": cancel_appointment,
    "create_client": create_client,
    "create_provider": create_provider,
    "search_clients": search_clients,
    "get_provider_schedule": get_provider_schedule,
}


def execute_function(func_name: str, args: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Execute AI function calls"""
    handler = FUNCTION_HANDLERS.get(func_name)

    if handler:
        return handler(args, db)
    else:
        return {"success": False, "error": f"Unknown function: {func_name}"}
