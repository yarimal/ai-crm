"""
Message Schemas - Request/Response Validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class MessageTypeEnum(str, Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class MessageCreate(BaseModel):
    """Schema for creating a message"""
    content: str = Field(..., min_length=1)
    message_type: MessageTypeEnum = Field(default=MessageTypeEnum.USER, alias="type")
    
    class Config:
        populate_by_name = True


class MessageResponse(BaseModel):
    """Schema for message response"""
    id: UUID
    chatId: UUID
    content: str
    type: MessageTypeEnum
    modelUsed: Optional[str] = None
    tokensUsed: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AIMessageRequest(BaseModel):
    """Schema for sending a message to AI"""
    message: str = Field(..., min_length=1)
    chat_id: Optional[UUID] = Field(None, alias="chatId")  # If None, creates new chat
    
    class Config:
        populate_by_name = True


class AIMessageResponse(BaseModel):
    """Schema for AI response"""
    chatId: UUID
    userMessage: MessageResponse
    aiMessage: MessageResponse
