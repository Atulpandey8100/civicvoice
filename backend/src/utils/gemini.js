import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = 15000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'missing-key');

const extractJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const match = candidate.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const sanitize = (result) => {
  const priority = Number(result?.priority);
  if (!Number.isFinite(priority)) return null;
  const suggestions = Array.isArray(result?.suggestions)
    ? result.suggestions
        .filter(s => typeof s === 'string' && s.trim().length > 0)
        .map(s => s.trim())
        .slice(0, 3)
    : [];
  return {
    priority: Math.max(1, Math.min(10, Math.round(priority))),
    suggestions
  };
};

export const analyzeIssue = async (issue) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
    console.warn('Gemini API key is not configured; skipping AI analysis.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `Analyze this community issue and provide:
1. A priority score from 1 (low) to 10 (critical) based on urgency, safety impact, and community impact.
2. 2-3 practical solution suggestions.

Issue Title: ${issue.title}
Description: ${issue.description}
Category: ${issue.category}
Current Votes: ${issue.voteCount}

Respond in JSON format: { "priority": number, "suggestions": ["string", "string"] }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    }, { signal: AbortSignal.timeout(TIMEOUT_MS) });

    const parsed = extractJson(result.response.text());
    return sanitize(parsed);
  } catch (err) {
    if (err.name === 'TimeoutError' || err.code === 'ABORT_ERR') {
      console.error('Gemini API timed out');
    } else {
      console.error('Gemini API error:', err.message);
    }
    return null;
  }
};
