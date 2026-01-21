# AI-Powered CRM Scheduling System

A modern, full-stack Customer Relationship Management application with AI-powered natural language scheduling, real-time analytics, and comprehensive appointment management.

## Overview

This CRM system combines traditional appointment scheduling with modern AI technology to streamline office and clinic operations. Built with FastAPI and React, it enables natural language booking, real-time analytics, and intelligent conflict detection.

## Key Features

### AI-Powered Assistant
- Natural language appointment booking via Google Gemini API
- Voice interface with browser-based speech recognition
- Automatic conflict detection and validation
- Context-aware responses with conversation history

### Advanced Scheduling
- Interactive calendar with month and day views
- Multi-provider support with individual schedules
- Blocked time management (recurring and one-time)
- Appointment status tracking (scheduled, confirmed, completed, cancelled, no-show)
- Visual status indicators (cancelled appointments marked in red)

### Real-Time Analytics Dashboard
- Overview metrics: total appointments, completion rate, average duration, no-show rate
- Live updates with 60-second auto-refresh
- Current and next appointment tracking with countdowns
- Provider occupancy rate monitoring
- Data visualizations: trend charts, provider distribution, status breakdown
- Revenue tracking and service performance metrics
- Provider-based filtering and custom date ranges

### Client & Provider Management
- Comprehensive client profiles with appointment history
- Provider profiles with specialty and availability tracking
- Advanced search and filtering
- Soft delete for data preservation

### Service Management
- Service catalog with pricing and duration
- Revenue tracking by service type
- Performance analytics for services

## Technology Stack

### Backend
- FastAPI (Python 3.11+)
- PostgreSQL with SQLAlchemy ORM
- Google Gemini API integration
- Service layer architecture with dependency injection
- pytest for testing

### Frontend
- React 19 with Vite
- FullCalendar for scheduling
- Recharts for data visualization
- CSS Modules for styling
- Vitest with React Testing Library

### Infrastructure
- Docker and Docker Compose
- pgAdmin 4 for database administration
- Centralized environment configuration

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Gemini API key (obtain from https://aistudio.google.com/app/apikey)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yarimal/ai-crm.git
cd ai-crm
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_actual_api_key_here
DATABASE_URL=postgresql://crm_user:crm_password@localhost:5432/crm_database
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000/api
```

3. Start the application:
```bash
docker-compose up
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Database Admin: http://localhost:5050

## Development Setup

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest --cov=app         # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test                  # Run all tests
npm run test:ui          # Interactive UI
npm run test:coverage    # Coverage report
```

## API Documentation

Interactive API documentation available at http://localhost:8000/docs

### Main Endpoints

**Providers**
- `POST /api/providers` - Create provider
- `GET /api/providers` - List providers
- `PUT /api/providers/{id}` - Update provider
- `DELETE /api/providers/{id}` - Soft delete provider

**Clients**
- `POST /api/clients` - Create client
- `GET /api/clients` - List clients
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Soft delete client

**Appointments**
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Delete appointment

**Services**
- `POST /api/services` - Create service
- `GET /api/services` - List services
- `PUT /api/services/{id}` - Update service
- `DELETE /api/services/{id}` - Delete service

**Analytics**
- `GET /api/analytics/overview` - Overview statistics
- `GET /api/analytics/appointments-over-time` - Trend data
- `GET /api/analytics/appointments-by-provider` - Provider distribution
- `GET /api/analytics/appointments-by-status` - Status breakdown
- `GET /api/analytics/realtime` - Live metrics
- `GET /api/analytics/revenue` - Revenue statistics
- `GET /api/analytics/service-performance` - Service metrics

**AI Assistant**
- `POST /api/ai/chat` - Send message to AI
- `GET /api/chats` - List chat sessions
- `GET /api/chats/{id}` - Get chat history

## Architecture

### Service Layer Pattern
Business logic separated from routing handlers:
- `ai_functions.py` - AI function implementations
- `ai_context.py` - Context building for AI prompts
- `analytics_service.py` - Analytics calculations with filtering

### Component-Based Frontend
Modular dashboard components:
- `DashboardHeader.jsx` - Filters and controls
- `OverviewCards.jsx` - Summary metrics
- `LiveMetrics.jsx` - Real-time updates
- `ChartsSection.jsx` - Data visualizations

### Key Design Decisions
- Timezone-aware datetime handling with UTC
- Automatic exclusion of cancelled appointments from analytics
- Real-time updates with 60-second refresh intervals
- Centralized configuration via .env file
- Test isolation with in-memory databases

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://crm_user:crm_password@localhost:5432/crm_database` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:8000/api` |

## Troubleshooting

**Backend won't start**
- Verify PostgreSQL is running: `docker-compose ps`
- Check `.env` file exists and contains valid values
- Review logs: `docker-compose logs backend`

**Frontend can't connect to API**
- Verify `VITE_API_BASE_URL` matches backend address
- Check CORS origins include frontend URL
- Ensure backend is running at http://localhost:8000

**AI features not working**
- Verify `GEMINI_API_KEY` is set correctly
- Check API key validity at Google AI Studio
- Review backend logs for API errors

**Database connection errors**
- Check PostgreSQL container: `docker ps`
- Verify `DATABASE_URL` in `.env`
- Restart containers: `docker-compose restart`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Google Gemini AI for natural language processing
- FullCalendar for calendar components
- FastAPI framework and community
- React and Vite development teams
- Recharts for data visualizations
