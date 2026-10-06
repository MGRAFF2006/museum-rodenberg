<p align="center">
  <img src="docs/logo.svg" alt="Museum Rodenberg" width="420">
</p>

# Museum Rodenberg

A multilingual digital museum for the history of Rodenberg and the surrounding region. Visitors can explore exhibitions and artifacts, search the collection, scan QR codes at the museum, open accessible media and detailed content, and switch between seven languages. Curators manage exhibitions, artifacts, uploads, and translations through the built-in admin area.

The application is a React and TypeScript frontend backed by a self-hosted Convex deployment. Express serves the production build and upload API; LibreTranslate is optional for assisted translations.

## Features

- Exhibition and artifact pages with images, audio, video, and Markdown content
- German, English, French, Spanish, Italian, Dutch, and Polish interfaces
- Full-text collection search and QR-code lookup
- Accessibility controls and text-to-speech support
- Password-protected administration and a visual content editor
- Convex-backed content with local JSON seed data
- Docker Compose profiles for Convex, the app, the Convex dashboard, and LibreTranslate

## Requirements

- Node.js 18 or newer and npm 9 or newer
- Docker with Docker Compose for the local Convex backend

## Local development

```bash
npm ci
cp .env.example .env
```

Before starting services, set a strong `ADMIN_PASSWORD` and a separate random `CONVEX_WRITE_SECRET` in ignored `.env`. Then start the backend and generate its admin key:

```bash
docker compose up -d convex-backend
docker compose exec convex-backend ./generate_admin_key.sh
```

Put the generated key in ignored `.env.local` as `CONVEX_SELF_HOSTED_ADMIN_KEY`, with `CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210`. Push the schema, configure the same `CONVEX_WRITE_SECRET` in the target Convex deployment, and seed its initial collection:

```bash
npm run convex:push
# Configure the Convex deployment write secret before the next command.
node scripts/migrate-to-convex.mjs
npm run dev:full
```

See [content seeding](docs/content-seeding.md) for the secret setup and verification steps. Seed only a fresh local deployment: these commands write collection data. The app reads Convex; an empty reachable deployment does not automatically display the JSON seed files.

The Vite application is available at <http://localhost:5173>. Use `npm run dev:full:all` to also start the Convex dashboard and LibreTranslate, or `npm run dev:docker` for the production-like Compose stack at <http://localhost:3000>.

Never commit `.env` or `.env.local`, and replace the example admin password before deploying.

## Checks

```bash
npx tsc --noEmit
npm test -- --run
npm run build
```

The existing GitHub Actions workflow runs type checking, tests, and the production build. A push to `main` also publishes the Convex schema when the production secrets are configured.

## Project layout

```text
convex/          Convex schema and content queries
public/          Translations and uploaded media
scripts/         Development, backup, translation, and schema helpers
server/          Express production server and upload API
src/components/  Visitor and administration interfaces
src/hooks/       Content, language, search, and accessibility hooks
```

## License

Licensed under the [MIT License](LICENSE).

### Authenticated content writes

Editor saves, deletes, asset metadata, and bulk translation saves use the existing
Express login session through `/api/content-write`. Visitor Convex queries remain
public. Direct Convex mutations require a separate server-only `CONVEX_WRITE_SECRET`.

Before deploying this change, generate a strong random credential and set the same
`CONVEX_WRITE_SECRET` in the museum Express runtime and the target Convex deployment
environment. For local Vite development put it in ignored `.env` together with
`ADMIN_PASSWORD` and `CONVEX_SELF_HOSTED_URL`; Vite uses the same authenticated API.
Docker Compose passes `.env`'s credential to the museum service. Set the Convex
**deployment** variable through its Dashboard environment settings, or supply its
value to `npx convex env set CONVEX_WRITE_SECRET` through stdin, using the existing
CLI credentials to select the target. This CLI command does not prompt for a missing value.
Setting an environment variable on the backend container alone does not configure
Convex functions. For production use the target deployment's CLI environment or
Dashboard environment settings, and the museum host's runtime environment settings.

Deploy the Convex mutation guards and museum application together. Missing or
mismatched credentials deliberately reject writes. Never use a `VITE_` variable,
Docker build argument, or browser-side credential. The trusted migration CLI also
requires `CONVEX_WRITE_SECRET` in ignored `.env`/`.env.local` or its process environment.
No deployed service is modified by the regression tests.
