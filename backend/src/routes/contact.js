import express from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import Contact from '../models/Contact.js';
import { validate } from '../utils/validate.js';

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' }
});

router.post(
  '/',
  contactLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('subject').trim().isLength({ min: 3, max: 120 }).withMessage('Subject must be 3-120 characters'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters')
  ],
  validate,
  async (req, res) => {
    try {
      const contact = new Contact({
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        message: req.body.message
      });
      await contact.save();
      res.status(201).json({ message: 'Message sent. We will get back to you soon.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
