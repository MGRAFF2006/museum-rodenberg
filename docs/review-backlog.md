# Consolidated review implementation backlog

Baseline: `26133b5` (`origin/main`), rechecked 2026-10-06. This document preserves the final thread's F01–F103 and opportunity O01–O07, plus every ID in the previously published 111-finding/seven-opportunity backlog. `legacy:Oxx` means an operational finding from that earlier inventory; unprefixed Oxx means a future-work opportunity from the final report. Alias columns deduplicate shared causes without removing their acceptance criteria.

**Statuses:** actionable; already resolved (on main); unsupported; blocked; requiring a decision. An open PR or pushed branch remains actionable pending review/merge, never already resolved. GitHub API authentication is restored. Branches without PR numbers are either superseded proposals or work still awaiting publication; neither means the finding is fixed on main. No merges, deployment, production data writes, or shared-history rewrite are authorized.

Current main remains `26133b5`. Prepared work was reconciled against the current open PR inventory by branch base, changed behavior and available verification; many appeared during implementation in another active thread. Existing open PRs are reused rather than duplicated. Main contains none of these proposed fixes. The separate hosting branch proposes overlapping infrastructure changes but is not main; reconcile before editing the same behavior. T3 preview status/open succeed, but navigation fails in its automation client (including an isolated local audio fixture); no browser interaction or screenshot was obtained; camera, codecs, assistive technology, production configuration and a true isolated database restore remain explicit validation limits.

## Findings and acceptance ownership

