import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { initDatabase } from './db.js';
import songsRouter from './routes/songs.js';
import playlistsRouter from './routes/playlists.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5043');

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3078', 'http://localhost:5173', 'http://localhost:5043'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/songs', songsRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'Vinil Suno API'
    });
});

// In production, serve frontend static files
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../dist');
    app.use(express.static(frontendPath));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// Start server
async function start() {
    try {
        await initDatabase();

        app.listen(PORT, '0.0.0.0', () => {
            console.log('');
            console.log('🎵 ══════════════════════════════════════');
            console.log('   Vinil Suno API — Servidor Iniciado');
            console.log('   ──────────────────────────────────');
            console.log(`   🌐 URL:    http://localhost:${PORT}`);
            console.log(`   📡 API:    http://localhost:${PORT}/api`);
            console.log(`   💾 Health: http://localhost:${PORT}/api/health`);
            console.log('🎵 ══════════════════════════════════════');
            console.log('');
        });
    } catch (err) {
        console.error('❌ Falha ao iniciar servidor:', err);
        process.exit(1);
    }
}

start();
