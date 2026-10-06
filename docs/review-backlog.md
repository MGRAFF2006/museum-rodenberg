# Consolidated review implementation backlog

Baseline: `26133b5` (`origin/main`), rechecked 2026-10-06. This document preserves the final thread's F01–F103 and opportunity O01–O07, plus every ID in the previously published 111-finding/seven-opportunity backlog. `legacy:Oxx` means an operational finding from that earlier inventory; unprefixed Oxx means a future-work opportunity from the final report. Alias columns deduplicate shared causes without removing their acceptance criteria.

**Statuses:** actionable; already resolved (on main); unsupported; blocked; requiring a decision. An open PR or pushed branch remains actionable pending review/merge, never already resolved. Branches listed without PR numbers are tested/pushed proposals awaiting GitHub API authentication. No merges, deployment, production data writes, or shared-history rewrite are authorized.

Current public PRs checked: #3 authorization, #4 hydration/defaults/featured conversion, #5 public details, #6 static routing, #7 backlog, #8 membership, #9 login throttling. Main contains none of #3–#9. The separate hosting branch proposes overlapping infrastructure changes but is not main; reconcile before editing the same behavior. Native browser navigation is unavailable; camera, codecs, assistive technology, production configuration and a true isolated database restore remain explicit validation limits.

## Findings and acceptance ownership

