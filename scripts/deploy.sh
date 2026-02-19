#!/bin/bash
# ═══════════════════════════════════════════════════
# Vinil Suno — Script de Deploy para VPS
# ═══════════════════════════════════════════════════
# Uso:
#   bash deploy.sh                    → Gera o pacote
#   bash deploy.sh user@ip            → Gera e envia para a VPS
#   bash deploy.sh user@ip /opt/apps  → Gera, envia e especifica diretório
# ═══════════════════════════════════════════════════

set -e

DEPLOY_DIR="vinil-suno-deploy"
ARCHIVE="vinil-suno-deploy.tar.gz"
VPS_HOST="$1"
VPS_PATH="${2:-/opt/vinil-suno}"

echo ""
echo "🎵 ══════════════════════════════════════════"
echo "   Vinil Suno — Deploy Builder"
echo "   ──────────────────────────────────────"
echo ""

# Cleanup
rm -rf "$DEPLOY_DIR" "$ARCHIVE"
mkdir -p "$DEPLOY_DIR"

echo "📦 Copiando arquivos necessários..."

# Copy Docker files
cp docker-compose.yml "$DEPLOY_DIR/"
cp Dockerfile "$DEPLOY_DIR/"
cp .dockerignore "$DEPLOY_DIR/"
cp .env.production "$DEPLOY_DIR/.env" 2>/dev/null || cp .env "$DEPLOY_DIR/.env" 2>/dev/null || echo "NODE_ENV=production" > "$DEPLOY_DIR/.env"

# Copy Nginx config
mkdir -p "$DEPLOY_DIR/nginx"
cp nginx/default.conf "$DEPLOY_DIR/nginx/"

# Copy backend
mkdir -p "$DEPLOY_DIR/backend"
cp -r backend/src "$DEPLOY_DIR/backend/"
cp backend/package.json "$DEPLOY_DIR/backend/"
cp backend/tsconfig.json "$DEPLOY_DIR/backend/"

# Copy frontend
mkdir -p "$DEPLOY_DIR/components" "$DEPLOY_DIR/utils"
cp package.json "$DEPLOY_DIR/"
cp tsconfig.json "$DEPLOY_DIR/"
cp vite.config.ts "$DEPLOY_DIR/"
cp index.html "$DEPLOY_DIR/"
cp index.tsx "$DEPLOY_DIR/"
cp index.css "$DEPLOY_DIR/"
cp App.tsx "$DEPLOY_DIR/"
cp constants.ts "$DEPLOY_DIR/"
cp types.ts "$DEPLOY_DIR/"
cp -r components/* "$DEPLOY_DIR/components/"
cp -r utils/* "$DEPLOY_DIR/utils/"

# Copy api service if exists
if [ -d "services" ]; then
  cp -r services "$DEPLOY_DIR/"
fi

# Copy .env.local for build
cp .env.local "$DEPLOY_DIR/.env.local" 2>/dev/null || echo "GEMINI_API_KEY=PLACEHOLDER" > "$DEPLOY_DIR/.env.local"

echo "✅ Arquivos copiados"

# Create archive
echo "📁 Criando arquivo compactado..."
tar -czf "$ARCHIVE" "$DEPLOY_DIR"
echo "✅ Pacote criado: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# Cleanup temp directory
rm -rf "$DEPLOY_DIR"

# Send to VPS if host provided
if [ -n "$VPS_HOST" ]; then
  echo ""
  echo "🚀 Enviando para $VPS_HOST:$VPS_PATH..."
  
  # Create remote directory
  ssh "$VPS_HOST" "mkdir -p $VPS_PATH"
  
  # Send archive
  scp "$ARCHIVE" "$VPS_HOST:$VPS_PATH/"
  
  # Extract and start
  ssh "$VPS_HOST" "cd $VPS_PATH && tar -xzf $ARCHIVE --strip-components=1 && rm $ARCHIVE"
  
  echo ""
  echo "✅ Deploy enviado! Para iniciar na VPS:"
  echo ""
  echo "   ssh $VPS_HOST"
  echo "   cd $VPS_PATH"
  echo "   # Edite o .env com suas variáveis"
  echo "   nano .env"
  echo "   # Suba os containers"
  echo "   docker compose up -d --build"
  echo ""
else
  echo ""
  echo "📋 Próximos passos:"
  echo ""
  echo "   1. Envie o pacote para sua VPS:"
  echo "      scp $ARCHIVE user@sua-vps:/opt/"
  echo ""
  echo "   2. Na VPS, extraia e configure:"
  echo "      cd /opt"
  echo "      tar -xzf $ARCHIVE"
  echo "      cd $DEPLOY_DIR"
  echo "      nano .env  # Configure suas variáveis"
  echo ""
  echo "   3. Suba os containers:"
  echo "      docker compose up -d --build"
  echo ""
fi

echo "🎵 ══════════════════════════════════════════"
echo ""
