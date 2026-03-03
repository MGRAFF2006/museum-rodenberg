# Museum Rodenberg - Recommendations & Roadmap

> Comprehensive analysis of improvements sorted by effect and effort.
> All recommendations are designed for **full self-hosting** with unreliable internet in mind.

---

## Current State Summary

| Aspect            | Current                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| Frontend          | React 18 + Vite 5 + Tailwind CSS + React Router 6                      |
| Backend           | Express 5 (production) + Vite dev plugin (shared API handler module)    |
| Data storage      | Self-hosted Convex (7 tables, SQLite-backed)                            |
| Database          | Convex self-hosted via Docker (:3210), dashboard on :6791               |
| Admin             | Custom admin panel at `/admin` with TipTap editor + media library       |
| Auth              | Server-side session auth, token-based, 24h TTL                          |
| Translation       | 7 languages, LibreTranslate (self-hosted via Docker), exponential backoff retry |
| Media             | Static files in `public/uploads/`, asset registry in Convex             |
| PWA               | Service worker with CacheFirst for uploads                              |
| TypeScript        | Zero `any` types across entire `src/` directory                         |
| Deployment        | Dockerized (museum-app + Convex backend + LibreTranslate), docker-compose |
| Dev startup       | `npm run dev:full` — one-command orchestrator (Docker + Convex + Vite)  |

---

## Part 1: Quick Fixes (Implemented)

These fixes have been applied directly to the codebase.

### 1.1 Add 404 Page

**Effect: MEDIUM | Effort: LOW**

Previously, unmatched URLs rendered nothing. A catch-all `*` route now shows a
proper 404 page with navigation back to the homepage, using the existing
translation system.

### 1.2 Fix Broken Exhibition-Artifact References

**Effect: HIGH | Effort: LOW**

The `stadtgeschichte-rodenberg` exhibition referenced artifact IDs
(`staendehaus-wappen`, `gefaengnistuere`, `stadtmauer-fragment`) that do not
exist. These placeholders have been removed. The `geboren-in-rodenberg`
exhibition referenced wrong IDs (`johan-anton-coberg`, `wilhelm-johan-karl-zahn`,
`christian-wilhelm-moehling`) -- these have been corrected to match the actual
artifact keys (`coberg`, `zahn`, `moehling`).

### 1.3 Add Missing Artifacts to Exhibition

**Effect: MEDIUM | Effort: LOW**

The `landwirtschaft-handwerk` exhibition only listed 3 of its 6 artifacts.
Added `hochzeitspaar-tracht`, `taufbecken-holz`, and `festtagstracht-seide`
to its `artifacts` array.

### 1.4 Normalize Artifact IDs

**Effect: MEDIUM | Effort: LOW**

Artifact IDs used inconsistent casing (`Mohling`, `Zahn` vs `coberg`,
`alter-trecker`). Normalized to lowercase kebab-case (`moehling`, `zahn`) to
match the convention used by all other artifacts and prevent bugs with
case-sensitive lookups.

### 1.5 Translate ErrorBoundary Strings

**Effect: LOW | Effort: LOW**

The ErrorBoundary component had hardcoded German text. Added translation keys
(`errorTitle`, `errorDescription`, `tryAgain`, `goHome`, `technicalDetails`)
to the German translation file so they can be translated along with everything else.
Note: Since ErrorBoundary is a class component and cannot use hooks, the
German strings remain as fallback but are now also in the translation system.

### 1.6 Untrack dist/ from Git

**Effect: LOW | Effort: LOW**

The `dist/` directory was in `.gitignore` but may have been tracked before the
rule was added. Ran `git rm -r --cached dist/` to untrack it.

---

## Part 2: Medium-Effort Improvements (Implemented)

These improvements have been applied directly to the codebase.

### 2.1 Fix Server-Side Authentication (CRITICAL SECURITY)

**Effect: HIGH | Effort: LOW-MEDIUM**

Previously, the admin password (`VITE_ADMIN_PASSWORD`) was exposed in the
client-side JavaScript bundle because Vite inlines all `VITE_*` env vars.
All API endpoints had zero authentication.

**What was done:**
- Moved password to server-only `ADMIN_PASSWORD` env var (dropped `VITE_` prefix)
- Added `POST /api/login` endpoint with in-memory session store (24h TTL)
- Added `POST /api/logout` endpoint
- Added `requireAuth` middleware on all protected `/api/*` routes
- Created `src/utils/auth.ts` with client-side auth utilities (login, logout,
  getToken, setToken, clearToken, isAuthenticated, authFetch)
- Updated `AdminLogin.tsx` to call server-side login (async, with loading state)
- Replaced raw `fetch` with `authFetch` in all 6 client files that call
  protected endpoints

