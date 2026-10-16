from datetime import datetime, timezone
from enum import Enum, IntEnum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

class Urgency(IntEnum):
    SELF_CARE = 0
    ROUTINE = 1
    URGENT = 2
    EMERGENCY = 3

class Sufficiency(str, Enum):
    COLLECTING = "COLLECTING"
    SUFFICIENT = "SUFFICIENT"
    INSUFFICIENT = "INSUFFICIENT"

class ObservationStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    UNKNOWN = "unknown"
    DISPUTED = "disputed"

class ObservationSource(str, Enum):
    USER_MESSAGE = "user_message"
    STRUCTURED_ANSWER = "structured_answer"
    MODEL_CANDIDATE = "model_candidate"

class WarningSignObservation(BaseModel):
    rule_id: str
    label: str
    status: ObservationStatus = ObservationStatus.UNKNOWN
    source: ObservationSource = ObservationSource.USER_MESSAGE
    supporting_excerpt: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    review_status: str = "unreviewed_demo_rule"

class SymptomFacts(BaseModel):
    chief_complaint: Optional[str] = None
    onset: Optional[str] = None
    duration: Optional[str] = None
    severity: Optional[int] = None
    frequency: Optional[str] = None
    associated_symptoms: List[str] = Field(default_factory=list)
    age_group: Optional[str] = None  # "infant", "child", "adult", "older_adult"
    age_detail: Optional[str] = None
    pregnancy_status: Optional[str] = None  # "yes", "no", "unknown", "not_applicable"
    relevant_conditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    worsening_status: Optional[str] = None  # "worsening", "improving", "unchanged", "fluctuating"

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (0 <= v <= 10):
            raise ValueError("Severity must be an integer between 0 and 10")
        return v

class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    emergency: bool = False

class AgentTurn(BaseModel):
    extracted_facts: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)
    next_question: str
    quick_replies: List[str] = Field(default_factory=list)
    reported_warning_signs: List[str] = Field(default_factory=list)
    suggested_urgency: Urgency = Urgency.ROUTINE
    ready_for_report: bool = False

class SessionState(BaseModel):
    session_id: str
    token_hash: str
    facts: SymptomFacts = Field(default_factory=SymptomFacts)
    transcript: List[ChatMessage] = Field(default_factory=list)
    warning_signs: Dict[str, WarningSignObservation] = Field(default_factory=dict)
    question_count: int = 0
    checklist_step: int = 0  # 0: not started, 1-3: in progress, 4: complete
    checklist_completed: bool = False
    assessment_status: Sufficiency = Sufficiency.COLLECTING
    final_urgency: Optional[Urgency] = None
    escalated: bool = False
    escalation_reason: Optional[str] = None
    emergency_rule_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    version: int = 1

class TurnResponse(BaseModel):
    type: str  # "question", "emergency", "ready_for_report", "fallback"
    assistant_message: str
    quick_replies: List[str] = Field(default_factory=list)
    progress: Dict[str, Any] = Field(default_factory=dict)
    warning_signs: List[WarningSignObservation] = Field(default_factory=list)
    urgency_so_far: Urgency = Urgency.ROUTINE
    assessment_status: Sufficiency = Sufficiency.COLLECTING
    facts: SymptomFacts = Field(default_factory=SymptomFacts)
    escalated: bool = False
    emergency_details: Optional[Dict[str, Any]] = None

class Report(BaseModel):
    session_id: str
    recommended_care_level: Urgency
    recommended_care_label: str
    recommendation_reasons: List[str]
    reported_facts: SymptomFacts
    relevant_answers: List[Dict[str, str]]
    warning_sign_status: Dict[str, List[Dict[str, Any]]]  # "present", "absent", "unknown", "disputed"
    missing_information: List[str]
    suggested_next_steps: List[str]
    clinician_questions: List[str]
    fixed_limitations: List[str]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ruleset_version: str = "demo-rules-v1.0 (unreviewed prototype)"
    protocol_used: Optional[str] = None
    contributing_factors: List[Dict[str, Any]] = Field(default_factory=list)
    counterfactuals: List[Dict[str, Any]] = Field(default_factory=list)
    uncertainty_rating: str = "Moderate"
    uncertainty_reasons: List[str] = Field(default_factory=list)
    doctor_summary_sbar: Dict[str, str] = Field(default_factory=dict)

# API Requests & Responses
class CreateSessionResponse(BaseModel):
    session_id: str
    token: str
    mode: str
    emergency_number: str
    emergency_region: str
    expires_in_minutes: int

class UserMessageRequest(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Message cannot be empty or whitespace only")
        if len(trimmed) > 1000:
            raise ValueError("Message exceeds maximum length of 1000 characters")
        return trimmed

class FactsUpdateRequest(BaseModel):
    updates: Dict[str, Any] = Field(default_factory=dict)
    disputed_rule_id: Optional[str] = None
    clear_escalation_if_disputed: bool = False

class HealthResponse(BaseModel):
    status: str
    mode: str
    llm_provider_configured: bool
    active_sessions: int
    version: str = "1.0.0"
