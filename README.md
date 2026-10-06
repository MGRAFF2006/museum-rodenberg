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

- Node.js 18 or newer and npm 9 or newer
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
npm run build
```

The existing GitHub Actions workflow runs type checking, tests, and the production build. A push to `main` also publishes the Convex schema when the production secrets are configured.

## Backups and recovery

Pause all curator and import writes before creating a complete backup. The script
does not stop services or enforce that pause itself. On the host with the matching
live upload directory, run:

```bash
npm run backup -- --writes-paused
# Set CONVEX_PROD_URL and CONVEX_PROD_ADMIN_KEY in the environment for production:
npm run backup:prod -- --writes-paused --uploads-dir /path/to/live/uploads
```

Backups contain a native Convex `convex.zip`, the Express `uploads/` files, and a
`manifest.json` written only after both succeed. An incomplete directory has no
manifest and must not be treated as a successful backup. Environment precedence
is process variables, then `.env.local`, then `.env`. Credentials are required;
the script does not guess a production target. Keep backups private. Upload sources
must contain regular files/directories, without symbolic links or special files.

`npm run backup -- --database-only` explicitly exports only the database and
Convex-managed file storage, excluding Express uploads. Native snapshots preserve
document IDs and relationships. The seed importer is not a restore tool.

Test recovery in a fresh isolated deployment with matching schema: run
`npx convex import --env-file /path/to/ignored-recovery.env /path/to/backup/convex.zip`,
then copy `uploads/` to that deployment's upload volume while its app is stopped.
The environment file must contain the recovery target's self-hosted URL and admin
key. Do not add replacement flags unless deliberately replacing existing data.
Compare record counts, relationships, translations, file checksums, and media
playback before accepting recovery. This command writes data; never target
production during a recovery drill.

Run orchestration regression checks with `node --test scripts/backup-convex.test.mjs`.
See Convex's [export](https://docs.convex.dev/database/import-export/export) and
[restore](https://docs.convex.dev/database/import-export/import) documentation.

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
