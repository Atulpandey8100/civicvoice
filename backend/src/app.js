import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MulterError } from 'multer';

import issueRoutes from './routes/issues.js';
import authRoutes from './routes/auth.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import uploadRouter from './routes/upload.js'; // Fixed: using ES module import with file extension
import chatRoutes from './routes/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// CORS
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: '1mb' }));

// Static uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api', uploadRouter); // Grouped with other routes
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum 5MB per image.'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files. Maximum 5 images.'
          : err.message;

    return res.status(400).json({
      error: message,
    });
  }

  if (
    err.type === 'entity.too.large' ||
    err.type === 'entity.parse.failed'
  ) {
    return res.status(413).json({
      error: 'Request body too large',
    });
  }

  if (
    err.name === 'ValidationError' ||
    err.name === 'CastError'
  ) {
    return res.status(400).json({
      error: err.message,
    });
  }

  console.error(err);

  res.status(500).json({
    error: 'Something went wrong',
  });
});

export default app;