| ID | Distinct behavior | Preserved aliases | Status | Work / evidence / prerequisite |
| --- | --- | --- | --- | --- |
| F01 | Unauthenticated content writes | B01 | actionable | PR #3 |
| F02 | Development API authentication bypass | B02 | actionable | PR #3 |
| F03 | Upload write failure and premature completion | B09 | actionable | fix/review-upload-safety; await PR authentication |
| F04 | Upload filename/ID collisions and stale mutable URLs | B07, B08, B31 | actionable | fix/review-upload-safety |
| F05 | Active same-origin uploaded documents | B04 | actionable | fix/review-upload-safety; existing volume requires passive-format check |
| F06 | Editor paste-handler XSS dependency | — | actionable | fix/patch-editor-paste-security |
| F07 | Failed backups falsely report success | legacy:O02 | actionable | fix/review-backup-recovery |
| F08 | Backup output incompatible with documented restore | legacy:O03 | actionable | fix/review-backup-recovery; isolated native restore drill outstanding |
| F09 | Backups omit upload bytes | legacy:O04 | actionable | fix/review-backup-recovery |
| F10 | Visitor queries omit all detailed content | V01 | actionable | PR #5 |
| F11 | Upload resource/filename limits | B10, B11 | actionable | fix/review-upload-safety; development body limit separately verified |
| F12 | Unbounded login attempts | B03 | actionable | PR #9; production parser ordering follow-up |
| F13 | Development ports/default credentials exposed | legacy:O12, legacy:O21 | actionable | actionable; coordinate hosting proposal before Compose edits |
| F14 | Dependency advisory debt | legacy:O11 | actionable | actionable; F06 patch first, remaining reachability/version review |
| F15 | Optional fields and removed translations cannot clear | B15, B16 | actionable | actionable; admin data-contract work |
| F16 | Artifact membership inconsistencies | B17 | actionable | PR #8 |
| F17 | Used assets can be deleted | B13 | actionable | actionable; usage guard across registered IDs and URLs |
| F18 | File/metadata partial failure not retryable | B12 | actionable | actionable; idempotent file deletion and UI result handling |
| F19 | Omitted media erases existing gallery | — | actionable | actionable; preserve absent versus explicit empty gallery |
| F20 | Async editor hydration missing | A01 | actionable | PR #4 |
| F21 | Blank new image rows cannot update/remove | A03 | actionable | fix/editor-gallery-rows; base PR #4 |
| F22 | Visual audio/video serialization incompatible | A13 | actionable | actionable; actual Tiptap round trip |
| F23 | Picker lacks upload bearer | B05 | actionable | PR #3 |
| F24 | Upload-image alias routes to 404 | B06 | actionable | PR #3 |
| F25 | Asset IDs bypass validation | A09 | actionable | fix/editor-asset-validation |
| F26 | Translation freshness shared across languages | T01 | actionable | actionable; target-specific freshness |
| F27 | Bulk translation omits detailed text/artist | A07 | actionable | actionable; full-record bulk source and aligned fields |
| F28 | Visible metadata controls do not persist | A04, A05 | actionable | fix/editor-metadata-controls |
| F29 | Save/delete races translation | — | actionable | actionable; operation serialization |
| F30 | Stale full-record saves overwrite newer edits | B21 | actionable | actionable; user approved stale-save rejection on 2026-10-06 |
| F31 | Unsaved editor navigation loses draft | A11 | actionable | actionable; dirty-navigation guard |
| F32 | Media operations advance on failed outcomes | B32 | actionable | actionable; PR #3 covers picker partly, remaining library/reauth state |
| F33 | Translation URL placeholder corruption | B23, B24, B25 | actionable | actionable; backend translation work |
| F34 | Translation timeout/cancellation/retry errors | B26, B27 | actionable | actionable; backend transport work |
| F35 | Out-of-order language responses overwrite state | V08 | actionable | fix/review-language-loading |
| F36 | Failed language retains previous dictionary | V09 | actionable | fix/review-language-loading |
| F37 | Generator marks failed translations fresh | T03 | actionable | actionable; failed-target cache policy |
| F38 | Missing mobile media parameter opens blank tab | V03 | actionable | fix/review-visitor-media |
| F39 | Audio/video-only gallery starts empty | V05 | actionable | fix/review-visitor-media |
| F40 | Mobile gallery loses clicked item | V04 | actionable | fix/review-visitor-media |
| F41 | Markdown custom media protocols stripped | V02 | actionable | fix/review-markdown-media-links |
| F42 | Speech error permanently blocks retry | V15 | actionable | actionable; speech retry |
| F43 | Audio playback rejection ignored | V16 | actionable | actionable; media-event state and useful error |
| F44 | Cards/search ignore disabled attributes | V10 | actionable | actionable; consistent presentation policy |
| F45 | Loading/unavailability presented as missing content | V12 | actionable | actionable; genuine data-state distinctions |
| F46 | Visitor actions inaccessible by keyboard | V23 | actionable | actionable; native controls and behavior tests |
| F47 | Overlays lack dialog focus/Escape semantics | V24 | actionable | actionable; shared native dialog behavior |
| F48 | Controls missing accessible names/states | V25 | actionable | actionable; named form and media controls |
| F49 | Document language remains English | V26 | actionable | fix/review-language-loading |
| F50 | CI typecheck processes zero files; lint absent | legacy:O01, legacy:O16 | actionable | actionable; checks must fail on source errors |
| F51 | Node requirement conflicts with tooling | legacy:O10 | actionable | actionable; align tested minimum/runtime |
| F52 | Browser backend URL baked as localhost | legacy:O08 | actionable | actionable; same-origin connection |
| F53 | Compose setup modifies host checkout | legacy:O09 | actionable | actionable; isolate install/config writes |
| F54 | Backups lack consistent database snapshot | legacy:O05 | actionable | fix/review-backup-recovery; media requires operator write pause |
| F55 | Stored artifact display order ignored | — | actionable | actionable; ordered membership projection |
| F56 | Featured flag and setting disagree | B19, A06 | actionable | PR #4 covers conversion only; backend integrity actionable |
| F57 | Featured deletion selects deleted replacement | B18 | actionable | actionable; replacement excludes removed record |
| F58 | Editor image previews use unresolved IDs | A15 | actionable | actionable; resolve display while retaining identity |
| F59 | Translation hashes not persisted | T02 | actionable | actionable; optional target-specific schema contract |
| F60 | Tags/materials cannot be authored | — | actionable | fix/editor-array-metadata |
| F61 | New record visibility defaults incorrect | A02 | actionable | PR #4, including regression |
| F62 | Clipboard falsely reports success | A12 | actionable | fix/media-clipboard-feedback |
| F63 | Duplicate Tiptap extensions | — | actionable | actionable; configure each extension once |
| F64 | Search pushes duplicate history | V13 | actionable | actionable; visitor search work |
| F65 | Padded query fails matches | V14 | actionable | actionable; visitor search work |
| F66 | StrictMode resets accessibility settings | V17 | actionable | actionable; validated lazy preference initialization |
| F67 | Detailed fallback has no read-more entry | — | actionable | PR #5; verify fallback independently |
| F68 | Description visibility hides detailed entry | — | actionable | PR #5 |
| F69 | Underline escapes as literal HTML | A14 | actionable | actionable; safely supported formatting contract |
| F70 | Links lack visible focus | V30 | actionable | actionable; retain native visible focus |
| F71 | Used translation keys absent | V27 | actionable | actionable; source and target key coverage |
| F72 | Hardcoded visitor labels | V28 | actionable | actionable; localized labels and provider-independent recovery |
| F73 | Gallery image alternative text discarded | — | actionable | actionable; registry metadata reaches rendered images |
| F74 | Live gallery invalidates selection | V07 | actionable | fix/review-visitor-media |
| F75 | Speech outlives dismissed source | — | actionable | actionable; source lifecycle cancellation |
| F76 | Malformed stored speech preferences | — | actionable | actionable; validate bounded defaults |
| F77 | Denied storage breaks optional preferences | V18, V19 | actionable | fix/review-language-loading covers language only; other settings actionable |
| F78 | QR async cleanup races replacement | V20, V21 | actionable | actionable; serialize lifecycle, actual camera validation outstanding |
| F79 | Mobile menu cannot scroll | V29 | actionable | actionable; bounded scroll region |
| F80 | Mobile WebM falsely declared MP4 | V34 | actionable | fix/review-visitor-media |
| F81 | Navigation scroll reset/restoration absent | — | actionable | actionable risk; real-browser reproduction required |
| F82 | High-contrast selected controls lose contrast | V31 | actionable | actionable; paired surface/text policy |
| F83 | Partial translation suppresses fallback | — | actionable | actionable; field-level completeness |
| F84 | Seed museum translations incomplete | — | requiring a decision | requiring a decision; curated content needs bilingual editorial approval |
| F85 | Seed audio syntax unrecognized | — | actionable | actionable; correct committed asset reference |
| F86 | URL query/fragment breaks media detection | V33 | actionable | actionable; pathname-aware classification |
| F87 | Root HTML has wrong cache policy | B30 | actionable | PR #6 |
| F88 | Missing uploads/API return cacheable SPA HTML | B29 | actionable | PR #6 |
| F89 | Lint command crashes | legacy:O19 | actionable | actionable; compatible tooling without suppressing useful rules |
| F90 | Fresh setup never imports museum seeds | legacy:O20 | actionable | actionable; explicit bootstrap documentation |
| F91 | README promises nonexistent JSON fallback | — | actionable | actionable; correct claim, no implicit fallback architecture |
| F92 | Translation CLI failure exits successfully | — | actionable | actionable; nonzero exit on incomplete generation |
| F93 | Removed source leaves stale targets | — | actionable | actionable; source-removal propagation |
| F94 | Migration documentation points to stub | B33 | actionable | actionable; remove misleading entrypoint/docs |
| F95 | Schema helper rejects documented flags | legacy:O06 | actionable | actionable; schema-tool work |
| F96 | Schema helper matches brittle credential patterns | legacy:O06 | actionable | actionable; explicit target credentials |
| F97 | Older CI run can deploy last | legacy:O18 | actionable | actionable; serialize/stale-run guard, no deployment performed |
| F98 | Mutable latest service tags | — | requiring a decision | requiring a decision; verify/pin actual deployed service versions without pulling production |
| F99 | Entrypoint ignores failed seed initialization | — | actionable | actionable; deliberate startup failure |
| F100 | Development supervisor loses child failure | legacy:O15 | actionable | actionable; first-exit supervision |
| F101 | Missing manifest/favicons | — | actionable | actionable; existing vector asset export/reference |
| F102 | README license disagrees with LICENSE | legacy:O14 | actionable | fix/license-documentation |
| F103 | Tests miss consequential boundaries | V35 | actionable | actionable; add regressions with fixes; hash oracle still needed |

