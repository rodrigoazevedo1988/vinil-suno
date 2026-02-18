import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper: Convert DB row to frontend-compatible Song object
function rowToSong(row: any) {
    return {
        id: row.id,
        title: row.title,
        artist: row.artist,
        album: row.album || '',
        coverUrl: row.cover_url || '',
        audioUrl: row.audio_url || '',
        duration: row.duration || 0,
        isFavorite: row.is_favorite || false,
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

// GET /api/songs — Listar todas as músicas
router.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM songs ORDER BY created_at DESC'
        );
        const songs = result.rows.map(rowToSong);
        res.json(songs);
    } catch (err) {
        console.error('Erro ao buscar músicas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/songs/:id — Buscar música por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM songs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Música não encontrada' });
            return;
        }
        res.json(rowToSong(result.rows[0]));
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
                duration || 0, isFavorite || false,
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
        const { title, artist, album, coverUrl, audioUrl, duration, isFavorite, mood, genre, lyrics } = req.body;

        const result = await pool.query(
            `UPDATE songs SET
        title = COALESCE($2, title),
        artist = COALESCE($3, artist),
        album = COALESCE($4, album),
        cover_url = COALESCE($5, cover_url),
        audio_url = COALESCE($6, audio_url),
        duration = COALESCE($7, duration),
        is_favorite = COALESCE($8, is_favorite),
        mood_energy = COALESCE($9, mood_energy),
        mood_valence = COALESCE($10, mood_valence),
        mood_tempo = COALESCE($11, mood_tempo),
        genre = COALESCE($12, genre),
        lyrics = COALESCE($13, lyrics),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
            [
                req.params.id, title, artist, album,
                coverUrl, audioUrl, duration, isFavorite,
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

// PATCH /api/songs/:id/favorite — Toggle favorito
router.patch('/:id/favorite', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE songs SET is_favorite = NOT is_favorite, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Música não encontrada' });
            return;
        }

        res.json(rowToSong(result.rows[0]));
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
