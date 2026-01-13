"""
Chats API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.chat import Chat
from app.models.message import Message
from app.schemas.chat import ChatCreate, ChatResponse, ChatListResponse

router = APIRouter(prefix="/chats", tags=["Chats"])


@router.get("", response_model=ChatListResponse)
def get_chats(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all chat sessions, ordered by most recent"""
    total = db.query(Chat).count()
    chats = db.query(Chat).order_by(Chat.updated_at.desc()).offset(skip).limit(limit).all()
    
    return ChatListResponse(
        chats=[ChatResponse(**chat.to_dict()) for chat in chats],
        total=total
    )


@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat(chat_id: UUID, db: Session = Depends(get_db)):
    """Get a specific chat with all messages"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return ChatResponse(**chat.to_dict(include_messages=True))


@router.post("", response_model=ChatResponse, status_code=201)
def create_chat(chat_data: ChatCreate, db: Session = Depends(get_db)):
    """Create a new chat session"""
    chat = Chat(title=chat_data.title)
    
    db.add(chat)
    db.commit()
    db.refresh(chat)
    
    return ChatResponse(**chat.to_dict())


@router.put("/{chat_id}", response_model=ChatResponse)
def update_chat(chat_id: UUID, chat_data: ChatCreate, db: Session = Depends(get_db)):
    """Update chat title"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if chat_data.title:
        chat.title = chat_data.title
    
    db.commit()
    db.refresh(chat)
    
    return ChatResponse(**chat.to_dict())


@router.delete("/{chat_id}", status_code=204)
def delete_chat(chat_id: UUID, db: Session = Depends(get_db)):
    """Delete a chat and all its messages"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete(chat)
    db.commit()
    
    return None


@router.get("/{chat_id}/messages", response_model=List[dict])
def get_chat_messages(
    chat_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Get messages for a specific chat"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(Message.created_at).offset(skip).limit(limit).all()
    
    return [msg.to_dict() for msg in messages]
