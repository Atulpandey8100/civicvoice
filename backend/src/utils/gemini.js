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
  const solution =
    typeof result?.solution === 'string' && result.solution.trim().length > 0
      ? result.solution.trim()
      : '';
  return {
    priority: Math.max(1, Math.min(10, Math.round(priority))),
    suggestions,
    solution
  };
};

export const analyzeIssue = async (issue) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
    console.warn('Gemini API key is not configured; skipping AI analysis.');
    return null;
  }

  const categoryGuide = {
    infrastructure: 'repairs/maintenance, PWD or municipal engineering department, documentation with photos, follow-up tracking',
    safety: 'immediate mitigation to reduce danger, police and municipal emergency contact, warning signage while awaiting permanent fix',
    environment: 'waste/pollution handling, local body or pollution control board, cleanup coordination, prevention measures',
    utilities: 'water/electricity provider helplines, register a complaint ID, escalation to local authorities if unresolved',
    transportation: 'traffic police and road department, transit operator, temporary traffic management while fixing the problem',
    other: 'escalation to the relevant municipal/civic authority with clear documentation'
  };

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are a civic problem-solving assistant. Given the community issue details reported by a citizen, provide:
1. priority: a score from 1 (low) to 10 (critical) based on urgency, safety impact, and community impact.
2. suggestions: 2-3 concise, practical actions the reporter or community can take.
3. solution: ONE precise, practical, step-by-step solution (under 200 words) tailored to the category and the specific information the reporter submitted. It must be actionable, name who should act (citizen, municipal body, police, service provider, etc.), and give concrete recommended steps and escalation path.

Category guidance:
- infrastructure: ${categoryGuide.infrastructure || ''}
- safety: ${categoryGuide.safety || ''}
- environment: ${categoryGuide.environment || ''}
- utilities: ${categoryGuide.utilities || ''}
- transportation: ${categoryGuide.transportation || ''}
- other: ${categoryGuide.other || ''}

Issue Title: ${issue.title}
Description: ${issue.description}
Category: ${issue.category}
Location/State: ${issue.state || 'Unknown'} ${issue.location?.address ? `(Address: ${issue.location.address})` : ''}
Current Votes: ${issue.voteCount}

Respond ONLY in JSON format: { "priority": number, "suggestions": ["string", "string"], "solution": "string" }`;

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

export const chatAnswer = async (question, context = {}) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
    console.warn('Gemini API key is not configured; skipping chatbot.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const issueSummary = (context.topIssues || [])
      .map(
        (i) =>
          `- "${i.title}" (${i.category}, status: ${i.status}, AI priority: ${i.aiPriority}/10, ${i.voteCount} votes${i.state ? `, state: ${i.state}` : ''})`
      )
      .join("\n");
    const statusSummary = (context.stats || [])
      .map((s) => `${s._id}: ${s.count}`)
      .join(", ");

    const prompt = `You are CivicBot, the helpful support assistant for CivicVoice, a citizen-engagement platform in India where residents report community issues (broken roads, streetlights, garbage, safety hazards, utilities, transport), vote on them, and officials update their status. AI (Gemini) scores each issue's priority and recommends practical solutions.

About CivicVoice you should know:
- Anyone can browse issues on the Explore and Community Map pages.
- To report or vote, users must sign in/register (email must end with @gmail.com, strong password, choose state and district).
- A reported issue captures title, description, category, photos, and a map pin. Gemini then assigns an AI priority (1-10) and recommends a practical solution shown on the issue page.
- Issues progress through stages: pending -> in-progress -> resolved -> closed.
- Verified officials take up issues, update status, and the community is notified.
- Users can view and edit their own issues from their profile dashboard.

Current platform overview: total issues by status => ${statusSummary || "no data yet"}.
Top current issues on the platform:${issueSummary ? `\n${issueSummary}` : " none yet"}

Answer the user's question clearly and concisely (under 150 words), in a friendly tone. If they ask about a specific issue, refer to the listed issues if relevant, otherwise explain how to find or report it. If they ask something unrelated to CivicVoice, politely steer them back to the platform.

User question: ${question}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 400 }
    });

    const text = result.response.text();
    return typeof text === "string" && text.trim().length > 0 ? text.trim() : null;
  } catch (err) {
    if (err.name === "TimeoutError" || err.code === "ABORT_ERR") {
      console.error("Gemini chatbot timed out");
    } else {
      console.error("Gemini chatbot error:", err.message);
    }
    return null;
  }
};
