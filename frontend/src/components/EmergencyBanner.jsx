import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export default function EmergencyBanner({ emergencyNumber = '911', emergencyRegion = 'US / Canada' }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2.5 shadow-sm text-sm"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>
            <strong className="font-semibold text-rose-700">Medical Emergency Notice:</strong> If you are experiencing chest pain, severe shortness of breath, stroke symptoms, or sudden severe bleeding, seek emergency care immediately.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {emergencyNumber ? (
            <a
              href={`tel:${emergencyNumber.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call {emergencyNumber} ({emergencyRegion})</span>
            </a>
          ) : (
            <span className="font-semibold text-rose-700 text-xs">Call your local emergency number</span>
          )}
        </div>
      </div>
    </div>
  );
}
