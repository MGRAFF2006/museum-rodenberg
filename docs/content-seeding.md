# Initialize a local collection

The visitor app reads Convex queries. The files in `src/content` are seed inputs;
they are not an automatic fallback when a reachable deployment has no records.

1. Install dependencies with `npm ci`, copy `.env.example` to ignored `.env`, and
   set a strong `ADMIN_PASSWORD` and a separate random `CONVEX_WRITE_SECRET` there.
   Neither credential belongs in a `VITE_` variable or a committed file.
2. Start the local backend with `docker compose up -d convex-backend`. Generate
   its key with `docker compose exec convex-backend ./generate_admin_key.sh` and
   save it in ignored `.env.local` as `CONVEX_SELF_HOSTED_ADMIN_KEY`, alongside
   `CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210`. Confirm this points to the fresh
   local deployment you intend to initialize, rather than a production backend.
3. Run `npm run convex:push` to install its schema and functions.
4. Configure the identical `CONVEX_WRITE_SECRET` in the **Convex deployment's**
   environment settings. You can start the local Dashboard with
   `docker compose --profile dashboard up -d convex-dashboard`, open
   <http://localhost:6791>, and select that backend. Alternatively,
   `npx convex env set CONVEX_WRITE_SECRET` accepts the value through stdin; it
   does not prompt when run without a value in a terminal. Keep secret values out
   of command arguments and shell history. A backend container environment
   variable alone does not configure the environment seen by Convex functions.
5. Run the actual seed command:

   ```bash
   node scripts/migrate-to-convex.mjs
   ```

   It reads `src/content/assets.json`, `exhibitions.json`, and `artifacts.json`,
   saves their records, then sets the featured exhibition. It requires the
   server write secret from its process environment or ignored `.env.local`/`.env`.
   Each write is a separate mutation, so a failure can leave a partial seed.
   Inspect the error and target before retrying; a failed command is not a
   completed migration. Source asset URLs are metadata only: ensure the referenced
   uploaded files exist separately.
6. Run `npm run dev:full` and open <http://localhost:5173>. Check that the featured
   exhibition appears, its artifacts and German titles load, and a source QR code
   opens the corresponding record. The seed command prints source counts and
   prints its completion message only after all writes succeed.

Use seeding only for a fresh local deployment. Saves upsert matching identifiers,
so rerunning against curated data can overwrite edits. This is not a backup
restore command and does not reproduce a database snapshot. The former
`npx convex run migrate:run` action deliberately fails with guidance to the
`.mjs` command rather than reporting an import that never happened.
