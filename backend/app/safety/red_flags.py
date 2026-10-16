import re
from typing import List, Dict, Any
from app.schemas.models import Urgency

DEMO_RULES: List[Dict[str, Any]] = [
    {
        "id": "RULE_SEV_BREATHING",
        "label": "Severe Breathing Difficulty",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "Severe breathing difficulty, gasping for air, or inability to speak in sentences requires immediate emergency medical evaluation.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(struggling to breathe|can't breathe|cannot breathe|cant breathe|gasping for air|suffocating|lips (turning|are) blue|unable to catch (my|their) breath|shortness of breath so bad|can't speak full sentences)\b",
            r"\b(severe shortness of breath|extreme difficulty breathing|choking)\b",
            r"\b(difficulty breathing|shortness of breath|trouble breathing)\b",
        ],
    },
    {
        "id": "RULE_CHEST_PAIN",
        "label": "Severe Chest Pain or Pressure",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "Crushing chest pain, heavy chest pressure, or chest pain radiating to the left arm or jaw may indicate an acute coronary event.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(crushing chest pain|chest pressure like an elephant|chest pain radiating to (arm|jaw|neck|back)|severe chest tightness|sharp chest pain with sweating)\b",
            r"\b(heart attack symptoms|pain in chest and left arm|chest pain and passing out)\b",
            r"\b(severe chest pain|unbearable chest pain)\b",
            r"\b(chest pain|chest pressure|chest tightness)\b",
        ],
    },
    {
        "id": "RULE_STROKE_FAST",
        "label": "Stroke-like Symptoms (FAST)",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "Sudden facial drooping, one-sided arm weakness, or slurred speech are key warning signs of a stroke requiring immediate emergency transport.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(face drooping|facial droop|one side of (my|the) face is numb|one side of (my|the) face is drooping)\b",
            r"\b(arm weakness on one side|can't lift (my|one) arm|sudden numbness on one side)\b",
            r"\b(slurred speech|speech is slurred|suddenly can't speak|unable to talk properly)\b",
            r"\b(having a stroke|think i'm having a stroke|signs of stroke)\b",
        ],
    },
    {
        "id": "RULE_UNRESPONSIVE",
        "label": "Unresponsiveness or Active Seizure",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "Unresponsiveness, loss of consciousness, or an active seizure is a medical emergency.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(passed out|blacked out|loss of consciousness|unconscious|unresponsive|collapsed and not waking up)\b",
            r"\b(having a seizure|convulsing|active seizure|violent shaking and unresponsive)\b",
        ],
    },
    {
        "id": "RULE_UNCONTROLLED_BLEEDING",
        "label": "Serious Uncontrolled Bleeding",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "Heavy arterial spurting or bleeding that does not stop after continuous direct pressure requires urgent emergency stabilization.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(spurting blood|bleeding won't stop|bleeding will not stop|gushing blood|soaking through (towels|dressings|bandages|clothes))\b",
            r"\b(coughing up large amounts of blood|vomiting blood like coffee grounds)\b",
        ],
    },
    {
        "id": "RULE_ANAPHYLAXIS",
        "label": "Severe Allergic Reaction (Anaphylaxis)",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "Rapid swelling of the throat or tongue, hives accompanied by breathing trouble, or feeling the airway closing is an anaphylactic emergency.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(throat is swelling|tongue is swollen|airway closing|can't swallow and can't breathe)\b",
            r"\b(anaphylaxis|allergic reaction and can't breathe|severe allergic reaction)\b",
        ],
    },
    {
        "id": "RULE_THUNDERCLAP_HEADACHE",
        "label": "Sudden Worst-Ever Headache",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "A sudden, explosive headache reaching maximum intensity within seconds (thunderclap headache) may indicate an intracranial hemorrhage.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(worst headache of my life|thunderclap headache|sudden explosive headache|headache struck like lightning)\b",
            r"\b(sudden severe headache and stiff neck|headache with vision loss and confusion)\b",
        ],
    },
    {
        "id": "RULE_SELF_HARM",
        "label": "Self-Harm or Suicide Concerns",
        "urgency": Urgency.EMERGENCY,
        "action": "crisis_escalation",
        "reason": "Expressions of self-harm or suicidal thoughts require immediate supportive crisis intervention.",
        "clinical_review_status": "unreviewed_demo_rule",
        "is_crisis": True,
        "patterns": [
            r"\b(want to kill myself|want to die|thinking of suicide|commit suicide|end my life|kill myself)\b",
            r"\b(harming myself|cutting myself|suicidal thoughts|plan to kill myself)\b",
        ],
    },
    {
        "id": "RULE_INFANT_FEVER",
        "label": "Infant High Fever (Demo Rule)",
        "urgency": Urgency.EMERGENCY,
        "action": "emergency_escalation",
        "reason": "Fever in infants under 3 months requires prompt emergency or pediatric evaluation. (Demo threshold: unreviewed).",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(baby has fever|infant has (a )?fever|newborn with fever|2 month old with fever|1 month old with fever|baby is burning up)\b",
        ],
    },
    {
        "id": "RULE_PERSISTENT_WORSENING",
        "label": "Rapidly Worsening or High Severity Condition",
        "urgency": Urgency.URGENT,
        "action": "urgent_flag",
        "reason": "Rapidly escalating symptoms or severe persistent pain warrant urgent same-day medical attention.",
        "clinical_review_status": "unreviewed_demo_rule",
        "patterns": [
            r"\b(getting rapidly worse|worsening very quickly|pain is becoming unbearable|pain is 10 out of 10|fever for more than 4 days)\b",
        ],
    },
]

# Standard checklist questions to ensure all key warning domains are covered before a non-emergency report
CHECKLIST_ITEMS = [
    {
        "id": "CHK_BREATHING_CHEST",
        "label": "Difficulty Breathing or Chest Discomfort",
        "question": "Are you currently experiencing any severe difficulty breathing, shortness of breath, or chest pressure?",
        "options": ["No, neither", "Yes, shortness of breath", "Yes, chest pressure", "Not sure"],
    },
    {
        "id": "CHK_NEURO",
        "label": "Sudden Weakness, Numbness, or Speech Changes",
        "question": "Have you noticed any sudden numbness or weakness on one side of your face or body, or difficulty speaking?",
        "options": ["No", "Yes, on one side", "Yes, speech difficulty", "Not sure"],
    },
    {
        "id": "CHK_RAPID_WORSENING",
        "label": "Fainting, Confusion, or Rapid Deterioration",
        "question": "Have you experienced any fainting, confusion, or sudden severe worsening of your symptoms?",
        "options": ["No", "Yes, felt faint / passed out", "Yes, getting rapidly worse", "Not sure"],
    },
]