## Additional preserved findings

These IDs have no exact F-series counterpart. They remain separate rather than being silently dropped or claimed as covered by a nearby fix.

| ID | Distinct behavior | Status | Work / evidence / prerequisite |
| --- | --- | --- | --- |
| B14 | Directories validate as media files | actionable | Reject directories as valid media; server file-type regression |
| B20 | Duplicate QR codes resolve inconsistently | requiring a decision | Cross-type QR uniqueness requires existing-data preflight; do not change published identifiers silently |
| B22 | Listing queries scan unrelated translation/media rows | actionable | Measure related-row reads on representative collections before query optimization |
| B28 | Built uploads mask persistent uploads | actionable | PR #6 serves persistent uploads before built seed media |
| A08 | Empty or unsafe content identity can be saved | actionable | Reject empty/unsafe new identities without silently rewriting existing published slugs |
| A10 | Saving during translation publishes partial work | actionable | Reverify distinct behavior before implementation |
| T04 | Generator translates Markdown destinations | actionable | Protect generator Markdown destinations; actual echo-translator regression |
| T05 | Translation generator updates seeds rather than live content | unsupported | Not a runtime defect: the generator intentionally edits seed JSON. Document that boundary; live content translation is admin work F27 |
| V06 | Markdown media is absent from opened gallery | actionable | fix/review-visitor-media includes Markdown-only gallery selection |
| V11 | Sponsor is never rendered | actionable | Verify enabled sponsor rendering from existing global metadata |
| V22 | Routine scan misses flood console | actionable | Routine QR scan misses must not flood logs; verify actual callback contract |
| V32 | Markdown URLs containing parentheses are truncated | actionable | Parenthesized Markdown destinations need proper parsing regression |
| V36 | Duplicate prop contracts drift | actionable | Verify actual divergent shared prop contracts before changing code; prefer one existing type |
| V37 | TranslationWarning conditionally calls a hook | actionable | Move context-only hook above early return; do not claim a reproduced runtime crash |
| legacy:O07 | Schema push can overwrite local frontend configuration | actionable | Schema CLI must never rewrite frontend configuration; explicit target-env isolation |
| legacy:O13 | CI schema deployment is not gated on credentials | actionable | CI must skip production publishing when credentials are absent; no target changes |
| legacy:O17 | Backup chooses inconsistent environment precedence | actionable | fix/review-backup-recovery establishes process > local > base environment precedence |

