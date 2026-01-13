"""
Gemini AI Service for Office/Clinic Scheduling
"""
from google import genai
from google.genai import types
from typing import List, Dict, Optional
import os
from datetime import datetime, timedelta


# Function definitions for scheduling
SCHEDULING_TOOLS = [
    {
        "name": "create_appointment",
        "description": "Book a new appointment for a client with a provider (doctor/staff). Use IDs from the context.",
        "parameters": {
            "type": "object",
            "properties": {
                "provider_id": {
                    "type": "string",
                    "description": "The provider's ID (UUID) from the PROVIDERS list"
                },
                "client_id": {
                    "type": "string",
                    "description": "The client's ID (UUID) from the CLIENTS list"
                },
                "date": {
                    "type": "string",
                    "description": "Appointment date (YYYY-MM-DD)"
                },
                "start_time": {
                    "type": "string",
                    "description": "Start time (HH:MM, 24-hour format)"
                },
                "end_time": {
                    "type": "string",
                    "description": "End time (HH:MM, 24-hour format)"
                },
                "notes": {
                    "type": "string",
                    "description": "Optional notes"
                }
            },
            "required": ["provider_id", "client_id", "date", "start_time", "end_time"]
        }
    },
    {
        "name": "get_appointments",
        "description": "Get appointments, optionally filtered by provider, client, or date.",
        "parameters": {
            "type": "object",
            "properties": {
                "provider_id": {
                    "type": "string",
                    "description": "Filter by provider ID"
                },
                "client_id": {
                    "type": "string",
                    "description": "Filter by client ID"
                },
                "date": {
                    "type": "string",
                    "description": "Filter by date (YYYY-MM-DD)"
                }
            },
            "required": []
        }
    },
    {
        "name": "check_availability",
        "description": "Check when a provider (or all providers) is available on a specific date.",
        "parameters": {
            "type": "object",
            "properties": {
                "provider_id": {
                    "type": "string",
                    "description": "Provider ID to check (optional, checks all if not provided)"
                },
                "date": {
                    "type": "string",
                    "description": "Date to check (YYYY-MM-DD)"
                }
            },
            "required": ["date"]
        }
    },
    {
        "name": "get_provider_schedule",
        "description": "Get a specific provider's full schedule for a date.",
        "parameters": {
            "type": "object",
            "properties": {
                "provider_id": {
                    "type": "string",
                    "description": "Provider ID"
                },
                "date": {
                    "type": "string",
                    "description": "Date (YYYY-MM-DD)"
                }
            },
            "required": ["provider_id", "date"]
        }
    },
    {
        "name": "cancel_appointment",
        "description": "Cancel an existing appointment by its ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "appointment_id": {
                    "type": "string",
                    "description": "The appointment ID to cancel"
                }
            },
            "required": ["appointment_id"]
        }
    },
    {
        "name": "create_client",
        "description": "Create a new client in the system.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Client's full name"
                },
                "phone": {
                    "type": "string",
                    "description": "Client's phone number"
                },
                "email": {
                    "type": "string",
                    "description": "Client's email address"
                }
            },
            "required": ["name"]
        }
    },
    {
        "name": "search_clients",
        "description": "Search for existing clients by name or phone.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name or phone to search for"
                }
            },
            "required": ["name"]
        }
    }
]


class GeminiService:
    """Service for Gemini AI with scheduling functions"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model_name = "gemini-2.5-flash"
    
    def _get_date_context(self) -> str:
        """Get comprehensive date context for AI"""
        today = datetime.now()
        
        # Build calendar for this week and next week
        lines = []
        lines.append(f"=== DATE REFERENCE ===")
        lines.append(f"TODAY: {today.strftime('%A, %B %d, %Y')} ({today.strftime('%Y-%m-%d')})")
        lines.append(f"CURRENT TIME: {today.strftime('%H:%M')}")
        lines.append("")
        
        # This week and next 2 weeks calendar
        lines.append("UPCOMING DATES:")
        for i in range(14):  # Next 14 days
            date = today + timedelta(days=i)
            day_name = date.strftime('%A')
            date_str = date.strftime('%Y-%m-%d')
            display = date.strftime('%B %d')
            
            label = ""
            if i == 0:
                label = " (TODAY)"
            elif i == 1:
                label = " (TOMORROW)"
            elif i < 7:
                label = " (THIS WEEK)"
            else:
                label = " (NEXT WEEK)"
            
            lines.append(f"  {day_name}: {date_str} ({display}){label}")
        
        lines.append("")
        lines.append("DATE CALCULATION RULES:")
        lines.append("- 'next Sunday' = the NEAREST upcoming Sunday from today")
        lines.append("- 'this Monday' = Monday of current week")
        lines.append("- 'next week Monday' = Monday of following week")
        lines.append("- Use the dates above to find the correct YYYY-MM-DD")
        lines.append("=== END DATE REFERENCE ===")
        
        return "\n".join(lines)
    
    def _build_system_prompt(self, context_data: Optional[str] = None) -> str:
        base_prompt = f"""You are a friendly, intuitive AI assistant for a clinic/office scheduling system. You help the secretary manage appointments naturally.

{self._get_date_context()}

