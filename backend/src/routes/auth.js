import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../utils/validate.js';
import { sendOtp } from '../utils/mailer.js';
import { saveUpload, imageFileFilter } from '../utils/uploads.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

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

const createOtp = async (email, purpose) => {
  const otp = String(crypto.randomInt(100000, 1000000));
  await Otp.deleteMany({ email, purpose });
  await Otp.create({
    email,
    purpose,
    otp: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + OTP_VALID_MS)
  });
  return otp;
};

const verifyOtp = async (email, purpose, otp) => {
  const record = await Otp.findOne({
    email,
    purpose,
    expiresAt: { $gt: new Date() }
  });
  if (!record) return false;
  return bcrypt.compare(otp, record.otp);
};

const clearOtp = async (email, purpose) => {
  await Otp.deleteMany({ email, purpose });
};

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
  '/send-register-otp',
  otpLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('A valid email is required')
      .custom((value) => /@gmail\.com$/i.test(value))
      .withMessage('Email must end with @gmail.com')
      .normalizeEmail()
  ],
  validate,
  async (req, res) => {
    try {
      const email = req.body.email;
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }
      const otp = await createOtp(email, 'register');
      await sendOtp(email, otp);
      res.json({ message: 'An OTP has been sent to your email.' });
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
    body('otp').matches(/^\d{6}$/).withMessage('Enter the 6-digit OTP sent to your email'),
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

      const otpValid = await verifyOtp(email, 'register', req.body.otp);
      if (!otpValid) {
        return res.status(400).json({ error: 'OTP is invalid or has expired. Please request a new OTP.' });
      }

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
      await clearOtp(email, 'register');

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
          avatar: user.avatar,
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
          avatar: user.avatar,
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

const sanitizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  name: user.name,
  mobile: user.mobile,
  email: user.email,
  avatar: user.avatar,
  address: user.address,
  consent: user.consent,
  role: user.role,
  createdAt: user.createdAt
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(
  '/me',
  auth,
  [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('mobile').optional().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
    body('state').optional().trim().notEmpty().withMessage('Please select your state'),
    body('district').optional().trim().notEmpty().withMessage('Please select your district')
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { firstName, lastName, mobile, state, district } = req.body;

      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (mobile !== undefined) user.mobile = mobile;
      if (state !== undefined || district !== undefined) {
        user.address = {
          state: state !== undefined ? state : user.address?.state,
          district: district !== undefined ? district : user.address?.district
        };
      }

      await user.save();
      res.json({ user: sanitizeUser(user) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/avatar', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.avatar = await saveUpload(req.file);
    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.avatar = null;
    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-password-otp', auth, otpLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const otp = await createOtp(user.email, 'password-change');
    await sendOtp(user.email, otp);
    res.json({ message: 'An OTP has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('otp').matches(/^\d{6}$/).withMessage('Enter the 6-digit OTP sent to your email'),
    body('newPassword')
      .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character'),
    body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match')
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const valid = await user.comparePassword(req.body.currentPassword);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

      const otpValid = await verifyOtp(user.email, 'password-change', req.body.otp);
      if (!otpValid) {
        return res.status(400).json({ error: 'OTP is invalid or has expired. Please request a new OTP.' });
      }

      user.password = req.body.newPassword;
      await user.save();
      await clearOtp(user.email, 'password-change');
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
