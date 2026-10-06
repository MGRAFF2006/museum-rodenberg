# Collection backups and recovery

`npm run backup` uses the installed Convex CLI to create an authenticated native
snapshot of **all tables**, with Convex file storage included. It also archives
`public/uploads`, the separate filesystem used by the museum upload API. Install
project dependencies and have `tar` available before running it. The archive
command ignores inherited `TAR_OPTIONS` so host settings cannot exclude uploads
or remove source files.

The command reads credentials with precedence: process environment, `.env.local`,
then `.env`. Local backups require `CONVEX_SELF_HOSTED_URL` and
`CONVEX_SELF_HOSTED_ADMIN_KEY`. Production backups require `CONVEX_PROD_URL` and
`CONVEX_PROD_ADMIN_KEY`; commented credentials are never selected. Keep keys in
ignored environment files or your existing secret manager, never command arguments.

```bash
npm run backup
npm run backup:prod -- --uploads-dir /path/to/mounted/production/uploads
npm run backup -- --output-dir /path/to/backup-storage
```

Production requires an explicit local path to the **production upload disk**.
Run on a host with that disk mounted, or mount a verified filesystem snapshot.
The command cannot fetch media from a remote app and cannot verify that a supplied
mount belongs to the selected backend. Never substitute repository seed uploads.

## Consistency and completion

The Convex ZIP is a point-in-time database snapshot. The upload archive is a
separate filesystem operation, **not** an atomic database/filesystem snapshot.
Pause all curator writes (including upload/delete, asset changes and content
edits) before starting, and keep them paused until completion to produce a
coherent recovery set. The script does not itself enforce that maintenance window.

A successful command creates one private directory under `backups/` containing:

- `convex.zip`: native table/file-storage snapshot, including document IDs.
- `uploads.tar.gz`: uploaded media, including nested files and symlinks as links.
- `manifest.json`: target URL, timings, consistency limits, file sizes and SHA-256.

The completed directory is published only after both archives succeed and the
manifest is written. Failures exit nonzero and remove that attempt's partial files.
A forcibly killed process can leave a `.incomplete-*` directory; do not restore it.
The command suppresses child CLI output to avoid leaking credentials; failures
identify the failing phase and exit status. Check connectivity/credentials/disk
space before retrying. The database snapshot excludes code, deployment environment
variables and pending scheduled functions: retain the matching source revision and
existing secret-manager/environment configuration separately.

Keep completed backups off the application disk using your existing backup
storage. This script does not schedule, rotate, encrypt or replicate backups.
Directories are private to the creating account, but archive contents may contain
museum data: restrict access and handle them accordingly.

## Recovery drill (isolated destination)

First verify both archive sizes and SHA-256 against `manifest.json`. For example,
run `sha256sum convex.zip uploads.tar.gz` inside the backup directory and compare
the results. Preserve the original archives; do not rewrite the ZIP.

Prepare a fresh, isolated self-hosted Convex deployment with the matching schema
and source revision. Set `CONVEX_SELF_HOSTED_URL` and
`CONVEX_SELF_HOSTED_ADMIN_KEY` to **that destination** in an ignored environment
file. Clear unrelated `CONVEX_DEPLOY_KEY` and `CONVEX_DEPLOYMENT` values. Then:

```bash
npx convex import --env-file /path/to/ignored/restore.env /path/to/backup/convex.zip
mkdir -p /path/to/isolated/restored/uploads
tar -xzf /path/to/backup/uploads.tar.gz -C /path/to/isolated/restored/uploads
```

The native import preserves IDs, creation times and relationships. Its default
rejects tables with existing data. Do not add replacement flags or restore against
production without a separate deliberate recovery decision and backup of its
current state. The old `scripts/migrate-to-convex.mjs` imports repository seed JSON;
it is **not** a restore tool for either these snapshots or previous JSON exports.

Configure the isolated app to use the restored backend and extracted upload disk.
Check exhibitions, artifacts, translations, featured selection, associations and
an admin-uploaded media file absent from git. Compare file hashes with the source
fixture. Only after this drill succeeds should you plan an actual recovery.

Native mechanism references:
[Convex backup/restore](https://docs.convex.dev/database/backup-restore),
[export](https://docs.convex.dev/database/import-export/export), and
[ZIP import](https://docs.convex.dev/database/import-export/import).

## Verified isolated recovery drill

On 2026-10-06, the native recovery path passed against two freshly created,
loopback-only self-hosted backends using Convex CLI 1.32.0 and backend image
`sha256:1cd901be5d7de21bdba700d69dc7e47e91e2e77d87e70356a16ea04fde22d6e8`.
Both deployments used the museum schema/functions from main commit `c09904a`
plus temporary fixture helpers. The source contained ten synthetic records across
all seven museum tables: one exhibition, one artifact, two translations of each,
one asset, one media row, and two settings rows. Relationships covered document
IDs, exhibition/artifact slugs and featured selection. The helpers also uploaded
one 41-byte native Convex storage file and created two filesystem uploads absent
from git, including a filename containing spaces and a nested file.

The drill ran the real `createBackup` implementation and its native
`convex export --path … --include-file-storage` command, verified archive sizes and
SHA-256 values against the manifest, then used the real default
`convex import convex.zip` against the empty destination. A complete query of all
seven restored tables exactly matched the source, including IDs, creation times,
translations and relationships. The restored native storage file and both
extracted filesystem uploads matched their original bytes. Source uploads
remained intact. Both owned backend containers, their anonymous volumes and the
temporary projects/archives were removed afterwards; existing museum containers,
volumes, credentials and data were untouched.

This verifies the native snapshot/import and filesystem archive mechanisms with
synthetic data. It does not verify a production backup, application browsing after
recovery, interrupted exports, large deployments or enforcement of the required
cross-system write freeze. The fixture regressions cover reported subprocess
failure, incomplete archive cleanup and unsafe inherited `TAR_OPTIONS` separately.
