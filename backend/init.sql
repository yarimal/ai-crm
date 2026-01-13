-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance (will be created after tables exist)
-- These are created by SQLAlchemy, but we enable the extension here
