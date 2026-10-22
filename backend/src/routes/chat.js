import express from "express";
import rateLimit from "express-rate-limit";

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." }
});

router.post("/", chatLimiter, (req, res) => {
  try {
    const message = (req.body?.message || "").toString().trim().toLowerCase();
    
    if (message.includes("report") || message.includes("create issue")) {
      return res.json({ answer: "To report an issue: Sign in → Click 'Report Issue' or 'Create Issue' → Fill in title, description, category → Pin location on map → Add photos (optional) → Submit. AI will analyze and assign priority!" });
    }
    if (message.includes("vote")) {
      return res.json({ answer: "To vote: Open any issue from Explore or Map → Click the vote button. You can vote once per issue, and voting helps increase its priority!" });
    }
    if (message.includes("status") || message.includes("track")) {
      return res.json({ answer: "Issues go through: Pending → In Progress → Resolved → Closed. You can track your issues in Dashboard or check notifications for updates." });
    }
    if (message.includes("ai") || message.includes("priority")) {
      return res.json({ answer: "Our AI (Gemini) analyzes each issue and assigns a priority score (1-10) based on urgency, safety impact, and community impact. More votes can influence re-analysis!" });
    }
    if (message.includes("trending") || message.includes("popular")) {
      return res.json({ answer: "Check the Explore page sorted by 'Most Voted' to see trending issues, or view them on the Community Map!" });
    }
    if (message.includes("what is") || message.includes("civicvoice")) {
      return res.json({ answer: "CivicVoice is a citizen-engagement platform where residents report community issues, vote on priorities, track official progress, and get AI-powered insights. Report issues, engage with your community, and drive change!" });
    }
    
    return res.json({ 
      answer: "Hi! I'm CivicBot 👋 I can help with reporting issues, voting, tracking status, AI priorities, and navigating CivicVoice. Try asking: 'How do I report an issue?' or 'How does voting work?'" 
    });
  } catch (err) {
    return res.json({ answer: "I'm CivicBot! Ask me about reporting issues, voting, tracking status, or using CivicVoice." });
  }
});

export default router;
