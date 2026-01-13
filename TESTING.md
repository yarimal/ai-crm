# Testing Guide

Complete testing setup for both backend and frontend.

---

## Backend Testing (Python + pytest)

### Setup

1. **Install test dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

### Running Tests

**Run all tests:**
```bash
pytest
```

**Run with coverage:**
```bash
pytest --cov=app --cov-report=html
```

**Run specific test file:**
```bash
pytest tests/test_providers.py
```

**Run specific test:**
```bash
pytest tests/test_providers.py::test_create_provider
```

**Run with verbose output:**
```bash
pytest -v
```

**Run and stop at first failure:**
```bash
pytest -x
```

### Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures and configuration
│   ├── test_providers.py        # Provider endpoint tests
│   └── test_ai_functions.py     # AI function tests
└── pytest.ini                    # Pytest configuration
```

### Writing Tests

**Example test:**
```python
def test_create_provider(client, db_session):
    """Test creating a new provider"""
    response = client.post(
        "/api/providers",
        json={
            "name": "Dr. Test",
            "specialty": "General"
        }
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Dr. Test"
```

### Fixtures Available

- `client` - TestClient for making API requests
- `db_session` - Database session (in-memory SQLite)

---

## Frontend Testing (Vitest + React Testing Library)

### Setup

1. **Install test dependencies:**
```bash
cd frontend
npm install
```

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run with UI:**
```bash
npm run test:ui
```

**Run with coverage:**
```bash
npm run test:coverage
```

**Run in watch mode:**
```bash
npm test -- --watch
```

**Run specific test file:**
```bash
npm test -- src/tests/config.test.js
```

### Test Structure

```
frontend/
├── src/
│   └── tests/
│       ├── setup.js                    # Test configuration
│       ├── config.test.js              # Config tests
│       ├── utils/
│       │   └── dateUtils.test.js       # Utility tests
│       └── services/
│           └── api.test.js             # API service tests
└── vitest.config.js                    # Vitest configuration
```

### Writing Tests

**Example test:**
```javascript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const result = myFunction()
    expect(result).toBe('expected value')
  })
})
```

**Testing React components:**
```javascript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should display text', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

---

## Test Coverage

### Backend Coverage

View coverage report:
```bash
cd backend
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

### Frontend Coverage

View coverage report:
```bash
cd frontend
npm run test:coverage
# Open coverage/index.html in browser
```

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: |
          cd frontend
          npm test
```

---

## Best Practices

### Backend Testing

1. **Use fixtures** for common setup
2. **Test edge cases** and error conditions
3. **Mock external services** (like Gemini AI)
4. **Use descriptive test names**
5. **Test one thing per test**

### Frontend Testing

1. **Test user interactions**, not implementation
2. **Use semantic queries** (getByRole, getByLabelText)
3. **Mock API calls** with vi.fn()
4. **Test accessibility**
5. **Keep tests isolated**

---

## Common Commands Cheat Sheet

### Backend
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific file
pytest tests/test_providers.py

# Run with output
pytest -v -s
```

### Frontend
```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

---

## Troubleshooting

### Backend

**Issue:** Tests can't find modules
```bash
# Make sure you're in the backend directory
cd backend
# Install in development mode
pip install -e .
```

**Issue:** Database errors
- Tests use in-memory SQLite, not PostgreSQL
- Check conftest.py fixture setup

### Frontend

**Issue:** Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

**Issue:** jsdom errors
```bash
# Make sure jsdom is installed
npm install -D jsdom
```

---

## Next Steps

1. **Add more test coverage** - Aim for 80%+
2. **Add integration tests** - Test full workflows
3. **Add E2E tests** - Use Playwright or Cypress
4. **Set up CI/CD** - Automate testing on commits
5. **Test performance** - Add load testing

---

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
