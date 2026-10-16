from app.schemas.models import Urgency

def max_urgency(u1: Urgency, u2: Urgency) -> Urgency:
    """Return the higher of two urgency levels. Safety rule: LLM cannot lower urgency."""
    return Urgency(max(int(u1), int(u2)))

def urgency_to_label(urgency: Urgency) -> str:
    labels = {
        Urgency.SELF_CARE: "Self-Care & Monitoring",
        Urgency.ROUTINE: "Routine Medical Evaluation",
        Urgency.URGENT: "Urgent Medical Care (Same-Day / Next-Day)",
        Urgency.EMERGENCY: "Emergency Medical Attention Needed Immediately",
    }
    return labels.get(urgency, "Routine Medical Evaluation")

def urgency_to_color(urgency: Urgency) -> str:
    colors = {
        Urgency.SELF_CARE: "emerald",
        Urgency.ROUTINE: "blue",
        Urgency.URGENT: "amber",
        Urgency.EMERGENCY: "rose",
    }
    return colors.get(urgency, "blue")
