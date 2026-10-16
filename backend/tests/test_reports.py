from datetime import datetime, timezone
import pytest
from app.report.generator import ReportGenerator, ReportNotReadyError
from app.schemas.models import (
    ChatMessage,
    ObservationSource,
    ObservationStatus,
    SessionState,
    Sufficiency,
    SymptomFacts,
    Urgency,
    WarningSignObservation,
)

@pytest.fixture
def generator():
    return ReportGenerator()

def test_report_readiness_blocks_incomplete(generator):
    state = SessionState(
        session_id="test_sid",
        token_hash="hash",
        facts=SymptomFacts(chief_complaint="Cough"),
        checklist_completed=False,
        expires_at=datetime.now(timezone.utc),
    )
    unmet = generator.check_readiness(state)
    assert len(unmet) > 0
    with pytest.raises(ReportNotReadyError):
        generator.generate(state)

def test_report_generation_complete_routine(generator):
    state = SessionState(
        session_id="test_sid",
        token_hash="hash",
        facts=SymptomFacts(
            chief_complaint="Mild ankle sprain",
            onset="Yesterday afternoon",
            duration="1 day",
            severity=3,
            age_group="adult",
        ),
        checklist_completed=True,
        final_urgency=Urgency.ROUTINE,
        transcript=[
            ChatMessage(role="assistant", content="When did this start?"),
            ChatMessage(role="user", content="Yesterday afternoon"),
        ],
        warning_signs={
            "CHK_BREATHING_CHEST": WarningSignObservation(
                rule_id="CHK_BREATHING_CHEST",
                label="Difficulty Breathing or Chest Discomfort",
                status=ObservationStatus.ABSENT,
            )
        },
        expires_at=datetime.now(timezone.utc),
    )
    report = generator.generate(state)
    assert report.recommended_care_level == Urgency.ROUTINE
    assert report.reported_facts.chief_complaint == "Mild ankle sprain"
    assert len(report.fixed_limitations) > 0
    assert len(report.clinician_questions) > 0
    # Warning sign breakdown preserves absent
    assert any(w["rule_id"] == "CHK_BREATHING_CHEST" for w in report.warning_sign_status["absent"])

def test_report_emergency_escalation_immediate(generator):
    state = SessionState(
        session_id="test_sid",
        token_hash="hash",
        facts=SymptomFacts(chief_complaint="Chest pressure"),
        escalated=True,
        escalation_reason="Crushing chest pain",
        emergency_rule_id="RULE_CHEST_PAIN",
        final_urgency=Urgency.EMERGENCY,
        expires_at=datetime.now(timezone.utc),
    )
    # Even if checklist is False and onset is missing, emergency allows immediate report
    unmet = generator.check_readiness(state)
    assert len(unmet) == 0
    report = generator.generate(state)
    assert report.recommended_care_level == Urgency.EMERGENCY
    assert any("Crushing chest pain" in r for r in report.recommendation_reasons)
