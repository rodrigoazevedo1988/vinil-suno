import { Router, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import pool from '../db.js';

const router = Router();

// --- Estado Global da Rádio ---
interface ConnectedClient {
    id: number;
    res: Response;
}

let clients: ConnectedClient[] = [];
let nextClientId = 1;
let currentSongMetadata: any = null;
let isRadioRunning = false;
let currentFfmpeg: any = null;

// --- Configuração ---
const RADIO_PLAYLIST_NAME = 'Rádio'; // Nome da playlist no CMS
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

// --- Funções Auxiliares ---

// Busca a próxima música da playlist "Rádio" ou aleatória
async function getNextRadioSong() {
    try {
        // 1. Tentar achar playlist 'Rádio'
        const playlistRes = await pool.query(
            'SELECT id FROM playlists WHERE name ILIKE $1 LIMIT 1',
            [RADIO_PLAYLIST_NAME]
        );

        let songIdToPlay = null;

        if (playlistRes.rows.length > 0) {
            const playlistId = playlistRes.rows[0].id;
            // Buscar músicas da playlist na tabela de relacionamento
            const songsRes = await pool.query(
                'SELECT song_id FROM playlist_songs WHERE playlist_id = $1',
                [playlistId]
            );

            if (songsRes.rows.length > 0) {
                const songIds = songsRes.rows.map((r: any) => r.song_id);
                const randomIndex = Math.floor(Math.random() * songIds.length);
                songIdToPlay = songIds[randomIndex];
            }
        }

        let song = null;
        if (songIdToPlay) {
            const songRes = await pool.query('SELECT * FROM songs WHERE id = $1', [songIdToPlay]);
            song = songRes.rows[0];
        } else {
            // Fallback: Aleatória geral
            const randomRes = await pool.query('SELECT * FROM songs ORDER BY RANDOM() LIMIT 1');
            song = randomRes.rows[0];
        }

        if (!song) return null;

        // Normalizar dados
        return {
            id: song.id,
            title: song.title,
            artist: song.artist,
            coverUrl: song.cover_url,
            audioUrl: song.audio_url,
            duration: song.duration
        };

    } catch (e) {
        console.error('Erro ao buscar música para rádio:', e);
        return null;
    }
}

// Loop Principal da Rádio
async function startRadioLoop() {
    if (isRadioRunning) return;
    isRadioRunning = true;

    const playNext = async () => {
        try {
            const song = await getNextRadioSong();

            if (!song) {
                console.log('Rádio: Nenhuma música encontrada. Tentando em 10s...');
                currentSongMetadata = null; // Rádio fora do ar
                setTimeout(playNext, 10000);
                return;
            }

            // Atualizar Metadados Globais
            currentSongMetadata = song;
            console.log(`Rádio Tocando: ${song.title} - ${song.artist}`);

            // Resolver caminho
            let inputPath = '';
            if (song.audioUrl.startsWith('http')) {
                inputPath = song.audioUrl;
            } else if (song.audioUrl.startsWith('/uploads')) {
                inputPath = path.join('/app', song.audioUrl);
            } else {
                inputPath = path.resolve(UPLOAD_DIR, song.audioUrl);
            }

            // FFmpeg args
            // -re é ESSENCIAL aqui para simular a velocidade real de leitura, 
            // já que estamos fazendo broadcast para múltiplos clientes.
            const ffmpegArgs = [
                '-re',
                '-i', inputPath,
                '-f', 'mp3',
                '-acodec', 'libmp3lame',
                '-ab', '128k',
                '-ar', '44100',
                '-ac', '2',
                '-'
            ];

            currentFfmpeg = spawn('ffmpeg', ffmpegArgs);

            currentFfmpeg.stdout.on('data', (chunk: Buffer) => {
                // Enviar para todos os clientes conectados
                // Se um cliente falhar, remover da lista
                for (let i = clients.length - 1; i >= 0; i--) {
                    const client = clients[i];
                    try {
                        client.res.write(chunk);
                    } catch (err) {
                        console.error(`Cliente ${client.id} desconectado (write error)`);
                        clients.splice(i, 1);
                    }
                }
            });

            currentFfmpeg.on('close', () => {
                // Música acabou, tocar próxima
                playNext();
            });

            currentFfmpeg.on('error', (err: any) => {
                console.error('Ffmpeg error:', err);
                setTimeout(playNext, 1000); // Tentar próxima em caso de erro
            });

        } catch (error) {
            console.error('Erro fatal no loop da rádio:', error);
            setTimeout(playNext, 5000);
        }
    };

    playNext();
}

// Iniciar Rádio no boot
startRadioLoop();


// --- Rotas ---

// GET /api/radio/stream.mp3
router.get('/stream.mp3', (req, res) => {
    // Headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('icy-name', 'Vinil Suno Radio');
    res.setHeader('icy-description', 'A melhor música 24h');
    res.setHeader('icy-url', 'https://vinilsuno.rsolutionsbr.com');
    // res.setHeader('icy-metaint', '8192'); // Futuro: Suporte a metadata nativo ICY

    const clientId = nextClientId++;
    const client = { id: clientId, res };
    clients.push(client);

    console.log(`Cliente Rádio conectado: ${clientId}. Total: ${clients.length}`);

    req.on('close', () => {
        console.log(`Cliente Rádio desconectado: ${clientId}`);
        clients = clients.filter(c => c.id !== clientId);
    });
});

// GET /api/radio/now-playing
router.get('/now-playing', (req, res) => {
    res.json(currentSongMetadata || {
        title: 'Rádio Offline',
        artist: 'Vinil Suno',
        coverUrl: ''
    });
});

export default router;
