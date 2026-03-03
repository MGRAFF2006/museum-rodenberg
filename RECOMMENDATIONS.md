# Museum Rodenberg - Recommendations & Roadmap

> Comprehensive analysis of improvements sorted by effect and effort.
> All recommendations are designed for **full self-hosting** with unreliable internet in mind.

---

## Current State Summary

| Aspect            | Current                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| Frontend          | React 18 + Vite 5 + Tailwind CSS + React Router 6                      |
| Backend           | Express 5 (production) + Vite dev plugin (shared API handler module)    |
| Data storage      | 3 JSON flat files (`exhibitions.json`, `artifacts.json`, `assets.json`) |
| Database          | None                                                                    |
| Admin             | Custom admin panel at `/admin` with TipTap editor + media library       |
| Auth              | Server-side session auth, token-based, 24h TTL                          |
| Translation       | 7 languages, LibreTranslate (self-hosted via Docker), embedded per-record |
| Media             | Static files in `public/uploads/`, asset registry in JSON               |
| PWA               | Service worker with CacheFirst for uploads                              |
| TypeScript        | Zero `any` types across entire `src/` directory                         |
| Deployment        | Dockerized (museum-app + LibreTranslate), docker-compose                |

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

### 3.1 Migrate to Self-Hosted Convex as Database

**Effect: HIGH | Effort: HIGH**

**Problem:** All data lives in 3 JSON flat files. Every read/write parses and
rewrites the entire file. No query capability, no indexing, no transactions,
risk of data corruption from concurrent writes. The `ContentContext` polls every
5 seconds in dev mode with `JSON.stringify` comparisons to detect changes.

**Why Convex:**
- **Self-hostable**: Convex is fully open-source (FSL Apache 2.0) and can be
  self-hosted via Docker. The backend stores state in a local SQLite database
  by default, so no external DB dependency is needed.
  (See: https://docs.convex.dev/self-hosting)
- **Reactive queries**: Convex's `useQuery` hook automatically re-renders
  components when underlying data changes via WebSocket subscriptions. This
  eliminates the need for polling or manual `refreshData()` calls -- the exact
  problem your current architecture has.
- **Real-time sync**: When an admin edits content, all connected visitors see
  updates immediately without page refresh. No more 5-second polling.
- **Type-safe**: Convex generates TypeScript types from your schema, replacing
  all the `as any` casts with proper end-to-end type safety.
- **ACID transactions**: Mutations are transactional with optimistic concurrency
  control. No risk of corrupted JSON files.
- **File storage**: Convex has built-in file storage, which could replace the
  `public/uploads/` + `assets.json` system.
- **Runs locally**: With Docker, the entire Convex backend runs on the same
  machine as your app. No internet dependency.

**Self-hosting setup:**
```bash
# Download docker-compose.yml from the Convex repo
# Start Convex backend + dashboard
docker compose up

# Generate admin key
docker compose exec backend ./generate_admin_key.sh

# In your project:
echo 'CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210' >> .env.local
echo 'CONVEX_SELF_HOSTED_ADMIN_KEY=<key>' >> .env.local

npm install convex@latest
npx convex dev
```

**Migration plan:**

#### Phase 1: Define Convex Schema
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  exhibitions: defineTable({
    slug: v.string(),           // URL-friendly ID
    qrCode: v.string(),
    image: v.string(),          // asset reference
    dateRange: v.optional(v.string()),
    location: v.optional(v.string()),
    curator: v.optional(v.string()),
    organizer: v.optional(v.string()),
    sponsor: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    enabledAttributes: v.optional(v.array(v.string())),
    isFeatured: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_qrCode", ["qrCode"]),

  exhibition_translations: defineTable({
    exhibitionId: v.id("exhibitions"),
    language: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.string(),
    detailedContent: v.optional(v.string()), // markdown
  })
    .index("by_exhibition", ["exhibitionId"])
    .index("by_exhibition_lang", ["exhibitionId", "language"]),

  artifacts: defineTable({
    slug: v.string(),
    qrCode: v.string(),
    exhibitionId: v.optional(v.id("exhibitions")),
    image: v.string(),
    materials: v.optional(v.array(v.string())),
    dimensions: v.optional(v.string()),
    provenance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    enabledAttributes: v.optional(v.array(v.string())),
  })
    .index("by_slug", ["slug"])
    .index("by_qrCode", ["qrCode"])
    .index("by_exhibition", ["exhibitionId"]),

  artifact_translations: defineTable({
    artifactId: v.id("artifacts"),
    language: v.string(),
    title: v.string(),
    period: v.optional(v.string()),
    artist: v.optional(v.string()),
    description: v.string(),
    significance: v.optional(v.string()),
    detailedContent: v.optional(v.string()),
  })
    .index("by_artifact", ["artifactId"])
    .index("by_artifact_lang", ["artifactId", "language"]),

  assets: defineTable({
    name: v.string(),
    alt: v.string(),
    url: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("other")
    ),
  }),

  media: defineTable({
    parentType: v.union(v.literal("exhibition"), v.literal("artifact")),
    parentId: v.string(),  // Convex ID of parent
    mediaType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("audio")
    ),
    url: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  }).index("by_parent", ["parentType", "parentId"]),
});
```

#### Phase 2: Write Convex Functions
```typescript
// convex/exhibitions.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("exhibitions").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exhibitions")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const findByQRCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const exhibition = await ctx.db
      .query("exhibitions")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first();
    if (exhibition) return { type: "exhibition", item: exhibition };

    const artifact = await ctx.db
      .query("artifacts")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first();
    if (artifact) return { type: "artifact", item: artifact };

    return null;
  },
});
```

#### Phase 3: Update React Frontend
Replace `ContentContext.tsx` with Convex hooks:

```typescript
// Before (polling JSON):
const exhibitions = useContent().exhibitions;

