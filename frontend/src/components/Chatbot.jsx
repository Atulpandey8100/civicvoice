import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X } from 'lucide-react';
import api from '../utils/api';
import { useToast } from './Toast';

const SUGGESTIONS = [
  'How do I report an issue?',
  'What is CivicVoice?',
  'How does the AI priority work?',
  'What issues are trending?'
];

export default function Chatbot() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi! I'm CivicBot 👋 I can answer your questions about CivicVoice and the issues on the platform. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const { data } = await api.post('/chat', { message: text });
      setMessages((prev) => [...prev, { role: 'bot', text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: err.response?.data?.error || 'Sorry, I could not respond right now. Please try again.'
        }
      ]);
      toast({ variant: 'error', title: 'Chatbot error' });
    }
    setSending(false);
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'bot',
        text: "Hi! I'm CivicBot 👋 I can answer your questions about CivicVoice and the issues on the platform. What would you like to know?"
      }
    ]);
    setInput('');
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[1200] flex h-[540px] max-h-[80vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop sm:bottom-28 sm:right-6">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white" aria-hidden="true">
                <Bot size={18} />
              </span>
              <div>
                <h2 className="flex items-center gap-1 font-display text-sm font-bold tracking-tight text-ink">
                  CivicBot
                  <Sparkles size={12} className="text-accent" aria-hidden="true" />
                </h2>
                <p className="text-[11px] text-ink-soft">AI assistant · issues &amp; project</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'bot' ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-ink-soft'
                  }`}
                  aria-hidden="true"
                >
                  {m.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                </span>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'bot'
                      ? 'rounded-tl-sm border border-line bg-surface-2 text-ink'
                      : 'rounded-tr-sm bg-accent text-white'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
                  <Bot size={14} />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-line bg-surface-2 px-4 py-3 text-ink-soft">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-line bg-surface px-3 py-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  disabled={sending}
                  className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-60"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-line bg-surface-2 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about issues, reporting, officials…"
              aria-label="Ask CivicBot a question"
              maxLength={500}
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="btn btn-primary shrink-0 !px-3.5"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close CivicBot' : 'Open CivicBot'}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-[1200] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-pop transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      >
        {open ? <X size={22} aria-hidden="true" /> : <Bot size={24} aria-hidden="true" />}
      </button>
    </>
  );
}
