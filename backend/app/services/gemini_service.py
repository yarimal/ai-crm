"""
Gemini AI Service for Office/Clinic Scheduling
"""
from google import genai
from google.genai import types
from typing import List, Dict, Optional
import os
from datetime import datetime, timedelta
import hashlib


# Function definitions for scheduling
SCHEDULING_TOOLS = [
    {
        "name": "create_appointment",
        "description": "Book a new appointment for a client with a provider (doctor/staff). IMPORTANT: Before calling this function, ask the user if they want to add a service from the SERVICES list. Show available service options with buttons/numbers and let them choose or skip. If user says 'no', 'skip', 'none', 'without service', or provides an empty response, proceed WITHOUT a service_id. Use IDs from the context.",
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
                "service_id": {
                    "type": "string",
                    "description": "The service ID (UUID) from the SERVICES list (optional but recommended)"
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
        "description": "REQUIRED function to create/add a new client/patient/account. MUST be called when user says: 'create client', 'add client', 'new client', 'add patient', 'new patient', 'create account', 'add account'. This is the ONLY way to add clients to the system.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Client's full name"
                },
                "phone": {
                    "type": "string",
                    "description": "Client's phone number (optional)"
                },
                "email": {
                    "type": "string",
                    "description": "Client's email address (optional)"
                }
            },
            "required": ["name"]
        }
    },
    {
        "name": "create_provider",
        "description": "REQUIRED function to create/add a new provider/doctor/staff member. MUST be called when user says: 'create provider', 'add provider', 'new provider', 'add doctor', 'new doctor', 'add staff'. This is the ONLY way to add providers to the system.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Provider's full name (e.g., 'Dr. Smith', 'John Doe')"
                },
                "title": {
                    "type": "string",
                    "description": "Provider's professional title/role (e.g., 'Doctor', 'Dentist', 'Therapist', 'Nurse'). OPTIONAL - if the name includes Dr./Prof., you can infer 'Doctor' as the title. If user doesn't specify and name has no prefix, default to 'Provider'."
                },
                "specialty": {
                    "type": "string",
                    "description": "Provider's specialty or area of expertise (e.g., 'Cardiology', 'Pediatrics', 'Orthodontics', 'Physical Therapy'). Optional."
                },
                "phone": {
                    "type": "string",
                    "description": "Provider's phone number (optional)"
                },
                "email": {
                    "type": "string",
                    "description": "Provider's email address (optional)"
                },
                "working_hours": {
                    "type": "string",
                    "description": "Working hours in format 'HH:MM-HH:MM' (e.g., '09:00-17:00'). Optional, defaults to 09:00-17:00"
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

    def _get_static_instructions(self) -> str:
        """Get static instructions that will be cached (no dynamic data)"""
        return """You are a functional AI assistant for a clinic/office scheduling system. You MUST use the provided functions to perform actions.

CRITICAL: You can only make changes by calling functions. You CANNOT create, modify, or delete anything without calling the appropriate function.

YOUR CAPABILITIES:
1. BOOK APPOINTMENTS: Use create_appointment with provider_id, client_id, date, start_time, end_time, and optionally service_id from SERVICES list
2. CHECK AVAILABILITY: Use check_availability to see when providers are free
3. VIEW SCHEDULE: Use get_provider_schedule to see a provider's appointments
4. VIEW APPOINTMENTS: Use get_appointments to list appointments
5. CANCEL: Use cancel_appointment with the appointment ID
6. ADD CLIENTS: ALWAYS use create_client function when user wants to add/create a new client/patient/account
7. SEARCH CLIENTS: Use search_clients to find existing clients
8. ADD PROVIDERS: Use create_provider function to add new doctors/staff members

SERVICES - PROACTIVE RECOMMENDATION:
- When booking appointments, ALWAYS ask the user if they want to add a specific service
- Show available services with their full details including IDs, prices, and duration
- IMPORTANT: Use bullet points (•) in this EXACT format: "• Visit - $30.00 (30 min) [ID: abc-123]"
- Services have prices and durations that are automatically tracked
- If the user mentions a service name, match it to the SERVICES list and use the service_id
- If user says "yes" or mentions a service, use the service_id from SERVICES list
- If user says "no" or "skip", proceed without service_id (it's optional)

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
6. ACT FIRST, CONFIRM AFTER: Execute the function immediately, then tell user what you did.
7. ALWAYS USE FUNCTIONS: You MUST call functions to perform actions. You have NO ability to make changes without calling functions.
8. USE COMMON SENSE: "does Dr. Cohen have appointments?" = get_appointments for that doctor
9. NATURAL RESPONSES: Don't be robotic. Be helpful and conversational.
10. FOR WEEKLY QUESTIONS: When asked "free this week?", call check_availability ONCE for TODAY only. Then summarize based on the UPCOMING APPOINTMENTS data you already have. Don't call the function multiple times!
11. USE YOUR CONTEXT: You already have UPCOMING APPOINTMENTS data - use it to answer questions without calling functions when possible.

EXAMPLES OF GOOD UNDERSTANDING:
- "appointments tomorrow" → get ALL appointments for tomorrow (no client filter)
- "book John with Dr. Cohen at 3pm tomorrow" → Ask "Would you like to add a service? Available: [list services]", then CALL create_appointment
- "is Dr. Levy free Monday?" → CALL check_availability for Dr. Levy on Monday
- "cancel John's appointment" → find John's appointment and CALL cancel_appointment
- "add a meeting for Sarah with Dr. Cohen next week Tuesday at 2" → Ask about service, then CALL create_appointment
- "book John with Dr. Cohen for a checkup at 3pm" → Match "checkup" to service, CALL create_appointment with service_id
- "create a new client named John Smith" → CALL create_client with name="John Smith"
- "add new account Mary Johnson" → CALL create_client with name="Mary Johnson"
- "when is Dr. Cohen free this week?" → Look at UPCOMING APPOINTMENTS data and summarize Dr. Cohen's schedule. Don't call check_availability 7 times!
- "what's on the schedule this week?" → Summarize from UPCOMING APPOINTMENTS data

WHAT NOT TO DO:
- Don't ask "which client?" when user wants ALL appointments
- Don't ask "which date?" if date was mentioned in recent messages
- Don't ask for confirmation before taking action - just do it
- Don't be overly formal or robotic
- Don't call check_availability multiple times for "this week" - use the data you have!
- NEVER say "done" or "created" without actually calling the function - ALWAYS CALL THE FUNCTION FIRST

TECHNICAL RULES:
- Use IDs from CURRENT DATA (never make up IDs)
- Use DATE REFERENCE to calculate exact YYYY-MM-DD dates
- Use 24-hour format for times (14:00 not 2:00 PM)
- Default duration: 30 minutes

FUNCTION CALLING REQUIREMENT:
If the user asks you to:
- Create/add a client → YOU MUST call create_client function
- Create/book an appointment → YOU MUST call create_appointment function
- Cancel an appointment → YOU MUST call cancel_appointment function
- Check availability → YOU MUST call check_availability function
- Search clients → YOU MUST call search_clients function
- Create/add a provider → YOU MUST call create_provider function

You have NO other way to perform these actions. Only text responses that don't involve actions can skip function calls."""

    def _create_cache(self) -> Optional[str]:
        """Create a context cache with static instructions and tools"""
        if not self.client:
            return None

        try:
            static_content = self._get_static_instructions()

            # Create tools for the cache
            tools = [types.Tool(function_declarations=[
                types.FunctionDeclaration(
                    name=tool["name"],
                    description=tool["description"],
                    parameters=tool["parameters"]
                ) for tool in SCHEDULING_TOOLS
            ])]

            cache = self.client.caches.create(
                model=f'models/{self.model_name}',
                config=types.CreateCachedContentConfig(
                    display_name=f'scheduling_cache_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                    system_instruction=static_content,
                    tools=tools,  # Include tools in the cache
                    tool_config=types.ToolConfig(
                        function_calling_config=types.FunctionCallingConfig(
                            mode="AUTO"
                        )
                    ),
                    ttl="3600s",  # 1 hour cache
                )
            )

            print(f"Created cache: {cache.name}")
            return cache.name

        except Exception as e:
            print(f"Failed to create cache: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _is_cache_valid(self, cache_name: Optional[str]) -> bool:
        """Check if cache still exists and is valid"""
        if not cache_name or not self.client:
            return False

        try:
            cache = self.client.caches.get(name=cache_name)
            return cache is not None
        except Exception:
            return False

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
    
    def _build_dynamic_context(self, context_data: Optional[str] = None) -> str:
        """Build only dynamic context data (date + current data)"""
        return f"""{self._get_date_context()}

=== CURRENT DATA ===
{context_data if context_data else "No data available."}
=== END DATA ==="""
    
    async def generate_response(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        context_data: Optional[str] = None,
        cache_name: Optional[str] = None
    ) -> Dict:
        """Generate response with function calling and context caching"""

        if not self.client:
            return self._get_simulated_response(message)

        try:
            # Build only dynamic context (date + current data)
            dynamic_context = self._build_dynamic_context(context_data)

            # Build conversation history
            conversation_text = ""
            if history:
                for msg in history[-15:]:  # Keep more history for better context
                    role = "User" if msg["role"] == "user" else "Assistant"
                    conversation_text += f"{role}: {msg['text']}\n"

            conversation_text += f"User: {message}\nAssistant:"

            # Combine dynamic context with conversation
            full_content = f"{dynamic_context}\n\n{conversation_text}"

            # Build config based on whether we're using cache
            config_params = {}

            # Use cached content if available and valid
            if cache_name and self._is_cache_valid(cache_name):
                # When using cache, tools are already in the cache
                config_params["cached_content"] = cache_name
                print(f"🎯 Using cached instructions (faster response!)")
            else:
                # No cache - include tools directly
                tools = [types.Tool(function_declarations=[
                    types.FunctionDeclaration(
                        name=tool["name"],
                        description=tool["description"],
                        parameters=tool["parameters"]
                    ) for tool in SCHEDULING_TOOLS
                ])]

                config_params["tools"] = tools
                config_params["tool_config"] = types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(
                        mode="AUTO"
                    )
                )

            # Generate with function calling mode
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_content,
                config=types.GenerateContentConfig(**config_params)
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