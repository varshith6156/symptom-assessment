import json
from pathlib import Path
from typing import Dict, Any, Optional

PROTOCOLS_DIR = Path(__file__).parent

class ProtocolLoader:
    """
    Loads symptom protocols from structured JSON files.
    Allows clinician review without altering application logic.
    """

    def __init__(self):
        self._protocols: Dict[str, Dict[str, Any]] = {}
        self.reload()

    def reload(self):
        self._protocols = {}
        for path in PROTOCOLS_DIR.glob("*.json"):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    key = data.get("symptom_key", path.stem)
                    self._protocols[key] = data
            except Exception as e:
                print(f"Error loading protocol {path}: {e}")

    def get_protocol(self, symptom_key: str) -> Optional[Dict[str, Any]]:
        return self._protocols.get(symptom_key)

    def match_protocol(self, text: str) -> Dict[str, Any]:
        """Matches a user symptom description to the appropriate protocol."""
        if not text:
            return self._protocols.get("general", {})

        t = text.lower()
        if any(w in t for w in ["headache", "head pain", "migraine", "temple pain"]):
            return self._protocols.get("headache", self._protocols.get("general", {}))
        if any(w in t for w in ["fever", "chills", "burning up", "high temp", "temperature"]):
            return self._protocols.get("fever", self._protocols.get("general", {}))
        if any(w in t for w in ["cough", "phlegm", "sputum", "bronchitis"]):
            return self._protocols.get("cough", self._protocols.get("general", {}))
        if any(w in t for w in ["stomach", "abdominal", "belly", "nausea", "vomit", "cramp"]):
            return self._protocols.get("abdominal_pain", self._protocols.get("general", {}))
        if any(w in t for w in ["dizzy", "dizziness", "vertigo", "spinning", "lightheaded"]):
            return self._protocols.get("dizziness", self._protocols.get("general", {}))

        return self._protocols.get("general", {})

    def list_protocols(self) -> Dict[str, Dict[str, Any]]:
        return self._protocols

protocol_loader = ProtocolLoader()
