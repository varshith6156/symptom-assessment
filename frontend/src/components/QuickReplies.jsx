import React from 'react';

export default function QuickReplies({ replies = [], onSelect, disabled = false }) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="py-2 flex flex-wrap gap-2 items-center">
      <span className="text-xs font-medium text-slate-400 mr-1">Suggested replies:</span>
      {replies.map((reply, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-2xs font-medium"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
