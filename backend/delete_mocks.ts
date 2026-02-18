import pool from './src/db';

async function cleanup() {
    try {
        console.log('Iniciando limpeza...');

        // Deletar playlists p1 e p2
        const resPlaylists = await pool.query("DELETE FROM playlists WHERE id IN ('p1', 'p2') RETURNING *");
        console.log(`Playlists deletadas: ${resPlaylists.rowCount}`);

        // Deletar songs 1, 2, 3, 4
        // Nota: Se houver foreign keys em playlist_songs, eles devem ser deletados cascade ou manualmente.
        // O schema original tinha ON DELETE CASCADE? Vamos assumir que sim ou deletar da tabela de junção primeiro.

        await pool.query("DELETE FROM playlist_songs WHERE playlist_id IN ('p1', 'p2')");
        await pool.query("DELETE FROM playlist_songs WHERE song_id IN ('1', '2', '3', '4')");

        const resSongs = await pool.query("DELETE FROM songs WHERE id IN ('1', '2', '3', '4') RETURNING *");
        console.log(`Músicas deletadas: ${resSongs.rowCount}`);

        console.log('Limpeza concluída com sucesso!');
    } catch (err) {
        console.error('Erro durante a limpeza:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

cleanup();
