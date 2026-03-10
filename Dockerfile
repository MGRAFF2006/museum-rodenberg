# ── Build stage ─────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Vite bakes VITE_* env vars into the JS bundle at build time.
# On Sevalla, set VITE_CONVEX_URL in env vars (available at build).
# For Docker Compose, override with --build-arg or .env.
ARG VITE_CONVEX_URL
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build the Vite frontend
COPY . .
RUN npm run build

# ── Production stage ───────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built frontend and server code
COPY --from=build /app/dist ./dist
COPY server ./server

# Copy entrypoint (seeds persistent disk with build-time uploads on first run)
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Content and uploads are bind-mounted at runtime (see docker-compose.yml),
# but we copy defaults so the image works standalone too.
COPY src/content ./src/content
COPY public/uploads ./public/uploads

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
