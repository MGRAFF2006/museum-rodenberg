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
- Convex-backed content with local JSON fallback data
- Docker Compose profiles for Convex, the app, the Convex dashboard, and LibreTranslate

## Requirements

- Node.js 22.13 or newer (use a supported LTS release) and npm 9 or newer
- Docker with Docker Compose for the local Convex backend

## Local development

```bash
npm ci
cp .env.example .env
docker compose up -d convex-backend
docker compose exec convex-backend ./generate_admin_key.sh
```

Put the generated key in `.env.local` as `CONVEX_SELF_HOSTED_ADMIN_KEY`, then run:

```bash
npm run dev:full
```

The Vite application is available at <http://localhost:5173>. Use `npm run dev:full:all` to also start the Convex dashboard and LibreTranslate, or `npm run dev:docker` for the production-like Compose stack at <http://localhost:3000>.

Never commit `.env` or `.env.local`, and replace the example admin password before deploying.

## Checks

```bash
npx tsc --noEmit
npm test -- --run
npm run test:node
npm run build
```

The existing GitHub Actions workflow runs type checking, tests, and the production build. A push to `main` also publishes the Convex schema when the production secrets are configured.

`npm test` runs the visitor/application Vitest suites. `npm run test:node` also
runs native Node suites under `scripts/` and `server/`, including nested test
directories; it skips empty trees and excludes nested `node_modules`.

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

Licensed under the [GNU General Public License, version 2](LICENSE).

### Authenticated content writes

Editor saves, deletes, asset metadata, and bulk translation saves use the existing
Express login session through `/api/content-write`. Visitor Convex queries remain
public. Direct Convex mutations require a separate server-only `CONVEX_WRITE_SECRET`.

Before deploying this change, generate a strong random credential and set the same
`CONVEX_WRITE_SECRET` in the museum Express runtime and the target Convex deployment
environment. For local Vite development put it in ignored `.env` together with
`ADMIN_PASSWORD` and `CONVEX_SELF_HOSTED_URL`; Vite uses the same authenticated API.
Docker Compose passes `.env`'s credential to the museum service. Set the Convex
**deployment** variable in the target Convex Dashboard environment settings.
The CLI also supports reading the value from stdin; do not put credentials in shell
arguments or history.
Setting an environment variable on the backend container alone does not configure
Convex functions. For production use the target deployment's CLI environment or
Dashboard environment settings, and the museum host's runtime environment settings.

Deploy the Convex mutation guards and museum application together. Missing or
mismatched credentials deliberately reject writes. Never use a `VITE_` variable,
Docker build argument, or browser-side credential. The trusted migration CLI also
requires `CONVEX_WRITE_SECRET` in ignored `.env`/`.env.local` or its process environment.
No deployed service is modified by the regression tests.
