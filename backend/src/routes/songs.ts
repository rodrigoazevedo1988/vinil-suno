import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper: Convert DB row to frontend-compatible Song object
// Now accepts an optional userId to determine per-user favorite status
function rowToSong(row: any, userFavoriteIds?: Set<string>) {
    return {
        id: row.id,
        title: row.title,
        artist: row.artist,
        album: row.album || '',
        coverUrl: row.cover_url || '',
        audioUrl: row.audio_url || '',
        duration: row.duration || 0,
        // Per-user favorites: check if this song is in the user's favorites
        isFavorite: userFavoriteIds ? userFavoriteIds.has(row.id) : false,
        dateAdded: row.date_added ? new Date(row.date_added).toISOString().split('T')[0] : '',
        genre: row.genre || '',
        lyrics: row.lyrics || '',
        mood: {
            energy: row.mood_energy || 0.5,
            valence: row.mood_valence || 0.5,
            tempo: row.mood_tempo || 120,
        },
    };
}

// Helper: Get user's favorite song IDs
async function getUserFavoriteIds(userId?: string): Promise<Set<string>> {
    if (!userId) return new Set();
    try {
        const result = await pool.query(
            'SELECT song_id FROM user_favorites WHERE user_id = $1',
            [userId]
        );
        return new Set(result.rows.map((r: any) => r.song_id));
    } catch {
        // Table might not exist yet, return empty
        return new Set();
    }
}

// GET /api/songs — Listar todas as músicas
// Query param: ?userId=xxx to get per-user favorites
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        const userFavIds = await getUserFavoriteIds(userId);

        const result = await pool.query(
            'SELECT * FROM songs ORDER BY created_at DESC'
        );
        const songs = result.rows.map((row: any) => rowToSong(row, userFavIds));
        res.json(songs);
    } catch (err) {
        console.error('Erro ao buscar músicas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/songs/:id — Buscar música por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        const userFavIds = await getUserFavoriteIds(userId);

        const result = await pool.query('SELECT * FROM songs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Música não encontrada' });
            return;
        }
        res.json(rowToSong(result.rows[0], userFavIds));
    } catch (err) {
        console.error('Erro ao buscar música:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/songs — Criar nova música
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, artist, album, coverUrl, audioUrl, duration, isFavorite, dateAdded, mood, genre, lyrics } = req.body;
        const id = uuidv4().slice(0, 9);

        await pool.query(
            `INSERT INTO songs (id, title, artist, album, cover_url, audio_url, duration, is_favorite, date_added, mood_energy, mood_valence, mood_tempo, genre, lyrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
                id, title, artist, album || '',
                coverUrl || '', audioUrl || '',
                duration || 0, false, // is_favorite on song table is now legacy, always false
                dateAdded || new Date().toISOString().split('T')[0],
                mood?.energy || 0.5, mood?.valence || 0.5, mood?.tempo || 120,
                genre || '', lyrics || ''
            ]
        );

        const result = await pool.query('SELECT * FROM songs WHERE id = $1', [id]);
        res.status(201).json(rowToSong(result.rows[0]));
    } catch (err) {
        console.error('Erro ao criar música:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/songs/:id — Atualizar música
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { title, artist, album, coverUrl, audioUrl, duration, mood, genre, lyrics } = req.body;

        const result = await pool.query(
            `UPDATE songs SET
        title = COALESCE($2, title),
        artist = COALESCE($3, artist),
        album = COALESCE($4, album),
        cover_url = COALESCE($5, cover_url),
        audio_url = COALESCE($6, audio_url),
        duration = COALESCE($7, duration),
        mood_energy = COALESCE($8, mood_energy),
        mood_valence = COALESCE($9, mood_valence),
        mood_tempo = COALESCE($10, mood_tempo),
        genre = COALESCE($11, genre),
        lyrics = COALESCE($12, lyrics),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
            [
                req.params.id, title, artist, album,
                coverUrl, audioUrl, duration,
                mood?.energy, mood?.valence, mood?.tempo,
                genre, lyrics
            ]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Música não encontrada' });
            return;
        }

        res.json(rowToSong(result.rows[0]));
    } catch (err) {
        console.error('Erro ao atualizar música:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PATCH /api/songs/:id/favorite — Toggle favorito POR USUÁRIO
// Body: { userId: string }
router.patch('/:id/favorite', async (req: Request, res: Response) => {
    try {
        const songId = req.params.id;
        const userId = req.body.userId;

        if (!userId) {
            res.status(400).json({ error: 'userId é obrigatório para favoritar' });
            return;
        }

        // Check if already favorited
        const existing = await pool.query(
            'SELECT 1 FROM user_favorites WHERE user_id = $1 AND song_id = $2',
            [userId, songId]
        );

        let isFavorite: boolean;
        if (existing.rows.length > 0) {
            // Remove favorite
            await pool.query(
                'DELETE FROM user_favorites WHERE user_id = $1 AND song_id = $2',
                [userId, songId]
            );
            isFavorite = false;
        } else {
            // Add favorite
            await pool.query(
                'INSERT INTO user_favorites (user_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, songId]
            );
            isFavorite = true;
        }

        res.json({ songId, userId, isFavorite });
    } catch (err) {
        console.error('Erro ao favoritar música:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/songs/:id — Deletar música
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'DELETE FROM songs WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Música não encontrada' });
            return;
        }

        res.json({ success: true, id: req.params.id });
    } catch (err) {
        console.error('Erro ao deletar música:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
