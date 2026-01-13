"""
Message Model - Individual Chat Messages
"""
from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class MessageType(str, enum.Enum):
    """Message sender type"""
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class Message(Base):
    """Chat Message Model"""
    
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.USER)
    
    # Optional metadata for AI responses
    model_used = Column(String(100), nullable=True)  # e.g., "gemini-pro"
    tokens_used = Column(String(50), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    
    def __repr__(self):
        return f"<Message(id={self.id}, type={self.message_type})>"
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            "id": str(self.id),
            "chatId": str(self.chat_id),
            "content": self.content,
            "type": self.message_type.value,
            "modelUsed": self.model_used,
            "tokensUsed": self.tokens_used,
            "timestamp": self.created_at.isoformat()
        }
