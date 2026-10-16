import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Edit3, AlertCircle, Loader2, FileText, Mic, MicOff } from 'lucide-react';
import MessageBubble from './MessageBubble';
import QuickReplies from './QuickReplies';
import SeveritySlider from './SeveritySlider';

export default function ChatWindow({
  messages = [],
  quickReplies = [],
  isLoading = false,
  error = null,
  onSendMessage,
  onEditClick,
  onRestartClick,
  onViewReportClick,
  readyForReport = false,
  escalated = false,
  facts = {},
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Voice speech-to-text setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickReply = (reply) => {
    if (isLoading) return;
    onSendMessage(reply);
  };

  const shouldShowSeverity = facts && facts.severity === undefined && !readyForReport && !escalated;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden my-3">
      {/* Chat Header Toolbar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-700">Adaptive Clinical Interview</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            title="Review or correct collected symptom details"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-600" />
            <span>Edit Answers</span>
          </button>
          <button
            type="button"
            onClick={onRestartClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            title="Clear and restart assessment"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Processing your response...</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="my-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => onSendMessage(messages[messages.length - 1]?.content || 'retry')}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded font-semibold text-[11px] text-amber-900"
            >
              Retry
            </button>
          </div>
        )}

        {readyForReport && (
          <div className="my-4 p-4 bg-teal-50 border-2 border-teal-500 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-teal-950 shadow-sm animate-in fade-in">
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-bold text-sm sm:text-base text-teal-900 flex items-center gap-1.5 justify-center sm:justify-start">
                <FileText className="w-5 h-5 text-teal-700" />
                <span>Preliminary Symptom Report Ready</span>
              </div>
              <p className="text-xs text-teal-800">
                All symptom details and safety checklist items have been recorded into your structured summary.
              </p>
            </div>
            <button
              type="button"
              onClick={onViewReportClick}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex-shrink-0"
            >
              View Assessment Report &rarr;
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Controls & Input Area */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2">
        {/* Severity rating quick-picker when asking about severity */}
        {shouldShowSeverity && (
          <SeveritySlider onSelect={handleQuickReply} disabled={isLoading || escalated} />
        )}

        {/* Quick-reply chip buttons */}
        <QuickReplies replies={quickReplies} onSelect={handleQuickReply} disabled={isLoading} />

        {/* Text Input Box with Voice Mic */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 1000))}
              placeholder={
                isListening
                  ? 'Listening... speak clearly into your microphone'
                  : escalated
                  ? 'Emergency triggered. Please call emergency services immediately.'
                  : 'Describe your symptoms or answer the question above...'
              }
              disabled={isLoading || escalated}
              className={`w-full px-4 py-2.5 bg-white border ${
                isListening ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300'
              } rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed pr-20`}
            />
            {inputText.length > 800 && (
              <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">
                {inputText.length}/1000
              </span>
            )}
          </div>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isLoading || escalated}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
            } focus:outline-none focus:ring-2 focus:ring-rose-500 flex-shrink-0`}
            title={isListening ? "Stop listening" : "Click to speak your symptoms"}
            aria-label="Voice input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || escalated}
            className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