## Opportunities

Scope estimates are recommendations, not evidence of visitor demand. Speculative editorial choices await answers; silence is not approval.

| ID | Opportunity | Preserved aliases | Status | Smallest candidate / prerequisite |
| --- | --- | --- | --- | --- |
| O01 | Printable labels | N02 | actionable | Print selected existing object titles/QR identifiers; no paid service |
| O02 | Curated short trails | N01 | requiring a decision | Museum must choose actual audience, stops and intended duration |
| O03 | Printable school/group companion | — | requiring a decision | Teacher/curator supplies prompts and selection; no invented historical claims |
| O04 | Private local visit shortlist | N04 | actionable | Save/remove existing IDs locally, clear list, graceful storage failure; no accounts |
| O05 | Share links with explicit language | — | actionable | Allowlisted language parameter and clear preference precedence |
| O06 | Side-by-side editorial translation review | — | actionable | Source/target comparison first; reviewed-state persistence needs separate agreement |
| O07 | Discovery through existing tags | N07 | actionable | Simple theme links/filter; no recommendation engine |
| N03 | Side-by-side bilingual visitor reading | — | actionable | German alongside selected translation; distinct from curator review O06 |
| N05 | Two-object teaching comparison | — | requiring a decision | Validate educator workflow/demand before new product surface |
| N06 | Media sources and credit metadata | — | requiring a decision | Agree public/private attribution fields and schema before implementation |

## Priorities and dependencies

1. Public authorization #3; existing login limiter #9 plus production-parser follow-up.
2. Upload safety and editor dependency patch; preserve existing uploaded files.
3. Recoverable native database snapshots plus matching disk media, with explicit operator write pause and failing completion semantics.
4. Content-save revision checks (approved: reject stale saves and request reload), clearing, media/asset references, #8 memberships and featured integrity.
5. #4 editor hydration and #5 visitor details, then translation/media/state correctness.
6. Keyboard/dialog/control accessibility and real effective checks.
7. Remaining operations/documentation and focused clear feature candidates.

Every proposed PR must identify its actual base, relevant IDs, observed checks, baseline failures and remaining verification. Independent branches start at origin/main; authorization-dependent branches name #3 explicitly; gallery-row fix names #4. Proposed branches are not merged or deployed fixes.

## Decisions and infrastructure limits

- Approved on 2026-10-06: reject stale curator saves and ask for explicit reload; preserve the unsaved draft, never take a newer subscription revision silently.
- Pending: GitHub API authentication (`gh auth login` or GitHub connection); SSH push works, opening/updating PRs does not.
- Pending: new curated itinerary/teaching content and attribution schema; no invented content or paid dependencies.
- QR uniqueness requires production read-only preflight before enforcement; no production access performed.
- Service image pinning requires the actual deployed versions or a tested isolated upgrade path; do not guess compatibility.
- Complete backups require all curator/import writes paused through database export and media copy. The script does not alter running services itself.
