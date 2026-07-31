"""
Verification tests for the Vercel deployment-config fix (ModuleNotFoundError: dotenv).

Covers:
 1. Regression: FastAPI backend endpoints still work (login/content/me/media).
 2. Dependency verification: /app/api/index.py imports the FastAPI app
    with zero ModuleNotFoundError in a fresh Python invocation.
 3. Manifest completeness: /app/api/requirements.txt and /app/requirements.txt
    both cover every third-party module imported by backend/server.py & seed_content.py.
 4. Vercel config sanity: /app/vercel.json is valid, uses modern keys only.
"""
import io
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest
import requests
from PIL import Image

# ---- Config ---------------------------------------------------------------
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1]
                break
BASE_URL = BASE_URL.rstrip("/")

ADMIN_EMAIL = "admin@caternation.com"
ADMIN_PASSWORD = "CaterNation@2025"

# Mapping: third-party import name -> pip distribution name
REQUIRED_PACKAGES = {
    "dotenv": "python-dotenv",
    "fastapi": "fastapi",
    "starlette": "starlette",
    "motor": "motor",
    "pymongo": "pymongo",   # bson ships with pymongo
    "pydantic": "pydantic",
    "email_validator": "email-validator",
    "multipart": "python-multipart",
    "jwt": "PyJWT",
    "bcrypt": "bcrypt",
    "PIL": "pillow",
}


# ---- Fixtures -------------------------------------------------------------
@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                      timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    body = r.json()
    assert "token" in body and isinstance(body["token"], str) and body["token"]
    assert body["user"]["email"] == ADMIN_EMAIL
    return body["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- 1. Regression: FastAPI endpoints still work --------------------------
class TestBackendRegression:
    def test_login_returns_token(self, token):
        assert token and len(token.split(".")) == 3  # JWT structure

    def test_login_invalid_credentials_401(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "wrong"},
                          timeout=15)
        assert r.status_code == 401

    def test_get_content_public(self):
        r = requests.get(f"{BASE_URL}/api/content", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "settings" in data
        assert data["settings"]["brand_name"] == "CaterNation"

    def test_auth_me_with_bearer(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "admin"

    def test_auth_me_without_token_401(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_media_list_auth(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/media", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_media_list_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/media", timeout=15)
        assert r.status_code == 401


# ---- 2. Dependency verification: api/index.py imports cleanly -------------
class TestVercelEntrypointImport:
    def test_api_index_imports_without_module_not_found(self):
        """Fresh Python invocation to simulate Vercel cold start."""
        result = subprocess.run(
            [sys.executable, "-c",
             "import sys; sys.path.insert(0,'/app/api'); "
             "from index import app; print('ROUTES=', len(app.routes))"],
            cwd="/app",
            capture_output=True,
            text=True,
            timeout=30,
        )
        assert result.returncode == 0, (
            f"Import failed.\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
        )
        assert "ModuleNotFoundError" not in result.stderr, result.stderr
        assert "No module named" not in result.stderr, result.stderr
        assert "ROUTES=" in result.stdout
        # Should have at least the /api/* routes registered
        routes_count = int(result.stdout.strip().split("ROUTES=")[1])
        assert routes_count >= 10

    def test_api_index_reexports_fastapi_app(self):
        sys.path.insert(0, "/app/api")
        # Fresh import guard
        for mod in ("index", "server"):
            sys.modules.pop(mod, None)
        from index import app  # noqa
        from fastapi import FastAPI
        assert isinstance(app, FastAPI)
        assert app.title == "CaterNation API"


# ---- 3. Manifest completeness --------------------------------------------
class TestRequirementsManifests:
    @pytest.mark.parametrize("req_file", [
        "/app/api/requirements.txt",
        "/app/requirements.txt",
    ])
    def test_manifest_covers_all_server_imports(self, req_file):
        assert Path(req_file).exists(), f"{req_file} missing"
        contents = Path(req_file).read_text().lower()
        missing = []
        for _import_name, pkg in REQUIRED_PACKAGES.items():
            if pkg.lower() not in contents:
                missing.append(pkg)
        assert not missing, f"{req_file} missing required packages: {missing}"

    def test_root_and_api_manifests_consistent(self):
        root = Path("/app/requirements.txt").read_text().lower()
        api = Path("/app/api/requirements.txt").read_text().lower()
        for pkg in REQUIRED_PACKAGES.values():
            assert pkg.lower() in root, f"root requirements missing {pkg}"
            assert pkg.lower() in api, f"api requirements missing {pkg}"


# ---- 4. vercel.json sanity ------------------------------------------------
class TestVercelJson:
    def test_vercel_json_is_valid_json(self):
        cfg = json.loads(Path("/app/vercel.json").read_text())
        assert isinstance(cfg, dict)

    def test_vercel_json_has_modern_keys(self):
        cfg = json.loads(Path("/app/vercel.json").read_text())
        assert cfg.get("outputDirectory") == "frontend/build"
        rewrites = cfg.get("rewrites", [])
        # /api/(.*) -> /api/index
        assert any(r.get("source") == "/api/(.*)" and r.get("destination") == "/api/index"
                   for r in rewrites), f"Missing api rewrite: {rewrites}"
        # SPA fallback for non /api paths -> /index.html
        assert any("/index.html" == r.get("destination") for r in rewrites), \
            f"Missing SPA fallback: {rewrites}"

    def test_vercel_json_no_legacy_keys(self):
        cfg = json.loads(Path("/app/vercel.json").read_text())
        for legacy in ("version", "builds", "routes"):
            assert legacy not in cfg, f"legacy key '{legacy}' reintroduced in vercel.json"
