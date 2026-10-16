import React, { useState } from 'react';
import { AlertTriangle, Bot, User, Volume2, VolumeX } from 'lucide-react';

export default function MessageBubble({ message }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isUser = message.role === 'user';
  const isEmergency = message.emergency;

  const formattedTime = new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (isEmergency) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="my-4 p-4 sm:p-5 bg-rose-50 border-2 border-rose-500 rounded-2xl shadow-sm text-rose-950 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700 font-bold text-base sm:text-lg">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 animate-bounce" />
            <span>Immediate Emergency Notice</span>
          </div>
          <button
            type="button"
            onClick={handleSpeak}
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
            title={isSpeaking ? "Stop speaking" : "Read aloud"}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-2 font-medium">
          {message.content}
        </div>
        <div className="text-xs text-rose-700 font-semibold pt-2 border-t border-rose-200">
          This system cannot evaluate emergencies. Do not wait for online messages — seek emergency care immediately.
        </div>
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      className={`flex items-start gap-3 my-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold shadow-sm ${
          isUser ? 'bg-slate-700' : 'bg-teal-600'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-1`}>
        <div
          className={`p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all relative group ${
            isUser
              ? 'bg-slate-800 text-white rounded-tr-none'
              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
          }`}
        >
          <div className="whitespace-pre-line">{message.content}</div>

          {!isUser && (
            <button
              type="button"
              onClick={handleSpeak}
              className="absolute right-2 bottom-2 text-slate-400 hover:text-teal-600 opacity-60 group-hover:opacity-100 transition-opacity p-1"
              title={isSpeaking ? "Stop audio" : "Read question aloud"}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-teal-600 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
        <div
          className={`text-[10px] text-slate-400 px-1 font-medium ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