// After (reactive Convex):
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
const exhibitions = useQuery(api.exhibitions.list);
```

Wrap the app with `ConvexProvider`:
```typescript
import { ConvexProvider, ConvexReactClient } from "convex/react";
const convex = new ConvexReactClient("http://127.0.0.1:3210"); // self-hosted

root.render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);
```

#### Phase 4: Remove Old Data Layer
- Delete `src/content/*.json` (data lives in Convex)
- Remove JSON read/write from `server/index.js`
- Remove `scripts/dev-server-plugin.ts` (Convex replaces it)
- Simplify Express server to only serve static files + proxy translation
- Keep admin components but rewire them to use `useMutation` from Convex

**What stays unchanged:**
- All public-facing React components (HomePage, ExhibitionDetail, etc.)
- Language/Accessibility contexts and hooks
- QR scanner, Text-to-Speech, Search
- PWA configuration
- Tailwind styles
- Translation utilities (markdown splitting, URL protection)

**Key benefit for your use case:** With Convex self-hosted via Docker on the
same machine, the WebSocket connection is `localhost` -- zero internet
dependency, instant reactivity, and the admin panel updates are reflected to
all visitors in real-time.

### 3.2 Full PWA Offline Support for Content

**Effect: HIGH | Effort: HIGH**

**Problem:** Your PWA caches uploaded media (images/audio) but content data
and the app shell are not fully offline-capable. Given the unreliable internet
at your deployment site, the museum app should be usable even when completely
offline.

**Solution (after Convex migration):**
- Convex client handles reconnection automatically when connection drops
- For true offline support, use a service worker to precache the app shell
  and critical content data
- Implement a background sync queue for admin writes when offline
- The Convex WebSocket client will automatically retry and sync when
  connectivity returns

**Solution (before Convex migration):**
- Configure the Vite PWA plugin to precache `exhibitions.json`,
  `artifacts.json`, and `assets.json` as part of the build
- Add a NetworkFirst strategy for API calls so the app uses cached content
  when offline but gets fresh data when online

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

### Phase 3: Architecture (Do Next)
| #   | Change                                 | Effect | Effort |
| --- | -------------------------------------- | ------ | ------ |
| 3.1 | Migrate to self-hosted Convex          | HIGH   | HIGH   |
| 3.2 | Full PWA offline support               | HIGH   | HIGH   |
| 3.3 | SSR / Pre-rendering (optional)         | MEDIUM | HIGH   |

### Phase 4: Decided Against
| Option              | Reason                                                    |
| ------------------- | --------------------------------------------------------- |
| Switch to a CMS     | Custom admin already works; CMS adds complexity, no gain  |
| Cloud-hosted Convex | Internet unreliable; self-hosted Convex is the right call |
| Cloud-hosted DB     | Same internet problem; local-first is mandatory           |

---

## Deployment Target Architecture

```
 Docker Host (your server, no internet required)
 +-------------------------------------------------+
 |                                                 |
 |  +-------------------+  +--------------------+  |
 |  | museum-app        |  | convex-backend     |  |
 |  | (Node + Express)  |  | (self-hosted)      |  |
 |  | :3000             |  | :3210 (backend)    |  |
 |  |                   |  | :3211 (http acts)  |  |
 |  +-------------------+  | :6791 (dashboard)  |  |
 |           |              +--------------------+  |
 |           |                       |              |
 |  +-------------------+            |              |
 |  | libretranslate    |  +---------+----------+   |
 |  | :5000             |  | SQLite (embedded)  |   |
 |  +-------------------+  +--------------------+   |
 |                                                  |
 |  Volumes:                                        |
 |  - /uploads (media files)                        |
 |  - /convex-data (database)                       |
 |  - /lt-models (translation models)               |
 +-------------------------------------------------+
```

Everything runs on `localhost`. The museum app connects to Convex at
`http://127.0.0.1:3210` and LibreTranslate at `http://localhost:5000`.
Visitors connect to `http://<local-ip>:3000` over the local network.
Zero internet dependency for core functionality.
