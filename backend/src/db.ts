import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'vinilsuno',
});

// Test connection on startup
pool.on('connect', () => {
  console.log('📦 Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool do PostgreSQL:', err);
});

// Initialize database tables
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        avatar_url TEXT DEFAULT '',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS songs (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255) DEFAULT '',
        cover_url TEXT DEFAULT '',
        audio_url TEXT NOT NULL,
        duration INT DEFAULT 0,
        is_favorite BOOLEAN DEFAULT FALSE,
        date_added DATE DEFAULT CURRENT_DATE,
        mood_energy REAL DEFAULT 0.5,
        mood_valence REAL DEFAULT 0.5,
        mood_tempo INT DEFAULT 120,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        cover_url TEXT DEFAULT '',
        owner_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS playlist_songs (
        playlist_id VARCHAR(36) REFERENCES playlists(id) ON DELETE CASCADE,
        song_id VARCHAR(36) REFERENCES songs(id) ON DELETE CASCADE,
        position INT DEFAULT 0,
        PRIMARY KEY (playlist_id, song_id)
      );

      -- Per-user favorites table (privacy: each user has their own favorites)
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        song_id VARCHAR(36) REFERENCES songs(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, song_id)
      );
    `);

    // Migration: add columns if they don't exist yet (safe to run multiple times)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE playlists ADD COLUMN IF NOT EXISTS owner_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE playlists ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
        ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre VARCHAR(100) DEFAULT '';
        ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics TEXT DEFAULT '';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);
    console.log('✅ Tabelas do banco inicializadas');
  } catch (err) {
    console.error('❌ Erro ao inicializar tabelas:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
