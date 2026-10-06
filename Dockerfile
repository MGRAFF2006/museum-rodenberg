FROM node:22-alpine AS build
WORKDIR /app
# Empty by default: the browser uses its own origin at /convex.
ARG VITE_CONVEX_URL=
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && rm -rf dist/uploads

FROM node:22-alpine AS production
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server ./server
COPY --chown=node:node public/uploads ./seed-uploads
RUN mkdir -p public/uploads && chown -R node:node public
COPY --chmod=755 docker-entrypoint.sh ./docker-entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
