"""
Test cases for Provider endpoints
"""
import pytest
from app.models.provider import Provider


def test_create_provider(client, db_session):
    """Test creating a new provider"""
    response = client.post(
        "/api/providers",
        json={
            "name": "Dr. John Smith",
            "title": "MD",
            "specialty": "Cardiology",
            "email": "john.smith@example.com",
            "phone": "555-0100",
            "working_hours": "09:00-17:00",
            "color": "#1a73e8"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Dr. John Smith"
    assert data["specialty"] == "Cardiology"
    assert "id" in data


def test_get_all_providers(client, db_session):
    """Test retrieving all providers"""
    # Create a provider first
    provider = Provider(
        name="Dr. Jane Doe",
        specialty="Pediatrics",
        working_hours="08:00-16:00",
        color="#e91e63"
    )
    db_session.add(provider)
    db_session.commit()

    response = client.get("/api/providers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Dr. Jane Doe"


def test_get_provider_by_id(client, db_session):
    """Test retrieving a specific provider"""
    provider = Provider(
        name="Dr. Test",
        specialty="General",
        working_hours="09:00-17:00",
        color="#4285f4"
    )
    db_session.add(provider)
    db_session.commit()
    db_session.refresh(provider)

    response = client.get(f"/api/providers/{provider.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Dr. Test"


def test_update_provider(client, db_session):
    """Test updating a provider"""
    provider = Provider(
        name="Dr. Update Test",
        specialty="Orthopedics",
        working_hours="09:00-17:00",
        color="#33b679"
    )
    db_session.add(provider)
    db_session.commit()
    db_session.refresh(provider)

    response = client.put(
        f"/api/providers/{provider.id}",
        json={
            "name": "Dr. Updated Name",
            "specialty": "Sports Medicine",
            "working_hours": "10:00-18:00",
            "color": "#33b679"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Dr. Updated Name"
    assert data["specialty"] == "Sports Medicine"


def test_delete_provider(client, db_session):
    """Test deleting a provider (soft delete)"""
    provider = Provider(
        name="Dr. Delete Test",
        specialty="Dermatology",
        working_hours="09:00-17:00",
        color="#ea4335"
    )
    db_session.add(provider)
    db_session.commit()
    db_session.refresh(provider)

    response = client.delete(f"/api/providers/{provider.id}")
    assert response.status_code == 204

    # Verify it's soft deleted
    db_session.refresh(provider)
    assert provider.is_active == False


def test_provider_not_found(client):
    """Test getting a non-existent provider"""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/providers/{fake_id}")
    assert response.status_code == 404
