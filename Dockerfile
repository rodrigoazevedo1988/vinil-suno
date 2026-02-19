FROM node:20-alpine AS builder

WORKDIR /app

# Install backend deps
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend/ ./backend/

# Build backend
RUN cd backend && npm run build

# Install frontend deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy frontend source
COPY . .

# Build frontend
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads/audio /app/uploads/images

# Install ffmpeg for radio streaming
RUN apk add --no-cache ffmpeg

EXPOSE 5043

ENV NODE_ENV=production
ENV PORT=5043
ENV UPLOAD_DIR=/app/uploads

WORKDIR /app/backend

CMD ["node", "dist/index.js"]
