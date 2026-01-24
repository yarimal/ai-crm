"""
AI API Router - Gemini Integration for Office/Clinic Scheduling
Refactored for better separation of concerns
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.chat import Chat
from app.models.message import Message, MessageType
from app.schemas.message import AIMessageRequest
from app.services.gemini_service import GeminiService
from app.services.ai_context import build_context_data
from app.services.ai_functions import execute_function
from app.services.tts_service import TTSService

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat")
async def chat_with_ai(
    request: AIMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Send a message to AI and get a response.

    Process:
    1. Get or create chat session
    2. Save user message
    3. Build context from database
    4. Get AI response with function calling
    5. Execute any function calls
    6. Save AI response
    7. Return complete conversation update
    """
    gemini = GeminiService()

    try:
        # Get or create chat
        chat = _get_or_create_chat(request, db)

        # Save user message
        user_message = _save_user_message(chat.id, request.message, db)

        # Get context data
        context_data = build_context_data(db)

        # Get conversation history
        conversation_history = _build_conversation_history(chat.id, db)

        # Get AI response
        ai_response = await gemini.generate_response(
            message=request.message,
            history=conversation_history,
            context_data=context_data
        )

        # Execute function calls if any
        function_results = _execute_function_calls(ai_response, db)

        # Build final response text
        response_text = _build_response_text(ai_response, function_results)

        # Save AI response
        ai_message = _save_ai_message(chat.id, response_text, ai_response, db)

        # Update chat timestamp
        chat.updated_at = datetime.utcnow()
        db.commit()

        return {
            "chatId": str(chat.id),
            "userMessage": user_message.to_dict(),
            "aiMessage": ai_message.to_dict(),
            "functionCalls": function_results
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def get_available_models():
    """Get available AI models"""
    return {
        "models": [{"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"}],
        "default": "gemini-2.5-flash"
    }


# Helper functions

def _get_or_create_chat(request: AIMessageRequest, db: Session) -> Chat:
    """Get existing chat or create new one"""
    if request.chat_id:
        chat = db.query(Chat).filter(Chat.id == request.chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat
    else:
        # Create new chat with truncated title
        title = request.message[:50] + "..." if len(request.message) > 50 else request.message
        chat = Chat(title=title)
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return chat


def _save_user_message(chat_id: str, content: str, db: Session) -> Message:
    """Save user message to database"""
    user_message = Message(
        chat_id=chat_id,
        content=content,
        message_type=MessageType.USER
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    return user_message


def _build_conversation_history(chat_id: str, db: Session) -> list:
    """Build conversation history for AI context"""
    history = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(Message.created_at).all()

    # Exclude the last message (current user message)
    return [
        {
            "role": "user" if msg.message_type == MessageType.USER else "model",
            "text": msg.content
        }
        for msg in history[:-1]
    ]


def _execute_function_calls(ai_response: dict, db: Session) -> list:
    """Execute AI function calls and return results"""
    function_results = []

    if ai_response.get("function_calls"):
        for func_call in ai_response["function_calls"]:
            result = execute_function(func_call["name"], func_call["args"], db)
            function_results.append({
                "function": func_call["name"],
                "args": func_call["args"],
                "result": result
            })

    return function_results


def _build_response_text(ai_response: dict, function_results: list) -> str:
    """Build final response text from AI response and function results"""
    response_text = ai_response.get("text", "")

    if function_results:
        result_messages = []
        for fr in function_results:
            result = fr["result"]
            if result.get("success") and result.get("message"):
                result_messages.append(result["message"])
            elif not result.get("success"):
                result_messages.append(f"❌ {result.get('error', 'Something went wrong')}")

        if result_messages:
            if response_text:
                response_text = response_text + "\n\n" + "\n\n".join(result_messages)
            else:
                response_text = "\n\n".join(result_messages)

    if not response_text:
        response_text = "Done! ✅"

    return response_text


def _save_ai_message(chat_id: str, content: str, ai_response: dict, db: Session) -> Message:
    """Save AI message to database with TTS audio"""

    # Generate audio using Gemini TTS
    tts = TTSService()
    audio_result = tts.generate_speech(content)

    ai_message = Message(
        chat_id=chat_id,
        content=content,
        message_type=MessageType.AI,
        model_used=ai_response.get("model", "gemini-2.5-flash"),
        audio_data=audio_result.get("audio_data") if audio_result else None,  # Base64 WAV data
        audio_mime_type=audio_result.get("mime_type") if audio_result else None
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    return ai_message
