import re
from typing import Any, Dict, List, Optional
from app.schemas.models import (
    AgentTurn,
    ObservationSource,
    ObservationStatus,
    SessionState,
    Sufficiency,
    SymptomFacts,
    Urgency,
    WarningSignObservation,
)
from app.safety.red_flags import CHECKLIST_ITEMS

class MockAgent:
    """
    Deterministic, rule-based mock conversational agent.
    Provides structured questions, fact extraction, and checklist gating
    without requiring external LLM API calls.
    """

    def process_turn(
        self, user_message: str, current_state: SessionState
    ) -> AgentTurn:
        msg = user_message.lower().strip()
        facts = current_state.facts
        extracted_facts: Dict[str, Any] = {}

        # 1. Check for prompt injection attempts
        if any(
            phrase in msg
            for phrase in [
                "ignore previous",
                "system prompt",
                "you are now",
                "override safety",
                "disregard",
                "act as a doctor",
                "jailbreak",
            ]
        ):
            return AgentTurn(
                extracted_facts={},
                missing_fields=[],
                next_question=(
                    "I am an educational prototype designed to help document your symptoms. "
                    "I cannot alter safety protocols or provide medical advice. "
                    "Could you describe the main symptom or physical concern you are experiencing?"
                ),
                quick_replies=["I have a headache", "I have a cough", "I have stomach discomfort", "Skin rash"],
                suggested_urgency=Urgency.ROUTINE,
                ready_for_report=False,
            )

        # 2. Check for diagnosis or medication requests
        if any(
            phrase in msg
            for phrase in [
                "what medicine",
                "what medication",
                "what pills",
                "can i take",
                "what disease",
                "what do i have",
                "diagnose me",
                "prescribe",
            ]
        ):
            return AgentTurn(
                extracted_facts={},
                missing_fields=[],
                next_question=(
                    "As an educational prototype, I cannot diagnose illnesses or recommend medications. "
                    "A doctor or pharmacist should evaluate your condition to recommend safe treatment. "
                    "Let's continue gathering your symptom details so you have an organized summary to share with them. "
                    "When did your main symptoms begin?"
                ),
                quick_replies=["Earlier today", "Yesterday", "2-3 days ago", "Over a week ago"],
                suggested_urgency=Urgency.ROUTINE,
                ready_for_report=False,
            )

        # 3. Extract Facts from user message
        # Chief complaint
        if not facts.chief_complaint:
            extracted_facts["chief_complaint"] = user_message[:150].strip()

        # Severity extraction
        sev_match = re.search(r"\b(10|[0-9])\s*(/10|out of 10|\/10)?\b", msg)
        if sev_match and facts.severity is None:
            try:
                extracted_facts["severity"] = int(sev_match.group(1))
            except ValueError:
                pass
        elif "mild" in msg and facts.severity is None:
            extracted_facts["severity"] = 2
        elif "moderate" in msg and facts.severity is None:
            extracted_facts["severity"] = 5
        elif "severe" in msg and facts.severity is None:
            extracted_facts["severity"] = 8

        # Onset / Duration
        if any(term in msg for term in ["today", "this morning", "hours ago", "hour ago"]) and not facts.onset:
            extracted_facts["onset"] = "Earlier today"
            extracted_facts["duration"] = "Less than 24 hours"
        elif "yesterday" in msg and not facts.onset:
            extracted_facts["onset"] = "Yesterday"
            extracted_facts["duration"] = "1-2 days"
        elif any(term in msg for term in ["days ago", "few days"]) and not facts.onset:
            extracted_facts["onset"] = "A few days ago"
            extracted_facts["duration"] = "Several days"
        elif any(term in msg for term in ["week", "weeks", "month"]) and not facts.onset:
            extracted_facts["onset"] = "Over a week ago"
            extracted_facts["duration"] = "Prolonged"

        # Worsening / Improving
        if any(term in msg for term in ["getting worse", "worse", "worsening"]):
            extracted_facts["worsening_status"] = "worsening"
        elif any(term in msg for term in ["getting better", "improving"]):
            extracted_facts["worsening_status"] = "improving"
        elif any(term in msg for term in ["same", "unchanged", "constant"]):
            extracted_facts["worsening_status"] = "unchanged"

        # Age group
        if any(term in msg for term in ["baby", "infant", "newborn", "month old"]):
            extracted_facts["age_group"] = "infant"
        elif any(term in msg for term in ["child", "kid", "teen", "teenager"]):
            extracted_facts["age_group"] = "child"
        elif any(term in msg for term in ["elderly", "65", "older adult", "senior"]):
            extracted_facts["age_group"] = "older_adult"
        elif any(term in msg for term in ["adult", "years old", "30", "40", "50", "20"]):
            extracted_facts["age_group"] = "adult"

        # Process checklist progression if in checklist stage
        checklist_step = current_state.checklist_step
        if checklist_step > 0 and checklist_step <= len(CHECKLIST_ITEMS):
            # The current message answers the checklist question for checklist_step - 1
            answered_idx = checklist_step - 1
            item = CHECKLIST_ITEMS[answered_idx]
            rule_id = item["id"]

            if any(term in msg for term in ["no", "neither", "none"]):
                obs_status = ObservationStatus.ABSENT
            elif any(term in msg for term in ["not sure", "maybe", "uncertain", "don't know", "dont know"]):
                obs_status = ObservationStatus.UNKNOWN
            else:
                obs_status = ObservationStatus.PRESENT

            # Record in state
            current_state.warning_signs[rule_id] = WarningSignObservation(
                rule_id=rule_id,
                label=item["label"],
                status=obs_status,
                source=ObservationSource.STRUCTURED_ANSWER,
                supporting_excerpt=user_message[:100],
                review_status="unreviewed_demo_rule",
            )

        # 4. Decide Next Question and Action
        # Effective facts combining state and newly extracted facts
        merged_chief = extracted_facts.get("chief_complaint") or facts.chief_complaint
        merged_onset = extracted_facts.get("onset") or facts.onset
        merged_severity = extracted_facts.get("severity") if "severity" in extracted_facts else facts.severity
        merged_age = extracted_facts.get("age_group") or facts.age_group

        missing = []
        if not merged_onset:
            missing.append("onset")
        if merged_severity is None:
            missing.append("severity")
        if not merged_age:
            missing.append("age_group")

        # Question flow:
        # Step A: Ask onset/duration if missing
        if not merged_onset:
            return AgentTurn(
                extracted_facts=extracted_facts,
                missing_fields=missing,
                next_question="When did you first notice these symptoms, and have they been continuous or coming and going?",
                quick_replies=["Started today", "Started yesterday", "2-3 days ago", "More than a week ago"],
                suggested_urgency=Urgency.ROUTINE,
                ready_for_report=False,
            )

        # Step B: Ask severity if missing
        if merged_severity is None:
            return AgentTurn(
                extracted_facts=extracted_facts,
                missing_fields=missing,
                next_question="On a scale from 0 to 10 (where 0 is no discomfort and 10 is unbearable pain), how would you describe the severity?",
                quick_replies=["Mild (1-3)", "Moderate (4-6)", "Severe (7-8)", "Very Severe (9-10)"],
                suggested_urgency=Urgency.ROUTINE,
                ready_for_report=False,
            )

        # Step C: Ask age group / pre-existing conditions if missing
        if not merged_age:
            return AgentTurn(
                extracted_facts=extracted_facts,
                missing_fields=missing,
                next_question="What age group applies to the person experiencing these symptoms, and are there any pre-existing health conditions?",
                quick_replies=["Adult (18-64)", "Older Adult (65+)", "Child (2-17)", "Infant (< 1 year)"],
                suggested_urgency=Urgency.ROUTINE,
                ready_for_report=False,
            )

        # Step D: Checklist questions (Checklist gating)
        if checklist_step < len(CHECKLIST_ITEMS):
            next_chk = CHECKLIST_ITEMS[checklist_step]
            current_state.checklist_step += 1
            return AgentTurn(
                extracted_facts=extracted_facts,
                missing_fields=[],
                next_question=f"Safety screening ({current_state.checklist_step}/{len(CHECKLIST_ITEMS)}): {next_chk['question']}",
                quick_replies=next_chk["options"],
                suggested_urgency=Urgency.ROUTINE,
                ready_for_report=False,
            )

        # Step E: Completed checklist & sufficient facts gathered
        current_state.checklist_completed = True
        current_state.assessment_status = Sufficiency.SUFFICIENT

        # Calculate suggested urgency based on severity and worsening
        sugg_urg = Urgency.ROUTINE
        if merged_severity is not None and merged_severity >= 8:
            sugg_urg = Urgency.URGENT
        elif merged_severity is not None and merged_severity <= 3 and extracted_facts.get("worsening_status") != "worsening":
            sugg_urg = Urgency.SELF_CARE

        return AgentTurn(
            extracted_facts=extracted_facts,
            missing_fields=[],
            next_question=(
                "Thank you for providing these details and completing the preliminary safety checklist. "
                "I have gathered your symptom information and preliminary screening is now complete. "
                "You can now view your structured assessment summary."
            ),
            quick_replies=["View Assessment Report"],
            suggested_urgency=sugg_urg,
            ready_for_report=True,
        )

mock_agent = MockAgent()
