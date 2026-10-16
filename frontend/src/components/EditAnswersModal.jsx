import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

export default function EditAnswersModal({
  isOpen,
  onClose,
  facts = {},
  warningSigns = [],
  onSave,
  escalated = false,
}) {
  const [formData, setFormData] = useState({
    chief_complaint: '',
    onset: '',
    severity: 5,
    age_group: 'adult',
    worsening_status: 'unchanged',
  });
  const [disputedRule, setDisputedRule] = useState('');
  const [clearEscalation, setClearEscalation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (facts) {
      setFormData({
        chief_complaint: facts.chief_complaint || '',
        onset: facts.onset || '',
        severity: facts.severity ?? 5,
        age_group: facts.age_group || 'adult',
        worsening_status: facts.worsening_status || 'unchanged',
      });
    }
  }, [facts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(
        {
          chief_complaint: formData.chief_complaint.trim() || null,
          onset: formData.onset.trim() || null,
          severity: Number(formData.severity),
          age_group: formData.age_group,
          worsening_status: formData.worsening_status,
        },
        disputedRule || null,
        clearEscalation
      );
      onClose();
    } catch {
      // Handled by parent hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 id="edit-modal-title" className="text-lg font-bold text-slate-800">
            Review & Edit Your Reported Answers
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chief Symptom / Concern
            </label>
            <input
              type="text"
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Mild headache, sore throat"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                When Did It Start?
              </label>
              <input
                type="text"
                value={formData.onset}
                onChange={(e) => setFormData({ ...formData, onset: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. Yesterday morning"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Severity (0 to 10): {formData.severity}
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full accent-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age Group
              </label>
              <select
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="adult">Adult (18-64)</option>
                <option value="older_adult">Older Adult (65+)</option>
                <option value="child">Child (2-17)</option>
                <option value="infant">Infant (&lt; 1 year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Progression
              </label>
              <select
                value={formData.worsening_status}
                onChange={(e) => setFormData({ ...formData, worsening_status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="unchanged">About the same</option>
                <option value="improving">Improving</option>
                <option value="worsening">Getting worse</option>
                <option value="fluctuating">Fluctuating</option>
              </select>
            </div>
          </div>

          {/* Dispute Red Flag Section */}
          {warningSigns.some((w) => w.status === 'present') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Dispute a Triggered Warning Sign</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                If the automated engine matched a phrase that does not apply to you (for example, historical mention or someone else), select it below to mark it as disputed and re-evaluate safety:
              </p>
              <select
                value={disputedRule}
                onChange={(e) => setDisputedRule(e.target.value)}
                className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Select a warning sign to dispute --</option>
                {warningSigns
                  .filter((w) => w.status === 'present')
                  .map((w) => (
                    <option key={w.rule_id} value={w.rule_id}>
                      {w.label} ({w.rule_id})
                    </option>
                  ))}
              </select>

              {escalated && disputedRule && (
                <label className="flex items-center gap-2 text-xs text-amber-900 pt-1">
                  <input
                    type="checkbox"
                    checked={clearEscalation}
                    onChange={(e) => setClearEscalation(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Re-evaluate and clear emergency escalation if this was the sole trigger</span>
                </label>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Save & Re-evaluate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
