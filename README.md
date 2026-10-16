# Med+Care — AI-Powered Preliminary Symptom Assessment

> **CRITICAL EDUCATIONAL DISCLAIMER**
> **Educational healthcare-navigation prototype — NOT a diagnostic tool and NOT clinically validated.**
> This prototype is designed strictly to explore patient symptom communication and clinician visit preparation. It must NEVER be used as a substitute for professional clinical judgment, diagnosis, emergency medical triage, or treatment. If you are experiencing severe symptoms, call your local emergency services (e.g., 911, 112, 999) or proceed to the nearest emergency department immediately.

---

## 1. Project Purpose & Non-Negotiable Boundaries

Med+Care helps individuals articulate and organize their symptoms in natural language, answer adaptive follow-up questions, recognize potential warning signs, and produce a structured summary for discussion with a qualified healthcare provider.

### Non-Negotiable Boundaries:
- **No Diagnoses:** The system will never diagnose or declare what disease or condition a user probably has.
- **No Prescriptions:** The system will never prescribe, recommend, or adjust medications, supplements, or dosages.
- **No Guarantees of Safety:** The absence of reported warning signs is never interpreted or communicated as proof that nothing serious is wrong.
- **Deterministic Urgency Floor:** The LLM cannot override or downgrade the deterministic safety engine:
  $$\text{Final Urgency} = \max(\text{Rule Urgency}, \text{Validated LLM Suggestion})$$
- **Immediate Emergency Bypass:** Any potential emergency trigger produces an immediate, fixed backend-controlled emergency response **without waiting for or calling an external LLM**.
- **No Fabricated References:** The application never invents medical studies, clinical guidelines, or validation claims.

---

## 2. Architecture & Design

```
                     ┌───────────────────────────────────────────────┐
                     │          Browser Frontend (React + Vite)      │
                     │  - In-memory per-session token (no cookies)   │
                     │  - Adaptive Chat UI + Severity Rating (0-10)  │
                     │  - Printable / Save-as-PDF Structured Report  │
                     └───────────────────────┬───────────────────────┘
                                             │ HTTP REST / JSON
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │           FastAPI Backend (Python)            │
                     │  - In-Memory Session Store with Auto-TTL      │
                     │  - Concurrency Locking & Rate Limiting        │
                     └───────┬───────────────────────────────┬───────┘
                             │                               │
                             ▼                               ▼
       ┌──────────────────────────────┐    ┌──────────────────────────────────┐
       │ Deterministic Safety Engine  │    │      Conversational Agent        │
       │ - Regex red flag detection   │    │ - Deterministic Mock Agent       │
       │ - Negation & history filter  │    │   (offline / zero-key mode)      │
       │ - Structured facts checks    │    │ - OpenAI-compatible Live Client  │
       │ - Immediate Emergency Bypass │    │   (configurable base URL/model)  │
       └──────────────┬───────────────┘    └─────────────────┬────────────────┘
                      │                                      │
                      └──────────────────┬───────────────────┘
                                         ▼
                     ┌───────────────────────────────────────────────┐
                     │          Structured Report Generator          │
                     │  - Un-hallucinated templates                  │
                     │  - Enforced 409 Conflict readiness gates      │
                     │  - Warning signs (present/absent/unknown)     │
                     └───────────────────────────────────────────────┘
```

### Safety-First Message Pipeline
1. **Authenticate & Lock:** Validate session bearer token and acquire session lock to prevent race conditions.
2. **Deterministic Scan:** Evaluate user message using `SafetyEngine`.
3. **Emergency Trigger Check:** If an emergency red flag is detected, immediately return fixed emergency guidance without calling the LLM.
4. **Agent Processing:** Call conversational agent (Mock or Live LLM) with validated state.
5. **Schema Validation & Repair:** Enforce strict Pydantic JSON schema constraints. Single retry on malformed JSON.
6. **Fact Merging:** Merge newly extracted facts without overwriting valid historical facts.
7. **Secondary Safety Scan:** Re-evaluate safety rules on updated facts (e.g. severity $\ge 9$, infant fever).
8. **Urgency Calculation:** Compute $\text{final\_urgency} = \max(\text{rule\_urgency}, \text{llm\_suggestion})$.
9. **Question Gating:** Enforce ~8 question cap and required warning-sign checklist completion before report readiness.
10. **State Update:** Append messages to transcript, increment version counter, and return response.

---

## 3. Technology Stack

- **Backend:** Python 3.10+, FastAPI, Pydantic v2, HTTPX, Uvicorn, Pytest, Pytest-Asyncio.
- **Frontend:** React 18, Vite, Tailwind CSS, React Router DOM, Lucide React.
- **Storage:** In-memory, single-process session store with cryptographic token hashing and automatic TTL expiry.
- **AI Providers:** Deterministic Mock Mode (default, zero keys required) + OpenAI-compatible live provider adapter.

---

## 4. Setup & Running Instructions

### Prerequisites
- Python 3.10+ (`python --version`)
- Node.js 18+ and npm (`node --version`, `npm --version`)

### 1. Backend Setup

```bash
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy example environment configuration
cp .env.example .env

# Run backend test suite (45 tests)
pytest tests -v

# Start backend server (starts on http://127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Build to verify production bundle
npm run build

# Start Vite development server (starts on http://127.0.0.1:5173)
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://localhost:5173` in your browser.

---

## 5. Environment Variables & Modes

### Backend Configuration (`backend/.env`):
| Variable | Default | Description |
|---|---|---|
| `LLM_MODE` | `mock` | Mode: `mock` (deterministic, zero-key) or `live` |
| `LLM_API_KEY` | *(empty)* | OpenAI-compatible API Key (required if `LLM_MODE=live`) |
| `LLM_MODEL` | `gpt-4o-mini` | Model identifier |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Base URL for chat completions |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS frontend origin |
| `SESSION_TTL_MINUTES` | `30` | Inactivity expiration time for sessions |
| `MAX_SESSIONS` | `500` | Maximum concurrent in-memory sessions |
| `MAX_TRANSCRIPT_MESSAGES`| `40` | Maximum transcript messages per session |
| `EMERGENCY_NUMBER` | `911` | Emergency dial number (e.g., 911, 999, 112) |
| `EMERGENCY_REGION` | `US / Canada` | Geographic region for emergency notice |

### Frontend Configuration (`frontend/.env`):
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | URL of the running FastAPI backend |

---

## 6. How to Run & Test

### Running Automated Test Suite
The project includes 45 comprehensive automated tests covering safety engine rules, session concurrency, agent guardrails, API endpoints, and all 12 end-to-end demo scenarios:

```bash
cd backend
python -m pytest tests -v
```

### Test Coverage Highlights:
- **Red Flag Rules (`test_safety.py`):** Positive matches for severe breathing, chest pain, stroke (FAST), seizures/unresponsiveness, hemorrhage, anaphylaxis, thunderclap headache, self-harm crisis, infant fever, worsening status.
- **Negation & Historical Parsing:** Validates that "no chest pain" or "stroke 5 years ago" does not trigger acute emergency escalation.
- **Session Security (`test_sessions.py`):** Token authentication, expiry timing, rate limiting (30 requests/minute), and concurrent version locks.
- **Report Readiness Gate (`test_reports.py`):** Enforces HTTP 409 Conflict if a non-emergency report is requested before completing facts and the safety checklist.
- **End-to-End Scenarios (`test_scenarios.py`):** Covers all 12 required specification scenarios.

---

## 7. API Examples (curl)

### 1. Health Check
```bash
curl -X GET http://127.0.0.1:8000/api/health
```

### 2. Create Session
```bash
curl -X POST http://127.0.0.1:8000/api/sessions
```
*Response contains `session_id` and raw `token`.*

