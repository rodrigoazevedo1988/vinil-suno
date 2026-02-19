import { Router } from 'express';
import pool from '../db.js';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

async function getDirStats(dirPath: string) {
    try {
        const files = await fs.readdir(dirPath);
        let totalSize = 0;
        let count = 0;

        for (const file of files) {
            const stats = await fs.stat(path.join(dirPath, file));
            if (stats.isFile()) {
                totalSize += stats.size;
                count++;
            }
        }
        return { size: totalSize, count };
    } catch (e) {
        return { size: 0, count: 0 };
    }
}

router.get('/', async (req, res) => {
    try {
        // DB Stats
        const songsCount = await pool.query('SELECT COUNT(*) FROM songs');
        const playlistsCount = await pool.query('SELECT COUNT(*) FROM playlists');
        const artistsCount = await pool.query('SELECT COUNT(DISTINCT artist) FROM songs');
        const durationSum = await pool.query('SELECT SUM(duration) FROM songs');

        // File Stats
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const audioPath = path.resolve(uploadDir, 'audio');
        // Check for images dir - might be 'images' or just inside uploads, typically separated
        const imagePath = path.resolve(uploadDir, 'images');

        const audioStats = await getDirStats(audioPath);
        const imageStats = await getDirStats(imagePath);

        res.json({
            songs: parseInt(songsCount.rows[0].count),
            playlists: parseInt(playlistsCount.rows[0].count),
            artists: parseInt(artistsCount.rows[0].count),
            totalDuration: parseInt(durationSum.rows[0].sum || '0'),
            storage: {
                audio: audioStats.size,
                images: imageStats.size,
                total: audioStats.size + imageStats.size
            },
            files: {
                audio: audioStats.count,
                images: imageStats.count
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Stats error' });
    }
});

export default router;
