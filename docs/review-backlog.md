# Review implementation backlog

Reviewed baseline: `26133b5`; implementation begins on 2026-10-06.

IDs preserve the complete earlier review (111 findings and seven opportunities). No issues are created. PRs are proposals, not merged fixes. Existing PRs #3–#5 are checked before dependent work. Each row records one distinct behavior; shared causes can share a focused PR without deleting IDs.

Status: **actionable** means verified against current source and eligible for implementation; **requiring a decision** means dependent behavior must be agreed; **blocked** means a named prerequisite is outstanding; **already resolved** requires code on main; **unsupported** means verification invalidates the finding. Open PR coverage is actionable pending review/merge, not resolved. Deferred candidates stay listed with their reason.

| ID | Finding / opportunity | Status | Work / prerequisite |
| --- | --- | --- | --- |
| B01 | Unauthenticated Convex writes | actionable | PR #3 |
| B02 | Development API authorization bypass | actionable | PR #3 |
| B03 | Unbounded login attempts | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B04 | Active documents served on the application origin | actionable | Upload safety |
| B05 | Asset picker missing bearer token | actionable | PR #3 |
| B06 | Broken upload-image alias | actionable | PR #3 (shared handler alias) |
| B07 | Upload filename collisions overwrite bytes | actionable | Upload safety |
| B08 | Asset IDs collide across extensions | actionable | Upload safety |
| B09 | Upload write completion and error cleanup | actionable | Upload safety |
| B10 | Nameless multipart upload crashes | actionable | Upload safety |
| B11 | Upload and development body resource limits | actionable | Upload safety (body limits depend on #3) |
| B12 | File and metadata deletion cannot be retried | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B13 | Referenced media can be deleted | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B14 | Directories validate as media files | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B15 | Optional fields cannot be cleared | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B16 | Omitted translations remain stored | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B17 | Artifact moves leave stale memberships | actionable | Artifact relationship integrity; depends on #3 |
| B18 | Deleting featured item loses replacement | actionable | Featured integrity; depends on #3 |
| B19 | Featured flag and setting diverge | actionable | Featured integrity; depends on #3 |
| B20 | Duplicate QR codes resolve inconsistently | requiring a decision | Cross-type QR uniqueness and existing duplicates require preflight before enforcing |
| B21 | Concurrent editors overwrite changes | requiring a decision | Conflict resolution policy and version contract need agreement; preserve current records until agreed |
| B22 | Listing queries scan unrelated translation/media rows | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B23 | Translation placeholder numeric-prefix collisions | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B24 | Translation replacement interprets dollar sequences | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B25 | Translation normalization removes whitespace | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B26 | Translation requests have no deadline | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B27 | Non-transient translation failures retried | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| B28 | Built uploads mask persistent uploads | actionable | Static routing |
| B29 | Missing uploads return cached SPA HTML | actionable | Static routing |
| B30 | HTML entry point is cached | actionable | Static routing |
| B31 | Mutable upload URLs keep stale cached bytes | actionable | Upload safety |
| B32 | Expired session does not reauthenticate editor | actionable | PR #3 partial; reactive reauthentication remains |
| B33 | Advertised migration action is a stub | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A01 | Editor misses asynchronously loaded records | actionable | PR #4 |
| A02 | New editor attribute defaults are incomplete | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A03 | New blank media rows cannot be edited | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A04 | Translated metadata inputs are not persisted | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A05 | Global artist input is ignored | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A06 | Editing clears featured flag | actionable | PR #4 |
| A07 | Bulk translation uses incomplete listing data | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A08 | Empty or unsafe content identity can be saved | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A09 | Asset IDs bypass file validation | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A10 | Saving during translation publishes partial work | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A11 | Navigation silently discards unsaved drafts | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A12 | Clipboard reports success on failure | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A13 | Visual editor audio links serialize incorrectly | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A14 | Underline serializes as literal HTML | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| A15 | Visual editor previews unresolved asset IDs | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| T01 | Translation freshness shared across languages | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| T02 | Translation hashes are not persisted | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| T03 | Generator marks failed translations current | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| T04 | Generator translates Markdown destinations | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| T05 | Translation generator updates seeds rather than live content | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V01 | Public detailed content is unavailable | actionable | PR #5 |
| V02 | Custom media protocols are stripped | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V03 | Missing media tab parameter opens blank page | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V04 | Mobile media navigation loses clicked item | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V05 | Audio-only galleries default to images | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V06 | Markdown media is absent from opened gallery | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V07 | Gallery selection is stale after content changes | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V08 | Language responses race | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V09 | Failed language fetch retains previous labels | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V10 | Cards ignore disabled attributes | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V11 | Sponsor is never rendered | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V12 | Loading content is reported missing | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V13 | Search updates duplicate browser history | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V14 | Search query whitespace is not trimmed | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V15 | Speech error prevents retry | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V16 | Audio playback rejection is unhandled | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V17 | StrictMode resets accessibility preferences | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V18 | Storage exceptions can crash the app | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V19 | Stored speech preferences are unvalidated | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V20 | QR camera restarts on callback changes | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V21 | QR cleanup races subsequent camera initialization | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V22 | Routine scan misses flood console | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V23 | Clickable content is inaccessible by keyboard | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V24 | Dialogs lack focus and keyboard behavior | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V25 | Controls lack accessible names and states | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V26 | Document language remains English | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V27 | Translation dictionaries omit navigation keys | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V28 | Visitor interface includes hardcoded language strings | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V29 | Mobile menu lacks scrolling | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V30 | Links have no visible focus indicator | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V31 | Selected controls have insufficient contrast | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V32 | Markdown URLs containing parentheses are truncated | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V33 | Media extension detection ignores query and fragment | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V34 | Video sources always advertise MP4 | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V35 | Hash test does not assert its stated contract | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V36 | Duplicate prop contracts drift | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| V37 | TranslationWarning conditionally calls a hook | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O01 | Root typecheck checks no source files | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O02 | Backup reports success despite failed exports | actionable | Backup recovery |
| O03 | Backup restore instructions accept an incompatible format | actionable | Backup recovery |
| O04 | Backups omit uploaded media bytes | actionable | Backup recovery |
| O05 | Backup queries do not form a consistent snapshot | actionable | Backup recovery |
| O06 | Schema push ignores documented flags/environment | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O07 | Schema push can overwrite local frontend configuration | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O08 | Compose frontend targets localhost on visitor devices | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O09 | Compose setup modifies the host checkout | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O10 | Supported Node version conflicts with dependencies | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O11 | Locked Vite version has a conditional security advisory | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O12 | Support services bind all network interfaces | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O13 | CI schema deployment is not gated on credentials | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O14 | License documentation conflicts with GPL file | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O15 | Development supervisor loses child failure status | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O16 | CI lint job never invokes lint | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O17 | Backup chooses inconsistent environment precedence | actionable | Backup recovery |
| O18 | Concurrent CI schema pushes can roll back code | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O19 | Installed ESLint rule crashes | actionable | Known from PR #1; unresolved |
| O20 | Fresh setup omits content seeding | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| O21 | Compose accepts a published default admin password | actionable | Independent focused fix; recheck current code and open PRs before implementation |
| N01 | Curated short visit routes | requiring a decision | Curator must select route/audience/duration; question pending |
| N02 | Printable object label sheets | actionable | Candidate: print existing object QR labels with no new paid service |
| N03 | Side-by-side bilingual reading | actionable | Candidate: German alongside chosen language |
| N04 | Personal visitor shortlist | actionable | Candidate: best-effort local shortlist with shareable IDs |
| N05 | Two-object teaching comparison | requiring a decision | Speculative educator workflow; question pending |
| N06 | Media source and credit metadata | requiring a decision | Credit fields/schema scope; question pending |
| N07 | Tag browsing facets | actionable | Candidate: existing tags as browse facets |

## Work order

1. Authorization (#3), fail-closed credentials and service exposure.
2. Upload identity, limits, completion, cleanup and same-origin media safety.
3. Recoverable database and upload backups; safe schema tooling.
4. Editor loading (#4), public details (#5), content identity, clearing/deletion, memberships and featured consistency.
5. Translation correctness, media navigation, language/state races and storage resilience.
6. Keyboard/dialog accessibility and control semantics.
7. Effective CI checks, runtime compatibility and deployment sequencing.
8. Remaining maintainability and usability fixes; clear feature candidates after correctness.

## Decisions and limitations

- N01 needs real curator-supplied content; inventing an itinerary is not authorized.
- N05 is speculative and needs educator demand; N06 needs agreement on fields.
- B20 and B21 must not silently change content identity or concurrent editing policy.
- O11 exposure is conditional; update the affected dependency without claiming an exploited deployment.
- Real hosting/network policy, camera/device behavior, assistive technology and isolated restore drills remain validation prerequisites where applicable.
- No merge, deployment, production mutation or shared-history rewrite is authorized.
