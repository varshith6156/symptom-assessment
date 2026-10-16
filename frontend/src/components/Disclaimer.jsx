import React from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Disclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="text-center py-2 px-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
        <p>
          <strong>Educational Prototype:</strong> Not clinically validated. Preliminary guidance only, not a medical diagnosis. In an emergency, dial 911 or your local emergency services.{' '}
          <Link to="/safety" className="text-teal-700 underline font-medium hover:text-teal-800">
            Safety & Limitations
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
      <div className="flex items-center gap-2 text-slate-800 font-semibold">
        <Info className="w-4 h-4 text-teal-600" />
        <span>Educational Prototype Boundaries & Non-Negotiables</span>
      </div>
      <p>
        Med+Care is an educational healthcare-navigation prototype designed to help individuals describe symptoms, answer adaptive questions, recognize potential warning signs, and understand appropriate next steps.
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
        <li><strong>No Medical Diagnosis:</strong> This tool cannot determine medical conditions or illnesses.</li>
        <li><strong>No Prescriptions:</strong> This tool will never prescribe, recommend, or adjust medications.</li>
        <li><strong>No Safety Guarantee:</strong> Absence of reported warning signs does not ensure that you do not have a serious condition.</li>
        <li><strong>Clinician Review Needed:</strong> Safety screening rules are demonstration prototypes requiring formal clinical validation before real-world patient use.</li>
      </ul>
      <div className="pt-1 text-slate-500">
        <Link to="/safety" className="text-teal-700 underline font-medium hover:text-teal-900">
          Read full clinical disclaimers, external AI processing, and privacy details &rarr;
        </Link>
      </div>
    </div>
  );
}
