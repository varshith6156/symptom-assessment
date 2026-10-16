import re
from typing import Dict, List, Optional, Tuple
from app.schemas.models import (
    ObservationSource,
    ObservationStatus,
    SymptomFacts,
    Urgency,
    WarningSignObservation,
)
from app.safety.red_flags import DEMO_RULES, CHECKLIST_ITEMS
from app.safety.urgency import max_urgency
from app.config import settings

# Negation prefixes and helpers
NEGATION_REGEX = re.compile(
    r"\b(no|not|neither|nor|without|never|haven't|havent|have not|don't|dont|do not|denies|denied|negative for|zero|none of that)\b",
    re.IGNORECASE,
)

HISTORICAL_REGEX = re.compile(
    r"\b(years ago|months ago|in \d{4}|as a child|in my childhood|used to have|history of|past|previously had|recovered from)\b",
    re.IGNORECASE,
)

THIRD_PARTY_REGEX = re.compile(
    r"\b(my (mother|father|mom|dad|sister|brother|friend|colleague|husband|wife|partner|child|cousin|aunt|uncle|dog|cat))\b",
    re.IGNORECASE,
)

def normalize_text(text: str) -> str:
    """Normalize curly quotes, apostrophes, and whitespace."""
    if not text:
        return ""
    # Replace curly single quotes / apostrophes
    s = text.replace("’", "'").replace("‘", "'").replace("`", "'")
    # Replace curly double quotes
    s = s.replace("“", '"').replace("”", '"')
    # Collapse whitespace
    s = " ".join(s.split())
    return s

