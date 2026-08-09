import { useState } from 'react';
import { Mail, Send, Clock } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/Toast';

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/contact', form);
      toast({ variant: 'success', title: 'Message sent', description: data.message });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not send message',
        description: err.response?.data?.error || 'Something went wrong. Please try again.'
      });
    }
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        <Mail size={14} aria-hidden="true" />
        Contact
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Get in touch
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
        Have a question, suggestion, or partnership idea? Send us a message and the CivicVoice team
        will get back to you within a few business days.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Mail size={19} aria-hidden="true" />
            </div>
            <h2 className="mt-3 font-display text-base font-semibold text-ink">Email</h2>
            <p className="mt-1 text-sm text-ink-soft">hello@civicvoice.local</p>
          </div>
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Clock size={19} aria-hidden="true" />
            </div>
            <h2 className="mt-3 font-display text-base font-semibold text-ink">Response time</h2>
            <p className="mt-1 text-sm text-ink-soft">We reply within 2–3 business days.</p>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={80}
                placeholder="Your name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={120}
              placeholder="What is this about?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              required
              minLength={10}
              maxLength={2000}
              placeholder="Tell us more…"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={sending}>
            <Send size={15} aria-hidden="true" />
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
