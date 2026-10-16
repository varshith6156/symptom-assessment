import React from 'react';
import {
  AlertTriangle,
  Printer,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Calendar,
  Clock,
  Activity,
  FileCheck,
} from 'lucide-react';

export default function ReportCard({ report, onRestart }) {
  if (!report) return null;

  const {
    recommended_care_level,
    recommended_care_label,
    recommendation_reasons = [],
    reported_facts = {},
    relevant_answers = [],
    warning_sign_status = {},
    missing_information = [],
    suggested_next_steps = [],
    clinician_questions = [],
    fixed_limitations = [],
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
        };
      case 2: // URGENT
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-500',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-950',
          icon: AlertTriangle,
        };
      case 1: // ROUTINE
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          badge: 'bg-blue-600 text-white',
          text: 'text-blue-950',
          icon: Activity,
        };
      case 0: // SELF_CARE
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-500',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-950',
          icon: CheckCircle,
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
      <div className={`p-6 rounded-3xl border-2 ${theme.border} ${theme.bg} ${theme.text} space-y-3`}>
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

        {/* Reasons */}
        <div className="pt-2 border-t border-slate-300/40 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider opacity-90">
            Assessment Rationale:
          </span>
          <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
            {recommendation_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2. Separate "You Reported" Section */}
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

      {/* 3. Warning Signs Checklist Breakdown */}
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

      {/* 4. Suggested Next Steps */}
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

      {/* 5. Questions for Your Clinician */}
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

      {/* 6. Missing Information & Limitations */}
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
