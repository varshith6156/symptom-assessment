import pytest
from app.safety.engine import SafetyEngine
from app.schemas.models import ObservationStatus, SymptomFacts, Urgency, WarningSignObservation
from app.safety.urgency import max_urgency

@pytest.fixture
def engine():
    return SafetyEngine()

def test_positive_severe_breathing(engine):
    present, absent = engine.scan_text("I am struggling to breathe and gasping for air")
    assert any(obs.rule_id == "RULE_SEV_BREATHING" for obs in present)
    assert len(absent) == 0

def test_positive_chest_pain(engine):
    present, absent = engine.scan_text("I have crushing chest pain that radiates to my left arm")
    assert any(obs.rule_id == "RULE_CHEST_PAIN" for obs in present)

def test_positive_stroke_fast(engine):
    present, absent = engine.scan_text("My face is drooping and I have slurred speech")
    assert any(obs.rule_id == "RULE_STROKE_FAST" for obs in present)

def test_positive_unresponsive_seizure(engine):
    present, absent = engine.scan_text("I had an active seizure earlier and passed out")
    assert any(obs.rule_id == "RULE_UNRESPONSIVE" for obs in present)

def test_positive_uncontrolled_bleeding(engine):
    present, absent = engine.scan_text("There is spurting blood that is soaking through towels")
    assert any(obs.rule_id == "RULE_UNCONTROLLED_BLEEDING" for obs in present)

def test_positive_anaphylaxis(engine):
    present, absent = engine.scan_text("My throat is swelling and my tongue is swollen after eating peanuts")
    assert any(obs.rule_id == "RULE_ANAPHYLAXIS" for obs in present)

def test_positive_thunderclap_headache(engine):
    present, absent = engine.scan_text("This is the worst headache of my life, it struck like lightning")
    assert any(obs.rule_id == "RULE_THUNDERCLAP_HEADACHE" for obs in present)

def test_positive_self_harm(engine):
    present, absent = engine.scan_text("I want to kill myself and end my life")
    assert any(obs.rule_id == "RULE_SELF_HARM" for obs in present)

def test_positive_infant_fever(engine):
    facts = SymptomFacts(
        chief_complaint="baby has fever",
        age_group="infant",
        associated_symptoms=["fever", "crying"],
    )
    obs = engine.evaluate_facts(facts, {})
    assert any(o.rule_id == "RULE_INFANT_FEVER" for o in obs)

def test_positive_persistent_worsening(engine):
    facts = SymptomFacts(severity=9, worsening_status="worsening")
    obs = engine.evaluate_facts(facts, {})
    assert any(o.rule_id == "RULE_PERSISTENT_WORSENING" for o in obs)

def test_negated_chest_pain(engine):
    present, absent = engine.scan_text("I have a cough and mild fatigue, but no chest pain or shortness of breath")
    assert not any(obs.rule_id == "RULE_CHEST_PAIN" for obs in present)
    assert any(obs.rule_id == "RULE_CHEST_PAIN" for obs in absent)
    assert any(obs.rule_id == "RULE_SEV_BREATHING" for obs in absent)

def test_curly_apostrophe_normalization(engine):
    # Curly apostrophe in "can’t breathe"
    present, absent = engine.scan_text("I can’t breathe and my chest is tight")
    assert any(obs.rule_id == "RULE_SEV_BREATHING" for obs in present)

def test_historical_symptom_not_acute_emergency(engine):
    present, absent = engine.scan_text("5 years ago I had a stroke, but today I just have an earache")
    assert not any(obs.rule_id == "RULE_STROKE_FAST" for obs in present)

def test_third_party_symptom_not_user_emergency(engine):
    present, absent = engine.scan_text("My mother had crushing chest pain last year, I just have a rash")
    assert not any(obs.rule_id == "RULE_CHEST_PAIN" for obs in present)

def test_llm_cannot_downgrade_urgency():
    rule_urgency = Urgency.EMERGENCY
    model_suggestion = Urgency.SELF_CARE
    final = max_urgency(rule_urgency, model_suggestion)
    assert final == Urgency.EMERGENCY

def test_disputed_rule_bypasses_future_trigger(engine):
    # If RULE_CHEST_PAIN is marked DISPUTED
    existing_obs = {
        "RULE_CHEST_PAIN": WarningSignObservation(
            rule_id="RULE_CHEST_PAIN",
            label="Chest Pain",
            status=ObservationStatus.DISPUTED,
        )
    }
    present, absent = engine.scan_text("severe chest pain", current_observations=existing_obs)
    assert not any(obs.rule_id == "RULE_CHEST_PAIN" for obs in present)