| ID | Distinct behavior | Preserved aliases | Status | Work / evidence / prerequisite |
| --- | --- | --- | --- | --- |
| F01 | Unauthenticated content writes | B01 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F02 | Development API authentication bypass | B02 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F03 | Upload write failure and premature completion | B09 | actionable | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); adapter statuses [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); duplicate fix/review-upload-safety superseded |
| F04 | Upload filename/ID collisions and stale mutable URLs | B07, B08, B31 | actionable | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); immutable UUID paths/IDs; duplicate upload branch superseded |
| F05 | Active same-origin uploaded documents | B04 | actionable | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) active-format allowlist + [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55) bounded container signatures on [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) (17 native tests); [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) returns 415; [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) static headers protect legacy paths; legacy volume still unverified |
| F06 | Editor paste-handler XSS dependency | — | actionable | PR [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39); clean install, patched locked versions and real Tiptap smoke verified |
| F07 | Failed backups falsely report success | legacy:O02 | actionable | Draft PR [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); 11 native fixture tests pass; duplicate backup branch superseded |
| F08 | Backup output incompatible with documented restore | legacy:O03 | actionable | Draft PR [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); native ZIP contract inspected; isolated backend export/import drill outstanding |
| F09 | Backups omit upload bytes | legacy:O04 | actionable | Draft PR [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) includes upload archive/checksums; fixture-byte recovery verified |
| F10 | Visitor queries omit all detailed content | V01 | actionable | PR [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5) |
| F11 | Upload resource/filename limits | B10, B11 | actionable | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) limits/cleanup; [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) controlled statuses; development body limit already in [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F12 | Unbounded login attempts | B03 | actionable | PR [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9); actual production parser ordering follow-up PR [#51](https://github.com/MGRAFF2006/museum-rodenberg/pull/51) (10 focused tests) |
| F13 | Development ports/default credentials exposed | legacy:O12, legacy:O21 | actionable | Existing PR [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) proposes loopback services/required password; containers/second-device access not verified |
| F14 | Dependency advisory debt | legacy:O11 | actionable | Existing PR [#25](https://github.com/MGRAFF2006/museum-rodenberg/pull/25) patches Vite source-map advisory; [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39) editor advisory; remaining dependency advisories still need reachability review |
| F15 | Optional fields and removed translations cannot clear | B15, B16 | actionable | PR [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) explicit clearing + PR [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58) omission-safe loaded-language removals/details (25 tests); old nullable alternative superseded |
| F16 | Artifact membership inconsistencies | B17 | actionable | PR [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8) on [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42); related membership changes advance versions |
| F17 | Used assets can be deleted | B13 | actionable | actionable; usage guard across registered IDs and URLs |
| F18 | File/metadata partial failure not retryable | B12 | actionable | PR [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47) makes file deletion retryable and rejects directories (18 tests); metadata/UI completion remains actionable |
| F19 | Omitted media erases existing gallery | — | actionable | PR [#43](https://github.com/MGRAFF2006/museum-rodenberg/pull/43) on [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42); omitted media preserved, explicit [] clears, six contract regressions; base updated to current save contract |
| F20 | Async editor hydration missing | A01 | actionable | PR [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) |
| F21 | Blank new image rows cannot update/remove | A03 | actionable | Existing PR [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35) fixes blank-row editing; PR [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52) filters blank media on save (five tests); original gallery branch superseded |
| F22 | Visual audio/video serialization incompatible | A13 | actionable | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) real Tiptap audio/video round-trip |
| F23 | Picker lacks upload bearer | B05 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F24 | Upload-image alias routes to 404 | B06 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F25 | Asset IDs bypass validation | A09 | actionable | PR [#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44); six ID/path/registry/error regression cases |
| F26 | Translation freshness shared across languages | T01 | actionable | actionable; target-specific freshness |
| F27 | Bulk translation omits detailed text/artist | A07 | actionable | actionable; full-record bulk source and aligned fields |
| F28 | Visible metadata controls do not persist | A04, A05 | actionable | PR [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46) on [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); four actual editor metadata/translation-request cases |
| F29 | Save/delete races translation | — | actionable | Existing PR [#37](https://github.com/MGRAFF2006/museum-rodenberg/pull/37) blocks saves during translation; delete/navigation serialization still actionable |
| F30 | Stale full-record saves overwrite newer edits | B21 | actionable | PR [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) on [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) ([#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17)/[#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3)); approved conflict-and-reload policy, captured revision/document ID, 22 tests independently rerun; current [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8)/[#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) advance related versions; exact-head cross-PR regression checks pass |
| F31 | Unsaved editor navigation loses draft | A11 | actionable | actionable; dirty-navigation guard |
| F32 | Media operations advance on failed outcomes | B32 | actionable | actionable; PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) covers picker partly, remaining library/reauth state |
| F33 | Translation URL placeholder corruption | B23, B24, B25 | actionable | Existing PR [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13) + PR [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56) literal-placeholder collision supplement (six tests); own full alternative superseded |
| F34 | Translation timeout/cancellation/retry errors | B26, B27 | actionable | Existing PR [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16) deadlines/retries + PR [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59) permanent/malformed-response classification (36 tests); own full alternative superseded |
| F35 | Out-of-order language responses overwrite state | V08 | actionable | Existing PR [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); duplicate language branch superseded |
| F36 | Failed language retains previous dictionary | V09 | actionable | Existing PR [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); duplicate language branch superseded |
| F37 | Generator marks failed translations fresh | T03 | actionable | actionable; failed-target cache policy |
| F38 | Missing mobile media parameter opens blank tab | V03 | actionable | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); duplicate media-selection branch superseded |
| F39 | Audio/video-only gallery starts empty | V05 | actionable | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) chooses populated gallery tab |
| F40 | Mobile gallery loses clicked item | V04 | actionable | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) preserves type/URL route query |
| F41 | Markdown custom media protocols stripped | V02 | actionable | Existing PR [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28); duplicate Markdown branch superseded; wrapper actions cover part of F46 |
| F42 | Speech error permanently blocks retry | V15 | actionable | PR [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45); six native-engine event/provider/button cases |
| F43 | Audio playback rejection ignored | V16 | actionable | PR [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48); four native media promise/event cases; real browser playback remains unverified |
| F44 | Cards/search ignore disabled attributes | V10 | actionable | actionable; consistent presentation policy |
| F45 | Loading/unavailability presented as missing content | V12 | actionable | actionable; genuine data-state distinctions |
| F46 | Visitor actions inaccessible by keyboard | V23 | actionable | Existing [#38](https://github.com/MGRAFF2006/museum-rodenberg/pull/38) cards, [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28) Markdown wrappers; remaining gallery/image action keyboard behavior actionable |
| F47 | Overlays lack dialog focus/Escape semantics | V24 | actionable | actionable; shared native dialog behavior |
| F48 | Controls missing accessible names/states | V25 | actionable | actionable; named form and media controls |
| F49 | Document language remains English | V26 | actionable | Existing PR [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18) includes document language; duplicate language branch superseded |
| F50 | CI typecheck processes zero files; lint absent | legacy:O01, legacy:O16 | actionable | Existing PR [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14) independently passes three projects and rejects source-error probe; [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34) lint gate requires [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26)/[#31](https://github.com/MGRAFF2006/museum-rodenberg/pull/31); actual source assertions retained |
| F51 | Node requirement conflicts with tooling | legacy:O10 | actionable | Existing PR [#24](https://github.com/MGRAFF2006/museum-rodenberg/pull/24) Node >=22.13/runtime alignment; actual container startup unverified |
| F52 | Browser backend URL baked as localhost | legacy:O08 | actionable | Existing PR [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) relative backend resolution; second-device access unverified |
| F53 | Compose setup modifies host checkout | legacy:O09 | actionable | Existing PR [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) isolates setup copy/dependency volume; containers unverified |
| F54 | Backups lack consistent database snapshot | legacy:O05 | actionable | Draft PR [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) native DB snapshot + disk archive; external curator/import/upload write pause required |
| F55 | Stored artifact display order ignored | — | actionable | actionable; ordered membership projection |
| F56 | Featured flag and setting disagree | B19, A06 | actionable | Existing PR [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) plus [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) conversion; current [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) on [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) advances changed flag versions; cross-PR stale-draft checks pass |
| F57 | Featured deletion selects deleted replacement | B18 | actionable | Existing PR [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) selects replacement after removal; current [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) advances changed flags/detached children; cross-PR checks pass |
| F58 | Editor image previews use unresolved IDs | A15 | actionable | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) image preview resolves registry IDs without altering stored identity |
| F59 | Translation hashes not persisted | T02 | actionable | actionable; optional target-specific schema contract |
| F60 | Tags/materials cannot be authored | — | actionable | PR [#50](https://github.com/MGRAFF2006/museum-rodenberg/pull/50); three tags/materials editing/clearing cases; dictionary keys additive |
| F61 | New record visibility defaults incorrect | A02 | actionable | PR [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4), including regression |
| F62 | Clipboard falsely reports success | A12 | actionable | PR [#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49); delayed clipboard success/rejection/no-API cases |
| F63 | Duplicate Tiptap extensions | — | actionable | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) configures each Tiptap extension once |
| F64 | Search pushes duplicate history | V13 | actionable | Existing PR [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30) enhanced by first-entry push/subsequent-edit replacement (19 search/router tests); duplicate search branch superseded |
| F65 | Padded query fails matches | V14 | actionable | Existing PR [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30); whitespace normalization |
| F66 | StrictMode resets accessibility settings | V17 | actionable | Existing PR [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) on [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); duplicate preference branch superseded |
| F67 | Detailed fallback has no read-more entry | — | actionable | PR [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5); verify fallback independently |
| F68 | Description visibility hides detailed entry | — | actionable | PR [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5) |
| F69 | Underline escapes as literal HTML | A14 | actionable | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) removes unsupported underline action and preserves words; legacy published markup remains unmigrated |
| F70 | Links lack visible focus | V30 | actionable | actionable; retain native visible focus |
| F71 | Used translation keys absent | V27 | actionable | actionable; source and target key coverage |
| F72 | Hardcoded visitor labels | V28 | actionable | actionable; localized labels and provider-independent recovery |
| F73 | Gallery image alternative text discarded | — | actionable | actionable; registry metadata reaches rendered images |
| F74 | Live gallery invalidates selection | V07 | actionable | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) selection follows identity on reorder/removal |
| F75 | Speech outlives dismissed source | — | actionable | PR [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45) cancels owner-bound source on dismissal/content/language change |
| F76 | Malformed stored speech preferences | — | actionable | Existing PR [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) validates saved speech settings; duplicate preference branch superseded |
| F77 | Denied storage breaks optional preferences | V18, V19 | actionable | Existing PR [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) covers language/speech/accessibility denied storage |
| F78 | QR async cleanup races replacement | V20, V21 | actionable | Existing PR [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29) lifecycle; real camera/permission behavior unverified |
| F79 | Mobile menu cannot scroll | V29 | actionable | actionable; bounded scroll region |
| F80 | Mobile WebM falsely declared MP4 | V34 | actionable | Existing PR [#23](https://github.com/MGRAFF2006/museum-rodenberg/pull/23); duplicate source-type change superseded |
| F81 | Navigation scroll reset/restoration absent | — | actionable | actionable risk; real-browser reproduction required |
| F82 | High-contrast selected controls lose contrast | V31 | actionable | actionable; paired surface/text policy |
| F83 | Partial translation suppresses fallback | — | actionable | actionable; field-level completeness |
| F84 | Seed museum translations incomplete | — | requiring a decision | requiring a decision; curated content needs bilingual editorial approval |
| F85 | Seed audio syntax unrecognized | — | actionable | actionable; correct committed asset reference |
| F86 | URL query/fragment breaks media detection | V33 | actionable | Existing PR [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28) pathname classifier handles query/fragment |
| F87 | Root HTML has wrong cache policy | B30 | actionable | PR [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) |
| F88 | Missing uploads/API return cacheable SPA HTML | B29 | actionable | PR [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) |
| F89 | Lint command crashes | legacy:O19 | actionable | Existing PR [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26) repairs rule loading; source lint enforcement [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34) remains separate |
| F90 | Fresh setup never imports museum seeds | legacy:O20 | actionable | Existing PR [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53) proposes explicit seed bootstrap; not reverified in this publication batch |
| F91 | README promises nonexistent JSON fallback | — | actionable | actionable; correct claim, no implicit fallback architecture |
| F92 | Translation CLI failure exits successfully | — | actionable | actionable; nonzero exit on incomplete generation |
| F93 | Removed source leaves stale targets | — | actionable | actionable; source-removal propagation |
| F94 | Migration documentation points to stub | B33 | actionable | actionable; remove misleading entrypoint/docs |
| F95 | Schema helper rejects documented flags | legacy:O06 | actionable | Existing PR [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); 20 isolated wrapper tests independently rerun; duplicate schema helper superseded |
| F96 | Schema helper matches brittle credential patterns | legacy:O06 | actionable | Existing PR [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); explicit named credentials/precedence; backend typechecking now mandatory |
| F97 | Older CI run can deploy last | legacy:O18 | actionable | Existing PR [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32) serialization/stale-head guard; hosted scheduling not verified |
| F98 | Mutable latest service tags | — | requiring a decision | requiring a decision; verify/pin actual deployed service versions without pulling production |
| F99 | Entrypoint ignores failed seed initialization | — | actionable | actionable; deliberate startup failure |
| F100 | Development supervisor loses child failure | legacy:O15 | actionable | Existing PR [#57](https://github.com/MGRAFF2006/museum-rodenberg/pull/57) proposes first-exit child supervision; not reverified in this publication batch |
| F101 | Missing manifest/favicons | — | actionable | actionable; existing vector asset export/reference |
| F102 | README license disagrees with LICENSE | legacy:O14 | actionable | PR [#40](https://github.com/MGRAFF2006/museum-rodenberg/pull/40) README matches existing GPLv2 LICENSE |
| F103 | Tests miss consequential boundaries | V35 | actionable | Regressions accompany focused PRs; existing PR [#33](https://github.com/MGRAFF2006/museum-rodenberg/pull/33) discovers native suites; meaningful translation-hash oracle still actionable |

## Additional preserved findings

These IDs have no exact F-series counterpart. They remain separate rather than being silently dropped or claimed as covered by a nearby fix.

| ID | Distinct behavior | Status | Work / evidence / prerequisite |
| --- | --- | --- | --- |
| B14 | Directories validate as media files | actionable | PR [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47) (directories rejected by file validation/deletion; 18 filesystem tests) |
| B20 | Duplicate QR codes resolve inconsistently | requiring a decision | Cross-type QR uniqueness requires existing-data preflight; do not change published identifiers silently |
| B22 | Listing queries scan unrelated translation/media rows | actionable | Existing PR [#41](https://github.com/MGRAFF2006/museum-rodenberg/pull/41) proposes indexed reads; measured fixture document counts are not production latency |
| B28 | Built uploads mask persistent uploads | actionable | PR [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) serves persistent uploads before built seed media |
| A08 | Empty or unsafe content identity can be saved | actionable | Existing PR [#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17) identity/German-title checks and [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) create-only collision contract |
| A10 | Saving during translation publishes partial work | actionable | Existing PR [#37](https://github.com/MGRAFF2006/museum-rodenberg/pull/37) save guard; delete/navigation still separate |
| T04 | Generator translates Markdown destinations | actionable | Protect generator Markdown destinations; actual echo-translator regression |
| T05 | Translation generator updates seeds rather than live content | unsupported | Not a runtime defect: the generator intentionally edits seed JSON. Document that boundary; live content translation is admin work F27 |
| V06 | Markdown media is absent from opened gallery | actionable | PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) selected embedded item + [#54](https://github.com/MGRAFF2006/museum-rodenberg/pull/54) complete visible Markdown gallery/full media-route source (30 tests) |
| V11 | Sponsor is never rendered | actionable | Verify enabled sponsor rendering from existing global metadata |
| V22 | Routine scan misses flood console | actionable | Existing PR [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29) handles routine frame misses quietly |
| V32 | Markdown URLs containing parentheses are truncated | actionable | Parenthesized Markdown destinations need proper parsing regression |
| V36 | Duplicate prop contracts drift | actionable | Verify actual divergent shared prop contracts before changing code; prefer one existing type |
| V37 | TranslationWarning conditionally calls a hook | actionable | Existing PR [#31](https://github.com/MGRAFF2006/museum-rodenberg/pull/31) consistent hook order; no runtime crash claimed |
| legacy:O07 | Schema push can overwrite local frontend configuration | actionable | Existing PR [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15) preserves local frontend configuration on failure/signal; independently rerun 20 tests |
| legacy:O13 | CI schema deployment is not gated on credentials | actionable | Existing PR [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32) skips unconfigured deployment; no deploy run |
| legacy:O17 | Backup chooses inconsistent environment precedence | actionable | Draft PR [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) uses process > local > base environment precedence; fixture verified |

## Opportunities

Scope estimates are recommendations, not evidence of visitor demand. Speculative editorial choices await answers; silence is not approval.

| ID | Opportunity | Preserved aliases | Status | Smallest candidate / prerequisite |
| --- | --- | --- | --- | --- |
| O01 | Printable labels | N02 | actionable | Print selected existing object titles/QR identifiers; no paid service |
| O02 | Curated short trails | N01 | requiring a decision | Museum must choose actual audience, stops and intended duration |
| O03 | Printable school/group companion | — | requiring a decision | Teacher/curator supplies prompts and selection; no invented historical claims |
| O04 | Private local visit shortlist | N04 | actionable | Save/remove existing IDs locally, clear list, graceful storage failure; no accounts |
| O05 | Share links with explicit language | — | actionable | Unpublished prototype paused on superseded language base; finish on [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18), reverify clipboard fallback, then publish separately |
| O06 | Side-by-side editorial translation review | — | actionable | Source/target comparison first; reviewed-state persistence needs separate agreement |
| O07 | Discovery through existing tags | N07 | actionable | Simple theme links/filter; no recommendation engine |
| N03 | Side-by-side bilingual visitor reading | — | actionable | German alongside selected translation; distinct from curator review O06 |
| N05 | Two-object teaching comparison | — | requiring a decision | Validate educator workflow/demand before new product surface |
| N06 | Media sources and credit metadata | — | requiring a decision | Agree public/private attribution fields and schema before implementation |

## Priorities and dependencies

1. Public authorization [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); existing login limiter [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9) plus production-parser follow-up.
2. Upload safety and editor dependency patch; preserve existing uploaded files.
3. Recoverable native database snapshots plus matching disk media, with explicit operator write pause and failing completion semantics.
4. Content-save revision checks (approved: reject stale saves and request reload), clearing, media/asset references, [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8) memberships and featured integrity.
5. [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) editor hydration and [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5) visitor details, then translation/media/state correctness.
6. Keyboard/dialog/control accessibility and real effective checks.
7. Remaining operations/documentation and focused clear feature candidates.

Every proposed PR must identify its actual base, relevant IDs, observed checks, baseline failures and remaining verification. Independent branches start at origin/main; authorization-dependent branches name [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) explicitly; blank-row editing is [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35) and save filtering [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52); the latter names [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35). Proposed branches are not merged or deployed fixes.

## Publication and prepared-branch dispositions

New focused PRs: [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39) editor dependency security, [#40](https://github.com/MGRAFF2006/museum-rodenberg/pull/40) license documentation, [#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44) asset validation, [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45) speech recovery, [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46) metadata controls (now stacked on [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4)), [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47) retryable deletion, [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48) audio recovery, [#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49) clipboard feedback and [#50](https://github.com/MGRAFF2006/museum-rodenberg/pull/50) editable materials/tags. Each PR contains actual focused checks and compatibility/validation limits.

Explicit stacks: [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) → [#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17) → [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) → [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) → [#43](https://github.com/MGRAFF2006/museum-rodenberg/pull/43); [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) → [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46); [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) → [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9) → [#51](https://github.com/MGRAFF2006/museum-rodenberg/pull/51); [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35) → [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52); [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) → [#54](https://github.com/MGRAFF2006/museum-rodenberg/pull/54); [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) → [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55); [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13) → [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56) and [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13) → [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16) → [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59); [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) → [#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17) → [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) → [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58). [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) additionally needs [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4)'s complete editor hydration; [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55) needs [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) for controlled HTTP statuses; [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58) must preserve [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4)'s hydrate-once snapshot and [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42)'s captured revision/document identity when combined. Other prerequisites already documented by the existing PRs remain applicable.

Already-open proposals reused instead of duplicate PRs:

| Prepared local proposal | Disposition |
| --- | --- |
| fix/review-upload-safety | Superseded by [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10)/[#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) plus distinct byte-validation [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55) |
| fix/review-backup-recovery | Superseded by draft [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); restore drill still required |
| fix/schema-push-targets | Superseded by [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); added mandatory backend typechecking there |
| fix/ci-source-typechecking | Superseded by [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14); independently verified positive/negative source checks |
| fix/editor-gallery-rows | Superseded by [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35); only blank-save filtering published as [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52) |
| fix/explicit-content-field-clears | Superseded by [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27); only omission-safe loaded-content protection published as [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58) |
| fix/translation-markdown-links | Superseded by [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13); only token/prose collision dimension published as [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56) |
| fix/translation-timeouts | Superseded by [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16); upstream classification published separately as [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59) |
| fix/review-visitor-media | Superseded by [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22)/[#23](https://github.com/MGRAFF2006/museum-rodenberg/pull/23); complete article gallery supplement published as [#54](https://github.com/MGRAFF2006/museum-rodenberg/pull/54) |
| fix/review-language-loading | Superseded by [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18) and [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) |
| fix/review-markdown-media-links | Superseded by [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28) |
| fix/review-search-history | Superseded by [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30); enhanced its existing branch to preserve the starting detail entry |
| fix/review-keyboard-collection-cards | Superseded by [#38](https://github.com/MGRAFF2006/museum-rodenberg/pull/38) |
| fix/review-visitor-preferences | Superseded by [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) |
| local fix/featured-exhibition-integrity | Unchanged/unpushed because that remote branch already belongs to [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) |

These supersessions reject redundant implementations, not the underlying findings. Original branches/worktrees are retained; no force pushes or shared history rewrites were used. Opportunities are separate, unpublished investments; none is described as completed merely because a related bug fix was published.

## Verification from this publication batch

- GitHub authentication and all actual base refs were checked before publishing. Branches were pushed normally; PRs were opened or updated through authenticated `gh`/GitHub API and linked to the T3 thread. No PR was merged and main remains `26133b5`.
- [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39): clean `npm ci --ignore-scripts`, installed-version check and real Tiptap/jsdom initialization/edit/Markdown/undo/redo smoke pass. No advisory exploit was executed.
- [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11): `node --test scripts/__tests__/backup-convex.test.mjs` passes 11 isolated cases including archive byte recovery and failure cleanup. The native backend ZIP round-trip remains unperformed; draft status is deliberate.
- [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15): `node --test scripts/__tests__/push-convex.test.mjs` passes 20 isolated environment/failure/signal cases; Convex typecheck passes. Actual deploy was never invoked; `--typecheck=enable` is required by the wrapper.
- [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14): `npm run typecheck` passes app, tooling and Convex projects. A temporary app source type error was rejected with exit 2; its file was removed afterward.
- An isolated local integration worktree combines [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3)/[#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4)/[#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14), the original [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) revision commit, [#43](https://github.com/MGRAFF2006/museum-rodenberg/pull/43)/[#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44)/[#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46)/[#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49)/[#50](https://github.com/MGRAFF2006/museum-rodenberg/pull/50)/[#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45)/[#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48) and the protected-adapter fixture updates. `npm run typecheck` passes; 12 focused suites pass all 63 tests. Five fixture failures discovered on the first integration run were corrected by retaining the same assertions and mocking the authenticated adapter. The final run used CLI-only `--testTimeout 30000` under unrelated compiler load; repository timeouts/checks were not weakened.
- `npm run build` in that integration worktree passes with PWA generation (tmux `museum-publication-build` finished with exit 0). The existing Browserslist age warning remains. Integration tests (tmux `museum-publication-tests`) also finished with exit 0. These are local integration checks, not PR merges or backend deployment.
- Current [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) at `6a3b187` was independently reviewed and rerun for 24 revision/auth/draft cases after its forward integration with [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) and existing-ID preservation. Exact current [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8) (`5aaae34`) and [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) (`8628726`) already contain the necessary membership/flag revision increments; their isolated combination with [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) passes 41 focused tests, including six additional competing-draft boundaries. Removing just the two membership and one feature revision increments makes all six new cases fail by accepting stale drafts; restoring them passes all 41 again, with Convex typecheck and scoped test lint/diff checks. Equivalent local implementations were not pushed over those remote fixes. The 63-test integration above predates that forward integration, so it does not certify the entire latest open-PR graph.
- Native audio playback was attempted using an actual-component fixture and local WAV. HTTP succeeded but both T3 tab navigations failed in the automation client; no component interaction, native playback or screenshot was obtained. The transient fixture and owned server session were removed/stopped.
- Focused native and DOM suites in each new PR exercise actual handlers/components with filesystem or provider stubs where appropriate. No external translator, production backend, paid service, schema deployment or persistent media write was used. Standalone frontend checks still inherit baseline diagnostics until [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14); standard lint needs [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26)/[#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34). CLI-only lint workarounds are disclosed rather than represented as normal lint success.

## Decisions and infrastructure limits

- Approved on 2026-10-06: reject stale curator saves and ask for explicit reload; preserve the unsaved draft, never take a newer subscription revision silently.
- Resolved publication blocker: authenticated `gh` is ready; SSH pushes and GitHub PR creation/update work. The installed CLI cannot edit descriptions through its deprecated GraphQL projectCards query; direct authenticated pull-request PATCH updates work.
- Pending: new curated itinerary/teaching content and attribution schema; no invented content or paid dependencies.
- QR uniqueness requires production read-only preflight before enforcement; no production access performed.
- Service image pinning requires the actual deployed versions or a tested isolated upgrade path; do not guess compatibility.
- Complete backups require all curator/import writes paused through database export and media copy. The script does not alter running services itself.
