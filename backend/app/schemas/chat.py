"""
Chat Schemas - Request/Response Validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ChatCreate(BaseModel):
    """Schema for creating a new chat"""
    title: Optional[str] = None


class ChatResponse(BaseModel):
    """Schema for chat response"""
    id: UUID
    title: Optional[str]
    summary: Optional[str]
    createdAt: datetime
    updatedAt: datetime
    messageCount: int
    messages: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True


class ChatListResponse(BaseModel):
    """Schema for list of chats"""
    chats: List[ChatResponse]
    total: int
