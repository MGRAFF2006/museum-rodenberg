# QR identity preflight

Nonblank QR values identify one artifact or exhibition across both collections.
Matching stays exact and case sensitive, as in the existing lookup. Empty or
whitespace-only values carry no QR identity and do not resolve a scan.

Both save mutations check both indexed QR ranges before making any writes. A
conflict returns the safe `QR_CONFLICT` code through the admin API. The editor
keeps the draft and asks for another code; this does not trigger the stale draft
reload instructions. Existing revision/document ID checks remain required.

Before deploying, inspect the existing data with the read-only checker:

```sh
node scripts/preflight-content.mjs --seeds
node scripts/preflight-content.mjs --export-dir /path/to/extracted-export
```

The extracted export must contain `exhibitions/documents.jsonl` and
`artifacts/documents.jsonl`. The script reads local files only; it does not load
credentials, contact a backend, change records, or backfill revisions. Its output
lists conflicting QR values with their collection and slug. Keep private exports
and their output outside git.

Exit status: `0` means no duplicates, `1` means duplicates, and `2` means the
input could not be checked. Both collections are required, including empty ones.
Committed seeds are not evidence that deployed data is clean.

Review duplicate assignments before deployment. The guard does not rewrite
historical values or change QR labels. After deployment, an existing duplicate
can be repaired by saving one affected record with an unused QR value. Saving it
with its conflicting value remains rejected even when only another field was
edited. Deploy the compatible editor/API together with the backend; this PR
stacks on the content revision contract.
