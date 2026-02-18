import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Helper: Convert DB row + songIds to frontend-compatible Playlist
async function rowToPlaylist(row: any) {
    const songsResult = await pool.query(
        'SELECT song_id FROM playlist_songs WHERE playlist_id = $1 ORDER BY position ASC',
        [row.id]
    );
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        coverUrl: row.cover_url || '',
        songIds: songsResult.rows.map((r: any) => r.song_id),
        ownerId: row.owner_id,
        isPublic: row.is_public,
    };
}

// GET /api/playlists — Listar playlists (Públicas + do Usuário)
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        let query = 'SELECT * FROM playlists WHERE is_public = TRUE';
        let params: any[] = [];

        if (userId) {
            query += ' OR owner_id = $1';
            params.push(userId);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        const playlists = await Promise.all(result.rows.map(rowToPlaylist));
        res.json(playlists);
    } catch (err) {
        console.error('Erro ao buscar playlists:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/playlists/:id — Buscar playlist por ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM playlists WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Playlist não encontrada' });
            return;
        }
        const playlist = await rowToPlaylist(result.rows[0]);
        res.json(playlist);
    } catch (err) {
        console.error('Erro ao buscar playlist:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/playlists — Criar nova playlist
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, coverUrl, songIds, ownerId, isPublic } = req.body;
        const id = `p-${uuidv4().slice(0, 5)}`;

        // Default isPublic to false if not specified, for privacy
        const isPublicFinal = isPublic !== undefined ? isPublic : false;

        await pool.query(
            `INSERT INTO playlists (id, name, description, cover_url, owner_id, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, name, description || '', coverUrl || '', ownerId || null, isPublicFinal]
        );

        // Insert song associations
        if (songIds && songIds.length > 0) {
            for (let i = 0; i < songIds.length; i++) {
                await pool.query(
                    `INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)
           ON CONFLICT (playlist_id, song_id) DO UPDATE SET position = $3`,
                    [id, songIds[i], i]
                );
            }
        }

        const result = await pool.query('SELECT * FROM playlists WHERE id = $1', [id]);
        const playlist = await rowToPlaylist(result.rows[0]);
        res.status(201).json(playlist);
    } catch (err) {
        console.error('Erro ao criar playlist:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/playlists/:id — Atualizar playlist
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { name, description, coverUrl, songIds, ownerId, isPublic } = req.body;
        const playlistId = req.params.id;

        // Check ownership if ownerId is provided in request (acting as auth user)
        if (ownerId) {
            const check = await pool.query('SELECT owner_id FROM playlists WHERE id = $1', [playlistId]);
            if (check.rows.length > 0) {
                const currentOwner = check.rows[0].owner_id;
                if (currentOwner && currentOwner !== ownerId) {
                    res.status(403).json({ error: 'Você não tem permissão para editar esta playlist.' });
                    return;
                }
            }
        }

        const result = await pool.query(
            `UPDATE playlists SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        cover_url = COALESCE($4, cover_url),
        is_public = COALESCE($5, is_public),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
            [playlistId, name, description, coverUrl, isPublic]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Playlist não encontrada' });
            return;
        }

        // Update song associations
        if (songIds !== undefined) {
            await pool.query('DELETE FROM playlist_songs WHERE playlist_id = $1', [playlistId]);
            for (let i = 0; i < songIds.length; i++) {
                await pool.query(
                    `INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES ($1, $2, $3)`,
                    [playlistId, songIds[i], i]
                );
            }
        }

        const playlist = await rowToPlaylist(result.rows[0]);
        res.json(playlist);
    } catch (err) {
        console.error('Erro ao atualizar playlist:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/playlists/:id — Deletar playlist
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'DELETE FROM playlists WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Playlist não encontrada' });
            return;
        }

        res.json({ success: true, id: req.params.id });
    } catch (err) {
        console.error('Erro ao deletar playlist:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
