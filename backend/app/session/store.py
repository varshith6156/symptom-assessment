import asyncio
import hashlib
import hmac
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple
from app.config import settings
from app.schemas.models import (
    ChatMessage,
    SessionState,
    Sufficiency,
    SymptomFacts,
    WarningSignObservation,
)

class SessionNotFoundError(Exception):
    pass

class SessionExpiredError(Exception):
    pass

class UnauthorizedSessionError(Exception):
    pass

class SessionCapacityExceededError(Exception):
    pass

class RateLimitExceededError(Exception):
    pass

class SessionStore:
    """
    In-memory, single-process session store with cryptographic token authentication,
    per-session locking, automatic TTL cleanup, and rate limiting.
    """

    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._rate_limits: Dict[str, list] = {}  # session_id -> list of request timestamps
        self._master_lock = asyncio.Lock()

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    async def _cleanup_expired(self):
        """Remove sessions past their expiry time."""
        now = datetime.now(timezone.utc)
        expired_ids = [
            sid for sid, s in self._sessions.items() if s.expires_at <= now
        ]
        for sid in expired_ids:
            self._sessions.pop(sid, None)
            self._locks.pop(sid, None)
            self._rate_limits.pop(sid, None)

    async def create_session(self) -> Tuple[SessionState, str]:
        """Creates a new session and returns (SessionState, raw_bearer_token)."""
        async with self._master_lock:
            await self._cleanup_expired()
            if len(self._sessions) >= settings.MAX_SESSIONS:
                raise SessionCapacityExceededError("Server session capacity reached. Please try again later.")

            session_id = uuid.uuid4().hex
            raw_token = secrets.token_urlsafe(32)
            token_hash = self._hash_token(raw_token)
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(minutes=settings.SESSION_TTL_MINUTES)

            state = SessionState(
                session_id=session_id,
                token_hash=token_hash,
                facts=SymptomFacts(),
                transcript=[],
                warning_signs={},
                question_count=0,
                checklist_step=0,
                checklist_completed=False,
                assessment_status=Sufficiency.COLLECTING,
                final_urgency=None,
                escalated=False,
                created_at=now,
                updated_at=now,
                expires_at=expires_at,
                version=1,
            )

            self._sessions[session_id] = state
            self._locks[session_id] = asyncio.Lock()
            self._rate_limits[session_id] = []
            return state, raw_token

    def _verify_token(self, state: SessionState, token: str) -> bool:
        candidate_hash = self._hash_token(token)
        return hmac.compare_digest(state.token_hash, candidate_hash)

    def _check_rate_limit(self, session_id: str):
        now = time.time()
        window = 60.0  # 1 minute
        history = self._rate_limits.setdefault(session_id, [])
        # filter out older timestamps
        history[:] = [t for t in history if now - t < window]
        if len(history) >= settings.RATE_LIMIT_PER_MINUTE:
            raise RateLimitExceededError("Rate limit exceeded for this session. Please wait a moment.")
        history.append(now)

    async def get_session(self, session_id: str, token: str) -> Tuple[SessionState, asyncio.Lock]:
        """Validates token, checks expiry & rate limit, returns (session_state, lock)."""
        # Purge check
        now = datetime.now(timezone.utc)
        state = self._sessions.get(session_id)
        if not state:
            raise SessionNotFoundError("Session not found or has been removed.")

        if state.expires_at <= now:
            self._sessions.pop(session_id, None)
            self._locks.pop(session_id, None)
            self._rate_limits.pop(session_id, None)
            raise SessionExpiredError("Session has expired due to inactivity.")

        if not self._verify_token(state, token):
            raise UnauthorizedSessionError("Invalid session token.")

        self._check_rate_limit(session_id)

        # Extend expiry on active usage
        state.expires_at = now + timedelta(minutes=settings.SESSION_TTL_MINUTES)
        state.updated_at = now

        lock = self._locks.setdefault(session_id, asyncio.Lock())
        return state, lock

    async def delete_session(self, session_id: str, token: str) -> bool:
        """Deletes session explicitly."""
        async with self._master_lock:
            state = self._sessions.get(session_id)
            if not state:
                return False
            if not self._verify_token(state, token):
                raise UnauthorizedSessionError("Invalid session token.")
            self._sessions.pop(session_id, None)
            self._locks.pop(session_id, None)
            self._rate_limits.pop(session_id, None)
            return True

    def active_sessions_count(self) -> int:
        now = datetime.now(timezone.utc)
        return sum(1 for s in self._sessions.values() if s.expires_at > now)

session_store = SessionStore()
