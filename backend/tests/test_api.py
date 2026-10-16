import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["mode"] == "mock"

@pytest.mark.asyncio
async def test_create_session_and_message_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Create Session
        resp = await ac.post("/api/sessions")
        assert resp.status_code == 201
        session_data = resp.json()
        sid = session_data["session_id"]
        token = session_data["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Premature report request should return 409 Conflict
        rep_resp = await ac.get(f"/api/sessions/{sid}/report", headers=headers)
        assert rep_resp.status_code == 409
        assert "Report is not ready yet." in rep_resp.json()["detail"]["error"]

        # 3. Send regular message
        msg_resp = await ac.post(
            f"/api/sessions/{sid}/messages",
            json={"content": "I have had a mild headache since yesterday morning, about 3/10"},
            headers=headers,
        )
        assert msg_resp.status_code == 200
        msg_data = msg_resp.json()
        assert msg_data["type"] in ["question", "ready_for_report"]
        assert len(msg_data["assistant_message"]) > 0

        # 4. Immediate Emergency Message triggers without LLM
        em_resp = await ac.post(
            f"/api/sessions/{sid}/messages",
            json={"content": "Suddenly I have crushing chest pain and cannot breathe"},
            headers=headers,
        )
        assert em_resp.status_code == 200
        em_data = em_resp.json()
        assert em_data["type"] == "emergency"
        assert em_data["escalated"] is True
        assert "Emergency Medical Attention Needed" in em_data["emergency_details"]["title"]

        # 5. After emergency escalation, report IS ready immediately
        rep_resp_em = await ac.get(f"/api/sessions/{sid}/report", headers=headers)
        assert rep_resp_em.status_code == 200
        report = rep_resp_em.json()
        assert report["recommended_care_level"] == 3  # EMERGENCY

        # 6. Delete session
        del_resp = await ac.delete(f"/api/sessions/{sid}", headers=headers)
        assert del_resp.status_code == 204

@pytest.mark.asyncio
async def test_input_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/sessions")
        token = resp.json()["token"]
        sid = resp.json()["session_id"]
        headers = {"Authorization": f"Bearer {token}"}

        # Whitespace-only message rejected with 422
        bad_resp = await ac.post(
            f"/api/sessions/{sid}/messages",
            json={"content": "   "},
            headers=headers,
        )
        assert bad_resp.status_code == 422

        # Oversized message (> 1000 chars) rejected with 422
        oversized = "a" * 1001
        over_resp = await ac.post(
            f"/api/sessions/{sid}/messages",
            json={"content": oversized},
            headers=headers,
        )
        assert over_resp.status_code == 422
