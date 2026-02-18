# Vinil Suno - Status do Projeto & Roteiro de Migração

Este documento registra o estado atual da aplicação, diferenciando funcionalidades reais de dados simulados (mockados), e define o roteiro técnico para migração para um ambiente de produção (VPS + PostgreSQL).

---

## 1. Status Atual da Implementação

### 🎨 Frontend & UI/UX (100% Funcional)
*   **Design System:** Implementado com Tailwind CSS, suporte nativo a **Dark/Light Mode**.
*   **Efeitos Visuais:** Backgrounds dinâmicos baseados nas cores da capa do álbum e transições "Glassmorphism".
*   **Navegação:** Sidebar responsiva (Mobile/Desktop) e roteamento interno via estado (SPA).
*   **Responsividade:** Layout fluido que se adapta de mobile a telas 4K.

### 🎵 Player de Áudio (Híbrido)
*   **Controles:** Play/Pause, Próximo/Anterior, Volume (com mudo), Seek (barra de progresso arrastável).
*   **Expandir Player:** Visualização imersiva com capa grande, metadados detalhados e "Mais do Artista".
*   **Engine:** Baseado em HTML5 `Audio` API. O estado de reprodução persiste durante a navegação.
*   **Letras (AI):** Integração **REAL** com Google Gemini para gerar letras poéticas baseadas no título/mood da música.

### 🛠️ CMS - Gestão de Conteúdo (Funcional Localmente)
*   **CRUD de Músicas:** Criação, Edição e Exclusão de faixas.
*   **CRUD de Playlists:** Criação e gestão de músicas dentro de playlists.
*   **Sugestão de Mood (AI):** Integração **REAL** com Google Gemini para analisar metadados (título/artista) e sugerir Energia, Valência e BPM.
*   **Persistência:** Atualmente utiliza `localStorage`. Os dados sobrevivem ao refresh da página, mas ficam presos no navegador do usuário.

---

## 2. O que é Mock vs. O que é Real?

| Componente | Status | Detalhes |
| :--- | :--- | :--- |
| **Arquivos de Áudio** | ⚠️ **Mockado** | Todas as músicas apontam para uma URL pública de teste (`DUMMY_AUDIO`). O player funciona, mas toca sempre o mesmo áudio. |
| **Imagens/Capas** | ⚠️ **Mockado** | URLs estáticas do Unsplash. Não há upload real de arquivos. |
| **Autenticação** | ❌ **Mockado** | Usuário `MOCK_USER` hardcoded. Não há login, registro ou sessões reais. |
| **Banco de Dados** | ⚠️ **Simulado** | Utiliza `localStorage` do navegador e arrays em memória. |
| **Integração AI** | ✅ **Real** | Conecta via API Key do Google Gemini para gerar textos e analisar moods. |
| **Lógica do Player** | ✅ **Real** | Controle de volume, tempo e listas de reprodução funcionam logicamente. |

---

## 3. Roteiro para Produção (VPS + PostgreSQL)

Para levar este projeto para um servidor VPS (ex: DigitalOcean, AWS EC2, Hetzner) com PostgreSQL, a arquitetura precisa evoluir de **Client-Side Only** para **Full-Stack**.

### Fase 1: Backend & Banco de Dados
Precisamos de uma API para servir os dados e autenticar usuários.

**Tecnologias Sugeridas:** Node.js (Express ou NestJS) ou Go.

**Estrutura do Banco (PostgreSQL):**

```sql
-- Exemplo Simplificado do Schema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT
);

CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    cover_url TEXT,
    audio_url TEXT NOT NULL, -- Link para o Object Storage (S3/MinIO)
    duration INT,
    mood JSONB, -- { energy: 0.8, valence: 0.5, tempo: 120 }
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE
);

CREATE TABLE playlist_songs (
    playlist_id UUID REFERENCES playlists(id),
    song_id UUID REFERENCES songs(id),
    position INT,
    PRIMARY KEY (playlist_id, song_id)
);
```

### Fase 2: Armazenamento de Arquivos (Object Storage)
**Não salve arquivos de áudio/imagem no banco de dados.**
*   **Solução VPS:** Instalar **MinIO** (Self-hosted S3 Compatible) no mesmo VPS ou usar AWS S3 / Cloudflare R2.
*   **Fluxo:** O CMS fará upload do MP3 para o Backend -> Backend salva no MinIO -> MinIO retorna URL -> Backend salva URL no Postgres.

### Fase 3: Autenticação
*   Implementar JWT (JSON Web Tokens).
*   Substituir o `MOCK_USER` no Frontend por um Contexto de Autenticação (`AuthContext`) que guarda o token JWT.

### Fase 4: Infraestrutura & Deploy (Docker)
A melhor forma de gerenciar isso em uma VPS é usando Docker Compose.

**Arquivo `docker-compose.yml` sugerido:**

```yaml
version: '3.8'
services:
  # Banco de Dados
  postgres:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  # Armazenamento de Arquivos (Opcional se usar S3)
  minio:
    image: minio/minio
    command: server /data
    volumes:
      - minio_data:/data

  # Backend (Node/NestJS/Go)
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/vinilsuno
    depends_on:
      - postgres

  # Frontend (Nginx servindo o build do Vite)
  web:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api
```

### Próximos Passos Imediatos (To-Do List):

1.  [ ] **Criar Repositório Backend:** Iniciar um projeto Node.js/Express.
2.  [ ] **Configurar Postgres:** Criar as tabelas listadas acima.
3.  [ ] **Conectar Frontend à API:**
    *   Substituir `localStorage` no `App.tsx` e `CMSView.tsx` por chamadas `fetch` ou `axios` para a nova API (`GET /api/songs`, `POST /api/songs`).
4.  [ ] **Implementar Upload:** Criar rota no backend que aceita `multipart/form-data` para receber o MP3 e a imagem da capa e salvar em disco ou S3.
5.  [ ] **Player Real:** Garantir que o player receba URLs reais retornadas do backend.

---
*Gerado automaticamente para o projeto Vinil Suno.*
