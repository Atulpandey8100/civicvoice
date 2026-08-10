import express from 'express';
import multer from 'multer';
import imagekit from '../utils/imagekit.js';

const router = express.Router();

// Configure multer to store files in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload file buffer to ImageKit
        const response = await imagekit.upload({
            file: req.file.buffer, // required (Buffer)
            fileName: `${Date.now()}-${req.file.originalname}`, // required
            folder: '/civicvoice-uploads' // optional folder path in ImageKit
        });

        res.status(200).json({
            success: true,
            url: response.url,
            fileId: response.fileId
        });
    } catch (error) {
        console.error('ImageKit Upload Error:', error);
        res.status(500).json({ error: 'Something went wrong during file upload' });
    }
});

export default router;