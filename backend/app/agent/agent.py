from app.config import settings
from app.schemas.models import AgentTurn, SessionState
from app.agent.mock_agent import mock_agent
from app.agent.llm_client import LiveLLMClient

class ConversationalAgent:
    """
    Conversational Agent coordinating between Deterministic Mock mode
    and Live OpenAI-compatible provider.
    """

    def __init__(self):
        self.mock = mock_agent
        self.live = LiveLLMClient()

    async def process_turn(
        self, user_message: str, current_state: SessionState
    ) -> AgentTurn:
        mode = settings.LLM_MODE.lower()
        if mode == "live":
            return await self.live.process_turn(user_message, current_state)
        return self.mock.process_turn(user_message, current_state)

agent = ConversationalAgent()
