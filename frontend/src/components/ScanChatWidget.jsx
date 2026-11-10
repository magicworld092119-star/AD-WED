import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Brain, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { predictAPI } from '../services/apiService';

const SCAN_STARTER_QUESTIONS = [
  'Explain this result simply',
  'What do the heatmap colors mean?',
  'What should I ask my neurologist?'
];

const GENERAL_STARTER_QUESTIONS = [
  'How does AD-WEB analyze 3D MRI?',
  'What is Mild Cognitive Impairment?',
  'How can I lower dementia risk?'
];

function readStoredScanContext(userKey) {
  try {
    const raw = sessionStorage.getItem(`ad_active_scan_${userKey}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const pred = data?.prediction || data;
    const stage = pred?.predicted_stage;
    if (!stage) return null;
    const rawConf = pred?.confidence_score ?? pred?.confidence ?? 0;
    const confidence = rawConf > 1 ? Number(rawConf).toFixed(1) : (Number(rawConf) * 100).toFixed(1);
    let viewer = null;
    try {
      const vRaw = sessionStorage.getItem('ad_live_viewer_context');
      if (vRaw) viewer = JSON.parse(vRaw);
    } catch (e) {}
    return {
      prediction_id: pred?.prediction_id || pred?.id || data?.patientId || null,
      stage,
      confidence: Number(confidence),
      probabilities: pred?.probabilities || {},
      viewer
    };
  } catch (e) {
    return null;
  }
}

/**
 * Global floating bottom-right AI chatbot widget working across all AD-WEB pages.
 * Automatically becomes scan-aware whenever an MRI prediction is active.
 */
export default function ScanChatWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const userKey = user?.id || user?.email || 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [scanContext, setScanContext] = useState(() => readStoredScanContext(userKey));
  const endRef = useRef(null);

  // Sync active scan context on route/user change and live Dashboard viewer events
  useEffect(() => {
    setScanContext(readStoredScanContext(userKey));
  }, [location.pathname, userKey]);

  useEffect(() => {
    const handleContextUpdate = (e) => {
      if (e?.detail) {
        setScanContext(e.detail);
      } else {
        setScanContext(readStoredScanContext(userKey));
      }
    };
    window.addEventListener('ad-scan-context-update', handleContextUpdate);
    return () => window.removeEventListener('ad-scan-context-update', handleContextUpdate);
  }, [userKey]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending]);

  const hasScan = Boolean(scanContext?.stage);
  const starterQuestions = hasScan ? SCAN_STARTER_QUESTIONS : GENERAL_STARTER_QUESTIONS;

  const sendMessage = async (textOverride = null) => {
    const text = (textOverride ?? input).trim();
    if (!text || isSending) return;

    const latestScan = readStoredScanContext(userKey) || scanContext || {};
    const nextMessages = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    if (!textOverride) setInput('');
    setIsSending(true);

    try {
      const data = await predictAPI.chatAboutScan({
        message: text,
        history: messages.slice(-8),
        scan_context: {
          ...latestScan,
          page: location.pathname
        }
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data?.reply || 'Sorry, I could not generate a response right now.' }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to reach the assistant right now. Please check that the backend server is running and try again.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[375px] bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">AD-WEB AI Assistant</p>
                <p className="text-[10px] text-orange-50/90 truncate">
                  {hasScan ? scanContext.stage : 'Brain MRI & Alzheimer’s Guide'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="p-3.5 space-y-2.5 max-h-[340px] min-h-[220px] overflow-y-auto bg-orange-50/20 dark:bg-slate-950/40 text-xs">
            <div className="bg-white dark:bg-slate-800/90 border border-orange-100 dark:border-slate-700 rounded-2xl rounded-tl-sm p-3 text-slate-700 dark:text-slate-200 leading-relaxed shadow-2xs">
              {hasScan ? (
                <>
                  Ask me anything about your <strong>{scanContext.stage}</strong> result, the 3D heatmap, or questions for your neurologist.
                </>
              ) : (
                <>
                  Ask me anything about Alzheimer&apos;s stages, brain health, or how to upload and analyze a 3D MRI scan.
                </>
              )}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {starterQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-slate-700 transition-colors cursor-pointer text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-sm shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                  <span className="text-[11px]">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-orange-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasScan ? 'Ask about this scan...' : 'Ask about AD-WEB or MRI...'}
                disabled={isSending}
                className="flex-1 px-3 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-orange-400"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isSending}
                className="p-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9.5px] text-center text-slate-400 dark:text-slate-500">
              Informational aid only — not a medical diagnosis.
            </p>
          </div>
        </div>
      )}

      {/* Floating Launcher Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-xl shadow-orange-500/30 transition-all active:scale-95 cursor-pointer border border-orange-300/40"
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        <span>{isOpen ? 'Close Chat' : 'Ask AI'}</span>
      </button>
    </div>
  );
}