=== CURRENT DATA ===
{context_data if context_data else "No data available."}
=== END DATA ===

YOUR CAPABILITIES:
1. BOOK APPOINTMENTS: Use create_appointment with provider_id, client_id, date, start_time, end_time
2. CHECK AVAILABILITY: Use check_availability to see when providers are free
3. VIEW SCHEDULE: Use get_provider_schedule to see a provider's appointments
4. VIEW APPOINTMENTS: Use get_appointments to list appointments
5. CANCEL: Use cancel_appointment with the appointment ID
6. ADD CLIENTS: Use create_client if client doesn't exist
7. SEARCH CLIENTS: Use search_clients to find existing clients

BLOCKED TIMES:
- Providers have BLOCKED TIMES when they are unavailable (lunch, meetings, vacation, etc.)
- BLOCKED TIMES are shown in the data - DO NOT book during blocked times
- When checking availability, mention any blocked times
- Example: "Dr. Cohen is blocked 12:00-13:00 for lunch"

CONVERSATION RULES - BE INTUITIVE:
1. UNDERSTAND CONTEXT: Remember previous messages. If user said "Tuesday" before, use that date.
2. DON'T BE STRICT: "appointments on Tuesday" means ALL appointments that day, don't ask for client.
3. INFER INTENT: "add John with Dr. Cohen tomorrow 10am" = create appointment, don't ask confirmation.
4. BE SMART WITH NAMES: "John" likely means "John Smith" if that's the only John in clients.
5. ASSUME DEFAULTS:
   - No end time? Add 30 minutes to start time
   - "this Tuesday" = nearest Tuesday
   - "Dr. Cohen" = match to provider with "Cohen" in name
6. ACT FIRST, CONFIRM AFTER: Book the appointment, then tell user what you did.
7. USE COMMON SENSE: "does Dr. Cohen have appointments?" = get_appointments for that doctor
8. NATURAL RESPONSES: Don't be robotic. Be helpful and conversational.
9. FOR WEEKLY QUESTIONS: When asked "free this week?", call check_availability ONCE for TODAY only. Then summarize based on the UPCOMING APPOINTMENTS data you already have. Don't call the function multiple times!
10. USE YOUR CONTEXT: You already have UPCOMING APPOINTMENTS data - use it to answer questions without calling functions when possible.

EXAMPLES OF GOOD UNDERSTANDING:
- "appointments tomorrow" → get ALL appointments for tomorrow (no client filter)
- "book John with Dr. Cohen at 3pm tomorrow" → create_appointment immediately
- "is Dr. Levy free Monday?" → check_availability for Dr. Levy on Monday
- "cancel John's appointment" → find John's appointment and cancel it
- "add a meeting for Sarah with Dr. Cohen next week Tuesday at 2" → create appointment
- "when is Dr. Cohen free this week?" → Look at UPCOMING APPOINTMENTS data and summarize Dr. Cohen's schedule. Don't call check_availability 7 times!
- "what's on the schedule this week?" → Summarize from UPCOMING APPOINTMENTS data

WHAT NOT TO DO:
- Don't ask "which client?" when user wants ALL appointments
- Don't ask "which date?" if date was mentioned in recent messages
- Don't ask for confirmation before booking - just do it
- Don't be overly formal or robotic
- Don't call check_availability multiple times for "this week" - use the data you have!

TECHNICAL RULES:
- Use IDs from CURRENT DATA (never make up IDs)
- Use DATE REFERENCE to calculate exact YYYY-MM-DD dates
- Use 24-hour format for times (14:00 not 2:00 PM)
- Default duration: 30 minutes

Be helpful, smart, and conversational!"""
        
        return base_prompt
    
    async def generate_response(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        context_data: Optional[str] = None
    ) -> Dict:
        """Generate response with function calling"""
        
        if not self.client:
            return self._get_simulated_response(message)
        
        try:
            system_prompt = self._build_system_prompt(context_data)
            
            # Build conversation
            conversation = system_prompt + "\n\n"
            
            if history:
                for msg in history[-15:]:  # Keep more history for better context
                    role = "User" if msg["role"] == "user" else "Assistant"
                    conversation += f"{role}: {msg['text']}\n"
            
            conversation += f"User: {message}\nAssistant:"
            
            # Create tools
            tools = [types.Tool(function_declarations=[
                types.FunctionDeclaration(
                    name=tool["name"],
                    description=tool["description"],
                    parameters=tool["parameters"]
                ) for tool in SCHEDULING_TOOLS
            ])]
            
            # Generate
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=conversation,
                config=types.GenerateContentConfig(tools=tools)
            )
            
            # Parse response
            function_calls = []
            response_text = ""
            
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        fc = part.function_call
                        function_calls.append({
                            "name": fc.name,
                            "args": dict(fc.args) if fc.args else {}
                        })
                    elif hasattr(part, 'text') and part.text:
                        response_text += part.text
            
            return {
                "text": response_text,
                "model": self.model_name,
                "function_calls": function_calls
            }
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_simulated_response(message)
    
    def _get_simulated_response(self, message: str) -> Dict:
        """Fallback response"""
        return {
            "text": "AI is in simulated mode. Please check GEMINI_API_KEY.",
            "model": "simulated",
            "function_calls": []
        }