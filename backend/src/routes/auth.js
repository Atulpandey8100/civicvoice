import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import User from '../models/User.js';
import { validate } from '../utils/validate.js';
import { sendOtp } from '../utils/mailer.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

const ALLOWED_ROLES = ['resident'];

const OTP_VALID_MS = 10 * 60 * 1000;

const verifyOtpForUser = async (user, otp) => {
  if (!user || !user.otp || !user.otpExpires || new Date(user.otpExpires) < Date.now()) {
    return false;
  }
  return bcrypt.compare(otp, user.otp);
};

router.post(
  '/forgot-password',
  otpLimiter,
  [body('email').isEmail().withMessage('A valid email is required').normalizeEmail()],
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        const otp = String(crypto.randomInt(100000, 1000000));
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = new Date(Date.now() + OTP_VALID_MS);
        await user.save();
        await sendOtp(user.email, otp);
      }
      res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  '/verify-otp',
  otpLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('otp').matches(/^\d{6}$/).withMessage('Enter the 6-digit OTP')
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      const valid = await verifyOtpForUser(user, req.body.otp);
      if (!valid) {
        return res.status(400).json({ error: 'OTP is invalid or has expired. Please request a new OTP.' });
      }
      res.json({ message: 'OTP verified. You can now set a new password.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  '/reset-password',
  otpLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('otp').matches(/^\d{6}$/).withMessage('Enter the 6-digit OTP'),
    body('password')
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      const valid = await verifyOtpForUser(user, req.body.otp);
      if (!valid) {
        return res.status(400).json({ error: 'OTP is invalid or has expired. Please request a new OTP.' });
      }
      user.password = req.body.password;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      res.json({ message: 'Password updated. You can now log in with your new password.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


router.post(
  '/register',
  authLimiter,
  [
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
    body('email')
      .isEmail()
      .withMessage('A valid email is required')
      .custom((value) => /@gmail\.com$/i.test(value))
      .withMessage('Email must end with @gmail.com')
      .normalizeEmail(),
    body('password')
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
    body('state').trim().notEmpty().withMessage('Please select your state'),
    body('district').trim().notEmpty().withMessage('Please select your district'),
    body('consent').isBoolean().withMessage('Consent is required').custom((value) => value === true).withMessage('You must accept the consent'),
    body('role').optional().isIn(ALLOWED_ROLES).withMessage('Role must be resident')
  ],
  validate,
  async (req, res) => {
    try {
      const { firstName, lastName, mobile, email, password, state, district } = req.body;
      const role = 'resident';
      const user = new User({
        firstName,
        lastName,
        mobile,
        email,
        password,
        address: { state, district },
        consent: true,
        role
      });
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          address: user.address,
          consent: user.consent,
          role: user.role
        }
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
      res.status(400).json({ error: err.message });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          address: user.address,
          consent: user.consent,
          role: user.role
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
