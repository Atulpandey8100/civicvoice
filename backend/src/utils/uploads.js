import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import imagekit, { imagekitEnabled } from './imagekit.js';

const UPLOADS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'uploads'
);

const IMAGE_PATTERN = /jpeg|jpg|png|gif|webp/;

export const imageFileFilter = (req, file, cb) => {
  const extOk = IMAGE_PATTERN.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = IMAGE_PATTERN.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
  }
};

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function saveUpload(file) {
  if (imagekitEnabled) {
    const response = await imagekit.upload({
      file: file.buffer,
      fileName: `${Date.now()}-${file.originalname}`,
      folder: '/civicvoice-uploads'
    });
    return response.url;
  }

  await ensureUploadsDir();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

export async function removeStoredImages(urls = []) {
  if (imagekitEnabled) return;

  for (const url of urls) {
    if (typeof url === 'string' && url.startsWith('/uploads/')) {
      await fs.unlink(path.join(UPLOADS_DIR, path.basename(url))).catch(() => {});
    }
  }
}
