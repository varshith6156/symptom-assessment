import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Cpu,
  AlertTriangle,
  ArrowLeft,
  PhoneCall,
  CheckCircle,
} from 'lucide-react';
import EmergencyBanner from '../components/EmergencyBanner';

export default function Safety() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <EmergencyBanner />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <div className="space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assessment</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Safety, Limitations & Privacy Architecture
          </h1>
          <p className="text-sm text-slate-600">
            Detailed disclosure of design principles, safety mechanisms, and prototype boundaries.
          </p>
        </div>

        {/* Section 1: Non-Negotiable Boundaries */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-rose-700 font-bold text-lg">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <h2>Non-Negotiable Medical Boundaries</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
            <p>
              Med+Care is developed strictly as an <strong>educational healthcare-navigation prototype</strong>. It is not an FDA-cleared, CE-marked, or clinically validated medical device.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 pl-1">
              <li>
                <strong>No Medical Diagnosis:</strong> The system will never declare that you have a specific illness, disease, or medical condition.
              </li>
              <li>
                <strong>No Prescription or Dosage Advice:</strong> The tool will never prescribe, recommend, or adjust prescription drugs, over-the-counter medications, or supplements.
              </li>
              <li>
                <strong>No Reassurances of Safety:</strong> The absence of detected emergency flags does not mean that your condition is minor or that professional medical care is unnecessary.
              </li>
              <li>
                <strong>Rule Engine Urgency Priority:</strong> The underlying Large Language Model is strictly prohibited from overriding or lowering urgency ratings determined by the deterministic rule engine.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Deterministic Safety Engine & Clinical Review Status */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-amber-700 font-bold text-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h2>Deterministic Safety Engine & Clinical Review Status</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
            <p>
              The safety engine operates independently from any generative AI component. Every user message is evaluated by deterministic regex patterns and rule criteria before and after any model interaction.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <strong>Honest Clinical Review Disclosure:</strong>
              <p>
                The red-flag rules, fever thresholds, and checklist items in this software are <em>demonstration rules created for engineering prototyping</em>. They have not been reviewed, approved, or audited by a licensed clinical panel and must NOT be used for real-world patient triage or acute diagnosis.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Privacy, Data Retention & External AI Processing */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-teal-800 font-bold text-lg">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <h2>Data Privacy & Storage Limitations</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
            <p>
              This application has been architected with data minimization:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 pl-1">
              <li>
                <strong>No Accounts or Tracking:</strong> No name, email address, physical address, or phone number is collected. No third-party marketing analytics or tracking cookies are utilized.
              </li>
              <li>
                <strong>Temporary In-Memory Sessions:</strong> Assessments exist only in server memory with a 30-minute inactivity timeout. Sessions are not persisted to a database and are completely deleted when you click "Restart" or when the backend server restarts.
              </li>
              <li>
                <strong>Client Security:</strong> Per-session access tokens are stored strictly in browser memory (React state) and are not written to persistent browser localStorage or cookies.
              </li>
              <li>
                <strong>External LLM Transmission (Live Mode):</strong> When configured in Live mode, conversation messages are sent to the configured OpenAI-compatible API endpoint. Retention on that external provider depends on the API provider's enterprise privacy settings.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Verified Emergency & Crisis Contacts */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-slate-800 font-bold text-lg">
            <PhoneCall className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <h2>Emergency & Crisis Resources</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed">
            <p>
              If you or someone near you is in distress or experiencing acute symptoms, connect directly with established public emergency services:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong>United States & Canada</strong>
                <p>• Medical / Life Emergency: <strong>911</strong></p>
                <p>• Suicide & Crisis Lifeline: <strong>988</strong> (Call or Text)</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong>United Kingdom</strong>
                <p>• Emergency: <strong>999</strong></p>
                <p>• Non-Emergency Health: <strong>111</strong></p>
                <p>• Crisis Text Line: Text <strong>SHOUT</strong> to 85258</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 sm:col-span-2">
                <strong>European Union & Global</strong>
                <p>• European Emergency Number: <strong>112</strong></p>
                <p>• In any region: Contact your nearest accredited hospital emergency department.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
