"""Backend API tests for CaterNation."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://culinary-luxury-13.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@caternation.com"
ADMIN_PASSWORD = "CaterNation@2025"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"]["role"] == "admin"
    return data["token"]


# ------- Content
def test_get_content_defaults():
    r = requests.get(f"{API}/content", timeout=15)
    assert r.status_code == 200
    data = r.json()
    for key in ["settings", "contact", "hero", "marquee", "about", "services", "dishes", "counters", "gallery", "testimonials", "sections"]:
        assert key in data, f"missing {key}"
    assert data["hero"]["heading_lines"] == ["The Art of", "Fine Catering"]
    assert data["contact"]["primary_phone"].endswith("6284649883")
    assert len(data["contact"]["owners"]) == 2
    assert len(data["services"]["items"]) == 6
    assert len(data["gallery"]["items"]) >= 6


# ------- Auth
def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
    assert r.status_code == 401


def test_me_without_token():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401


def test_me_with_token(token):
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=15)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


def test_put_content_requires_auth():
    r = requests.put(f"{API}/content", json={"content": {"x": 1}}, timeout=15)
    assert r.status_code == 401


def test_put_content_persists_and_reset(token):
    headers = {"Authorization": f"Bearer {token}"}
    # fetch current
    current = requests.get(f"{API}/content", timeout=15).json()
    # modify
    modified = dict(current)
    modified["hero"] = dict(current["hero"])
    modified["hero"]["overline"] = "TEST_OVERLINE_XYZ"
    r = requests.put(f"{API}/content", json={"content": modified}, headers=headers, timeout=15)
    assert r.status_code == 200
    # verify persistence
    fetched = requests.get(f"{API}/content", timeout=15).json()
    assert fetched["hero"]["overline"] == "TEST_OVERLINE_XYZ"
    # reset
    r = requests.post(f"{API}/content/reset", headers=headers, timeout=15)
    assert r.status_code == 200
    restored = requests.get(f"{API}/content", timeout=15).json()
    assert restored["hero"]["overline"] != "TEST_OVERLINE_XYZ"


def test_reset_requires_auth():
    r = requests.post(f"{API}/content/reset", timeout=15)
    assert r.status_code == 401
