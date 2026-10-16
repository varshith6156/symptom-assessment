import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("medcare_app")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Med+Care Preliminary Symptom Assessment Service")
    logger.info(f"LLM Mode: {settings.LLM_MODE}")
    logger.info(f"Frontend URL: {settings.FRONTEND_URL}")
    logger.info(f"Emergency Number: {settings.EMERGENCY_NUMBER} ({settings.EMERGENCY_REGION})")
    if settings.LLM_MODE == "live" and not settings.LLM_API_KEY:
        logger.warning("WARNING: LLM_MODE is 'live' but LLM_API_KEY is not configured!")
    yield

app = FastAPI(
    title="AI-Powered Preliminary Symptom Assessment API",
    description="Educational healthcare-navigation prototype. Not a diagnostic tool.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
allowed_origins = [settings.FRONTEND_URL.rstrip("/")]
if "http://localhost:5173" not in allowed_origins:
    allowed_origins.append("http://localhost:5173")
if "http://127.0.0.1:5173" not in allowed_origins:
    allowed_origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log securely without exposing stack trace to API client
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )
