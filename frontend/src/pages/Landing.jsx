import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Info,
  HeartPulse,
} from 'lucide-react';
import { api } from '../api/client';
import EmergencyBanner from '../components/EmergencyBanner';

export default function Landing({ onStartAssessment, isStarting = false }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [health, setHealth] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch(() => setHealth({ mode: 'mock', status: 'offline' }));
  }, []);

  const handleStart = async () => {
    if (!acknowledged) return;
    await onStartAssessment();
    navigate('/assessment');
  };

  const isMockMode = health?.mode === 'mock';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <EmergencyBanner />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Header / Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          {/* Mode Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 shadow-2xs">
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            <span>AI Provider Mode:</span>
            {isMockMode ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                Deterministic Demo / Mock Mode
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Live External AI Provider
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            AI-Powered Preliminary <span className="text-teal-600">Symptom Assessment</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            An educational healthcare-navigation prototype designed to help you describe symptoms in natural language, answer adaptive follow-up questions, recognize potential warning signs, and organize details for your clinician.
          </p>
        </div>

        {/* Prominent Educational Prototype Notice */}
        <div className="p-5 sm:p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl text-amber-950 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2.5 font-bold text-amber-900 text-base">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Strict Educational Prototype Notice</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">
            This tool is an <strong>educational prototype and is not clinically validated</strong>. It is designed solely to demonstrate how patients can organize their symptom timeline and prepare for a medical visit. It does not provide medical diagnoses, triage certifications, or treatment prescriptions.
          </p>
        </div>

        {/* 2-Column Feature & Boundary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What the tool DOES */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span>What Med+Care Does</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span>Collects your symptom description using conversational follow-up questions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span>Scans every message with an independent, deterministic safety engine for potential red flags.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span>Guides you through an explicit warning-sign safety checklist.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span>Generates an un-hallucinated, structured report you can print or export for your doctor.</span>
              </li>
            </ul>
          </div>

          {/* Non-Negotiable Boundaries */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>What Med+Care NEVER Does</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span><strong>Never diagnoses</strong>: It will never declare what disease you probably have.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span><strong>Never prescribes</strong>: No medication, dosage, or supplement recommendations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span><strong>Never guarantees safety</strong>: "No red flags reported" is not proof of health.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span><strong>Safety override protection</strong>: The AI model can never reduce urgency below the rule engine.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Temporary Storage and Privacy Notice */}
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Lock className="w-4 h-4 text-teal-700" />
            <span>Temporary In-Memory Storage & AI Processing Notice</span>
          </div>
          <p>
            Assessments are stored temporarily in server memory for 30 minutes and are completely wiped when restarting or shutting down. No personal account, email, or database record is created.
          </p>
          <p>
            {isMockMode
              ? "In Demo/Mock mode, all processing runs locally on your server without calling external AI providers."
              : "In Live mode, symptom messages are transmitted securely to the configured external OpenAI-compatible LLM endpoint for question planning."}
          </p>
        </div>

        {/* Mandatory Acknowledgement & Start Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-teal-600 shadow-md space-y-6 max-w-2xl mx-auto">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-5 h-5 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              I understand that <strong>Med+Care is an educational prototype and not a diagnostic tool or medical device</strong>. I agree that this preliminary assessment is for navigation and discussion purposes only, and does not replace evaluation by a qualified medical professional.
            </span>
          </label>

          <button
            type="button"
            disabled={!acknowledged || isStarting}
            onClick={handleStart}
            className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-teal-500/30 active:scale-[0.99]"
          >
            <span>{isStarting ? 'Initializing Session...' : 'Start Preliminary Assessment'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="text-center text-xs text-slate-400">
            <Link to="/safety" className="text-teal-700 hover:text-teal-900 underline font-semibold">
              Read Safety & Privacy Details
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
