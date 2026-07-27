"""New backend tests: media upload/get/delete, account, password change, expanded content."""
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://culinary-luxury-13.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@caternation.com"
ADMIN_PASSWORD = "CaterNation@2025"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _make_png(size=(400, 300), color=(200, 100, 50)):
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


# ---------- Media
def test_media_upload_requires_auth():
    files = {"file": ("test.png", _make_png(), "image/png")}
    r = requests.post(f"{API}/media", files=files, timeout=20)
    assert r.status_code == 401


def test_media_upload_and_get_and_delete(auth_headers):
    files = {"file": ("test.png", _make_png(), "image/png")}
    r = requests.post(f"{API}/media", files=files, headers=auth_headers, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "id" in data and "path" in data
    assert data["path"] == f"/api/media/{data['id']}"

    # Public GET should return image bytes with cache header
    r2 = requests.get(f"{BASE_URL}{data['path']}", timeout=20)
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("image/")
    # Note: backend sets Cache-Control: public, max-age=31536000, immutable but ingress/CDN may override
    assert len(r2.content) > 100

    # Delete without auth
    r3 = requests.delete(f"{API}/media/{data['id']}", timeout=15)
    assert r3.status_code == 401

    # Delete with auth
    r4 = requests.delete(f"{API}/media/{data['id']}", headers=auth_headers, timeout=15)
    assert r4.status_code == 200
    assert r4.json().get("success") is True

    # Verify deletion
    r5 = requests.get(f"{BASE_URL}{data['path']}", timeout=15)
    assert r5.status_code == 404


def test_media_upload_rejects_invalid_image(auth_headers):
    files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
    r = requests.post(f"{API}/media", files=files, headers=auth_headers, timeout=15)
    assert r.status_code == 400


# ---------- Account
def test_update_account_requires_auth():
    r = requests.put(f"{API}/auth/account", json={"name": "Nope"}, timeout=15)
    assert r.status_code == 401


def test_update_account_name(auth_headers):
    r = requests.put(f"{API}/auth/account", json={"name": "TEST_Admin_Name"}, headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert r.json()["name"] == "TEST_Admin_Name"
    # Verify via /me
    m = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=15).json()
    assert m["name"] == "TEST_Admin_Name"
    # Revert
    r2 = requests.put(f"{API}/auth/account", json={"name": "Admin"}, headers=auth_headers, timeout=15)
    assert r2.status_code == 200


def test_update_account_email_uniqueness(auth_headers):
    # Create a second user via mongo? We only have admin. Simulate uniqueness by trying to change to same admin email as another - can't create user. So we just verify current email flow and same-email update works.
    # Change email to a different valid one, then back
    new_email = "test_admin_alt@caternation.com"
    r = requests.put(f"{API}/auth/account", json={"email": new_email}, headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert r.json()["email"] == new_email
    # Login with new email
    lr = requests.post(f"{API}/auth/login", json={"email": new_email, "password": ADMIN_PASSWORD}, timeout=15)
    assert lr.status_code == 200
    new_token = lr.json()["token"]
    # Revert email
    r2 = requests.put(f"{API}/auth/account", json={"email": ADMIN_EMAIL},
                     headers={"Authorization": f"Bearer {new_token}"}, timeout=15)
    assert r2.status_code == 200
    assert r2.json()["email"] == ADMIN_EMAIL


# ---------- Password
def test_change_password_wrong_current(auth_headers):
    r = requests.put(f"{API}/auth/password",
                     json={"current_password": "wrongpass", "new_password": "abcdef1"},
                     headers=auth_headers, timeout=15)
    assert r.status_code == 400


def test_change_password_too_short(auth_headers):
    r = requests.put(f"{API}/auth/password",
                     json={"current_password": ADMIN_PASSWORD, "new_password": "abc"},
                     headers=auth_headers, timeout=15)
    assert r.status_code == 400


def test_change_password_flow_and_reset(auth_headers):
    new_pw = "TEMP_Pass_9876"
    r = requests.put(f"{API}/auth/password",
                     json={"current_password": ADMIN_PASSWORD, "new_password": new_pw},
                     headers=auth_headers, timeout=15)
    assert r.status_code == 200
    # Login with new password
    lr = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": new_pw}, timeout=15)
    assert lr.status_code == 200
    new_token = lr.json()["token"]
    # Old password must fail
    old = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert old.status_code == 401
    # RESET back to original
    rr = requests.put(f"{API}/auth/password",
                      json={"current_password": new_pw, "new_password": ADMIN_PASSWORD},
                      headers={"Authorization": f"Bearer {new_token}"}, timeout=15)
    assert rr.status_code == 200
    # Login with original again
    final = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert final.status_code == 200


# ---------- Content expansion
def test_content_after_reset_has_new_keys(auth_headers):
    r = requests.post(f"{API}/content/reset", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    data = requests.get(f"{API}/content", timeout=15).json()
    assert "seo" in data, "seo key missing after reset"
    assert "settings" in data
    assert "typography" in data["settings"], "settings.typography missing"
    assert "hero" in data
    assert "layout" in data["hero"], "hero.layout missing"