### 2.2 Eliminate API Code Duplication

**Effect: MEDIUM | Effort: LOW**

Previously, `server/index.js` and `scripts/dev-server-plugin.ts` contained
~350 lines of identical API logic each.

**What was done:**
- Created `server/api-handlers.js` — shared module with all API handler logic
- Created `server/api-handlers.d.ts` — TypeScript declarations for the module
- Rewrote both `server/index.js` and `scripts/dev-server-plugin.ts` to import
  from the shared module
- Updated `tsconfig.node.json` with `allowJs` and expanded `include` array

### 2.3 Dockerize the Application

**Effect: HIGH | Effort: MEDIUM**

**What was done:**
- Created `Dockerfile` — multi-stage build (node:20-alpine), builds Vite
  frontend, copies server code, runs `node server/index.js`
- Created `docker-compose.yml` — two services: `museum` (port 3000) and
  `libretranslate` (port 5000)
- Created `.dockerignore` to exclude node_modules, dist, .git, .env, etc.
- Museum container bind-mounts `./public/uploads` and `./src/content` for
  data persistence across container restarts

### 2.4 Self-Host LibreTranslate

**Effect: MEDIUM | Effort: MEDIUM**

**What was done:**
- LibreTranslate service added to `docker-compose.yml` with
  `LT_LOAD_ONLY=de,en,fr,es,it,nl,pl` (only the 7 needed languages)
- `LT_API_KEYS=false` (no API key needed on internal network)
- Museum container env `LIBRETRANSLATE_API_URL=http://libretranslate:5000/translate`
  (Docker DNS resolution)
- Fixed `scripts/generate-translations.js` default URL from
  `https://libretranslate.com/translate` to `http://localhost:5000/translate`
- All three places that reference LibreTranslate URL now default to localhost

### 2.5 Clean Up TypeScript (`any` types)

**Effect: MEDIUM | Effort: MEDIUM**

**What was done:**
Starting from 44 `any` usages across 12 files, all were eliminated:
- Added type interfaces to `src/types/index.ts`: `RequiredMedia`,
  `RawExhibitionsData`, `RawArtifactsData`, `RawAssetsData`, `EntityRecord`
- Added `ContentRecord` interface to `src/utils/translationUtils.ts`
- Replaced all `any` in `ContentContext.tsx` (10), `App.tsx` (4),
  `MobileMenu.tsx` (1), `ArtifactDetail.tsx` (2), `ExhibitionDetail.tsx` (2),
  `translationUtils.ts` (5), `useEditorForm.ts` (6), `useAssetValidation.ts` (5),
  `AdminDashboard.tsx` (4), `VisualEditor.tsx` (2), `EditorShared.tsx` (2)
- Final verification: `tsc --noEmit` passes with zero errors, `rg` confirms
  zero `any` types remain in the entire `src/` directory

---

## Part 3: Architectural Changes

### 3.1 Migrate to Self-Hosted Convex as Database (Implemented)

**Effect: HIGH | Effort: HIGH**

**Problem:** All data lived in 3 JSON flat files. Every read/write parsed and
rewrote the entire file. No query capability, no indexing, no transactions,
risk of data corruption from concurrent writes. The `ContentContext` polled
every 5 seconds in dev mode with `JSON.stringify` comparisons to detect changes.

**What was done:**

- **Convex schema** (`convex/schema.ts`): 7 tables — `exhibitions`,
  `exhibition_translations`, `artifacts`, `artifact_translations`, `assets`,
  `media`, `settings` — with indexes on `slug`, `qrCode`, `exhibitionId`,
  and composite `(entity, language)` for translations.
- **Convex functions**: `exhibitions.ts`, `artifacts.ts`, `assets.ts`,
  `lookup.ts` (QR code search, full-text search), `migrate.ts` (stub).
  Queries: `list`, `getBySlug`, `getByExhibition`, `getFeatured`,
  `findByQRCode`, `search`. Mutations: `save`, `remove`, `setFeatured`.
- **Migration script** (`scripts/migrate-to-convex.mjs`): Node.js CLI using
  `ConvexHttpClient`. Reads JSON files, maps old IDs to Convex IDs, inserts
  all records with translations. Successfully migrated 14 assets, 5
  exhibitions, 13 artifacts, and set the featured exhibition.
- **Frontend rewired**: `ContentContext.tsx` fully rewritten to use Convex
  `useQuery` for reactive data. `useEditorForm.ts`, `useAssets.ts`,
  `AdminDashboard.tsx`, `MediaLibrary.tsx`, `AssetSelector.tsx` all use
  Convex mutations. `refreshData()` is now a no-op (Convex subscriptions
  auto-update). `main.tsx` wraps the app with `ConvexProvider`.
