import pool, { initDatabase } from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

/**
 * Seed script — Insere dados iniciais no banco de dados PostgreSQL.
 * Roda com: npm run seed
 */
async function seed() {
    console.log('🌱 Iniciando seed do banco de dados...');

    await initDatabase();

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Seed admin user
        const existingUsers = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(existingUsers.rows[0].count) === 0) {
            const adminPassword = await bcrypt.hash('admin123', 12);
            await client.query(
                `INSERT INTO users (id, name, email, password_hash, role, avatar_url)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING`,
                ['admin-001', 'Rodrigo Azevedo', 'rodrigo.azevedo1988@gmail.com', adminPassword, 'admin', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop']
            );
            console.log('✅ Admin "Rodrigo Azevedo" criado (email: rodrigo.azevedo1988@gmail.com, senha: admin123)');
            console.log('   ⚠️  Troque a senha após o primeiro login!');
        } else {
            console.log('ℹ️  Usuários já existem, pulando seed de users.');
        }

        // Check if songs already exist
        const existingSongs = await client.query('SELECT COUNT(*) FROM songs');
        if (parseInt(existingSongs.rows[0].count) > 0) {
            await client.query('COMMIT');
            console.log('⚠️  Banco já possui músicas. Pulando seed de dados.');
            return;
        }

        // Insert seed songs
        const songs = [
            {
                id: '1',
                title: 'Neon Cyberpunk Dreams',
                artist: 'Suno AI v3',
                album: 'Future Synth',
                cover_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop',
                audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                duration: 184,
                is_favorite: true,
                date_added: '2023-10-01',
                mood_energy: 0.9,
                mood_valence: 0.6,
                mood_tempo: 140,
            },
            {
                id: '2',
                title: 'Midnight Jazz Cafe',
                artist: 'Suno AI Jazz Model',
                album: 'Smooth Vibes',
                cover_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&auto=format&fit=crop',
                audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                duration: 210,
                is_favorite: false,
                date_added: '2023-10-02',
                mood_energy: 0.3,
                mood_valence: 0.7,
                mood_tempo: 85,
            },
            {
                id: '3',
                title: 'Heavy Metal Thunder',
                artist: 'Suno Metalhead',
                album: 'Raw Power',
                cover_url: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=400&auto=format&fit=crop',
                audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                duration: 195,
                is_favorite: true,
                date_added: '2023-10-03',
                mood_energy: 0.95,
                mood_valence: 0.2,
                mood_tempo: 160,
            },
            {
                id: '4',
                title: 'Lo-Fi Study Beats',
                artist: 'Chill Bot',
                album: 'Focus Mode',
                cover_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop',
                audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                duration: 240,
                is_favorite: false,
                date_added: '2023-10-05',
                mood_energy: 0.2,
                mood_valence: 0.5,
                mood_tempo: 70,
            },
        ];

        for (const song of songs) {
            await client.query(
                `INSERT INTO songs (id, title, artist, album, cover_url, audio_url, duration, is_favorite, date_added, mood_energy, mood_valence, mood_tempo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
                [
                    song.id, song.title, song.artist, song.album,
                    song.cover_url, song.audio_url, song.duration,
                    song.is_favorite, song.date_added,
                    song.mood_energy, song.mood_valence, song.mood_tempo,
                ]
            );
        }
        console.log(`✅ ${songs.length} músicas inseridas`);

        // Insert seed playlists
        const playlists = [
            {
                id: 'p1',
                name: 'Best of Suno V3',
                description: 'My top generated tracks from version 3.',
                cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
                songIds: ['1', '3'],
            },
            {
                id: 'p2',
                name: 'Late Night Coding',
                description: 'Focus music for deep work sessions.',
                cover_url: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=600&auto=format&fit=crop',
                songIds: ['2', '4'],
            },
        ];

        for (const playlist of playlists) {
            await client.query(
                `INSERT INTO playlists (id, name, description, cover_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
                [playlist.id, playlist.name, playlist.description, playlist.cover_url]
            );

            for (let i = 0; i < playlist.songIds.length; i++) {
                await client.query(
                    `INSERT INTO playlist_songs (playlist_id, song_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT (playlist_id, song_id) DO NOTHING`,
                    [playlist.id, playlist.songIds[i], i]
                );
            }
        }
        console.log(`✅ ${playlists.length} playlists inseridas`);

        await client.query('COMMIT');
        console.log('');
        console.log('🎉 Seed concluído com sucesso!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Erro no seed:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(() => process.exit(1));
