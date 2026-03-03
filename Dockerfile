# ── Build stage ─────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

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

# Content and uploads are bind-mounted at runtime (see docker-compose.yml),
# but we copy defaults so the image works standalone too.
COPY src/content ./src/content
COPY public/uploads ./public/uploads

EXPOSE 3000

CMD ["node", "server/index.js"]
