# AI-Powered CRM Scheduling System

A full-stack Customer Relationship Management application with AI-powered natural language scheduling capabilities and voice interface integration.

## Overview

This CRM system combines traditional appointment scheduling with modern AI technology to enable natural language booking through Google Gemini. Users can interact with the system via text or voice commands to manage providers, clients, appointments, and blocked time slots.

## Key Features

- **AI Scheduling Assistant**: Natural language processing for appointment booking using Google Gemini API with function calling
- **Voice Interface**: Browser-based speech recognition and text-to-speech synthesis
- **Interactive Calendar**: Visual scheduling with month and day views, drag-and-drop support
- **Conflict Detection**: Automatic validation against existing appointments and blocked times
- **Provider Management**: Multi-provider support with specialty tracking and working hours
- **Client Management**: Comprehensive client information and appointment history
- **Blocked Time Slots**: Recurring and one-time availability blocking
- **Comprehensive Testing**: Full test coverage with pytest and Vitest

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI Integration**: Google Gemini API
- **Architecture**: Service layer pattern with dependency injection
- **Testing**: pytest with in-memory SQLite

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Calendar**: FullCalendar library
- **API Client**: Fetch with centralized configuration
- **Testing**: Vitest with React Testing Library

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Database Admin**: pgAdmin 4

## Project Structure

```
my-crm-app/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoint handlers
│   │   ├── services/         # Business logic layer
│   │   │   ├── ai_functions.py
│   │   │   └── ai_context.py
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── config.py         # Application configuration
│   │   ├── database.py       # Database connection setup
│   │   └── main.py           # FastAPI application entry
│   ├── tests/
│   │   ├── conftest.py       # Test fixtures
│   │   └── test_providers.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── calendar/
│   │   │   ├── clients/
│   │   │   ├── providers/
│   │   │   └── ai/
│   │   ├── services/         # API service layer
│   │   ├── config/           # Configuration management
│   │   └── tests/            # Vitest test suites
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
├── SETUP.md
├── TESTING.md
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Google Gemini API key (obtain from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/ai-crm.git
cd ai-crm
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```
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

For detailed local development setup without Docker, see [SETUP.md](./SETUP.md).

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

Complete testing documentation is available in [TESTING.md](./TESTING.md).

### Run Backend Tests

```bash
cd backend
pytest                          # Run all tests
pytest -v                       # Verbose output
pytest --cov=app               # With coverage report
```

Current backend test coverage: 6 passing tests covering provider CRUD operations.

### Run Frontend Tests

```bash
cd frontend
npm test                        # Run all tests
npm run test:ui                # Interactive UI
npm run test:coverage          # Coverage report
```

Current frontend test coverage: 7 passing tests covering configuration and API service.

### Run All Tests

```bash
# Windows
run_tests.bat

# Linux/Mac
./run_tests.sh
```

## API Documentation

Once the backend is running, interactive API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/providers` - Create provider
- `GET /api/providers` - List providers
- `PUT /api/providers/{id}` - Update provider
- `DELETE /api/providers/{id}` - Delete provider (soft delete)
- `POST /api/clients` - Create client
- `GET /api/clients` - List clients with search
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - List appointments with filters
- `POST /api/blocked-times` - Create blocked time
- `POST /api/ai/chat` - AI chat endpoint

## Architecture Highlights

### Service Layer Pattern

Business logic is separated from routing handlers:
- `ai_functions.py`: AI function implementations (appointment creation, availability checking)
- `ai_context.py`: Context building for AI prompts

### Timezone-Aware DateTime Handling

All datetime comparisons use UTC timezone-aware objects to ensure consistency with PostgreSQL.

### Centralized Configuration

Single `.env` file at project root serves both frontend and backend configurations.

### Test Isolation

Tests use in-memory SQLite databases with automatic cleanup between test runs.

## Environment Variables

Required variables (see `.env.example` for complete list):

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://crm_user:crm_password@localhost:5432/crm_database` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:8000/api` |

## Security Considerations

This is a development/portfolio project. For production deployment, implement:

- User authentication and authorization (JWT tokens)
- Rate limiting on API endpoints
- Input sanitization and validation
- HTTPS/TLS encryption
- Database connection pooling
- Environment-specific CORS policies
- API key rotation and secrets management
- Audit logging

## Known Limitations

- No user authentication system
- No email/SMS notification system
- No multi-tenancy support
- Limited mobile responsiveness
- AI responses depend on Gemini API availability
- PostgreSQL required for full functionality (tests use SQLite)

## Troubleshooting

### Backend won't start
- Verify PostgreSQL is running: `docker-compose ps`
- Check `.env` file exists and contains valid values
- Review logs: `docker-compose logs backend`

### Frontend can't connect to API
- Verify `VITE_API_BASE_URL` in `.env` matches backend address
- Check CORS origins include frontend URL
- Ensure backend is running: http://localhost:8000/docs should load

### AI features not working
- Verify `GEMINI_API_KEY` is set in `.env`
- Check API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Review backend logs for API errors

### Tests failing
- Backend: Ensure no PostgreSQL-specific UUID issues
- Frontend: Verify Node version 18+ and compatible React Testing Library version
- Run `npm install --legacy-peer-deps` if dependency conflicts occur

## Contributing

This is a portfolio project, but suggestions and feedback are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - See LICENSE file for details


## Acknowledgments

- Google Gemini AI for natural language processing
- FullCalendar for calendar component
- FastAPI framework and community
- React and Vite teams