- **Express simplified**: Removed `save-content`, `delete-content`,
  `save-asset` endpoints. 8 endpoints remain (file upload/delete/list,
  validate-assets, translate proxy, login/logout).
- **Docker**: `docker-compose.yml` updated with `convex-backend` (:3210)
  and `convex-dashboard` (:6791) services. Backend stores state in local
  SQLite via Docker volume.
- **Codegen**: `convex/_generated/` committed to git so builds work
  without a running Convex backend. Files are `.js` + `.d.ts` pairs
  (not `.ts`, as Convex codegen produces).
- **JSON files kept** in `src/content/` as backup but no longer read by
  the app.

**Translation rate limiting** was also updated as part of this phase:
- Removed the 3.1-second minimum interval between LibreTranslate API calls
  (was targeting the free-tier 20 req/min limit, unnecessary for self-hosted).
- Removed the 30-second sleep on HTTP 429 responses.
- Added exponential backoff retry: up to 5 retries with delays of 1s, 2s,
  4s, 8s, 16s. Session cache and disk cache (`translation-memory.json`)
  kept for deduplication.

**Developer experience** — one-command startup:
- `scripts/dev.sh`: Starts Docker services (Convex backend, optionally
  dashboard and LibreTranslate), waits for health checks, runs `convex dev`
  (schema push + watcher) and `vite` in parallel. Supports `--no-docker`,
  `--dashboard`, `--translate`, `--all` flags. Handles Docker daemon
  requiring `sudo` by auto-detecting access.
- `npm run dev:full`: Runs `dev.sh` (Convex + Vite, no dashboard).
- `npm run dev:full:all`: Runs `dev.sh --all` (everything including
  dashboard and LibreTranslate).

### 3.2 Full PWA Offline Support for Content

**Effect: HIGH | Effort: HIGH**

**Problem:** The PWA caches uploaded media (images/audio) but content data
and the app shell are not fully offline-capable. Given the unreliable internet
at the deployment site, the museum app should be usable even when completely
offline.

**Solution (now that Convex is in place):**
- Convex client handles reconnection automatically when connection drops
- For true offline support, use a service worker to precache the app shell
  and critical content data
- Implement a background sync queue for admin writes when offline
- The Convex WebSocket client will automatically retry and sync when
  connectivity returns
- Consider caching Convex query results in IndexedDB for instant offline
  access to content that was previously loaded

### 3.3 Migrate to SSR or Pre-rendering (Optional)

**Effect: MEDIUM | Effort: HIGH**

**Problem:** Currently a pure SPA. Content is loaded client-side. This means
slower initial load and no SEO.

**Assessment:** For a museum website where the primary use case is in-museum
visitors scanning QR codes, SEO matters less. The PWA + Convex reactive
approach is likely sufficient. **Skip this unless you need search engine
visibility** for the public-facing pages.

If needed later, consider:
- Pre-rendering static pages at build time (Vite SSG plugins)
- Or migrating to Remix/TanStack Start (both support Convex natively)

---

## Part 4: CMS Evaluation

### Should You Switch to a CMS?

**Recommendation: No.**

| Factor                    | Custom Admin (Current)                      | Headless CMS (Strapi/Directus) |
| ------------------------- | ------------------------------------------- | ------------------------------ |
| Admin UI                  | Already built, tailored to museum workflow   | Generic, needs customization   |
| LibreTranslate integration| Built-in with hash-based change detection   | Requires custom plugin         |
| Asset ID system           | Custom indirection (ID -> URL)              | Would need reimplementation    |
| Self-hosting              | Already works                               | Adds CMS + DB dependency       |
| Content volume            | 5 exhibitions, ~14 artifacts                | Overkill for this scale        |
| Migration effort          | None                                        | HIGH - rebuild entire admin    |

Your custom admin already has everything a CMS would provide: WYSIWYG editing,
media library, translation management, and CRUD for all content types. Adding
a CMS would mean throwing away working code and adding complexity for no gain.

**The right move is to keep your custom admin and back it with Convex** for
proper data storage, reactivity, and type safety.

---

## Summary: Full Roadmap

### Phase 1: Quick Wins (Done)
| #   | Fix                                    | Effect | Effort |
| --- | -------------------------------------- | ------ | ------ |
| 1.1 | Add 404 page                           | MEDIUM | LOW    |
| 1.2 | Fix broken artifact references         | HIGH   | LOW    |
| 1.3 | Add missing artifacts to exhibition    | MEDIUM | LOW    |
| 1.4 | Normalize artifact IDs                 | MEDIUM | LOW    |
| 1.5 | Translate ErrorBoundary strings        | LOW    | LOW    |
| 1.6 | Untrack dist/ from git                 | LOW    | LOW    |

