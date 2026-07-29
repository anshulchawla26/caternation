"""Iteration 3 backend tests: Media Library list + typography defaults."""
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # Fallback: read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1].rstrip("/")

ADMIN_EMAIL = "admin@caternation.com"
ADMIN_PASSWORD = "CaterNation@2025"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _make_png_bytes():
    img = Image.new("RGB", (64, 64), (200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# --- Media list endpoint --------------------------------------------------

def test_list_media_requires_auth():
    r = requests.get(f"{BASE_URL}/api/media", timeout=15)
    assert r.status_code == 401


def test_list_media_returns_array(auth_headers):
    r = requests.get(f"{BASE_URL}/api/media", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body, list)
    for item in body:
        assert "id" in item and "path" in item
        assert "filename" in item and "content_type" in item and "created_at" in item
        assert "data" not in item  # binary excluded


def test_upload_list_delete_flow(auth_headers):
    files = {"file": ("test_iter3.png", _make_png_bytes(), "image/png")}
    up = requests.post(f"{BASE_URL}/api/media", headers=auth_headers, files=files, timeout=30)
    assert up.status_code == 200, up.text
    mid = up.json()["id"]
    assert up.json()["path"] == f"/api/media/{mid}"

    # appears in list
    lst = requests.get(f"{BASE_URL}/api/media", headers=auth_headers, timeout=15).json()
    ids = [m["id"] for m in lst]
    assert mid in ids

    # public GET returns bytes
    g = requests.get(f"{BASE_URL}/api/media/{mid}", timeout=15)
    assert g.status_code == 200
    assert g.headers["content-type"].startswith("image/")
    assert len(g.content) > 100

    # DELETE without auth -> 401
    d0 = requests.delete(f"{BASE_URL}/api/media/{mid}", timeout=15)
    assert d0.status_code == 401

    # DELETE with auth
    d = requests.delete(f"{BASE_URL}/api/media/{mid}", headers=auth_headers, timeout=15)
    assert d.status_code == 200

    # confirm gone
    lst2 = requests.get(f"{BASE_URL}/api/media", headers=auth_headers, timeout=15).json()
    assert mid not in [m["id"] for m in lst2]


# --- Typography defaults after reset --------------------------------------

def test_reset_content_typography_has_size_keys(auth_headers):
    r = requests.post(f"{BASE_URL}/api/content/reset", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    content = r.json()["content"]
    typo = content.get("settings", {}).get("typography", {})
    for k in ("hero_heading_size", "section_heading_size", "body_size"):
        assert k in typo, f"missing {k} in typography"
        assert typo[k] == "" or typo[k] is None, f"{k} default should be empty, got {typo[k]!r}"
    # heading/body objects also present
    assert isinstance(typo.get("heading"), dict)
    assert isinstance(typo.get("body"), dict)


def test_public_content_reflects_typography_keys():
    r = requests.get(f"{BASE_URL}/api/content", timeout=15)
    assert r.status_code == 200
    typo = r.json().get("settings", {}).get("typography", {})
    for k in ("hero_heading_size", "section_heading_size", "body_size"):
        assert k in typo
