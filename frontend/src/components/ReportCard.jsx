import React, { useState } from 'react';
import {
  AlertTriangle,
  Printer,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  MapPin,
  Copy,
  Check,
  FileCheck,
  Activity,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function ReportCard({ report, onRestart }) {
  const [copiedSbar, setCopiedSbar] = useState(false);

  if (!report) return null;

  const {
    recommended_care_level,
    recommended_care_label,
    recommendation_reasons = [],
    reported_facts = {},
    warning_sign_status = {},
    missing_information = [],
    suggested_next_steps = [],
    clinician_questions = [],
    fixed_limitations = [],
    protocol_used,
    contributing_factors = [],
    counterfactuals = [],
    uncertainty_rating,
    uncertainty_reasons = [],
    doctor_summary_sbar,
    generated_at,
    ruleset_version,
  } = report;

  // Care level theme styling
  const getCareTheme = (level) => {
    switch (level) {
      case 3: // EMERGENCY
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-500',
          badge: 'bg-rose-600 text-white',
          text: 'text-rose-950',
          icon: ShieldAlert,
          mapQuery: 'emergency+department+near+me',
          mapLabel: 'Find Nearest Emergency Department (Maps)',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 2: // URGENT
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-500',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-950',
          icon: AlertTriangle,
          mapQuery: 'urgent+care+clinic+near+me',
          mapLabel: 'Find Urgent Care Clinics Near Me (Maps)',
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 1: // ROUTINE
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          badge: 'bg-blue-600 text-white',
          text: 'text-blue-950',
          icon: Activity,
          mapQuery: 'general+physician+clinic+near+me',
          mapLabel: 'Find Primary Care Clinics Near Me (Maps)',
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 0: // SELF_CARE
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-500',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-950',
          icon: CheckCircle,
          mapQuery: 'pharmacy+near+me',
          mapLabel: 'Find Nearby Pharmacies (Maps)',
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
    }
  };

  const theme = getCareTheme(recommended_care_level);
  const CareIcon = theme.icon;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(report, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `symptom-report-${report.session_id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopySbar = () => {
    if (!doctor_summary_sbar) return;
    const text = `PATIENT CLINICAL SUMMARY (SBAR FORMAT)\n\nSITUATION: ${doctor_summary_sbar.situation}\nBACKGROUND: ${doctor_summary_sbar.background}\nASSESSMENT: ${doctor_summary_sbar.assessment}\nREQUEST: ${doctor_summary_sbar.request}`;
    navigator.clipboard.writeText(text);
    setCopiedSbar(true);
    setTimeout(() => setCopiedSbar(false), 2000);
  };

  return (
    <div className="report-container max-w-4xl mx-auto my-6 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10 space-y-8">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-teal-700 uppercase">
            Structured Patient-Clinician Summary
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Preliminary Symptom Assessment Report
          </h1>
          {protocol_used && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-0.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Protocol: {protocol_used}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors focus:ring-2 focus:ring-slate-400"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors focus:ring-2 focus:ring-slate-400"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm focus:ring-2 focus:ring-teal-500"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New</span>
          </button>
        </div>
      </div>

      {/* Prominent Educational Notice */}
      <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-700 leading-relaxed">
        <strong>EDUCATIONAL PROTOTYPE REPORT:</strong> This summary was produced by an automated prototype for navigation and clinician discussion purposes. It is not clinically validated, not a diagnosis, and not medical advice.
      </div>

      {/* 1. Recommended Level of Care Banner */}
      <div className={`p-6 rounded-3xl border-2 ${theme.border} ${theme.bg} ${theme.text} space-y-4`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <CareIcon className="w-7 h-7 flex-shrink-0" />
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                System Recommendation
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                {recommended_care_label}
              </h2>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${theme.badge}`}>
            Level {recommended_care_level}
          </span>
        </div>

        {/* Action Button: Google Maps Link (Zero API key required) */}
        <div className="pt-2 no-print">
          <a
            href={`https://www.google.com/maps/search/${theme.mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.btnClass}`}
          >
            <MapPin className="w-4 h-4" />
            <span>{theme.mapLabel} &rarr;</span>
          </a>
        </div>
      </div>

      {/* 2. "Why this recommendation" Explanation Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-bold text-base">
          <Info className="w-5 h-5 text-teal-600" />
          <h2>Why This Recommendation (Safety Reasoning & Contributing Factors)</h2>
        </div>

        {/* Contributing Factors */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Contributing Clinical Factors:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {contributing_factors.map((cf, idx) => (
              <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold">{cf.factor}</span>
                <p className="font-bold text-slate-800 text-sm">{cf.value}</p>
                <p className="text-[11px] text-teal-700 font-medium">{cf.weight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Counterfactual Simulation: "What would change this recommendation?" */}
        {counterfactuals.length > 0 && (
          <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ArrowRight className="w-4 h-4 text-teal-600" />
              <span>Counterfactual Sensitivity: What would change this result?</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              {counterfactuals.map((cf, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>
                    <strong>{cf.condition}</strong> &rarr; <span className="text-slate-800 font-medium">{cf.recommendation_shift}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Uncertainty & Completeness Display */}
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-teal-900">
              Information Completeness & Uncertainty Rating:
            </span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
              {uncertainty_rating || 'Moderate'}
            </span>
          </div>
          {uncertainty_reasons.length > 0 ? (
            <ul className="list-disc list-inside text-xs text-teal-800 space-y-1">
              {uncertainty_reasons.map((ur, idx) => (
                <li key={idx}>{ur}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-teal-800">
              All core symptom facts and safety screening checklist items were fully completed.
            </p>
          )}
        </div>
      </div>

      {/* 3. Structured Doctor Handover Card (SBAR Format) */}
      {doctor_summary_sbar && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-700">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Clinician Handover Briefing
              </span>
              <h2 className="text-lg font-extrabold text-white">
                SBAR Summary for Doctor Consultation
              </h2>
            </div>
            <button
              type="button"
              onClick={handleCopySbar}
              className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-600 transition-colors"
            >
              {copiedSbar ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy SBAR</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-300">
            <p>
              <strong className="text-teal-400 font-bold uppercase tracking-wider text-xs block mb-0.5">Situation:</strong>
              {doctor_summary_sbar.situation}
            </p>
            <p>
              <strong className="text-teal-400 font-bold uppercase tracking-wider text-xs block mb-0.5">Background:</strong>
              {doctor_summary_sbar.background}
            </p>
            <p>
              <strong className="text-teal-400 font-bold uppercase tracking-wider text-xs block mb-0.5">Assessment:</strong>
              {doctor_summary_sbar.assessment}
            </p>
            <p>
              <strong className="text-teal-400 font-bold uppercase tracking-wider text-xs block mb-0.5">Request:</strong>
              {doctor_summary_sbar.request}
            </p>
          </div>
        </div>
      )}

      {/* 4. Separate "You Reported" Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <FileCheck className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900">What You Reported</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Chief Complaint</span>
            <p className="text-sm font-bold text-slate-800">
              {reported_facts.chief_complaint || 'Not specified'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Onset & Duration</span>
            <p className="text-sm font-bold text-slate-800">
              {reported_facts.onset || 'Unknown onset'} ({reported_facts.duration || 'duration unstated'})
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Reported Severity</span>
            <p className="text-sm font-bold text-slate-800">
              {reported_facts.severity !== null && reported_facts.severity !== undefined
                ? `${reported_facts.severity} / 10`
                : 'Not rated'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Age Group</span>
            <p className="text-sm font-bold text-slate-800 capitalize">
              {reported_facts.age_group ? reported_facts.age_group.replace('_', ' ') : 'Not stated'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Progression</span>
            <p className="text-sm font-bold text-slate-800 capitalize">
              {reported_facts.worsening_status || 'Unchanged'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase">Known Conditions / Allergies</span>
            <p className="text-sm font-bold text-slate-800">
              {reported_facts.relevant_conditions?.length > 0
                ? reported_facts.relevant_conditions.join(', ')
                : 'None reported'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Warning Signs Checklist Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
          Demonstration Warning Sign Screening
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Present */}
          <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Reported Present ({warning_sign_status.present?.length || 0})</span>
            </div>
            {warning_sign_status.present?.length > 0 ? (
              <ul className="space-y-1.5 text-rose-900">
                {warning_sign_status.present.map((w, idx) => (
                  <li key={idx} className="p-2 bg-white rounded-lg border border-rose-200">
                    <strong>{w.label}</strong>
                    <div className="text-[11px] text-rose-700 italic">"{w.excerpt}"</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No acute warning signs reported present.</p>
            )}
          </div>

          {/* Explicitly Denied / Absent */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Explicitly Denied / Absent ({warning_sign_status.absent?.length || 0})</span>
            </div>
            {warning_sign_status.absent?.length > 0 ? (
              <ul className="space-y-1 text-emerald-900">
                {warning_sign_status.absent.map((w, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{w.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">None explicitly denied during interview.</p>
            )}
          </div>

          {/* Unknown / Uncertain */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Still Unknown or Unconfirmed ({warning_sign_status.unknown?.length || 0})</span>
            </div>
            {warning_sign_status.unknown?.length > 0 ? (
              <ul className="space-y-1 text-slate-600">
                {warning_sign_status.unknown.map((w, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>{w.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">All checklist items were evaluated.</p>
            )}
          </div>

          {/* Disputed */}
          {warning_sign_status.disputed?.length > 0 && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <XCircle className="w-4 h-4 text-amber-600" />
                <span>Disputed by User ({warning_sign_status.disputed.length})</span>
              </div>
              <ul className="space-y-1 text-amber-900">
                {warning_sign_status.disputed.map((w, idx) => (
                  <li key={idx}>
                    {w.label} — <em>Marked as "does not apply"</em>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 6. Questions for Your Clinician */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
          Questions to Take to a Clinician
        </h2>
        <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-2">
          <ul className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-teal-950">
            {clinician_questions.map((q, idx) => (
              <li key={idx} className="font-medium">
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7. Suggested Next Steps */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
          Suggested Next Steps
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
          {suggested_next_steps.map((step, idx) => (
            <li key={idx} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ul>
      </div>

      {/* 8. Missing Information & Limitations */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Missing Information & Clinical Limitations
        </h2>
        {missing_information.length > 0 && (
          <div className="text-xs text-slate-600">
            <strong>Uncollected Clinical Information:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {missing_information.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 space-y-1">
          {fixed_limitations.map((lim, idx) => (
            <p key={idx}>• {lim}</p>
          ))}
        </div>
      </div>

      {/* Footer Metadata */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <span>Session ID: {report.session_id}</span>
        <span>Generated: {new Date(generated_at).toLocaleString()}</span>
        <span>Ruleset: {ruleset_version}</span>
      </div>
    </div>
  );
}
