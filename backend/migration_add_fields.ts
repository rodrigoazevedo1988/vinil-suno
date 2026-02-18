import pool from './src/db.js';

async function migrate() {
    try {
        console.log('Iniciando migração...');

        // Adicionar colunas se não existirem
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='songs' AND column_name='genre') THEN
                    ALTER TABLE songs ADD COLUMN genre VARCHAR(100);
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='songs' AND column_name='lyrics') THEN
                    ALTER TABLE songs ADD COLUMN lyrics TEXT;
                END IF;
            END
            $$;
        `);

        console.log('Migração concluída com sucesso!');
    } catch (err) {
        console.error('Erro na migração:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

migrate();
