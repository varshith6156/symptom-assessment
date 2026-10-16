import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, Info } from 'lucide-react';
import Landing from './pages/Landing';
import Assessment from './pages/Assessment';
import Results from './pages/Results';
import Safety from './pages/Safety';
import { useAssessment } from './hooks/useAssessment';

export default function App() {
  const assessmentHook = useAssessment();
  const [isStarting, setIsStarting] = useState(false);

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
                  Preliminary Symptom Assessment
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
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
                />
              }
            />
            <Route
              path="/assessment"
              element={<Assessment assessmentHook={assessmentHook} />}
            />
            <Route
              path="/results"
              element={<Results assessmentHook={assessmentHook} />}
            />
            <Route path="/safety" element={<Safety />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
