"""
Chat Model - Conversation Sessions
"""
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Chat(Base):
    """Chat/Conversation Session Model"""
    
    __tablename__ = "chats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=True)  # Auto-generated from first message
    summary = Column(Text, nullable=True)  # AI-generated summary
    cache_name = Column(String(512), nullable=True)  # Gemini context cache name

    # Metadata
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan", order_by="Message.created_at")
    
    def __repr__(self):
        return f"<Chat(id={self.id}, title='{self.title}')>"
    
    def to_dict(self, include_messages=False):
        """Convert to dictionary for JSON serialization"""
        data = {
            "id": str(self.id),
            "title": self.title,
            "summary": self.summary,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "messageCount": len(self.messages) if self.messages else 0
        }
        
        if include_messages:
            data["messages"] = [msg.to_dict() for msg in self.messages]
        
        return data
