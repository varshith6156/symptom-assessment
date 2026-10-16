import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings
from app.schemas.models import AgentTurn, SessionState, Urgency
from app.agent.prompts import SYSTEM_PROMPT, REPAIR_PROMPT

logger = logging.getLogger(__name__)

class LLMProviderError(Exception):
    pass

class LLMTimeoutError(Exception):
    pass

class LLMConfigurationError(Exception):
    pass

class LiveLLMClient:
    """
    HTTPX-based client for OpenAI-compatible chat completion APIs.
    Enforces strict timeouts, schema validation, single retry on invalid JSON,
    and safe error isolation.
    """

    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        self.base_url = settings.LLM_BASE_URL.rstrip("/")
        self.timeout = 20.0  # seconds

    def validate_configuration(self):
        """Validates that necessary configuration is present when running in live mode."""
        if not self.api_key:
            raise LLMConfigurationError(
                "LLM_MODE is set to 'live' but LLM_API_KEY is not configured in backend environment."
            )

    async def _call_provider(self, messages: List[Dict[str, str]]) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        url = f"{self.base_url}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    raise LLMProviderError(
                        f"External LLM provider returned HTTP {response.status_code}"
                    )
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.TimeoutException:
            raise LLMTimeoutError("Request to LLM provider timed out after 20 seconds.")
        except httpx.RequestError as e:
            raise LLMProviderError(f"Network error communicating with LLM provider: {str(e)}")

    def _parse_and_validate(self, raw_content: str) -> AgentTurn:
        try:
            parsed = json.loads(raw_content)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON received from model.")

        if not isinstance(parsed, dict):
            raise ValueError("Model output root must be a JSON object.")

        extracted = parsed.get("extracted_facts", {})
        if not isinstance(extracted, dict):
            extracted = {}

        next_q = parsed.get("next_question", "").strip()
        if not next_q:
            next_q = "Could you tell me a little more about your symptoms?"

        replies = parsed.get("quick_replies", [])
        if not isinstance(replies, list):
            replies = []

        urg = parsed.get("suggested_urgency", 1)
        try:
            urg_enum = Urgency(int(urg))
        except (ValueError, TypeError):
            urg_enum = Urgency.ROUTINE

        ready = bool(parsed.get("ready_for_report", False))

        return AgentTurn(
            extracted_facts=extracted,
            missing_fields=parsed.get("missing_fields", []),
            next_question=next_q,
            quick_replies=[str(r)[:50] for r in replies][:5],
            reported_warning_signs=parsed.get("reported_warning_signs", []),
            suggested_urgency=urg_enum,
            ready_for_report=ready,
        )

    async def process_turn(
        self, user_message: str, current_state: SessionState
    ) -> AgentTurn:
        self.validate_configuration()

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Include recent conversation turns
        for m in current_state.transcript[-6:]:
            messages.append({"role": m.role, "content": m.content})

        messages.append({"role": "user", "content": user_message})

        raw_output = await self._call_provider(messages)

        try:
            return self._parse_and_validate(raw_output)
        except ValueError:
            # Single retry with repair prompt
            logger.warning("Model output failed schema validation; retrying with repair prompt.")
            repair_messages = list(messages)
            repair_messages.append({"role": "assistant", "content": raw_output})
            repair_messages.append({"role": "user", "content": REPAIR_PROMPT})
            second_raw = await self._call_provider(repair_messages)
            return self._parse_and_validate(second_raw)
