from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from typing import Any, Dict, Optional
from datetime import datetime, timezone, timedelta
import logging
import bcrypt
import jwt
import io
from PIL import Image
from bson import ObjectId

from seed_content import DEFAULT_CONTENT

# ------------------------------------------------------------------ DB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ------------------------------------------------------------------ App
app = FastAPI(title="CaterNation API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
CONTENT_KEY = "site_content"


# ------------------------------------------------------------------ Auth helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ------------------------------------------------------------------ Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ContentPayload(BaseModel):
    content: Dict[str, Any]


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ------------------------------------------------------------------ Auth routes
@api_router.post("/auth/login")
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    return {
        "token": token,
        "user": {"email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")},
    }


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.put("/auth/account")
async def update_account(body: AccountUpdate, user: dict = Depends(get_current_user)):
    updates = {}
    if body.name is not None:
        updates["name"] = body.name.strip()
    if body.email is not None:
        new_email = body.email.lower().strip()
        clash = await db.users.find_one({"email": new_email, "_id": {"$ne": ObjectId(user["_id"])}})
        if clash:
            raise HTTPException(status_code=400, detail="That email is already in use")
        updates["email"] = new_email
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": updates})
    doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    return {"email": doc["email"], "name": doc.get("name", "Admin"), "role": doc.get("role", "admin")}


@api_router.put("/auth/password")
async def change_password(body: PasswordChange, user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not verify_password(body.current_password, doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    await db.users.update_one({"_id": ObjectId(user["_id"])},
                              {"$set": {"password_hash": hash_password(body.new_password)}})
    return {"success": True}


# ------------------------------------------------------------------ Media routes
@api_router.post("/media")
async def upload_media(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    raw = await file.read()
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 15MB)")
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    has_alpha = img.mode in ("RGBA", "LA", "P")
    # resize keeping aspect ratio, max edge 2200px
    max_edge = 2200
    if max(img.size) > max_edge:
        img.thumbnail((max_edge, max_edge), Image.LANCZOS)

    buf = io.BytesIO()
    if has_alpha:
        img = img.convert("RGBA")
        img.save(buf, format="PNG", optimize=True)
        content_type = "image/png"
    else:
        img = img.convert("RGB")
        img.save(buf, format="JPEG", quality=82, optimize=True, progressive=True)
        content_type = "image/jpeg"
    data = buf.getvalue()

    doc = {
        "content_type": content_type,
        "data": data,
        "filename": file.filename,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.media.insert_one(doc)
    return {"id": str(res.inserted_id), "path": f"/api/media/{res.inserted_id}"}


@api_router.get("/media/{media_id}")
async def get_media(media_id: str):
    try:
        doc = await db.media.find_one({"_id": ObjectId(media_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=bytes(doc["data"]),
        media_type=doc.get("content_type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, user: dict = Depends(get_current_user)):
    try:
        await db.media.delete_one({"_id": ObjectId(media_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    return {"success": True}


# ------------------------------------------------------------------ Content routes
@api_router.get("/content")
async def get_content():
    doc = await db.site.find_one({"key": CONTENT_KEY})
    if not doc:
        await db.site.insert_one({"key": CONTENT_KEY, "content": DEFAULT_CONTENT,
                                  "updated_at": datetime.now(timezone.utc).isoformat()})
        return DEFAULT_CONTENT
    return doc.get("content", DEFAULT_CONTENT)


@api_router.put("/content")
async def update_content(body: ContentPayload, user: dict = Depends(get_current_user)):
    await db.site.update_one(
        {"key": CONTENT_KEY},
        {"$set": {"content": body.content, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"success": True, "content": body.content}


@api_router.post("/content/reset")
async def reset_content(user: dict = Depends(get_current_user)):
    await db.site.update_one(
        {"key": CONTENT_KEY},
        {"$set": {"content": DEFAULT_CONTENT, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"success": True, "content": DEFAULT_CONTENT}


@api_router.get("/")
async def root():
    return {"message": "CaterNation API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@caternation.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")
    if not await db.site.find_one({"key": CONTENT_KEY}):
        await db.site.insert_one({"key": CONTENT_KEY, "content": DEFAULT_CONTENT,
                                  "updated_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Seeded site content")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
