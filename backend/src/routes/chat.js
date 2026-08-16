import express from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";

import Issue from "../models/Issue.js";
import { chatAnswer } from "../utils/gemini.js";
import { validate } from "../utils/validate.js";

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." }
});

router.post(
  "/",
  chatLimiter,
  [
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Please type a question between 1 and 500 characters")
  ],
  validate,
  async (req, res) => {
    try {
      const [stats, topIssues] = await Promise.all([
        Issue.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]),
        Issue.find()
          .sort("-voteCount")
          .limit(10)
          .select("title category status aiPriority voteCount state")
      ]);

      const answer = await chatAnswer(req.body.message, { stats, topIssues });

      if (!answer) {
        return res.status(502).json({
          error: "CivicBot could not respond right now. Please try again in a moment."
        });
      }

      res.json({ answer });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
