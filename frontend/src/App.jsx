import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, BarChart3, Globe } from 'lucide-react';
import Landing from './pages/Landing';
import Assessment from './pages/Assessment';
import Results from './pages/Results';
import Safety from './pages/Safety';
import EvaluationModal from './components/EvaluationModal';
import { useAssessment } from './hooks/useAssessment';

export default function App() {
  const assessmentHook = useAssessment();
  const [isStarting, setIsStarting] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en'); // 'en', 'hi', 'te'

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await assessmentHook.startAssessment();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Navigation Header */}
        <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-700 transition-colors">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  Med<span className="text-teal-600">+</span>Care
                </span>
                <span className="block text-[10px] text-slate-400 font-medium leading-none">
                  {currentLang === 'hi'
                    ? 'प्रारंभिक लक्षण मूल्यांकन'
                    : currentLang === 'te'
                    ? 'ప్రాథమిక లక్షణాల అంచనా'
                    : 'Preliminary Symptom Assessment'}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                <Globe className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <button
                  type="button"
                  onClick={() => setCurrentLang('en')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    currentLang === 'en' ? 'bg-white shadow-2xs text-teal-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLang('hi')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    currentLang === 'hi' ? 'bg-white shadow-2xs text-teal-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="हिंदी (Hindi)"
                >
                  हिं
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLang('te')}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    currentLang === 'te' ? 'bg-white shadow-2xs text-teal-800' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="తెలుగు (Telugu)"
                >
                  తె
                </button>
              </div>

              {/* Evaluation Audit Button */}
              <button
                type="button"
                onClick={() => setIsAuditOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="View evaluated safety metrics across 40 test cases"
              >
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Safety Audit (40 Cases)</span>
              </button>

              <Link
                to="/safety"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span>Safety & Limits</span>
              </Link>

              {assessmentHook.session && (
                <Link
                  to="/assessment"
                  className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-lg hover:bg-teal-100 transition-colors"
                >
                  Active Session
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Routed Pages */}
        <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <Landing
                  onStartAssessment={handleStart}
                  isStarting={isStarting}
                  lang={currentLang}
                />
              }
            />
            <Route
              path="/assessment"
              element={<Assessment assessmentHook={assessmentHook} lang={currentLang} />}
            />
            <Route
              path="/results"
              element={<Results assessmentHook={assessmentHook} lang={currentLang} />}
            />
            <Route path="/safety" element={<Safety lang={currentLang} />} />
          </Routes>
        </div>

        {/* Evaluation Scorecard Modal */}
        <EvaluationModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      </div>
    </Router>
  );
}
