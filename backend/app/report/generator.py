from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.schemas.models import (
    ObservationStatus,
    Report,
    SessionState,
    Sufficiency,
    Urgency,
)
from app.safety.urgency import urgency_to_label
from app.safety.red_flags import DEMO_RULES, CHECKLIST_ITEMS
from app.report.templates import (
    DEFAULT_CLINICIAN_QUESTIONS,
    FIXED_LIMITATIONS,
    NEXT_STEPS_BY_URGENCY,
)

class ReportNotReadyError(Exception):
    def __init__(self, missing_criteria: List[str]):
        super().__init__(f"Report readiness criteria not met: {', '.join(missing_criteria)}")
        self.missing_criteria = missing_criteria

class ReportGenerator:
    """
    Builds structured, un-hallucinated reports strictly from validated session state.
    Does NOT call the LLM during generation.
    """

    def check_readiness(self, state: SessionState) -> List[str]:
        """Returns list of unsatisfied criteria for non-emergency sessions."""
        if state.escalated or (state.final_urgency and state.final_urgency == Urgency.EMERGENCY):
            # Emergency cases can generate report immediately
            return []

        missing = []
        if not state.facts.chief_complaint:
            missing.append("Chief complaint not specified")
        if not state.facts.onset:
            missing.append("Symptom onset/duration not collected")
        if state.facts.severity is None:
            missing.append("Severity rating (0-10) not collected")
        if not state.checklist_completed:
            missing.append("Demonstration safety screening checklist not completed")

        return missing

    def generate(self, state: SessionState) -> Report:
        unmet = self.check_readiness(state)
        if unmet:
            raise ReportNotReadyError(unmet)

        # 1. Determine recommended care level
        if state.escalated:
            care_level = Urgency.EMERGENCY
        elif state.final_urgency is not None:
            care_level = state.final_urgency
        else:
            care_level = Urgency.ROUTINE

        # If missing critical info (e.g. unknown checklist items or missing fields),
        # prevent SELF_CARE output
        unknown_warning_count = sum(
            1 for obs in state.warning_signs.values() if obs.status == ObservationStatus.UNKNOWN
        )
        if unknown_warning_count > 0 and care_level == Urgency.SELF_CARE:
            care_level = Urgency.ROUTINE

        # 2. Build reasons
        reasons: List[str] = []
        if state.escalated:
            reasons.append(
                f"Emergency red flag triggered: {state.escalation_reason or 'Severe acute symptoms detected'}"
            )
        elif care_level == Urgency.URGENT:
            if state.facts.severity is not None and state.facts.severity >= 8:
                reasons.append(f"Reported high symptom severity ({state.facts.severity}/10)")
            if state.facts.worsening_status == "worsening":
                reasons.append("Symptoms reported as rapidly worsening or deteriorating")
            if not reasons:
                reasons.append("Symptom pattern warrants prompt clinical evaluation within 24 hours")
        elif care_level == Urgency.ROUTINE:
            reasons.append("Symptoms do not exhibit acute emergency red flags, but merit clinical examination")
            if state.facts.duration:
                reasons.append(f"Symptom duration reported: {state.facts.duration}")
        else:
            reasons.append("Mild symptoms reported with all red flag screening items explicitly absent")

        # 3. Warning signs status breakdown
        warning_status: Dict[str, List[Dict]] = {
            "present": [],
            "absent": [],
            "unknown": [],
            "disputed": [],
        }

        # Track all known rules
        all_rule_ids = {r["id"] for r in DEMO_RULES} | {c["id"] for c in CHECKLIST_ITEMS}
        recorded_ids = set()

        for rule_id, obs in state.warning_signs.items():
            recorded_ids.add(rule_id)
            status_key = obs.status.value.lower()
            if status_key in warning_status:
                warning_status[status_key].append(
                    {
                        "rule_id": obs.rule_id,
                        "label": obs.label,
                        "status": obs.status.value,
                        "source": obs.source.value,
                        "excerpt": obs.supporting_excerpt or "No excerpt",
                    }
                )

        # Any unaddressed checklist items remain unknown
        for chk in CHECKLIST_ITEMS:
            if chk["id"] not in recorded_ids:
                warning_status["unknown"].append(
                    {
                        "rule_id": chk["id"],
                        "label": chk["label"],
                        "status": "unknown",
                        "source": "unanswered_checklist",
                        "excerpt": "Not explicitly asked or answered",
                    }
                )

        # 4. Relevant answers from transcript
        relevant_answers = []
        for i in range(0, len(state.transcript) - 1, 2):
            msg_a = state.transcript[i]
            msg_b = state.transcript[i + 1]
            if msg_a.role == "assistant" and msg_b.role == "user":
                relevant_answers.append(
                    {"question": msg_a.content, "user_answer": msg_b.content}
                )

        # 5. Missing information
        missing_info: List[str] = []
        if not state.facts.age_group:
            missing_info.append("Age group / exact age")
        if not state.facts.relevant_conditions:
            missing_info.append("Complete past medical history / chronic conditions")
        if not state.facts.allergies:
            missing_info.append("Known medication or environmental allergies")
        if unknown_warning_count > 0:
            missing_info.append(f"{unknown_warning_count} warning sign(s) remain uncertain or unconfirmed")

        # 6. Clinician questions tailored to chief complaint
        clinician_qs = list(DEFAULT_CLINICIAN_QUESTIONS)
        if state.facts.chief_complaint:
            clinician_qs.insert(
                0,
                f"Given my {state.facts.chief_complaint} that started {state.facts.onset or 'recently'}, what should I watch for?",
            )

        return Report(
            session_id=state.session_id,
            recommended_care_level=care_level,
            recommended_care_label=urgency_to_label(care_level),
            recommendation_reasons=reasons,
            reported_facts=state.facts,
            relevant_answers=relevant_answers,
            warning_sign_status=warning_status,
            missing_information=missing_info,
            suggested_next_steps=NEXT_STEPS_BY_URGENCY.get(int(care_level), []),
            clinician_questions=clinician_qs,
            fixed_limitations=FIXED_LIMITATIONS,
            generated_at=datetime.now(timezone.utc),
            ruleset_version="demo-rules-v1.0 (unreviewed prototype)",
        )

report_generator = ReportGenerator()