### 3. Send Message
```bash
curl -X POST http://127.0.0.1:8000/api/sessions/{session_id}/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"content": "I have had a mild headache since yesterday morning"}'
```

### 4. Immediate Emergency Message (No LLM called)
```bash
curl -X POST http://127.0.0.1:8000/api/sessions/{session_id}/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"content": "I have crushing chest pain and cannot breathe"}'
```

### 5. Update / Correct Facts
```bash
curl -X PATCH http://127.0.0.1:8000/api/sessions/{session_id}/facts \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"updates": {"severity": 8, "worsening_status": "worsening"}}'
```

### 6. Retrieve Report (Requires completed checklist or emergency escalation)
```bash
curl -X GET http://127.0.0.1:8000/api/sessions/{session_id}/report \
  -H "Authorization: Bearer {token}"
```

---

## 8. Interactive Demo Script

1. **Scenario A: Mild Condition Walkthrough**
   - Navigate to `http://localhost:5173`. Check acknowledgment and click **Start Preliminary Assessment**.
   - Click quick-reply: **"Persistent headache"**.
   - Reply: **"Started yesterday morning, about a 3 out of 10"**.
   - Select age: **"Adult (18-64)"**.
   - Answer the 3 safety checklist questions: click **"No, neither"** and **"No"**.
   - When **"Preliminary Symptom Report Ready"** appears, click **View Assessment Report**.
   - Review the generated care level (**Routine Medical Evaluation** or **Self-Care & Monitoring**), "What You Reported", clinician questions, and click **Print / PDF**.

2. **Scenario B: Emergency Trigger Demonstration**
   - Click **Start New**.
   - In the chat box, type: **"I have sudden crushing chest pain and I cannot breathe"**.
   - **Result:** The system triggers an **Immediate Emergency Notice** without calling an external LLM, displays the tap-to-call 911 banner, and immediately unlocks the emergency report summary.

3. **Scenario C: Correction & Disputed Match**
   - In the chat window, click **Edit Answers**.
   - Modify your reported severity or dispute a flagged red flag ("This does not apply to me").
   - Click **Save & Re-evaluate** to see safety recalculation in real time.

---

## 9. Privacy & Security Behavior

- **No Persistent Data:** Zero database tables, zero user tracking accounts, and zero cookies.
- **In-Memory Retention:** Sessions expire automatically after 30 minutes of inactivity and are completely wiped when the process restarts.
- **Token Security:** Bearer tokens are kept in browser React memory; tokens are hashed using SHA-256 on the server.
- **Network Boundaries:** Live mode sends messages to the configured OpenAI-compatible LLM provider; mock mode executes 100% locally on your machine.
- **Input Sanitization:** Rejects inputs > 1000 characters or whitespace-only; neutralizes prompt-injection attempts.

---

## 10. Presentation Outline

- **1. The Problem:** Patients often struggle to articulate symptom timelines and severity, leading to inefficient clinical encounters or delayed care.
- **2. The Solution:** An educational, conversational triage navigation prototype that guides patients through structured symptom exploration.
- **3. Architecture:** A dual-engine design combining an adaptive conversational agent with an independent, non-overridable deterministic safety engine.
- **4. Deterministic Safety Engine:** Pure-Python regex and fact-based rules with immediate emergency bypass, negation detection, and historical parsing.
- **5. Conversational Agent:** Deterministic mock mode (zero cost/offline) and OpenAI-compatible live provider with strict schema validation and 1-turn repair.
- **6. Structured Report Generator:** Un-hallucinated report templates with explicit care level, clinician questions, and HTTP 409 readiness gates.
- **7. Failure Handling & Privacy:** Safe fallbacks during API outages, in-memory ephemeral sessions, and zero browser storage leaks.
- **8. Live Demonstration:** Walkthrough of routine assessment, acute emergency bypass, and answer correction.
- **9. Clinical Limitations:** Transparent disclosure that demonstration rules require licensed clinical panel review prior to any real-world patient use.
