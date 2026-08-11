import express from 'express';
import multer from 'multer';
import { saveUpload, imageFileFilter } from '../utils/uploads.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const url = await saveUpload(req.file);

        res.status(200).json({
            success: true,
            url
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Something went wrong during file upload' });
    }
});

export default router;
