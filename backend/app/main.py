"""
FastAPI CRM Application - Office/Clinic Scheduling System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.database import engine, Base
from app.routers import providers, clients, appointments, chats, ai, blocked_times, analytics, services
from app.config import settings

# Import all models (needed for table creation)
from app.models.provider import Provider
from app.models.client import Client
from app.models.appointment import Appointment
from app.models.blocked_time import BlockedTime
from app.models.chat import Chat
from app.models.message import Message
from app.models.service import Service

# Create static directory BEFORE app initialization (needed for StaticFiles mount)
os.makedirs("/app/static/audio", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
    yield
    print("Shutting down...")


app = FastAPI(
    title="AI CRM - Scheduling System",
    description="Office/Clinic scheduling with AI assistant",
    version="2.0.0",
    lifespan=lifespan
)

# CORS - Use specific origins from config instead of wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers BEFORE mounting static files (order matters!)
app.include_router(providers.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(blocked_times.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# Mount static files for TTS audio (AFTER routers to avoid conflicts)
app.mount("/static", StaticFiles(directory="/app/static"), name="static")


@app.get("/")
async def root():
    return {
        "name": "AI CRM - Scheduling System",
        "version": "2.0.0",
        "features": ["providers", "clients", "services", "appointments", "blocked_times", "ai_assistant", "analytics"],
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}