class SafetyEngine:
    """
    Deterministic, pure-Python safety engine.
    Scans user inputs and facts for emergency triggers and safety red flags.
    LLM outputs can never downgrade safety urgency computed by this engine.
    """

    def __init__(self, rules: Optional[List[Dict]] = None):
        self.rules = rules or DEMO_RULES
        self._compiled_rules = []
        for r in self.rules:
            compiled_patterns = [
                re.compile(p, re.IGNORECASE) for p in r.get("patterns", [])
            ]
            self._compiled_rules.append({**r, "compiled_patterns": compiled_patterns})

    def is_negated(self, text: str, match_start: int, match_end: int) -> bool:
        """Check if a match is preceded or surrounded by negation words within the clause."""
        # Find clause boundaries (punctuation or commas)
        start_clause = max(
            text.rfind(".", 0, match_start),
            text.rfind(";", 0, match_start),
            text.rfind(",", 0, match_start),
            text.rfind("!", 0, match_start),
            0,
        )
        preceding_clause = text[start_clause:match_start].strip()
        if NEGATION_REGEX.search(preceding_clause):
            return True
        # Check immediately following words like "is absent", "is not happening"
        following = text[match_end : min(len(text), match_end + 30)].strip()
        if re.search(r"^( is not| are not| wasn't| was not| isn't)", following, re.IGNORECASE):
            return True
        return False

    def is_historical(self, text: str, match_start: int) -> bool:
        """Check if match is in a historical statement (e.g. '5 years ago')."""
        start_clause = max(
            text.rfind(".", 0, match_start),
            0,
        )
        preceding = text[start_clause:match_start].strip()
        return bool(HISTORICAL_REGEX.search(preceding))

    def is_third_party(self, text: str, match_start: int) -> bool:
        """Check if match refers to someone else."""
        start_clause = max(
            text.rfind(".", 0, match_start),
            0,
        )
        preceding = text[start_clause:match_start].strip()
        return bool(THIRD_PARTY_REGEX.search(preceding))

    def scan_text(
        self,
        text: str,
        current_observations: Optional[Dict[str, WarningSignObservation]] = None,
    ) -> Tuple[List[WarningSignObservation], List[WarningSignObservation]]:
        """
        Scans a user message against safety rules.
        Returns: (present_observations, absent_or_disputed_observations)
        """
        norm = normalize_text(text)
        present: List[WarningSignObservation] = []
        absent: List[WarningSignObservation] = []
        obs_map = current_observations or {}

        for rule in self._compiled_rules:
            rule_id = rule["id"]
            # Check if this rule was explicitly disputed by the user
            if rule_id in obs_map and obs_map[rule_id].status == ObservationStatus.DISPUTED:
                continue

            for pattern in rule["compiled_patterns"]:
                match = pattern.search(norm)
                if match:
                    m_start, m_end = match.span()
                    excerpt = norm[max(0, m_start - 20) : min(len(norm), m_end + 20)]

                    # Check third party
                    if self.is_third_party(norm, m_start):
                        # Not an active trigger for this user
                        continue

                    # Check historical
                    if self.is_historical(norm, m_start):
                        # Historical symptom, not acute emergency
                        continue

                    # Check negation
                    if self.is_negated(norm, m_start, m_end):
                        absent.append(
                            WarningSignObservation(
                                rule_id=rule_id,
                                label=rule["label"],
                                status=ObservationStatus.ABSENT,
                                source=ObservationSource.USER_MESSAGE,
                                supporting_excerpt=excerpt,
                                review_status=rule.get("clinical_review_status", "unreviewed_demo_rule"),
                            )
                        )
                        break

                    # Active match!
                    present.append(
                        WarningSignObservation(
                            rule_id=rule_id,
                            label=rule["label"],
                            status=ObservationStatus.PRESENT,
                            source=ObservationSource.USER_MESSAGE,
                            supporting_excerpt=excerpt,
                            review_status=rule.get("clinical_review_status", "unreviewed_demo_rule"),
                        )
                    )
                    break

        return present, absent

    def evaluate_facts(
        self, facts: SymptomFacts, current_observations: Dict[str, WarningSignObservation]
    ) -> List[WarningSignObservation]:
        """Evaluates structured facts (e.g. severe pain, infant fever, worsening)."""
        extra_obs: List[WarningSignObservation] = []

        # Infant fever demonstration rule
        if (
            facts.age_group == "infant"
            and (
                (facts.chief_complaint and "fever" in facts.chief_complaint.lower())
                or any("fever" in s.lower() for s in facts.associated_symptoms)
            )
        ):
            rule_id = "RULE_INFANT_FEVER"
            if rule_id not in current_observations or current_observations[rule_id].status != ObservationStatus.DISPUTED:
                extra_obs.append(
                    WarningSignObservation(
                        rule_id=rule_id,
                        label="Infant High Fever (Demo Rule)",
                        status=ObservationStatus.PRESENT,
                        source=ObservationSource.STRUCTURED_ANSWER,
                        supporting_excerpt="Age: Infant with reported fever",
                        review_status="unreviewed_demo_rule",
                    )
                )

        # High severity + worsening condition -> Urgent
        if facts.severity is not None and facts.severity >= 9:
            rule_id = "RULE_PERSISTENT_WORSENING"
            if rule_id not in current_observations or current_observations[rule_id].status != ObservationStatus.DISPUTED:
                extra_obs.append(
                    WarningSignObservation(
                        rule_id=rule_id,
                        label="Extreme Severity Reported (9-10/10)",
                        status=ObservationStatus.PRESENT,
                        source=ObservationSource.STRUCTURED_ANSWER,
                        supporting_excerpt=f"Reported severity: {facts.severity}/10",
                        review_status="unreviewed_demo_rule",
                    )
                )

        return extra_obs

    def compute_rule_urgency(
        self,
        observations: Dict[str, WarningSignObservation],
    ) -> Tuple[Urgency, Optional[str], Optional[str]]:
        """
        Determines the highest urgency level triggered by active PRESENT observations.
        Returns: (highest_urgency, highest_rule_id, explanation)
        """
        highest_urgency = Urgency.SELF_CARE
        highest_rule_id: Optional[str] = None
        explanation: Optional[str] = None

        rule_lookup = {r["id"]: r for r in self.rules}

        for rule_id, obs in observations.items():
            if obs.status == ObservationStatus.PRESENT:
                rule_def = rule_lookup.get(rule_id)
                if rule_def:
                    rule_urgency = rule_def["urgency"]
                    if int(rule_urgency) > int(highest_urgency):
                        highest_urgency = rule_urgency
                        highest_rule_id = rule_id
                        explanation = rule_def.get("reason", obs.label)

        # Default routine urgency if user has complaints but no red flags
        if highest_urgency == Urgency.SELF_CARE:
            highest_urgency = Urgency.ROUTINE

        return highest_urgency, highest_rule_id, explanation

    def get_emergency_guidance(
        self,
        rule_id: Optional[str],
        reason: Optional[str] = None,
        is_crisis: bool = False,
    ) -> Dict[str, str]:
        """Generates fixed, backend-controlled emergency or crisis guidance."""
        emergency_num = settings.EMERGENCY_NUMBER or "your local emergency number (e.g., 911, 112, 999)"
        region = settings.EMERGENCY_REGION or "your local area"

        if is_crisis or rule_id == "RULE_SELF_HARM":
            return {
                "title": "Immediate Support Available",
                "message": (
                    "If you are feeling overwhelmed, having thoughts of harming yourself, or need immediate support, "
                    "please reach out right now. Free, confidential help is available 24/7."
                ),
                "action_steps": (
                    f"• In the US & Canada: Call or text 988 to connect with the Suicide & Crisis Lifeline.\n"
                    f"• In the UK: Call 111 or text SHOUT to 85258.\n"
                    f"• In any location: Call {emergency_num} or go to the nearest emergency department."
                ),
                "emergency_number": emergency_num,
                "region": region,
                "is_crisis": True,
            }

        rule_label = "A potential medical emergency sign"
        if rule_id:
            for r in self.rules:
                if r["id"] == rule_id:
                    rule_label = r["label"]
                    break

        return {
            "title": f"Emergency Medical Attention Needed: {rule_label}",
            "message": (
                "Based on the warning signs you described, this situation may require immediate emergency medical care. "
                "This educational prototype cannot evaluate emergencies or ensure your safety."
            ),
            "reason": reason or "Severe or potentially life-threatening symptoms were detected.",
            "action_steps": (
                f"1. Call {emergency_num} ({region}) or your local emergency response immediately.\n"
                f"2. If safe to do so, proceed to the nearest emergency room or urgent emergency facility.\n"
                f"3. Do not drive yourself if you are feeling faint, short of breath, or in severe pain."
            ),
            "emergency_number": emergency_num,
            "region": region,
            "is_crisis": False,
        }

safety_engine = SafetyEngine()
