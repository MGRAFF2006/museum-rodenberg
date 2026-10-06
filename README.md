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
- Password-protected administration and a visual content editor; database writes are internal and use authenticated server routes
- Convex-backed content with local JSON fallback data
- Docker Compose profiles for Convex, the app, the Convex dashboard, and LibreTranslate

## Requirements

- Node.js 22.12 or newer and npm 9 or newer
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

Never commit `.env` or `.env.local`. Set a strong `ADMIN_PASSWORD` before using administration.

## Production on the homelab

The production stack is `docker-compose.production.yml`: React/Express and Convex, persistent database/upload volumes, loopback-only ports 3003/3213, and an optional Cloudflare Tunnel. LibreTranslate starts only with `--profile translate`; existing translations remain available without it.

The current VM also runs LibreTranslate for curator translation buttons. Start or update it with `docker compose --env-file .env.production -f docker-compose.production.yml --profile translate up -d libretranslate`. It stays on the internal Docker network and is limited to two CPU cores and 4 GiB RAM.

```bash
cp .env.production.example .env.production
# Set a strong ADMIN_PASSWORD in this ignored file.
docker compose --env-file .env.production -f docker-compose.production.yml up -d convex-backend
# Save the generated key as CONVEX_SELF_HOSTED_ADMIN_KEY in .env.production.
docker compose --env-file .env.production -f docker-compose.production.yml exec convex-backend ./generate_admin_key.sh
docker compose --env-file .env.production -f docker-compose.production.yml run --rm --build convex-setup
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build museum
curl --fail http://127.0.0.1:3003/healthz
```

The browser defaults to its own origin at `/convex`, including WebSockets. Set `VITE_CONVEX_URL` only for a direct development backend. The production image excludes all environment/credential files and runs as the Node user. Schema deployment and frontend deployment must use matching code because admin mutations are now internal.

Public address: **https://museum.humunkulud.com**. With Cloudflare's `cloudflared` CLI, log in, create a tunnel named `museum-rodenberg`, and route `museum.humunkulud.com` to it. Save the tunnel UUID and the path to its JSON credential as `CLOUDFLARE_TUNNEL_ID` and `CLOUDFLARE_TUNNEL_CREDENTIALS_FILE` in `.env.production`. Keep the JSON file ignored and readable by container UID 1000. The checked-in ingress config routes only this hostname to the museum container. Then start:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml --profile public up -d
```

Cloudflare supports the Convex WebSocket connection. Keep API, Convex, admin, and health responses out of any custom “cache everything” rules. Hashed static assets have immutable caching; app HTML and the service worker revalidate. [Cloudflare Tunnel setup](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-local-tunnel/) and [WebSockets](https://developers.cloudflare.com/network/websockets/).

### Migrating the existing site

1. Freeze curator edits on the old deployment before the final copy. Export its database with `npx convex export --env-file <ignored-source-env> --path backups/convex.zip --include-file-storage`. Copy **live** `/uploads/` files separately; Express disk files are outside Convex storage.
2. Start the fresh backend and publish this schema. Import the snapshot with `docker compose --env-file .env.production -f docker-compose.production.yml run --rm -v "$PWD/backups:/backup:ro" convex-setup npx convex import /backup/convex.zip --yes`. Native exports preserve document IDs and every table. Use `--replace-all` only when deliberately replacing an existing target database.
3. Start the app, copy the matching uploads into its persistent volume, and preserve ownership as UID/GID 1000. If needed, repair ownership using a one-time helper container: `docker run --rm --user root -v museum-rodenberg_uploads:/uploads node:22-alpine chown -R 1000:1000 /uploads`. The app container itself has no capabilities.
4. Verify exhibition/artifact/translation counts, images/audio, detail pages, languages, admin save/delete, denied anonymous writes, and WebSocket subscriptions before routing the public hostname. QR codes using museum.humunkulud.com continue to work; codes using the Sevalla app hostname need updating.
5. Keep Sevalla available until the replacement is verified and the final copy is complete. Export one final recovery snapshot before removing the old app, database, and persistent disk in Sevalla to stop billing. Remove obsolete Sevalla deployment secrets from GitHub when retiring the old deployment.

### Backups and recovery

`bash scripts/backup-production.sh` saves a native Convex ZIP plus the matching uploads under `backups/`. It briefly stops the museum to freeze writes and restarts it even if export/copy fails. A failed export exits with an error. `npm run backup` is database-only; use the production script for a complete backup.

The systemd templates in `deploy/` run at 00:20 Europe/Berlin, before the homelab's encrypted backup. Install them as system units and enable `museum-backup@<operator>.timer`; they write to `/srv/homelab/dbdumps/museum`, which is already included in the homelab Restic backup. Snapshots accumulate here; existing disk-health monitoring should remain active. Whole-VM backups also cover the Docker volumes. Test restoration into a fresh isolated stack using the import and upload steps above. Do not delete production volumes with `docker compose down -v`.

## Checks

```bash
npm run typecheck
npm test -- --run
npm run build
```

GitHub Actions runs type checking, tests, and the production build. Deploy the schema on the VM using `convex-setup`, then rebuild the museum container with matching source. Production schema publishing from GitHub is disabled: the new backend is private, and old repository secrets may still target Sevalla.

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
