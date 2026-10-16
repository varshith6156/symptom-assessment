import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

export default function EmergencyBanner({ emergencyNumber = '911', emergencyRegion = 'US / Canada', lang = 'en' }) {
  const getBannerText = () => {
    if (lang === 'hi') {
      return (
        <span>
          <strong className="font-semibold text-rose-700">चिकित्सा आपातकालीन सूचना:</strong> यदि आपको सीने में दर्द, सांस लेने में गंभीर कठिनाई, स्ट्रोक के लक्षण या अत्यधिक रक्तस्राव हो रहा है, तो तुरंत आपातकालीन सहायता लें।
        </span>
      );
    }
    if (lang === 'te') {
      return (
        <span>
          <strong className="font-semibold text-rose-700">వైద్య అత్యవసర నోటీసు:</strong> మీకు ఛాతీ నొప్పి, తీవ్రమైన శ్వాస ఆడకపోవడం, పక్షవాతం లక్షణాలు లేదా అధిక రక్తస్రావం ఉంటే, వెంటనే అత్యవసర వైద్య సంరక్షణను పొందండి.
        </span>
      );
    }
    return (
      <span>
        <strong className="font-semibold text-rose-700">Medical Emergency Notice:</strong> If you are experiencing chest pain, severe shortness of breath, stroke symptoms, or sudden severe bleeding, seek emergency care immediately.
      </span>
    );
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2.5 shadow-sm text-sm"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {getBannerText()}
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
