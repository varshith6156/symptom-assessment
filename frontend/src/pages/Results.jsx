import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencyBanner from '../components/EmergencyBanner';
import ReportCard from '../components/ReportCard';
import Disclaimer from '../components/Disclaimer';

export default function Results({ assessmentHook }) {
  const { session, report, fetchReport, restart } = assessmentHook;
  const navigate = useNavigate();

  useEffect(() => {
    if (session && !report) {
      fetchReport().catch(() => {});
    }
  }, [session, report, fetchReport]);

  const handleRestart = async () => {
    await restart();
    navigate('/');
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Assessment Found</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Assessments are stored in temporary memory. Please start an assessment to view a summary report.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <div className="no-print">
        <EmergencyBanner
          emergencyNumber={session.emergencyNumber}
          emergencyRegion={session.emergencyRegion}
        />
      </div>

      <main className="flex-1 px-4 py-6">
        <ReportCard report={report} onRestart={handleRestart} />
      </main>

      <footer className="no-print mt-auto">
        <Disclaimer compact={true} />
      </footer>
    </div>
  );
}
