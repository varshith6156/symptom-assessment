import { useState, useCallback, useRef } from 'react';
import { api } from '../api/client';

export function useAssessment() {
  // Session authentication stored strictly in React memory
  const [session, setSession] = useState(null); // { sessionId, token, mode, emergencyNumber, emergencyRegion }
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [facts, setFacts] = useState({});
  const [warningSigns, setWarningSigns] = useState([]);
  const [progress, setProgress] = useState({
    stage: 'initial',
    questionNumber: 0,
    checklistStep: 0,
    checklistCompleted: false,
  });
  const [urgency, setUrgency] = useState(1);
  const [escalated, setEscalated] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [readyForReport, setReadyForReport] = useState(false);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prevent duplicate concurrent submissions
  const isSubmittingRef = useRef(false);

  const startAssessment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.createSession();
      setSession({
        sessionId: data.session_id,
        token: data.token,
        mode: data.mode,
        emergencyNumber: data.emergency_number,
        emergencyRegion: data.emergency_region,
      });

      // Initial assistant greeting
      const initialGreeting = {
        id: 'msg_0',
        role: 'assistant',
        content:
          "Hello. I am here to help you describe and organize your symptoms so you have a structured summary ready for a healthcare professional. " +
          "What is the primary symptom or physical concern you are experiencing today?",
        timestamp: new Date().toISOString(),
        emergency: false,
      };

      setMessages([initialGreeting]);
      setQuickReplies([
        "Persistent headache",
        "Chest tightness",
        "Shortness of breath",
        "Fever & body aches",
        "Stomach pain or nausea",
        "Skin rash or itchiness",
      ]);
      setFacts({});
      setWarningSigns([]);
      setProgress({
        stage: 'questionnaire',
        questionNumber: 1,
        checklistStep: 0,
        checklistCompleted: false,
      });
      setUrgency(1);
      setEscalated(false);
      setEmergencyDetails(null);
      setReadyForReport(false);
      setReport(null);
    } catch (err) {
      setError(err.message || 'Failed to start assessment session.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      const text = content.trim();
      if (!text) return;
      if (!session || !session.token) {
        setError('No active session. Please start a new assessment.');
        return;
      }
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Append user message to UI immediately
      const userMsg = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
        emergency: false,
      };
      setMessages((prev) => [...prev, userMsg]);
      setQuickReplies([]);

      try {
        const response = await api.sendMessage(session.sessionId, session.token, text);

        const assistantMsg = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: response.assistant_message,
          timestamp: new Date().toISOString(),
          emergency: response.type === 'emergency',
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setQuickReplies(response.quick_replies || []);
        setFacts(response.facts || {});
        setWarningSigns(response.warning_signs || []);
        setProgress(response.progress || {});
        setUrgency(response.urgency_so_far);

        if (response.type === 'emergency') {
          setEscalated(true);
          setEmergencyDetails(response.emergency_details);
          setReadyForReport(true);
        } else if (response.type === 'ready_for_report') {
          setReadyForReport(true);
        }
      } catch (err) {
        // Preserve current messages on recoverable error
        setError(err.message || 'Unable to process your message. Please try again.');
      } finally {
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    },
    [session]
  );

  const updateFacts = useCallback(
    async (updates, disputedRuleId = null, clearEscalation = false) => {
      if (!session) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.updateFacts(
          session.sessionId,
          session.token,
          updates,
          disputedRuleId,
          clearEscalation
        );
        setFacts(response.facts || {});
        setWarningSigns(response.warning_signs || []);
        setUrgency(response.urgency_so_far);
        if (clearEscalation && !response.escalated) {
          setEscalated(false);
          setEmergencyDetails(null);
        }
        return response;
      } catch (err) {
        setError(err.message || 'Failed to update symptom details.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  const fetchReport = useCallback(async () => {
    if (!session) return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReport(session.sessionId, session.token);
      setReport(data);
      return data;
    } catch (err) {
      setError(err.message || 'Unable to generate report.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const restart = useCallback(async () => {
    if (session) {
      try {
        await api.deleteSession(session.sessionId, session.token);
      } catch {
        // Ignore deletion failures during reset
      }
    }
    setSession(null);
    setMessages([]);
    setQuickReplies([]);
    setFacts({});
    setWarningSigns([]);
    setProgress({
      stage: 'initial',
      questionNumber: 0,
      checklistStep: 0,
      checklistCompleted: false,
    });
    setUrgency(1);
    setEscalated(false);
    setEmergencyDetails(null);
    setReadyForReport(false);
    setReport(null);
    setError(null);
  }, [session]);

  return {
    session,
    messages,
    quickReplies,
    facts,
    warningSigns,
    progress,
    urgency,
    escalated,
    emergencyDetails,
    readyForReport,
    report,
    isLoading,
    error,
    startAssessment,
    sendMessage,
    updateFacts,
    fetchReport,
    restart,
  };
}
