# Review implementation backlog

Updated 2026-10-06. The original 111 findings and seven opportunities retain all 118 stable IDs. Additional final-review IDs recovered from PR descriptions are cross-referenced below. Open PRs remain **actionable pending review/merge**, not resolved or deployed. **Requiring a decision** records a named editorial/product decision; **blocked** names an unavailable verification prerequisite. “Unprepared” means actionable work remains outside this publication batch.

No campaign PR has been merged by this agent. Publication uses forward merges when bringing dependencies into prepared branches; shared history is preserved.

## Findings and opportunities

| ID | Finding / opportunity | Status | Published coverage and remaining work |
| --- | --- | --- | --- |
| B01 | Unauthenticated Convex writes | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Prepared; await review and merge. |
| B02 | Development API authorization bypass | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Prepared; await review and merge. |
| B03 | Unbounded login attempts | actionable | [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9), [#51](https://github.com/MGRAFF2006/museum-rodenberg/pull/51); Prepared; await review and merge. |
| B04 | Active documents served on the application origin | actionable | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6), [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55); New uploads: allowlist/signature checks; legacy media isolation needs #6. Header recognition is not complete decoding. |
| B05 | Asset picker missing bearer token | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Prepared; await review and merge. |
| B06 | Broken upload-image alias | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Prepared; await review and merge. |
| B07 | Upload filename collisions overwrite bytes | actionable | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); Prepared; await review and merge. |
| B08 | Asset IDs collide across extensions | actionable | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); Prepared; await review and merge. |
| B09 | Upload write completion and error cleanup | actionable | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); Prepared; await review and merge. |
| B10 | Nameless multipart upload crashes | actionable | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); Prepared; await review and merge. |
| B11 | Upload and development body resource limits | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3), [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); Prepared; await review and merge. |
| B12 | File and metadata deletion cannot be retried | actionable | [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47); Server retry covered; client registration-failure/metadata cleanup dimension remains actionable. |
| B13 | Referenced media can be deleted | actionable | Unprepared: authoritative reference protection must precede filesystem deletion; no client-only race-prone guard. |
| B14 | Directories validate as media files | actionable | [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47); Prepared; await review and merge. |
| B15 | Optional fields cannot be cleared | actionable | [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27); Prepared; await review and merge. |
| B16 | Omitted translations remain stored | actionable | [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27), [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58); Prepared; await review and merge. |
| B17 | Artifact moves leave stale memberships | actionable | [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8); Prepared; await review and merge. |
| B18 | Deleting featured item loses replacement | actionable | [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12); Prepared; await review and merge. |
| B19 | Featured flag and setting diverge | actionable | [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12); Prepared; await review and merge. |
| B20 | Duplicate QR codes resolve inconsistently | actionable | [#60](https://github.com/MGRAFF2006/museum-rodenberg/pull/60); Approved globally unique nonempty QR codes; seed preflight checked 18 records. Current deployed-data export must still be audited before rollout; no automatic rewrite/backfill. |
| B21 | Concurrent editors overwrite changes | actionable | [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42), [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62); Strict captured revision + document ID; versioned deletion B21-D01 is covered by #62. |
| B22 | Listing queries scan unrelated translation/media rows | actionable | [#41](https://github.com/MGRAFF2006/museum-rodenberg/pull/41); Prepared; await review and merge. |
| B23 | Translation placeholder numeric-prefix collisions | actionable | [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13), [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56); Prepared; await review and merge. |
| B24 | Translation replacement interprets dollar sequences | actionable | [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13); Prepared; await review and merge. |
| B25 | Translation normalization removes whitespace | actionable | [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13); Prepared; await review and merge. |
| B26 | Translation requests have no deadline | actionable | [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16), [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59); Prepared; await review and merge. |
| B27 | Non-transient translation failures retried | actionable | [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16), [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59); Prepared; await review and merge. |
| B28 | Built uploads mask persistent uploads | actionable | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6); Prepared; await review and merge. |
| B29 | Missing uploads return cached SPA HTML | actionable | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6); Prepared; await review and merge. |
| B30 | HTML entry point is cached | actionable | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6); Prepared; await review and merge. |
| B31 | Mutable upload URLs keep stale cached bytes | actionable | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); Prepared; await review and merge. |
| B32 | Expired session does not reauthenticate editor | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Partial: invalid tokens are cleared; reactive editor reauthentication remains unprepared. |
| B33 | Advertised migration action is a stub | actionable | [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53); Prepared; await review and merge. |
| A01 | Editor misses asynchronously loaded records | actionable | [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); Prepared; await review and merge. |
| A02 | New editor attribute defaults are incomplete | actionable | [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); Already covered by open #4; duplicate defaults branch deliberately not published. Main still lacks the fix. |
| A03 | New blank media rows cannot be edited | actionable | [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35), [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52); Prepared; await review and merge. |
| A04 | Translated metadata inputs are not persisted | actionable | [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46); Approved: metadata stays global; unsupported translation inputs removed; no migration. |
| A05 | Global artist input is ignored | actionable | [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46); Prepared; await review and merge. |
| A06 | Editing clears featured flag | actionable | [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); Prepared; await review and merge. |
| A07 | Bulk translation uses incomplete listing data | actionable | Unprepared: fetch full records and explicit entity type before bulk translation. |
| A08 | Empty or unsafe content identity can be saved | actionable | [#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17), [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27), [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42); Creation identity validated, create-only collision guard, existing mixed-case save identity preserved. |
| A09 | Asset IDs bypass file validation | actionable | [#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44); Prepared; await review and merge. |
| A10 | Saving during translation publishes partial work | actionable | [#37](https://github.com/MGRAFF2006/museum-rodenberg/pull/37); Prepared; await review and merge. |
| A11 | Navigation silently discards unsaved drafts | actionable | Unprepared; recheck code and existing PRs before implementation. |
| A12 | Clipboard reports success on failure | actionable | [#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49); Prepared; await review and merge. |
| A13 | Visual editor audio links serialize incorrectly | actionable | [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36); Prepared; await review and merge. |
| A14 | Underline serializes as literal HTML | actionable | [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36); New/resaved editor output covered; compatibility for already published literal underline HTML remains unprepared. |
| A15 | Visual editor previews unresolved asset IDs | actionable | [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36); Prepared; await review and merge. |
| T01 | Translation freshness shared across languages | actionable | Unprepared: per-language freshness rather than one field hash shared by all destinations. |
| T02 | Translation hashes are not persisted | actionable | Unprepared: agree persisted hash representation with T01 before editing schema/writers. |
| T03 | Generator marks failed translations current | actionable | Unprepared: advance generator freshness only after successful translation. |
| T04 | Generator translates Markdown destinations | actionable | [#61](https://github.com/MGRAFF2006/museum-rodenberg/pull/61); Prepared; await review and merge. |
| T05 | Translation generator updates seeds rather than live content | actionable | Unprepared: clarify seed-generator versus live content workflow; do not silently reseed curator edits. |
| V01 | Public detailed content is unavailable | actionable | [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5); Prepared; await review and merge. |
| V02 | Custom media protocols are stripped | actionable | [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28); Prepared; await review and merge. |
| V03 | Missing media tab parameter opens blank page | actionable | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Prepared; await review and merge. |
| V04 | Mobile media navigation loses clicked item | actionable | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Prepared; await review and merge. |
| V05 | Audio-only galleries default to images | actionable | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Prepared; await review and merge. |
| V06 | Markdown media is absent from opened gallery | actionable | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22), [#54](https://github.com/MGRAFF2006/museum-rodenberg/pull/54); Prepared; await review and merge. |
| V07 | Gallery selection is stale after content changes | actionable | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Prepared; await review and merge. |
| V08 | Language responses race | actionable | [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); Prepared; await review and merge. |
| V09 | Failed language fetch retains previous labels | actionable | [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); Prepared; await review and merge. |
| V10 | Cards ignore disabled attributes | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V11 | Sponsor is never rendered | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V12 | Loading content is reported missing | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V13 | Search updates duplicate browser history | actionable | [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30); Prepared; await review and merge. |
| V14 | Search query whitespace is not trimmed | actionable | [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30); Prepared; await review and merge. |
| V15 | Speech error prevents retry | actionable | [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45); Prepared; await review and merge. |
| V16 | Audio playback rejection is unhandled | actionable | [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48); Prepared; await review and merge. |
| V17 | StrictMode resets accessibility preferences | actionable | [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20); Prepared; await review and merge. |
| V18 | Storage exceptions can crash the app | actionable | [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20); Prepared; await review and merge. |
| V19 | Stored speech preferences are unvalidated | actionable | [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20); Prepared; await review and merge. |
| V20 | QR camera restarts on callback changes | actionable | [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29); Prepared; await review and merge. |
| V21 | QR cleanup races subsequent camera initialization | actionable | [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29); Prepared; await review and merge. |
| V22 | Routine scan misses flood console | actionable | [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29); Prepared; await review and merge. |
| V23 | Clickable content is inaccessible by keyboard | actionable | [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28), [#38](https://github.com/MGRAFF2006/museum-rodenberg/pull/38); Partial: cards and Markdown media actions covered; remaining clickable images/controls need keyboard semantics. |
| V24 | Dialogs lack focus and keyboard behavior | actionable | Unprepared: modal focus/escape/trap behavior; real browser and assistive-technology checks required. |
| V25 | Controls lack accessible names and states | actionable | [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48); Partial: native audio play/pause labels covered; audit remaining control names/states. |
| V26 | Document language remains English | actionable | [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); Prepared; await review and merge. |
| V27 | Translation dictionaries omit navigation keys | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V28 | Visitor interface includes hardcoded language strings | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V29 | Mobile menu lacks scrolling | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V30 | Links have no visible focus indicator | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V31 | Selected controls have insufficient contrast | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V32 | Markdown URLs containing parentheses are truncated | actionable | [#61](https://github.com/MGRAFF2006/museum-rodenberg/pull/61); Prepared; await review and merge. |
| V33 | Media extension detection ignores query and fragment | actionable | [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28); Prepared; await review and merge. |
| V34 | Video sources always advertise MP4 | actionable | [#23](https://github.com/MGRAFF2006/museum-rodenberg/pull/23); Prepared; await review and merge. |
| V35 | Hash test does not assert its stated contract | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V36 | Duplicate prop contracts drift | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V37 | TranslationWarning conditionally calls a hook | actionable | [#31](https://github.com/MGRAFF2006/museum-rodenberg/pull/31); Prepared; await review and merge. |
| O01 | Root typecheck checks no source files | actionable | [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14); Prepared; await review and merge. |
| O02 | Backup reports success despite failed exports | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Prepared; await review and merge. |
| O03 | Backup restore instructions accept an incompatible format | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Prepared; await review and merge. |
| O04 | Backups omit uploaded media bytes | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Prepared; await review and merge. |
| O05 | Backup queries do not form a consistent snapshot | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Database snapshot covered; filesystem consistency still requires a write freeze, not an atomic cross-system guarantee. |
| O06 | Schema push ignores documented flags/environment | actionable | [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); Prepared; await review and merge. |
| O07 | Schema push can overwrite local frontend configuration | actionable | [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); Prepared; await review and merge. |
| O08 | Compose frontend targets localhost on visitor devices | actionable | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Prepared; await review and merge. |
| O09 | Compose setup modifies the host checkout | actionable | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Prepared; await review and merge. |
| O10 | Supported Node version conflicts with dependencies | actionable | [#24](https://github.com/MGRAFF2006/museum-rodenberg/pull/24); Prepared; await review and merge. |
| O11 | Locked Vite version has a conditional security advisory | actionable | [#25](https://github.com/MGRAFF2006/museum-rodenberg/pull/25); Patched identified Vite advisory; remaining dependency audit entries are not claimed resolved. |
| O12 | Support services bind all network interfaces | actionable | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Prepared; await review and merge. |
| O13 | CI schema deployment is not gated on credentials | actionable | [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32); Prepared; await review and merge. |
| O14 | License documentation conflicts with GPL file | actionable | [#40](https://github.com/MGRAFF2006/museum-rodenberg/pull/40); Prepared; await review and merge. |
| O15 | Development supervisor loses child failure status | actionable | [#57](https://github.com/MGRAFF2006/museum-rodenberg/pull/57); Prepared; await review and merge. |
| O16 | CI lint job never invokes lint | actionable | [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34); Prepared; await review and merge. |
| O17 | Backup chooses inconsistent environment precedence | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Prepared; await review and merge. |
| O18 | Concurrent CI schema pushes can roll back code | actionable | [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32); Prepared; await review and merge. |
| O19 | Installed ESLint rule crashes | actionable | [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26); Known from existing #1; compatible rule loader restored without disabling rules. |
| O20 | Fresh setup omits content seeding | actionable | [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53); Prepared; await review and merge. |
| O21 | Compose accepts a published default admin password | actionable | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Prepared; await review and merge. |
| N01 | Curated short visit routes | requiring a decision (deferred by user) | User deferred until a curator supplies route content, audience and duration. |
| N02 | Printable object label sheets | actionable | Clear optional candidate: print existing object QR labels; unprepared in this publication batch. |
| N03 | Side-by-side bilingual reading | actionable | Clear optional candidate: German alongside chosen language; unprepared in this publication batch. |
| N04 | Personal visitor shortlist | actionable | Clear optional candidate: local visitor shortlist with shareable IDs; unprepared in this publication batch. |
| N05 | Two-object teaching comparison | requiring a decision (deferred by user) | User deferred pending educator demand. |
| N06 | Media source and credit metadata | requiring a decision (deferred by user) | User deferred pending agreed source/credit fields. |
| N07 | Tag browsing facets | actionable | Clear optional candidate: browse existing tags; unprepared in this publication batch. |

## Additional recovered review IDs

The raw final F-numbered master report is unavailable in this recovered workspace; these aliases come from existing PR descriptions, so this section does not claim to reconstruct every F-numbered entry.

| IDs | Coverage / distinction | Status |
| --- | --- | --- |
| F05 | B04 byte-signature dimension, #55 | actionable, PR open |
| F06 | Locked editor HTML-paste vulnerability, #39 | actionable, PR open; exploit not executed |
| F07 / F08 / F09 / F54 | O02–O05/O17 backup recovery, #11 | blocked verification: native isolated export/import drill; draft PR |
| F12 | B03 production parser ordering, #51 | actionable, PR open |
| F18 | B12 retryable filesystem deletion plus B14, #47 | actionable, client/reference dimensions remain |
| F19 | Omitted media must preserve galleries; explicit [] clears, #43 | actionable, PR open |
| F21 | A03 blank rows / incomplete rows omitted from saves, #35/#52 | actionable, PRs open |
| F25 | A09 resolved asset-ID validation, #44 | actionable, PR open |
| F28 | A04/A05 global metadata and translated artist, #46 | actionable, approved behavior implemented |
| F30 | B21 stale save + document recreation, #42 | actionable, PR open |
| F33 / F34 | B23–B27 placeholder/proxy/client failure dimensions, #13/#16/#56/#59 | actionable, PRs open |
| F42 / F43 | V15/V16 speech/audio recovery, #45/#48 | actionable, native device verification remains |
| F50 | O01 effective typechecks, #14 | actionable, PR open |
| F60 | Previously stored tags/materials lacked editing controls, #50 | actionable, PR open |
| F62 / F63 | A12 clipboard and A13/A15 duplicate editor extensions, #49/#36 | actionable, PRs open |
| F64 / F65 | V13/V14 search history and whitespace, #30 | actionable, PR open |
| F75 | Cancel read-aloud when its source disappears/changes, #45 | actionable, PR open |
| F95 / F96 | O06/O07 safe schema-push tooling, #15 | actionable, PR open |
| F102 | O14 README agrees with existing GPL license, #40 | actionable, PR open; license terms unchanged |
| O04-TAR01 / PR11-R1 | Inherited archive options can omit source media or delete it while backing up; cleared for tar subprocess in #11, two regressions added | actionable, fixed in draft PR; recovery drill remains |
| B21-D01 | New confirmed dimension: an old Delete action can remove a recreated same-slug record, #62 | actionable, PR open |

## Published PR inventory and verification

Results below are the focused checks recorded in each PR, not a claim that the complete combined project has passed. Exact commands, additional results and limitations are in the linked descriptions. Browser/device, native recovery and deployment checks are distinguished from fixtures.

| PR | Concern / IDs | Base | Verification recorded |
| --- | --- | --- | --- |
| [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) fix: require editor authorization for all content writes | B01 B02 B05 B06 B11 B32 | `main` | Fifteen focused tests, including AssetPicker image/media uploads, visible failure/retry behavior, and real Vite authenticated multipart uploads/revoked-session rejection: all Convex mutation guards, authorized writes without persisting credentials, public queries, allowlisted API/session expiry/revocation,… |
| [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) fix: hydrate editor drafts when full records arrive | A01 A02 A06 | `main` | `npm test -- src/hooks/__tests__/useEditorForm.test.tsx` — nine tests cover both editor save payloads, all seven languages, detailed content/media, reactive draft preservation, ID switches, missing records and immediate new forms. |
| [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5) fix: restore public access to stored item details | V01 | `main` | `npm test -- src/test/publicDetails.test.tsx` — 36 tests using real public routes, ContentProvider, converters, and detail components with a mocked Convex query boundary. |
| [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) fix: serve persistent media and keep missing uploads out of caches | B04 B28 B29 B30 | `main` | Eight HTTP integration cases cover live bytes, deleted build copies, API/media misses, three HTML entry routes, and hashed assets. |
| [#7](https://github.com/MGRAFF2006/museum-rodenberg/pull/7) docs: track review fixes and opportunity decisions | Backlog | `main` | All 103 final finding IDs appear exactly once; every legacy finding and both opportunity inventories remain represented. |
| [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8) Fix exhibition membership when artifacts move or are deleted | B17 | `fix/versioned-content-deletion` | 81 focused tests (12 membership, 8 revision, 22 validation, 11 save contract, 7 authorization, 16 deletion handlers, 5 rendered deletion checks); scoped Convex/test TypeScript and focused lint pass with baseline lint rule overrides. |
| [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9) fix: limit editor login attempts with a retry window | B03 | `fix/authenticated-content-writes` | Two HTTP regressions: forged forwarded addresses cannot bypass the limit; correct credentials cannot bypass an active lockout; expiry recovers; success resets failures. |
| [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) fix: make media uploads bounded and immutable | B04 B07 B08 B09 B10 B11 B31 | `main` | `node --test server/upload-media.test.js`: 14 passed, using actual multipart streams and temporary files. Covers collisions, MIME/extension rejection, nameless/empty/malformed uploads, exact and exceeded size boundaries, request and part limits, delayed writes, disk failures, exclusive-open collision prese… |
| [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) (draft) Make collection backups complete and recoverable | O02 O03 O04 O05 O17 F07 F08 F09 F54 | `main` | 13 isolated native orchestration tests pass, including inherited TAR_OPTIONS exclusion/removal regressions. No real Convex ZIP export/import. |
| [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) Keep featured exhibition selection consistent across save and deletion | B18 B19 | `fix/versioned-content-deletion` | 79 focused tests (10 featured, 8 revision, 22 validation, 11 save contract, 7 authorization, 16 deletion handlers, 5 rendered deletion checks); scoped Convex/test TypeScript and focused lint pass with baseline rule overrides. |
| [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13) fix: preserve protected Markdown destinations during translation | B23 B24 B25 | `main` | Five focused tests: eleven protected destinations, dollar literals, paragraph/image spacing, altered token spacing/case, invalid inputs/output. |
| [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14) fix: check all TypeScript projects in CI | O01 F50 | `main` | `npm run typecheck` checks all three projects successfully. |
| [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15) Push schemas without rewriting local deployment settings | O06 O07 F95 F96 | `main` | `node --test scripts/__tests__/push-convex.test.mjs` — 20 isolated tests pass for target selection, argument handling, credential isolation, failure/signal propagation and exact environment bytes/presence on both local and production paths. |
| [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16) fix: bound translator waits and avoid futile retries | B26 B27 | `fix/translation-proxy-preservation` | Fifteen focused tests pass: permanent failures, transient retry/recovery, browser deadline propagation, actual pending-fetch abort propagation, and URL/spacing preservation regressions. |
| [#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17) Validate route-safe content IDs and required German titles | A08 | `fix/authenticated-content-writes` | `vitest run src/test/content-validation.test.ts src/test/content-auth.test.ts` — 29 tests pass, invoking actual mutation handlers. |
| [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18) fix: keep dictionary labels aligned with the selected language | V08 V09 V26 | `main` | Four rendered-provider tests pass: French before stale English, immediate German fallback and two HTTP failures, unavailable German fallback. |
| [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) Isolate local Compose setup and supporting services | O08 O09 O12 O21 | `main` | `node --test scripts/__tests__/compose-isolation.test.mjs` — four configuration/setup-fixture tests pass, including password rejection, loopback/volume topology, failure propagation and unchanged host files. |
| [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) fix: keep visitor preferences usable when storage fails | V17 V18 V19 | `fix/language-load-races` | Twelve rendered-hook/provider tests pass: StrictMode saved-state preservation, blocked reads/full-quota writes, language changes, malformed/null/partial speech state, and dictionary races/fallbacks. |
| [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) fix: return useful statuses for rejected admin requests | B09 B10 B11 | `fix/login-rate-limit` | Eight HTTP tests pass: three upload statuses, unexpected-error redaction, malformed JSON redaction, oversized JSON, login rate limit/recovery. |
| [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) fix: preserve selected media across visitor gallery navigation | V03 V04 V05 V06 V07 | `main` | `npm exec vitest run src/test/mediaGallery.test.tsx`: 26 passed. Uses actual React viewer/detail components and MemoryRouter navigation with mocked content; covers both artifact/exhibition routes, desktop/mobile selection, query URL round-trips, audio/video-only galleries, null/invalid tabs, reactive image… |
| [#23](https://github.com/MGRAFF2006/museum-rodenberg/pull/23) fix: let browsers detect each gallery video format | V34 | `main` | `npm exec vitest run src/test/mediaVideoSource.test.tsx`: 3 passed for WebM, MP4 and query-based resource URLs. The actual rendered source keeps the URL and exposes an empty type for browser format detection. |
| [#24](https://github.com/MGRAFF2006/museum-rodenberg/pull/24) Align development and deployment on supported Node 22 | O10 | `main` | Node 22.23.3 satisfies the project and every locked dependency engine requirement. |
| [#25](https://github.com/MGRAFF2006/museum-rodenberg/pull/25) Upgrade Vite to the patched 6.4 release | O11 | `main` | Isolated `npm ci --ignore-scripts` in a real worktree-owned dependency directory; original shared node_modules unchanged. |
| [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26) Restore ESLint rule compatibility with TypeScript ESLint 8.24 | O19 | `main` | Reproduced original allowShortCircuit rule-loading crash with the baseline locked dependencies. |
| [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) Make editor clearing, translation removal and creation explicit | B15 B16 A08 | `fix/content-input-validation` | Four focused files, 44 tests pass: actual save-handler serialized payloads, explicit clear versus omission, complete versus partial translations, creation conflicts, operation flags not persisted, required German title/authentication, and actual hook save payloads. |
| [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28) fix: restore safe Markdown media actions and resource classification | V02 V23 V33 | `main` | `npm exec vitest run src/test/markdownMedia.test.tsx src/utils/__tests__/markdownUtils.test.ts`: 38 passed (15 new, 23 existing). Actual ReactMarkdown rendering verifies keyboard activation, preserved asset/relative/HTTPS destinations, unsafe nested scheme rejection, ordinary link safety, and consistent qu… |
| [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29) fix: keep QR camera startup and cleanup in one lifecycle | V20 V21 V22 | `main` | Five rendered scanner lifecycle tests pass: callback rerender/latest callback, asynchronous reopen, StrictMode replay, mount isolation, rejected stop. |
| [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30) fix: keep typed search updates out of browser history | V13 V14 F64 F65 | `main` | `npx vitest run src/components/__tests__/searchNavigation.test.tsx src/components/__tests__/searchDetailHistory.test.tsx src/hooks/__tests__/useSearch.test.ts` — 19 tests pass. Includes the actual Header input/App/router, starting artifact return in one Back after multiple keystrokes, padded matching, clea… |
| [#31](https://github.com/MGRAFF2006/museum-rodenberg/pull/31) fix: keep translation warning hooks unconditional | V37 | `main` | Unmodified `react-hooks/rules-of-hooks` validation passes for this component using the compatible lint dependencies from #26. |
| [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32) Skip unconfigured or outdated schema deployments in CI | O13 O18 | `main` | `node --test scripts/__tests__/schema-ci-guards.test.mjs` — six fixture tests pass for complete/partial/missing credentials, gating/concurrency permissions, latest/stale main commits and failed API lookup. |
| [#33](https://github.com/MGRAFF2006/museum-rodenberg/pull/33) Run native script and server regression tests in CI | Native test discovery | `fix/supported-node-runtime` | `npm run test:node` — four native discovery/propagation tests pass. |
| [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34) fix: enforce working lint checks in CI | O16 | `fix/conditional-translation-hook` | Unmodified `npm run lint`: zero errors, seven existing warnings. |
| [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35) fix: make newly added image rows editable | A03 | `main` | Actual editor-hook regressions cover add/select, add/remove, and an invalid index without altering existing media. |
| [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) fix: keep visual editor output compatible with visitor Markdown | A13 A14 A15 F63 | `main` | `npm exec vitest run src/test/visualEditorMedia.test.tsx`: 9 passed with the actual TipTap editor and ContentProvider, mocked registry queries/picker only. Verifies audio/video insertion and reopening, safe literal asset captions, resolved image bytes with stable Markdown IDs, late/changed registry updates… |
| [#37](https://github.com/MGRAFF2006/museum-rodenberg/pull/37) fix: wait for translation before saving editor drafts | A10 | `fix/editor-async-hydration` | Ten editor tests pass, including a regression that cannot validate/save while translating and can save after completion. |
| [#38](https://github.com/MGRAFF2006/museum-rodenberg/pull/38) fix: make collection cards accessible navigation links | V23 | `main` | Two rendered keyboard tests pass: Tab focus, Enter activation, correct href, modified-click default preserved. |
| [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39) Patch the editor HTML-paste vulnerability | F06 | `main` | Clean npm ci --ignore-scripts succeeds. |
| [#40](https://github.com/MGRAFF2006/museum-rodenberg/pull/40) Align the README with the existing GPL license | O14 F102 | `main` | Compared README against the LICENSE heading/version. |
| [#41](https://github.com/MGRAFF2006/museum-rodenberg/pull/41) Index content reads by language and exhibition membership | B22 | `main` | 13 Node tests execute actual query handlers against a schema-checked fake database containing 500 entities of each kind and seven languages; payloads match the former full-scan join. |
| [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) Reject stale editor saves before modifying collection content | B21 A08 F30 | `fix/explicit-editor-save-contract` | Seven focused Vitest suites: 61 tests pass, including revision/document identity guards, legacy records, creation collisions, clearing, translation replacement, JSON wire serialization, safe HTTP 409, captured drafts and protected mutations. |
| [#43](https://github.com/MGRAFF2006/museum-rodenberg/pull/43) Preserve galleries when content updates omit media | F19 | `fix/content-revision-guards` | Eight focused suites: 67 tests pass, including six stateful JSON-wire media cases for both entity types, strict revisions, creation, clearing, translation replacement, editor payloads and protected API responses. |
| [#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44) Validate registry asset IDs before saving content | A09 F25 | `main` | `vitest run src/hooks/__tests__/useAssetValidation.test.ts` (six focused cases: all content locations, deduplication, unknown IDs, registry arrival, missing files, direct/external URLs and server failure; five fail against `main`). |
| [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45) Recover read-aloud playback and cancel dismissed sources | V15 F42 F75 | `main` | `npx vitest run src/components/__tests__/SpeechRecovery.test.tsx` — 6 tests pass using the actual provider/buttons and controlled native engine events: retry, source dismissal, text/language change, unrelated-source removal, and stale error/end events after restart. |
| [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46) Align curator metadata controls with the stored content model | A04 A05 F28 | `fix/editor-async-hydration` | Metadata controls plus async-hydration suites: 13 tests pass, covering persisted fields, language switching, translation request fields and delayed full-record loading. |
| [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47) Make uploaded media deletion safely retryable | B12 B14 F18 | `main` | `npx vitest run src/test/apiHandlers.test.ts` — 18 tests passed using temporary files, repeated deletion, missing roots, containment/symlinks, directory sentinels, concurrent-removal ENOENT, and permission-error propagation. |
| [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48) Recover failed audio playback and ignore stale source errors | V16 V25 F43 | `main` | `npx vitest run src/components/__tests__/AudioPlayer.test.tsx` — 4 tests pass for rejected native promises, retry, native event-based playing/paused state, source-load error, and pending rejection after source replacement. |
| [#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49) Show copy success only after the clipboard write succeeds | A12 F62 | `main` | `vitest run src/components/Admin/__tests__/clipboardFeedback.test.tsx` (three cases: delayed success, rejected access, missing API). |
| [#50](https://github.com/MGRAFF2006/museum-rodenberg/pull/50) Let curators edit materials and collection tags | F60 | `main` | `vitest run src/components/Admin/__tests__/arrayMetadata.test.tsx` (three integration cases: exhibition/artifact tags and artifact materials, including clearing). |
| [#51](https://github.com/MGRAFF2006/museum-rodenberg/pull/51) Run production login throttling before JSON parsing | B03 F12 | `fix/login-rate-limit` | `npx vitest run src/test/productionLoginLimits.test.ts src/test/loginLimits.test.ts src/test/content-auth.test.ts` — 10 tests passed. |
| [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52) Skip unfinished gallery rows when saving content | A03 F21 | `fix/editor-media-rows` | Two regression cases fail on PR #35 before the fix, for both editor types. |
| [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53) Document explicit collection seeding and reject the migration placeholder | B33 O20 | `fix/authenticated-content-writes` | Four Node tests execute the actual placeholder handler and actual seed CLI body with a fake client and shipped JSON: successful authenticated import, missing secret, and a failed write with credential-safe error handling. |
| [#54](https://github.com/MGRAFF2006/museum-rodenberg/pull/54) Include article-only media in visitor galleries | V06 | `fix/media-gallery-selection` | `npx vitest run src/test/mediaGallery.test.tsx` — 30 tests pass, including all existing #22 cases plus both entity routes with no media query, all article embeds, hidden-attribute exclusion, and desktop article Media action. |
| [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55) Validate uploaded media container signatures | B04 F05 | `fix/safe-media-ingestion` | `node --test server/upload-media.test.js` — 17 tests passed, including declared-JPEG HTML/SVG, empty files, batch rollback, all permitted extensions, classic QuickTime, one-byte header chunks and byte preservation. Existing stream completion, exact limits, crashes, collision and interruption checks remain … |
| [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56) Keep protected translation tokens distinct from ordinary prose | B23 F33 | `fix/translation-proxy-preservation` | `npx vitest run src/test/translationProxy.test.ts` — 6 tests passed, covering literal placeholder-like prose, eleven distinct destinations with dollar syntax, paragraph spacing, modified token spacing/case and invalid input/output. |
| [#57](https://github.com/MGRAFF2006/museum-rodenberg/pull/57) Stop the development session when a required service exits | O15 | `main` | Eight Node tests run the actual Bash script with fake services and a fake health check: failure and clean exit of either service, watcher failure during startup, initial schema failure, SIGINT, and SIGTERM. They assert peer termination and a single cleanup. |
| [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58) Preserve unseen translations and remove only deliberately cleared rows | B16 | `fix/explicit-editor-save-contract` | 25 focused tests pass: complete and partial source payloads, intentional loaded-language deletion, unseen-language/detail preservation, explicit known-detail clearing, complete-replacement compatibility and operation flags omitted from records. |
| [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59) Stop retries for permanent translator failures and invalid output | B26 B27 F34 | `fix/translation-deadlines` | `npx vitest run src/test/translationFailures.test.ts src/test/translationProxy.test.ts src/test/translationDeadline.test.ts src/utils/__tests__/translationRetries.test.ts` — 36 tests passed. Includes actual proxy/client boundaries for provider 400/401/403/404/422, no accidental logout, transient 408/429/50… |
| [#60](https://github.com/MGRAFF2006/museum-rodenberg/pull/60) Reject duplicate QR identities across museum content | B20 | `fix/content-revision-guards` | 84 focused Vitest tests across QR guards/preflight, revision/auth boundaries, editor save contracts, validation, and rendered draft recovery. |
| [#61](https://github.com/MGRAFF2006/museum-rodenberg/pull/61) Preserve CommonMark media boundaries across rendering and translation | V32 T04 | `fix/translation-placeholder-collisions` | `npm exec vitest run src/test/generatorMediaProtection.test.ts src/test/markdownBoundaries.test.tsx src/utils/__tests__/markdownUtils.test.ts src/utils/__tests__/translationUtils.test.ts src/test/translationProxy.test.ts` — **76 passed**. Includes actual ReactMarkdown rendering, the server adapter and a re… |
| [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62) Reject stale content deletion using captured identity and revision | B21-D01 B21 | `fix/content-revision-guards` | 37 focused tests pass for real-wire stale deletion, legacy versions, recreation, zero partial writes, editor draft recovery and protected API behavior; Convex TypeScript pass. |

## Review and merge sequence

1. Start with #3 authorization, #6 media isolation, #10 → #55 ingestion, #39 editor dependency security. Keep #11 draft until its isolated recovery drill passes.
2. Review #4 hydration and #17 → #27 explicit saves. Then #42 strict revisions, #43 media omission, #58 deliberate translation removal and #60 QR uniqueness. #8/#12 stack on #62 versioned deletion, which stacks on #42 and must preserve all version increments. Deploy compatible editor/backend bundles together after approved merges; existing editors need reload, and legacy records normalize revision zero without a backfill.
3. Review #9 login → #21 request errors, with #51 production middleware ordering. #21's upload statuses also need #10/#55. #53 seeding depends on #3; no seeding is implied by merging its documentation.
4. Translation stack: #13 → #56 → #61 parser, and #13 → #16 → #59 deadlines/failures. When integrating #28, keep its media classifier with #61's AST traversal. Resolve the parser/proxy sibling hunks before claiming combined verification.
5. Visitor stacks: #18 → #20; #22 → #54. #5 full public detail payloads, #23 format detection, #28 actions, #29 camera, #30 search, #38 cards, #45 speech and #48 audio remain focused concerns.
6. Editor #46 now stacks on #4. Keep #37's save-during-translation guard and #42's captured versions when integrating form changes; #35 → #52 handle gallery rows. #44 validation, #49 clipboard and #50 array metadata are independent concerns that still need their shared editor hunks integrated.
7. Tooling: #24 → #33 native tests; #26 restores lint, #31 → #34 enables it; #14 checks all TypeScript projects. Combine manifest/workflow hunks with #25 and #39 rather than overwriting dependency fixes. #15/#19/#32/#40/#41/#57 remain independent operational concerns.
8. Next unprepared fixes: authoritative media-reference deletion, editor-session recovery, full bulk translation + per-language persisted freshness, generator failure bookkeeping, draft navigation, remaining visitor accessibility/localization/loading states. Optional N02/N03/N04/N07 follow correctness work. N01/N05/N06 stay deferred by the user's explicit decisions.

## Superseded prepared work

No duplicate PR is opened for these branches. Keep local work recoverable; do not merge them alongside their replacements.

| Prepared branch / draft | Published replacement |
| --- | --- |
| `fix/editor-gallery-rows` | #4, #35, #52 |
| `fix/explicit-content-field-clears` | #27, #42, #58 |
| `fix/review-backup-recovery` | #11 (draft; native recovery drill outstanding) |
| `fix/review-keyboard-collection-cards` | #38 |
| `fix/review-language-loading` | #18 |
| `fix/review-markdown-media-links` | #28 |
| `fix/review-search-history` | #30 |
| `fix/review-upload-safety` | #10/#55 with #3/#21 prerequisites |
| `fix/review-visitor-media` | #22/#54 |
| `fix/review-visitor-preferences` | #20 |
| `fix/translation-markdown-links` | #13/#56/#61 |
| `fix/translation-timeouts` | #16/#59 |
| Local `fix/speech-retry` draft (archived in a local Git stash) | #45 |
| Local `fix/editor-attribute-defaults` | #4 already covers the defaults |
| Local `fix/enforced-lint` | #26/#31/#34 |
| Local `fix/qr-and-content-revisions` draft | #42 revision/document-ID protocol plus #60 QR uniqueness |

## Publication checks and limits

- `gh api user --jq .login`: authenticated account verified. `git fetch origin`, `gh pr list/view` and `git merge-base --is-ancestor` recheck remote heads, declared bases and stacks. Parent-base updates require forward merges and relevant reruns; no force pushes.
- `git merge-tree --write-tree` exposed save/revision and metadata/hydration conflicts. #42 was integrated with #27 (61 focused tests plus Convex TypeScript pass); #46 was integrated with #4 and retained a concurrent remote test adapter (13 tests pass). #43 integration retains both deliberate translation replacement and media omission semantics.
- Related-record version increments receive independent review and regression tests; versioned deletion is covered by #62. An isolated #4/#8/#12/#42/#60/#62 integration passed 136 focused tests; this is not a complete combined-project claim. These checks do not prove all PRs together are conflict-free.
- Every PR created or worked on is registered with T3; final thread inventory is checked before handoff. GitHub checks were successful where main-targeted workflows ran; stacked child branches have no check rollup and rely on the documented local checks until their target is eligible.
- No production writes, live seed/schema commands, real translator calls, deployment, merge or shared-history rewrite were performed for this publication batch. Temporary file/HTTP fixtures and subprocesses are isolated.
- Native browser preview automation was unavailable; real camera, codecs, speech engine, assistive technology and curator UX checks remain. No screenshots or device validation are claimed.
- Native backup export/import, actual Docker service startup and real GitHub Actions schema dispatch were not performed. Fixtures are meaningful regressions, not evidence of operational round-trip success.
- Standalone branches often retain pre-existing app type/lint diagnostics fixed by separate #14/#26/#34. Check the combined result after integrating their dependencies; no rules/assertions were weakened.
