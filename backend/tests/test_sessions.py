import asyncio
from datetime import datetime, timedelta, timezone
import pytest
from app.session.store import (
    RateLimitExceededError,
    SessionExpiredError,
    SessionNotFoundError,
    SessionStore,
    UnauthorizedSessionError,
)

@pytest.mark.asyncio
async def test_session_lifecycle():
    store = SessionStore()
    state, token = await store.create_session()
    assert state.session_id is not None
    assert token is not None

    # Retrieve valid session
    fetched, lock = await store.get_session(state.session_id, token)
    assert fetched.session_id == state.session_id

    # Delete session
    deleted = await store.delete_session(state.session_id, token)
    assert deleted is True

    # Retrieve deleted session raises SessionNotFoundError
    with pytest.raises(SessionNotFoundError):
        await store.get_session(state.session_id, token)

@pytest.mark.asyncio
async def test_invalid_token():
    store = SessionStore()
    state, _ = await store.create_session()
    with pytest.raises(UnauthorizedSessionError):
        await store.get_session(state.session_id, "incorrect-token")

@pytest.mark.asyncio
async def test_expired_session():
    store = SessionStore()
    state, token = await store.create_session()
    # Force expiry to the past
    state.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    with pytest.raises(SessionExpiredError):
        await store.get_session(state.session_id, token)

@pytest.mark.asyncio
async def test_rate_limiting():
    store = SessionStore()
    state, token = await store.create_session()
    # Fill rate limit quota
    for _ in range(30):
        await store.get_session(state.session_id, token)

    with pytest.raises(RateLimitExceededError):
        await store.get_session(state.session_id, token)

@pytest.mark.asyncio
async def test_concurrent_access():
    store = SessionStore()
    state, token = await store.create_session()

    async def worker():
        s, lock = await store.get_session(state.session_id, token)
        async with lock:
            s.version += 1

    await asyncio.gather(*(worker() for _ in range(10)))
    assert state.version == 11
