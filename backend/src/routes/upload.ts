import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const audioDir = path.join(uploadDir, 'audio');
const imagesDir = path.join(uploadDir, 'images');

[audioDir, imagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, audioDir);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, imagesDir);
        } else {
            cb(new Error('Tipo de arquivo não suportado'), '');
        }
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
    fileFilter: (_req, file, cb) => {
        const allowedAudio = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac'];
        const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const allowed = [...allowedAudio, ...allowedImages];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
        }
    },
});

// POST /api/upload/audio — Upload de arquivo de áudio
router.post('/audio', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5043}`;
    const fileUrl = `${baseUrl}/uploads/audio/${req.file.filename}`;

    res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
    });
});

// POST /api/upload/image — Upload de imagem de capa
router.post('/image', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5043}`;
    const fileUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
    });
});

export default router;
