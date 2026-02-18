import pool from './src/db.js';

async function migrate() {
    try {
        console.log('Iniciando migração de Playlists RLS...');

        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playlists' AND column_name='owner_id') THEN
                    ALTER TABLE playlists ADD COLUMN owner_id VARCHAR(50);
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playlists' AND column_name='is_public') THEN
                    ALTER TABLE playlists ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
                END IF;
            END
            $$;
        `);

        // Playlists antigas sem dono viram públicas para não sumir
        await pool.query("UPDATE playlists SET is_public = TRUE WHERE owner_id IS NULL");

        console.log('Migração concluída!');
    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}
migrate();
