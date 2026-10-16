import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export default function ProgressBar({ progress = {}, escalated = false }) {
  const { stage = 'questionnaire', questionNumber = 1, checklistStep = 0, checklistCompleted = false } = progress;

  // Compute stage status
  let currentStage = 1;
  let statusText = 'Collecting symptom details';

  if (escalated) {
    statusText = 'Emergency escalation triggered';
  } else if (checklistCompleted) {
    currentStage = 3;
    statusText = 'Safety screening completed — Summary ready';
  } else if (checklistStep > 0) {
    currentStage = 2;
    statusText = `Safety screening checklist (${checklistStep}/3 items)`;
  } else {
    currentStage = 1;
    statusText = `Symptom exploration (~${Math.min(questionNumber, 4)} questions completed)`;
  }

  const steps = [
    { id: 1, label: 'Symptom Details' },
    { id: 2, label: 'Safety Checklist' },
    { id: 3, label: 'Summary Report' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Stage Indicators */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium text-slate-600">
          {steps.map((step, idx) => {
            const isDone = currentStage > step.id || (step.id === 2 && checklistCompleted);
            const isCurrent = currentStage === step.id;
            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                <div className={`flex items-center gap-1.5 ${isCurrent ? 'text-teal-700 font-semibold' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  ) : isCurrent ? (
                    <Circle className="w-4 h-4 text-teal-600 fill-teal-100" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                  <span>{step.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Dynamic Approximate Progress Label */}
        <div className="text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          {escalated ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          )}
          <span>{statusText}</span>
        </div>
      </div>
    </div>
  );
}
