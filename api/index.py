"""
Vercel serverless entrypoint for the CaterNation FastAPI backend.

Vercel's @vercel/python runtime detects and serves the exported ASGI `app`.
This file only re-exports the existing FastAPI application defined in
`backend/server.py` — no backend logic lives here, so the local
(supervisor-managed) setup and this Vercel entrypoint stay in sync.
"""
import os
import sys

# Make the backend package importable (server.py lives in /backend).
BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Re-export the existing FastAPI app untouched.
from server import app  # noqa: E402

# `app` is the ASGI application Vercel will serve.
__all__ = ["app"]
