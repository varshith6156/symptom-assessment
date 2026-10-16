import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmergencyBanner from '../components/EmergencyBanner';
import ProgressBar from '../components/ProgressBar';
import ChatWindow from '../components/ChatWindow';
import Disclaimer from '../components/Disclaimer';
import EditAnswersModal from '../components/EditAnswersModal';

export default function Assessment({ assessmentHook }) {
  const {
    session,
    messages,
    quickReplies,
    facts,
    warningSigns,
    progress,
    urgency,
    escalated,
    readyForReport,
    isLoading,
    error,
    sendMessage,
    updateFacts,
    fetchReport,
    restart,
  } = assessmentHook;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const navigate = useNavigate();

  // If no session exists, prompt user to go to landing
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No Active Assessment Session</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Assessments are stored temporarily in memory. Please start a new preliminary symptom assessment from the home page.
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

  const handleViewReport = async () => {
    try {
      await fetchReport();
      navigate('/results');
    } catch {
      // Error handled by hook
    }
  };

  const handleConfirmRestart = async () => {
    await restart();
    setShowRestartConfirm(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Persistent Emergency Access */}
      <EmergencyBanner
        emergencyNumber={session.emergencyNumber}
        emergencyRegion={session.emergencyRegion}
      />

      {/* Approximate Progress Bar */}
      <ProgressBar progress={progress} escalated={escalated} />

      {/* Chat Window Container */}
      <main className="flex-1 px-4 max-w-5xl mx-auto w-full">
        <ChatWindow
          messages={messages}
          quickReplies={quickReplies}
          isLoading={isLoading}
          error={error}
          onSendMessage={sendMessage}
          onEditClick={() => setIsEditModalOpen(true)}
          onRestartClick={() => setShowRestartConfirm(true)}
          onViewReportClick={handleViewReport}
          readyForReport={readyForReport}
          escalated={escalated}
          facts={facts}
        />
      </main>

      {/* Persistent Limitations Notice */}
      <footer className="mt-auto">
        <Disclaimer compact={true} />
      </footer>

      {/* Edit Answers Modal */}
      <EditAnswersModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        facts={facts}
        warningSigns={warningSigns}
        onSave={updateFacts}
        escalated={escalated}
      />

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Restart Assessment?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Restarting will permanently clear your current conversation and symptom answers from server memory.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRestartConfirm(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Continue Assessment
              </button>
              <button
                type="button"
                onClick={handleConfirmRestart}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
