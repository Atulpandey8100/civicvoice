import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MulterError } from 'multer';
import connectDB from './utils/db.js';
import issueRoutes from './routes/issues.js';
import authRoutes from './routes/auth.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Trust the first hop so express-rate-limit (keyed on req.ip) sees real client IPs
// behind the Vite dev proxy / a reverse proxy instead of a shared 127.0.0.1.
app.set('trust proxy', 1);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : true;

app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum 5MB per image.' :
      err.code === 'LIMIT_FILE_COUNT' ? 'Too many files. Maximum 5 images.' : err.message;
    return res.status(400).json({ error: message });
  }
  if (err.type === 'entity.too.large' || err.type === 'entity.parse.failed') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  server.on('error', (err) => {
    console.error('Server error:', err.message);
    process.exit(1);
  });
});