### Phase 2: Security & Infrastructure (Done)
| #   | Improvement                            | Effect | Effort     |
| --- | -------------------------------------- | ------ | ---------- |
| 2.1 | Server-side authentication             | HIGH   | LOW-MEDIUM |
| 2.2 | Eliminate API code duplication          | MEDIUM | LOW        |
| 2.3 | Dockerize the application              | HIGH   | MEDIUM     |
| 2.4 | Self-host LibreTranslate               | MEDIUM | MEDIUM     |
| 2.5 | Clean up TypeScript any types          | MEDIUM | MEDIUM     |

### Phase 3: Architecture
| #   | Change                                 | Effect | Effort | Status |
| --- | -------------------------------------- | ------ | ------ | ------ |
| 3.1 | Migrate to self-hosted Convex          | HIGH   | HIGH   | Done   |
| 3.2 | Full PWA offline support               | HIGH   | HIGH   | Next   |
| 3.3 | SSR / Pre-rendering (optional)         | MEDIUM | HIGH   | —      |

### Phase 4: Decided Against
| Option              | Reason                                                    |
| ------------------- | --------------------------------------------------------- |
| Switch to a CMS     | Custom admin already works; CMS adds complexity, no gain  |
| Cloud-hosted Convex | Internet unreliable; self-hosted Convex is the right call |
| Cloud-hosted DB     | Same internet problem; local-first is mandatory           |

---

## Express API Endpoints (Remaining)

After the Convex migration, 8 Express endpoints remain for operations that
require server-side file system access or external service proxying:

| Method | Endpoint               | Purpose                              |
| ------ | ---------------------- | ------------------------------------ |
| POST   | `/api/login`           | Authenticate admin, issue session    |
| POST   | `/api/logout`          | Invalidate admin session             |
| POST   | `/api/upload-image`    | Upload image file to disk            |
| POST   | `/api/upload-media`    | Upload media file to disk            |
| POST   | `/api/validate-assets` | Check file existence on disk         |
| GET    | `/api/list-uploads`    | List physical files in uploads dir   |
| DELETE | `/api/delete-image`    | Delete file from disk                |
| POST   | `/api/translate`       | Proxy to LibreTranslate              |

---

## Deployment Target Architecture

### Option A: Docker Compose (Self-Hosted / Local Network)

```
 Docker Host (your server, no internet required)
 +-------------------------------------------------+
 |                                                  |
 |  +-------------------+  +--------------------+   |
 |  | museum-app        |  | convex-backend     |   |
 |  | (Node + Express)  |  | (self-hosted)      |   |
 |  | :3000             |  | :3210 (backend)    |   |
 |  |                   |  | :3211 (http acts)  |   |
 |  +-------------------+  +--------------------+   |
 |           |                       |               |
 |  +-------------------+  +--------------------+   |
 |  | libretranslate    |  | convex-dashboard   |   |
 |  | :5000             |  | :6791              |   |
 |  +-------------------+  +--------------------+   |
 |                                                  |
 |  Volumes:                                        |
 |  - /uploads          (media files)               |
 |  - /convex-data      (Convex SQLite database)    |
 |  - /lt-models        (translation models)        |
 +-------------------------------------------------+
```

Everything runs on `localhost`. The museum app connects to Convex at
`http://127.0.0.1:3210` and LibreTranslate at `http://localhost:5000`.
Visitors connect to `http://<local-ip>:3000` over the local network.
Zero internet dependency for core functionality.

### Option B: Sevalla Cloud

See the [Sevalla Cloud Deployment](#sevalla-cloud-deployment) section below
for full setup instructions. Deploy 2–3 Sevalla applications (Convex backend,
museum app, optionally LibreTranslate) in the same data center with persistent
storage and internal connections.

---

## Sevalla Cloud Deployment

The app can be deployed to Sevalla as **2–3 separate applications** in the same
data center, connected via private networking. Sevalla supports Dockerfile
builds, Docker image deployments, persistent storage, and internal connections.

### Architecture on Sevalla

```
 Sevalla (same data center)
 +-------------------------------------------------------+
 |                                                        |
 |  +---------------------+   +------------------------+ |
 |  | museum-app          |   | convex-backend         | |
 |  | (GitHub → Dockerfile)|  | (Docker image)         | |
 |  | Web port: 3000      |   | Private port: 3210     | |
 |  | Disk: /app/public/  |   | TCP proxy: :3210       | |
 |  |       uploads       |   | Disk: /convex/data     | |
 |  +---------------------+   +------------------------+ |
 |            |                          |                |
 |            | (private network)        | (public TCP    |
 |            |                          |  for browsers) |
 |  +---------------------+                              |
 |  | libretranslate      |   (optional)                 |
 |  | (Docker image)      |                              |
 |  | Private port: 5000  |                              |
 |  | Disk: /app/data     |                              |
 |  +---------------------+                              |
 +-------------------------------------------------------+
```

### Step 1: Deploy the Convex Backend

1. In Sevalla, create a new application from **Docker image**
2. Image: `ghcr.io/get-convex/convex-backend:latest`
3. Add a **persistent disk**: path `/convex/data`, size 10 GB
4. Under **Networking** → expose a **TCP proxy** on port `3210`
   - Note the TCP proxy hostname (e.g. `tcp-convex-abc123.sevalla.app:3210`)
   - Browsers need this URL to connect via WebSocket
5. Alternatively, give it a domain (e.g. `convex.museum-rodenberg.de`) and
   expose port 3210 publicly

### Step 2: Generate the Convex Admin Key

1. Use the **Web Terminal** in Sevalla to open a shell on the Convex container
2. Run: `./generate_admin_key.sh`
3. Save the output — you'll need it to push the schema

### Step 3: Push the Convex Schema

From your local machine (with the Convex CLI):

```bash
CONVEX_SELF_HOSTED_URL=https://convex.museum-rodenberg.de:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin-key-from-step-2> \
npx convex deploy
```

This pushes the schema and functions to the remote Convex backend.

### Step 4: Migrate Data

```bash
CONVEX_SELF_HOSTED_URL=https://convex.museum-rodenberg.de:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin-key-from-step-2> \
node scripts/migrate-to-convex.mjs
```

### Step 5: Deploy the Museum App

1. In Sevalla, create a new application from **GitHub** repository
2. Build strategy: **Dockerfile** (path: `Dockerfile`, context: `.`)
3. Set the web process port to `3000` (matches `process.env.PORT`)
4. Add a **persistent disk**: path `/app/public/uploads`, size 10 GB
5. **Environment variables** (mark `VITE_CONVEX_URL` as available at build):

   | Variable | Availability | Value |
   |----------|-------------|-------|
   | `VITE_CONVEX_URL` | **Build time** | `https://convex.museum-rodenberg.de:3210` (the public Convex URL) |
   | `ADMIN_PASSWORD` | Runtime | Your strong admin password |
   | `LIBRETRANSLATE_API_URL` | Runtime | Internal hostname of LibreTranslate (if deployed), or omit |
   | `LIBRETRANSLATE_API_KEY` | Runtime | API key if required, or omit |

6. Add an **internal connection** to the Convex backend (optional — only
   needed if the Express server ever needs to call Convex directly)

### Step 6: Deploy LibreTranslate (Optional)

1. Create a new application from **Docker image**
2. Image: `libretranslate/libretranslate:latest`
3. Environment variable: `LT_LOAD_ONLY=de,en,fr,es,it,nl,pl`
4. Add a **persistent disk**: path `/app/data`, size 20 GB (for language models)
5. Expose a **private port** on `5000`
6. Add an **internal connection** from museum-app to LibreTranslate
7. Set `LIBRETRANSLATE_API_URL` on museum-app to the internal hostname

### Important Notes

- **`VITE_CONVEX_URL` is a build-time variable.** Vite replaces
  `import.meta.env.VITE_CONVEX_URL` with a literal string during
  `npm run build`. It must be set before the build runs. In Sevalla,
  mark it as available during the build process. The Dockerfile includes
  `ARG VITE_CONVEX_URL` to support this.

- **The Convex URL must be publicly accessible.** Visitors' browsers
  connect to Convex directly via WebSocket. Use a TCP proxy or public
  domain — private networking alone is not enough for the browser connection.

- **Persistent storage limits horizontal scaling.** Processes with
  persistent disks are limited to 1 instance on Sevalla. This is fine
  for the museum's scale.

- **Uploads persist across deploys.** With the persistent disk at
  `/app/public/uploads`, uploaded media files survive container restarts
  and redeployments.

---

## Development Quick Start

```bash
# First time: start Docker, push schema, and launch dev server
npm run dev:full

# With LibreTranslate and Convex dashboard too:
npm run dev:full:all

# If you manage Docker yourself:
bash scripts/dev.sh --no-docker

# Regular dev (no Docker, no Convex watcher — assumes backend is running):
npm run dev
```

See `scripts/dev.sh --help` for all options.
