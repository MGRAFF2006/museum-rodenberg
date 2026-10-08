# Review implementation backlog

Updated 2026-10-08. Detailed review evidence below retains its 2026-10-06 snapshot. The original 111 findings and seven opportunities retain all 118 stable IDs. The complete F01–F103 inventory and final opportunities O01–O07 are recovered and cross-referenced below. At the feedback snapshot, 36 campaign PRs are merged and 26 implementation PRs are open and ready for review. **Resolved in repository** means the complete mapped code fix is merged; it does not assert deployment or production verification. Open PRs remain **actionable pending review/merge**. Partial findings remain actionable even when their covered portion is merged. **Requiring a decision** records a named editorial/product decision; **blocked** names an unavailable verification prerequisite. “Unprepared” means actionable work remains outside this publication batch.

At the 2026-10-06 snapshot, the user had merged the completed PRs; the agent had not merged PRs or deployed to production. Snapshot main was `c09904a`. Publication uses forward merges when bringing dependencies into prepared branches; shared history is preserved. GitHub authentication, including workflow scope, is restored; the earlier workflow-push authorization blocker is cleared.

**2026-10-08 merge update:** All 25 ready implementation PRs from the remaining batch are merged in dependency order, with their hosted code checks passing. This documentation PR records the outcome. [#60](https://github.com/MGRAFF2006/museum-rodenberg/pull/60) remains open until an export of actual deployed data passes the QR identity preflight; its code is being integrated with the merged save/deletion contracts. The latest observed main [schema deployment](https://github.com/MGRAFF2006/museum-rodenberg/actions/runs/37756296413) failed with `deployment connection failed`, after lint/type checks, tests and build passed. Production deployment remains unverified.

## Findings and opportunities

| ID | Finding / opportunity | Status | Published coverage and remaining work |
| --- | --- | --- | --- |
| B01 | Unauthenticated Convex writes | resolved in repository | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B02 | Development API authorization bypass | resolved in repository | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B03 | Unbounded login attempts | resolved in repository | [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9), [#51](https://github.com/MGRAFF2006/museum-rodenberg/pull/51); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B04 | Active documents served on the application origin | resolved in repository | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6), [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55); New uploads: allowlist/signature checks; merged #6 isolates legacy media paths; deployed-volume verification remains. Header recognition is not complete decoding. |
| B05 | Asset picker missing bearer token | resolved in repository | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B06 | Broken upload-image alias | resolved in repository | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B07 | Upload filename collisions overwrite bytes | resolved in repository | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); Merged; code fix is in the repository. |
| B08 | Asset IDs collide across extensions | resolved in repository | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); Merged; code fix is in the repository. |
| B09 | Upload write completion and error cleanup | actionable | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); Upload implementation merged; controlled adapter errors remain in open #21. |
| B10 | Nameless multipart upload crashes | actionable | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); Crash handling merged; controlled HTTP rejection remains in open #21. |
| B11 | Upload and development body resource limits | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3), [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10), [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); Prepared; await review and merge. |
| B12 | File and metadata deletion cannot be retried | actionable | [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47); Server retry covered; client registration-failure/metadata cleanup dimension remains actionable. |
| B13 | Referenced media can be deleted | actionable | Unprepared: authoritative reference protection must precede filesystem deletion; no client-only race-prone guard. |
| B14 | Directories validate as media files | resolved in repository | [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47); Merged; code fix is in the repository. |
| B15 | Optional fields cannot be cleared | resolved in repository | [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B16 | Omitted translations remain stored | resolved in repository | [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27), [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B17 | Artifact moves leave stale memberships | resolved in repository | [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B18 | Deleting featured item loses replacement | resolved in repository | [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B19 | Featured flag and setting diverge | resolved in repository | [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| B20 | Duplicate QR codes resolve inconsistently | actionable | [#60](https://github.com/MGRAFF2006/museum-rodenberg/pull/60); Approved globally unique nonempty QR codes; seed preflight checked 18 records. Current deployed-data export must still be audited before rollout; no automatic rewrite/backfill. |
| B21 | Concurrent editors overwrite changes | actionable | [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42), [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62); Strict captured revision + document ID; versioned deletion B21-D01 is covered by #62. |
| B22 | Listing queries scan unrelated translation/media rows | resolved in repository | [#41](https://github.com/MGRAFF2006/museum-rodenberg/pull/41); Merged; code fix is in the repository. |
| B23 | Translation placeholder numeric-prefix collisions | actionable | [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13), [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56); Numeric-prefix fix merged; literal-prose collision supplement remains in open #56. |
| B24 | Translation replacement interprets dollar sequences | resolved in repository | [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13); Merged; code fix is in the repository. |
| B25 | Translation normalization removes whitespace | resolved in repository | [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13); Merged; code fix is in the repository. |
| B26 | Translation requests have no deadline | resolved in repository | [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16), [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59); Merged; code fix is in the repository. |
| B27 | Non-transient translation failures retried | resolved in repository | [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16), [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59); Merged; code fix is in the repository. |
| B28 | Built uploads mask persistent uploads | resolved in repository | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6); Merged; code fix is in the repository. |
| B29 | Missing uploads return cached SPA HTML | resolved in repository | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6); Merged; code fix is in the repository. |
| B30 | HTML entry point is cached | resolved in repository | [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6); Merged; code fix is in the repository. |
| B31 | Mutable upload URLs keep stale cached bytes | resolved in repository | [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); Merged; code fix is in the repository. |
| B32 | Expired session does not reauthenticate editor | actionable | [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3); Partial: invalid tokens are cleared; reactive editor reauthentication remains unprepared. |
| B33 | Advertised migration action is a stub | resolved in repository | [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| A01 | Editor misses asynchronously loaded records | resolved in repository | [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); Merged; code fix is in the repository. |
| A02 | New editor attribute defaults are incomplete | resolved in repository | [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); Covered by merged #4; duplicate defaults branch deliberately not published. |
| A03 | New blank media rows cannot be edited | resolved in repository | [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35), [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52); Merged; code fix is in the repository. |
| A04 | Translated metadata inputs are not persisted | resolved in repository | [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46); Approved: metadata stays global; unsupported translation inputs removed; no migration. |
| A05 | Global artist input is ignored | resolved in repository | [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46); Merged; code fix is in the repository. |
| A06 | Editing clears featured flag | resolved in repository | [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); Merged; code fix is in the repository. |
| A07 | Bulk translation uses incomplete listing data | actionable | Unprepared: fetch full records and explicit entity type before bulk translation. |
| A08 | Empty or unsafe content identity can be saved | actionable | [#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17), [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27), [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42); Creation identity validated, create-only collision guard, existing mixed-case save identity preserved. |
| A09 | Asset IDs bypass file validation | resolved in repository | [#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44); Merged; code fix is in the repository. |
| A10 | Saving during translation publishes partial work | resolved in repository | [#37](https://github.com/MGRAFF2006/museum-rodenberg/pull/37); Merged; code fix is in the repository. |
| A11 | Navigation silently discards unsaved drafts | actionable | Unprepared; recheck code and existing PRs before implementation. |
| A12 | Clipboard reports success on failure | resolved in repository | [#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49); Merged; code fix is in the repository. |
| A13 | Visual editor audio links serialize incorrectly | resolved in repository | [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36); Merged; code fix is in the repository. |
| A14 | Underline serializes as literal HTML | actionable | [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36); New/resaved editor output covered; compatibility for already published literal underline HTML remains unprepared. |
| A15 | Visual editor previews unresolved asset IDs | resolved in repository | [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36); Merged; code fix is in the repository. |
| T01 | Translation freshness shared across languages | actionable | Unprepared: per-language freshness rather than one field hash shared by all destinations. |
| T02 | Translation hashes are not persisted | actionable | Unprepared: agree persisted hash representation with T01 before editing schema/writers. |
| T03 | Generator marks failed translations current | actionable | Unprepared: advance generator freshness only after successful translation. |
| T04 | Generator translates Markdown destinations | resolved in repository | [#61](https://github.com/MGRAFF2006/museum-rodenberg/pull/61); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| T05 | Translation generator updates seeds rather than live content | unsupported as a runtime defect | Generator intentionally edits seed JSON; #53 clarifies seed versus runtime data. Live admin bulk translation is A07/F27; no silent reseeding. |
| V01 | Public detailed content is unavailable | resolved in repository | [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5); Merged; code fix is in the repository. |
| V02 | Custom media protocols are stripped | resolved in repository | [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28); Merged; code fix is in the repository. |
| V03 | Missing media tab parameter opens blank page | resolved in repository | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Merged; code fix is in the repository. |
| V04 | Mobile media navigation loses clicked item | resolved in repository | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Merged; code fix is in the repository. |
| V05 | Audio-only galleries default to images | resolved in repository | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Merged; code fix is in the repository. |
| V06 | Markdown media is absent from opened gallery | resolved in repository | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22), [#54](https://github.com/MGRAFF2006/museum-rodenberg/pull/54); Merged; code fix is in the repository. |
| V07 | Gallery selection is stale after content changes | resolved in repository | [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); Merged; code fix is in the repository. |
| V08 | Language responses race | resolved in repository | [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); Merged; code fix is in the repository. |
| V09 | Failed language fetch retains previous labels | resolved in repository | [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); Merged; code fix is in the repository. |
| V10 | Cards ignore disabled attributes | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V11 | Sponsor is never rendered | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V12 | Loading content is reported missing | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V13 | Search updates duplicate browser history | resolved in repository | [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| V14 | Search query whitespace is not trimmed | resolved in repository | [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| V15 | Speech error prevents retry | resolved in repository | [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45); Merged; code fix is in the repository. |
| V16 | Audio playback rejection is unhandled | resolved in repository | [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| V17 | StrictMode resets accessibility preferences | resolved in repository | [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20); Merged; code fix is in the repository. |
| V18 | Storage exceptions can crash the app | resolved in repository | [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20); Merged; code fix is in the repository. |
| V19 | Stored speech preferences are unvalidated | resolved in repository | [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20); Merged; code fix is in the repository. |
| V20 | QR camera restarts on callback changes | resolved in repository | [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29); Merged; code fix is in the repository. |
| V21 | QR cleanup races subsequent camera initialization | resolved in repository | [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29); Merged; code fix is in the repository. |
| V22 | Routine scan misses flood console | resolved in repository | [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29); Merged; code fix is in the repository. |
| V23 | Clickable content is inaccessible by keyboard | actionable | [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28), [#38](https://github.com/MGRAFF2006/museum-rodenberg/pull/38); Partial: cards and Markdown media actions covered; remaining clickable images/controls need keyboard semantics. |
| V24 | Dialogs lack focus and keyboard behavior | actionable | Unprepared: modal focus/escape/trap behavior; real browser and assistive-technology checks required. |
| V25 | Controls lack accessible names and states | actionable | [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48); Partial: native audio play/pause labels covered; audit remaining control names/states. |
| V26 | Document language remains English | resolved in repository | [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); Merged; code fix is in the repository. |
| V27 | Translation dictionaries omit navigation keys | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V28 | Visitor interface includes hardcoded language strings | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V29 | Mobile menu lacks scrolling | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V30 | Links have no visible focus indicator | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V31 | Selected controls have insufficient contrast | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V32 | Markdown URLs containing parentheses are truncated | resolved in repository | [#61](https://github.com/MGRAFF2006/museum-rodenberg/pull/61); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| V33 | Media extension detection ignores query and fragment | resolved in repository | [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28); Merged; code fix is in the repository. |
| V34 | Video sources always advertise MP4 | resolved in repository | [#23](https://github.com/MGRAFF2006/museum-rodenberg/pull/23); Merged; code fix is in the repository. |
| V35 | Hash test does not assert its stated contract | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V36 | Duplicate prop contracts drift | actionable | Unprepared; recheck code and existing PRs before implementation. |
| V37 | TranslationWarning conditionally calls a hook | resolved in repository | [#31](https://github.com/MGRAFF2006/museum-rodenberg/pull/31); Merged; code fix is in the repository. |
| O01 | Root typecheck checks no source files | resolved in repository | [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| O02 | Backup reports success despite failed exports | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Ready after the real isolated recovery drill; await review and merge. |
| O03 | Backup restore instructions accept an incompatible format | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Ready after the real isolated recovery drill; await review and merge. |
| O04 | Backups omit uploaded media bytes | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Ready after the real isolated recovery drill; await review and merge. |
| O05 | Backup queries do not form a consistent snapshot | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Database snapshot covered; filesystem consistency still requires a write freeze, not an atomic cross-system guarantee. |
| O06 | Schema push ignores documented flags/environment | resolved in repository | [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); Merged; code fix is in the repository. Historical production deployment failure remains unexplained; secret-safe diagnostic follow-up #64 is open. |
| O07 | Schema push can overwrite local frontend configuration | resolved in repository | [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); Merged; code fix is in the repository. |
| O08 | Compose frontend targets localhost on visitor devices | resolved in repository | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Merged; code fix is in the repository. |
| O09 | Compose setup modifies the host checkout | resolved in repository | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Merged; code fix is in the repository. |
| O10 | Supported Node version conflicts with dependencies | resolved in repository | [#24](https://github.com/MGRAFF2006/museum-rodenberg/pull/24); Merged; code fix is in the repository. |
| O11 | Locked Vite version has a conditional security advisory | resolved in repository | [#25](https://github.com/MGRAFF2006/museum-rodenberg/pull/25); Patched identified Vite advisory; remaining dependency audit entries are not claimed resolved. |
| O12 | Support services bind all network interfaces | resolved in repository | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Merged; code fix is in the repository. |
| O13 | CI schema deployment is not gated on credentials | resolved in repository | [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| O14 | License documentation conflicts with GPL file | resolved in repository | [#40](https://github.com/MGRAFF2006/museum-rodenberg/pull/40); Merged; code fix is in the repository. |
| O15 | Development supervisor loses child failure status | resolved in repository | [#57](https://github.com/MGRAFF2006/museum-rodenberg/pull/57); Merged; code fix is in the repository. |
| O16 | CI lint job never invokes lint | resolved in repository | [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| O17 | Backup chooses inconsistent environment precedence | actionable | [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); Ready after the real isolated recovery drill; await review and merge. |
| O18 | Concurrent CI schema pushes can roll back code | resolved in repository | [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| O19 | Installed ESLint rule crashes | actionable | [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26); Known from existing #1; compatible rule loader restored without disabling rules. |
| O20 | Fresh setup omits content seeding | resolved in repository | [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53); Merged on 2026-10-08; complete mapped code fix is in the repository. |
| O21 | Compose accepts a published default admin password | resolved in repository | [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19); Merged; code fix is in the repository. |
| N01 | Curated short visit routes | requiring a decision (deferred by user) | User deferred until a curator supplies route content, audience and duration. |
| N02 | Printable object label sheets | actionable | Clear optional candidate: print existing object QR labels; unprepared in this publication batch. |
| N03 | Side-by-side bilingual reading | actionable | Clear optional candidate: German alongside chosen language; unprepared in this publication batch. |
| N04 | Personal visitor shortlist | actionable | Clear optional candidate: local visitor shortlist with shareable IDs; unprepared in this publication batch. |
| N05 | Two-object teaching comparison | requiring a decision (deferred by user) | User deferred pending educator demand. |
| N06 | Media source and credit metadata | requiring a decision (deferred by user) | User deferred pending agreed source/credit fields. |
| N07 | Tag browsing facets | actionable | Clear optional candidate: browse existing tags; unprepared in this publication batch. |

## Final-review acceptance inventory and cross-references

Recovered from the concurrent published backlog. These F01–F103 rows own the final review acceptance criteria; the original 118-ID table above is a lookup view, not 118 additional unique work items. Aliases preserve shared causes and distinct remaining dimensions. In this F-series table, `legacy:Oxx` refers to an operational finding above. In the opportunity table, `opportunity:Oxx` names a final-review opportunity, avoiding collisions with operational IDs.

| ID | Distinct behavior | Preserved aliases | Status | Work / evidence / prerequisite |
| --- | --- | --- | --- | --- |
| F01 | Unauthenticated content writes | B01 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F02 | Development API authentication bypass | B02 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F03 | Upload write failure and premature completion | B09 | actionable | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); adapter statuses [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21); duplicate fix/review-upload-safety superseded |
| F04 | Upload filename/ID collisions and stale mutable URLs | B07, B08, B31 | resolved in repository | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10); immutable UUID paths/IDs; duplicate upload branch superseded |
| F05 | Active same-origin uploaded documents | B04 | actionable | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) active-format allowlist + [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55) bounded container signatures on [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) (17 native tests); [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) returns 415; [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) static headers protect legacy paths; legacy volume still unverified |
| F06 | Editor paste-handler XSS dependency | — | resolved in repository | PR [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39); clean install, patched locked versions and real Tiptap smoke verified |
| F07 | Failed backups falsely report success | legacy:O02 | actionable | Ready [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11); 13 native orchestration/archive tests pass, including TAR_OPTIONS source-preservation regressions. Real isolated native ZIP round-trip passed; 10 exact records across all seven tables, native storage and two filesystem uploads recovered. |
| F08 | Backup output incompatible with documented restore | legacy:O03 | actionable | Ready [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) native ZIP import/export contract inspected; isolated native backend recovery drill passed on 2026-10-06. |
| F09 | Backups omit upload bytes | legacy:O04 | actionable | Ready [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) includes uploaded bytes/checksums and real fixture recovery; O04-TAR01 prevents inherited options excluding/deleting sources. |
| F10 | Visitor queries omit all detailed content | V01 | resolved in repository | PR [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5) |
| F11 | Upload resource/filename limits | B10, B11 | actionable | PR [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) limits/cleanup; [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) controlled statuses; development body limit already in [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F12 | Unbounded login attempts | B03 | actionable | PR [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9); actual production parser ordering follow-up PR [#51](https://github.com/MGRAFF2006/museum-rodenberg/pull/51) (10 focused tests) |
| F13 | Development ports/default credentials exposed | legacy:O12, legacy:O21 | resolved in repository | Existing PR [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) merged loopback services/required password; containers/second-device access not verified |
| F14 | Dependency advisory debt | legacy:O11 | actionable | Existing PR [#25](https://github.com/MGRAFF2006/museum-rodenberg/pull/25) patches Vite source-map advisory; [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39) editor advisory; remaining dependency advisories still need reachability review |
| F15 | Optional fields and removed translations cannot clear | B15, B16 | actionable | PR [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) explicit clearing + PR [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58), now on #42, omission-safe loaded-language removals/details (25 tests); old nullable alternative superseded |
| F16 | Artifact membership inconsistencies | B17 | actionable | [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8) now stacks on [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62); revision-aware membership helpers and guarded deletion. 81 tests pass; combined stack 136. |
| F17 | Used assets can be deleted | B13 | actionable | actionable; usage guard across registered IDs and URLs |
| F18 | File/metadata partial failure not retryable | B12 | actionable | PR [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47) makes file deletion retryable and rejects directories (18 tests); metadata/UI completion remains actionable |
| F19 | Omitted media erases existing gallery | — | actionable | PR [#43](https://github.com/MGRAFF2006/museum-rodenberg/pull/43) on [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42); omitted media preserved, explicit [] clears, six contract regressions; base updated to current save contract |
| F20 | Async editor hydration missing | A01 | resolved in repository | PR [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) |
| F21 | Blank new image rows cannot update/remove | A03 | resolved in repository | Existing PR [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35) fixes blank-row editing; PR [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52) filters blank media on save (five tests); original gallery branch superseded |
| F22 | Visual audio/video serialization incompatible | A13 | resolved in repository | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) real Tiptap audio/video round-trip |
| F23 | Picker lacks upload bearer | B05 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F24 | Upload-image alias routes to 404 | B06 | actionable | PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) |
| F25 | Asset IDs bypass validation | A09 | resolved in repository | PR [#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44); six ID/path/registry/error regression cases |
| F26 | Translation freshness shared across languages | T01 | actionable | actionable; target-specific freshness |
| F27 | Bulk translation omits detailed text/artist | A07 | actionable | actionable; full-record bulk source and aligned fields |
| F28 | Visible metadata controls do not persist | A04, A05 | resolved in repository | Approved global metadata behavior in [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46) on [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4); 13 metadata/hydration tests pass; artist, period, descriptions and details remain translated. |
| F29 | Save/delete races translation | — | actionable | Existing PR [#37](https://github.com/MGRAFF2006/museum-rodenberg/pull/37) blocks saves during translation; delete/navigation serialization still actionable |
| F30 | Stale full-record saves overwrite newer edits | B21 | actionable | [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) on [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) preserves strict captured revision/document ID; 61 tests pass. New deletion dimension [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62); [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8)/#12 on [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62) retain indirect version increments. Combined [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4)/#8/#12/#42/#60/#62 passes 136 tests. |
| F31 | Unsaved editor navigation loses draft | A11 | actionable | actionable; dirty-navigation guard |
| F32 | Media operations advance on failed outcomes | B32 | actionable | actionable; PR [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) covers picker partly, remaining library/reauth state |
| F33 | Translation URL placeholder corruption | B23, B24, B25 | actionable | Existing PR [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13) + PR [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56) literal-placeholder collision supplement (six tests); own full alternative superseded |
| F34 | Translation timeout/cancellation/retry errors | B26, B27 | resolved in repository | Existing PR [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16) deadlines/retries + PR [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59) permanent/malformed-response classification (36 tests); own full alternative superseded |
| F35 | Out-of-order language responses overwrite state | V08 | resolved in repository | Existing PR [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); duplicate language branch superseded |
| F36 | Failed language retains previous dictionary | V09 | resolved in repository | Existing PR [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); duplicate language branch superseded |
| F37 | Generator marks failed translations fresh | T03 | actionable | actionable; failed-target cache policy |
| F38 | Missing mobile media parameter opens blank tab | V03 | resolved in repository | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22); duplicate media-selection branch superseded |
| F39 | Audio/video-only gallery starts empty | V05 | resolved in repository | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) chooses populated gallery tab |
| F40 | Mobile gallery loses clicked item | V04 | resolved in repository | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) preserves type/URL route query |
| F41 | Markdown custom media protocols stripped | V02 | resolved in repository | Existing PR [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28); duplicate Markdown branch superseded; wrapper actions cover part of F46 |
| F42 | Speech error permanently blocks retry | V15 | resolved in repository | PR [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45); six native-engine event/provider/button cases |
| F43 | Audio playback rejection ignored | V16 | actionable | PR [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48); four native media promise/event cases; real browser playback remains unverified |
| F44 | Cards/search ignore disabled attributes | V10 | actionable | actionable; consistent presentation policy |
| F45 | Loading/unavailability presented as missing content | V12 | actionable | actionable; genuine data-state distinctions |
| F46 | Visitor actions inaccessible by keyboard | V23 | actionable | Existing [#38](https://github.com/MGRAFF2006/museum-rodenberg/pull/38) cards, [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28) Markdown wrappers; remaining gallery/image action keyboard behavior actionable |
| F47 | Overlays lack dialog focus/Escape semantics | V24 | actionable | actionable; shared native dialog behavior |
| F48 | Controls missing accessible names/states | V25 | actionable | actionable; named form and media controls |
| F49 | Document language remains English | V26 | resolved in repository | Existing PR [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18) includes document language; duplicate language branch superseded |
| F50 | CI typecheck processes zero files; lint absent | legacy:O01, legacy:O16 | actionable | Existing PR [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14) independently passes three projects and rejects source-error probe; [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34) lint gate now stacks on #14, which stacks on [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26); merged [#31](https://github.com/MGRAFF2006/museum-rodenberg/pull/31) retained; actual source assertions retained |
| F51 | Node requirement conflicts with tooling | legacy:O10 | resolved in repository | Existing PR [#24](https://github.com/MGRAFF2006/museum-rodenberg/pull/24) Node >=22.13/runtime alignment; actual container startup unverified |
| F52 | Browser backend URL baked as localhost | legacy:O08 | resolved in repository | Existing PR [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) relative backend resolution; second-device access unverified |
| F53 | Compose setup modifies host checkout | legacy:O09 | resolved in repository | Existing PR [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) isolates setup copy/dependency volume; containers unverified |
| F54 | Backups lack consistent database snapshot | legacy:O05 | actionable | Ready PR [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) native DB snapshot + disk archive; external curator/import/upload write pause required |
| F55 | Stored artifact display order ignored | — | actionable | actionable; ordered membership projection |
| F56 | Featured flag and setting disagree | B19, A06 | actionable | [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) on [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62) plus [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) loaded featured conversion; 79 tests pass including changed flag revisions and no-op preservation. |
| F57 | Featured deletion selects deleted replacement | B18 | actionable | [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) on [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62) selects fallback after removal, bumps changed flags/detached children and rejects stale deletion; 79 tests pass. |
| F58 | Editor image previews use unresolved IDs | A15 | resolved in repository | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) image preview resolves registry IDs without altering stored identity |
| F59 | Translation hashes not persisted | T02 | actionable | actionable; optional target-specific schema contract |
| F60 | Tags/materials cannot be authored | — | actionable | PR [#50](https://github.com/MGRAFF2006/museum-rodenberg/pull/50); three tags/materials editing/clearing cases; dictionary keys additive |
| F61 | New record visibility defaults incorrect | A02 | resolved in repository | PR [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4), including regression |
| F62 | Clipboard falsely reports success | A12 | resolved in repository | PR [#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49); delayed clipboard success/rejection/no-API cases |
| F63 | Duplicate Tiptap extensions | — | resolved in repository | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) configures each Tiptap extension once |
| F64 | Search pushes duplicate history | V13 | actionable | Existing PR [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30) enhanced by first-entry push/subsequent-edit replacement (19 search/router tests); duplicate search branch superseded |
| F65 | Padded query fails matches | V14 | actionable | Existing PR [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30); whitespace normalization |
| F66 | StrictMode resets accessibility settings | V17 | resolved in repository | Existing PR [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) on [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18); duplicate preference branch superseded |
| F67 | Detailed fallback has no read-more entry | — | actionable | PR [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5); merged; independent fallback verification remains |
| F68 | Description visibility hides detailed entry | — | resolved in repository | PR [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5) |
| F69 | Underline escapes as literal HTML | A14 | actionable | Existing PR [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) removes unsupported underline action and preserves words; legacy published markup remains unmigrated |
| F70 | Links lack visible focus | V30 | actionable | actionable; retain native visible focus |
| F71 | Used translation keys absent | V27 | actionable | actionable; source and target key coverage |
| F72 | Hardcoded visitor labels | V28 | actionable | actionable; localized labels and provider-independent recovery |
| F73 | Gallery image alternative text discarded | — | actionable | actionable; registry metadata reaches rendered images |
| F74 | Live gallery invalidates selection | V07 | resolved in repository | Existing PR [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) selection follows identity on reorder/removal |
| F75 | Speech outlives dismissed source | — | resolved in repository | PR [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45) cancels owner-bound source on dismissal/content/language change |
| F76 | Malformed stored speech preferences | — | resolved in repository | Existing PR [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) validates saved speech settings; duplicate preference branch superseded |
| F77 | Denied storage breaks optional preferences | V18, V19 | resolved in repository | Existing PR [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) covers language/speech/accessibility denied storage |
| F78 | QR async cleanup races replacement | V20, V21 | resolved in repository | Existing PR [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29) lifecycle; real camera/permission behavior unverified |
| F79 | Mobile menu cannot scroll | V29 | actionable | actionable; bounded scroll region |
| F80 | Mobile WebM falsely declared MP4 | V34 | resolved in repository | Existing PR [#23](https://github.com/MGRAFF2006/museum-rodenberg/pull/23); duplicate source-type change superseded |
| F81 | Navigation scroll reset/restoration absent | — | actionable | actionable risk; real-browser reproduction required |
| F82 | High-contrast selected controls lose contrast | V31 | actionable | actionable; paired surface/text policy |
| F83 | Partial translation suppresses fallback | — | actionable | actionable; field-level completeness |
| F84 | Seed museum translations incomplete | — | requiring a decision | requiring a decision; curated content needs bilingual editorial approval |
| F85 | Seed audio syntax unrecognized | — | actionable | actionable; correct committed asset reference |
| F86 | URL query/fragment breaks media detection | V33 | resolved in repository | Existing PR [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28) pathname classifier handles query/fragment |
| F87 | Root HTML has wrong cache policy | B30 | resolved in repository | PR [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) |
| F88 | Missing uploads/API return cacheable SPA HTML | B29 | resolved in repository | PR [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) |
| F89 | Lint command crashes | legacy:O19 | actionable | Existing PR [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26) repairs rule loading; source lint enforcement [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34) remains separate |
| F90 | Fresh setup never imports museum seeds | legacy:O20 | actionable | [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53) on [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42), with [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) authorization inherited; four actual CLI/stub tests pass. Explicit seeding documented; no live import run. |
| F91 | README promises nonexistent JSON fallback | — | actionable | [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53) corrects the README: seed JSON is not automatic runtime fallback. No fallback architecture added. |
| F92 | Translation CLI failure exits successfully | — | actionable | actionable; nonzero exit on incomplete generation |
| F93 | Removed source leaves stale targets | — | actionable | actionable; source-removal propagation |
| F94 | Migration documentation points to stub | B33 | actionable | [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53) makes the stub fail with the actual .mjs command; four CLI/stub tests plus Convex TypeScript pass. |
| F95 | Schema helper rejects documented flags | legacy:O06 | resolved in repository | Existing PR [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); 20 isolated wrapper tests independently rerun; duplicate schema helper superseded Historical production deployment failure remains unexplained; secret-safe diagnostic follow-up #64 is open. |
| F96 | Schema helper matches brittle credential patterns | legacy:O06 | resolved in repository | Existing PR [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15); explicit named credentials/precedence; backend typechecking now mandatory Historical production deployment failure remains unexplained; secret-safe diagnostic follow-up #64 is open. |
| F97 | Older CI run can deploy last | legacy:O18 | actionable | Existing PR [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32) serialization/stale-head guard; hosted scheduling not verified |
| F98 | Mutable latest service tags | — | requiring a decision | requiring a decision; verify/pin actual deployed service versions without pulling production |
| F99 | Entrypoint ignores failed seed initialization | — | actionable | actionable; deliberate startup failure |
| F100 | Development supervisor loses child failure | legacy:O15 | resolved in repository | [#57](https://github.com/MGRAFF2006/museum-rodenberg/pull/57) actual-script first-exit supervision and peer cleanup; eight isolated subprocess tests plus Bash syntax pass. |
| F101 | Missing manifest/favicons | — | actionable | actionable; existing vector asset export/reference |
| F102 | README license disagrees with LICENSE | legacy:O14 | resolved in repository | PR [#40](https://github.com/MGRAFF2006/museum-rodenberg/pull/40) README matches existing GPLv2 LICENSE |
| F103 | Tests miss consequential boundaries | V35 | actionable | Regressions accompany focused PRs; existing PR [#33](https://github.com/MGRAFF2006/museum-rodenberg/pull/33) discovers native suites; meaningful translation-hash oracle still actionable |

## Additional verified boundaries

| ID | Behavior | Status |
| --- | --- | --- |
| O04-TAR01 / PR11-R1 | Inherited archive options can omit source media or delete it while backing up; cleared for tar subprocess in #11, two regressions added | actionable, fixed in open ready PR; real isolated recovery drill passed |
| B21-D01 | New confirmed dimension: an old Delete action can remove a recreated same-slug record, #62 | actionable, PR open |

## Final-review opportunities

O01/N02, O02/N01, O04/N04 and O07/N07 are aliases. O03/O05/O06 are distinct candidates recovered from the final review. N03 bilingual visitor reading, N05 teaching comparisons and N06 credits retain their separate rows above; N01/N05/N06 remain deferred. No speculative editorial content is invented.

| Final opportunity ID | Opportunity | Preserved aliases | Status | Smallest candidate / prerequisite |
| --- | --- | --- | --- | --- |
| opportunity:O01 | Printable labels | N02 | actionable | Print selected existing object titles/QR identifiers; no paid service |
| opportunity:O02 | Curated short trails | N01 | requiring a decision (deferred by user) | User deferred until curator supplies route, audience and duration; same candidate as N01. |
| opportunity:O03 | Printable school/group companion | — | requiring a decision | Teacher/curator supplies prompts and selection; no invented historical claims |
| opportunity:O04 | Private local visit shortlist | N04 | actionable | Save/remove existing IDs locally, clear list, graceful storage failure; no accounts |
| opportunity:O05 | Share links with explicit language | — | actionable | Unpublished prototype on superseded language base; needs forward integration with #18 and fresh clipboard/language URL tests before publication. |
| opportunity:O06 | Side-by-side editorial translation review | — | actionable | Source/target comparison first; reviewed-state persistence needs separate agreement |
| opportunity:O07 | Discovery through existing tags | N07 | actionable | Simple theme links/filter; no recommendation engine |

## Published PR inventory and verification

Results below are the focused checks recorded in each PR, not a claim that the complete combined project has passed. Exact commands, additional results and limitations are in the linked descriptions. Browser/device and production deployment checks remain distinct from fixtures. Native backup recovery has now passed the isolated backend drill; other operational limitations remain. Host states and bases are refreshed from GitHub; recorded checks on older heads are not silently promoted to complete latest-graph validation.

| PR | Concern / IDs | State | Current base | Verification recorded |
| --- | --- | --- | --- | --- |
| [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3) fix: require editor authorization for all content writes | B01 B02 B05 B06 B11 B32 | open, ready | `main` | Fifteen focused tests, including AssetPicker image/media uploads, visible failure/retry behavior, and real Vite authenticated multipart uploads/revoked-session rejection: all Convex mutation guards, authorized writes without persisting credentials, public queries, allowlisted API/session expiry/revocation,… |
| [#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4) fix: hydrate editor drafts when full records arrive | A01 A02 A06 | merged | `main` | `npm test -- src/hooks/__tests__/useEditorForm.test.tsx` — nine tests cover both editor save payloads, all seven languages, detailed content/media, reactive draft preservation, ID switches, missing records and immediate new forms. |
| [#5](https://github.com/MGRAFF2006/museum-rodenberg/pull/5) fix: restore public access to stored item details | V01 | merged | `main` | `npm test -- src/test/publicDetails.test.tsx` — 36 tests using real public routes, ContentProvider, converters, and detail components with a mocked Convex query boundary. |
| [#6](https://github.com/MGRAFF2006/museum-rodenberg/pull/6) fix: serve persistent media and keep missing uploads out of caches | B04 B28 B29 B30 | merged | `main` | Eight HTTP integration cases cover live bytes, deleted build copies, API/media misses, three HTML entry routes, and hashed assets. |
| [#7](https://github.com/MGRAFF2006/museum-rodenberg/pull/7) docs: track review fixes and opportunity decisions | Backlog | merged | `main` | All 103 final finding IDs appear exactly once; every legacy finding and both opportunity inventories remain represented. |
| [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8) Fix exhibition membership when artifacts move or are deleted | B17 | open, ready | `fix/versioned-content-deletion` | 81 focused tests (12 membership, 8 revision, 22 validation, 11 save contract, 7 authorization, 16 deletion handlers, 5 rendered deletion checks); scoped Convex/test TypeScript and focused lint pass with baseline lint rule overrides. |
| [#9](https://github.com/MGRAFF2006/museum-rodenberg/pull/9) fix: limit editor login attempts with a retry window | B03 | open, ready | `fix/authenticated-content-writes` | Two HTTP regressions: forged forwarded addresses cannot bypass the limit; correct credentials cannot bypass an active lockout; expiry recovers; success resets failures. |
| [#10](https://github.com/MGRAFF2006/museum-rodenberg/pull/10) fix: make media uploads bounded and immutable | B04 B07 B08 B09 B10 B11 B31 | merged | `main` | `node --test server/upload-media.test.js`: 14 passed, using actual multipart streams and temporary files. Covers collisions, MIME/extension rejection, nameless/empty/malformed uploads, exact and exceeded size boundaries, request and part limits, delayed writes, disk failures, exclusive-open collision prese… |
| [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11) Make collection backups complete and recoverable | O02 O03 O04 O05 O17 F07 F08 F09 F54 | open, ready | `main` | 13 orchestration/archive regressions pass plus real isolated native ZIP recovery: exact ten records, IDs/creation times/relationships, 41-byte storage blob and two filesystem uploads; manifest byte/checksum verification and owned-resource cleanup pass. |
| [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) Keep featured exhibition selection consistent across save and deletion | B18 B19 | open, ready | `fix/versioned-content-deletion` | 79 focused tests (10 featured, 8 revision, 22 validation, 11 save contract, 7 authorization, 16 deletion handlers, 5 rendered deletion checks); scoped Convex/test TypeScript and focused lint pass with baseline rule overrides. |
| [#13](https://github.com/MGRAFF2006/museum-rodenberg/pull/13) fix: preserve protected Markdown destinations during translation | B23 B24 B25 | merged | `main` | Five focused tests: eleven protected destinations, dollar literals, paragraph/image spacing, altered token spacing/case, invalid inputs/output. |
| [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14) fix: check all TypeScript projects in CI | O01 F50 | open, ready | `fix/eslint-rule-compatibility` | `npm run typecheck` checks all three projects successfully. |
| [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15) Push schemas without rewriting local deployment settings | O06 O07 F95 F96 | merged | `main` | `node --test scripts/__tests__/push-convex.test.mjs` — 20 isolated tests pass for target selection, argument handling, credential isolation, failure/signal propagation and exact environment bytes/presence on both local and production paths. |
| [#16](https://github.com/MGRAFF2006/museum-rodenberg/pull/16) fix: bound translator waits and avoid futile retries | B26 B27 | merged | `main` | Fifteen focused tests pass: permanent failures, transient retry/recovery, browser deadline propagation, actual pending-fetch abort propagation, and URL/spacing preservation regressions. |
| [#17](https://github.com/MGRAFF2006/museum-rodenberg/pull/17) Validate route-safe content IDs and required German titles | A08 | open, ready | `fix/authenticated-content-writes` | `vitest run src/test/content-validation.test.ts src/test/content-auth.test.ts` — 29 tests pass, invoking actual mutation handlers. |
| [#18](https://github.com/MGRAFF2006/museum-rodenberg/pull/18) fix: keep dictionary labels aligned with the selected language | V08 V09 V26 | merged | `main` | Four rendered-provider tests pass: French before stale English, immediate German fallback and two HTTP failures, unavailable German fallback. |
| [#19](https://github.com/MGRAFF2006/museum-rodenberg/pull/19) Isolate local Compose setup and supporting services | O08 O09 O12 O21 | merged | `main` | `node --test scripts/__tests__/compose-isolation.test.mjs` — four configuration/setup-fixture tests pass, including password rejection, loopback/volume topology, failure propagation and unchanged host files. |
| [#20](https://github.com/MGRAFF2006/museum-rodenberg/pull/20) fix: keep visitor preferences usable when storage fails | V17 V18 V19 | merged | `main` | Twelve rendered-hook/provider tests pass: StrictMode saved-state preservation, blocked reads/full-quota writes, language changes, malformed/null/partial speech state, and dictionary races/fallbacks. |
| [#21](https://github.com/MGRAFF2006/museum-rodenberg/pull/21) fix: return useful statuses for rejected admin requests | B09 B10 B11 | open, ready | `fix/login-rate-limit` | Eight HTTP tests pass: three upload statuses, unexpected-error redaction, malformed JSON redaction, oversized JSON, login rate limit/recovery. |
| [#22](https://github.com/MGRAFF2006/museum-rodenberg/pull/22) fix: preserve selected media across visitor gallery navigation | V03 V04 V05 V06 V07 | merged | `main` | `npm exec vitest run src/test/mediaGallery.test.tsx`: 26 passed. Uses actual React viewer/detail components and MemoryRouter navigation with mocked content; covers both artifact/exhibition routes, desktop/mobile selection, query URL round-trips, audio/video-only galleries, null/invalid tabs, reactive image… |
| [#23](https://github.com/MGRAFF2006/museum-rodenberg/pull/23) fix: let browsers detect each gallery video format | V34 | merged | `main` | `npm exec vitest run src/test/mediaVideoSource.test.tsx`: 3 passed for WebM, MP4 and query-based resource URLs. The actual rendered source keeps the URL and exposes an empty type for browser format detection. |
| [#24](https://github.com/MGRAFF2006/museum-rodenberg/pull/24) Align development and deployment on supported Node 22 | O10 | merged | `main` | Node 22.23.3 satisfies the project and every locked dependency engine requirement. |
| [#25](https://github.com/MGRAFF2006/museum-rodenberg/pull/25) Upgrade Vite to the patched 6.4 release | O11 | merged | `main` | Isolated `npm ci --ignore-scripts` in a real worktree-owned dependency directory; original shared node_modules unchanged. |
| [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26) Restore ESLint rule compatibility with TypeScript ESLint 8.24 | O19 | open, ready | `main` | Reproduced original allowShortCircuit rule-loading crash with the baseline locked dependencies. |
| [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) Make editor clearing, translation removal and creation explicit | B15 B16 A08 | open, ready | `fix/content-input-validation` | Four focused files, 44 tests pass: actual save-handler serialized payloads, explicit clear versus omission, complete versus partial translations, creation conflicts, operation flags not persisted, required German title/authentication, and actual hook save payloads. |
| [#28](https://github.com/MGRAFF2006/museum-rodenberg/pull/28) fix: restore safe Markdown media actions and resource classification | V02 V23 V33 | merged | `main` | `npm exec vitest run src/test/markdownMedia.test.tsx src/utils/__tests__/markdownUtils.test.ts`: 38 passed (15 new, 23 existing). Actual ReactMarkdown rendering verifies keyboard activation, preserved asset/relative/HTTPS destinations, unsafe nested scheme rejection, ordinary link safety, and consistent qu… |
| [#29](https://github.com/MGRAFF2006/museum-rodenberg/pull/29) fix: keep QR camera startup and cleanup in one lifecycle | V20 V21 V22 | merged | `main` | Five rendered scanner lifecycle tests pass: callback rerender/latest callback, asynchronous reopen, StrictMode replay, mount isolation, rejected stop. |
| [#30](https://github.com/MGRAFF2006/museum-rodenberg/pull/30) fix: keep typed search updates out of browser history | V13 V14 F64 F65 | open, ready | `main` | `npx vitest run src/components/__tests__/searchNavigation.test.tsx src/components/__tests__/searchDetailHistory.test.tsx src/hooks/__tests__/useSearch.test.ts` — 19 tests pass. Includes the actual Header input/App/router, starting artifact return in one Back after multiple keystrokes, padded matching, clea… |
| [#31](https://github.com/MGRAFF2006/museum-rodenberg/pull/31) fix: keep translation warning hooks unconditional | V37 | merged | `main` | Unmodified `react-hooks/rules-of-hooks` validation passes for this component using the compatible lint dependencies from #26. |
| [#32](https://github.com/MGRAFF2006/museum-rodenberg/pull/32) Skip unconfigured or outdated schema deployments in CI | O13 O18 | open, ready | `main` | `node --test scripts/__tests__/schema-ci-guards.test.mjs` — seven fixture tests pass for complete/partial/missing credentials, gating/concurrency permissions, latest/stale main commits and failed API lookup; Node 22 and native-test gates preserved after forward integration with main. |
| [#33](https://github.com/MGRAFF2006/museum-rodenberg/pull/33) Run native script and server regression tests in CI | Native test discovery | merged | `main` | `npm run test:node` — four native discovery/propagation tests pass. |
| [#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34) fix: enforce working lint checks in CI | O16 | open, ready | `fix/effective-typechecks` | Unmodified `npm run lint`: zero errors, seven existing warnings. |
| [#35](https://github.com/MGRAFF2006/museum-rodenberg/pull/35) fix: make newly added image rows editable | A03 | merged | `main` | Actual editor-hook regressions cover add/select, add/remove, and an invalid index without altering existing media. |
| [#36](https://github.com/MGRAFF2006/museum-rodenberg/pull/36) fix: keep visual editor output compatible with visitor Markdown | A13 A14 A15 F63 | merged | `main` | `npm exec vitest run src/test/visualEditorMedia.test.tsx`: 9 passed with the actual TipTap editor and ContentProvider, mocked registry queries/picker only. Verifies audio/video insertion and reopening, safe literal asset captions, resolved image bytes with stable Markdown IDs, late/changed registry updates… |
| [#37](https://github.com/MGRAFF2006/museum-rodenberg/pull/37) fix: wait for translation before saving editor drafts | A10 | merged | `main` | Ten editor tests pass, including a regression that cannot validate/save while translating and can save after completion. |
| [#38](https://github.com/MGRAFF2006/museum-rodenberg/pull/38) fix: make collection cards accessible navigation links | V23 | merged | `main` | Two rendered keyboard tests pass: Tab focus, Enter activation, correct href, modified-click default preserved. |
| [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39) Patch the editor HTML-paste vulnerability | F06 | merged | `main` | Clean npm ci --ignore-scripts succeeds. |
| [#40](https://github.com/MGRAFF2006/museum-rodenberg/pull/40) Align the README with the existing GPL license | O14 F102 | merged | `main` | Compared README against the LICENSE heading/version. |
| [#41](https://github.com/MGRAFF2006/museum-rodenberg/pull/41) Index content reads by language and exhibition membership | B22 | merged | `main` | 13 Node tests execute actual query handlers against a schema-checked fake database containing 500 entities of each kind and seven languages; payloads match the former full-scan join. |
| [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) Reject stale editor saves before modifying collection content | B21 A08 F30 | open, ready | `fix/explicit-editor-save-contract` | Seven focused Vitest suites: 61 tests pass, including revision/document identity guards, legacy records, creation collisions, clearing, translation replacement, JSON wire serialization, safe HTTP 409, captured drafts and protected mutations. |
| [#43](https://github.com/MGRAFF2006/museum-rodenberg/pull/43) Preserve galleries when content updates omit media | F19 | open, ready | `fix/content-revision-guards` | Eight focused suites: 67 tests pass, including six stateful JSON-wire media cases for both entity types, strict revisions, creation, clearing, translation replacement, editor payloads and protected API responses. |
| [#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44) Validate registry asset IDs before saving content | A09 F25 | merged | `main` | `vitest run src/hooks/__tests__/useAssetValidation.test.ts` (six focused cases: all content locations, deduplication, unknown IDs, registry arrival, missing files, direct/external URLs and server failure; five fail against `main`). |
| [#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45) Recover read-aloud playback and cancel dismissed sources | V15 F42 F75 | merged | `main` | `npx vitest run src/components/__tests__/SpeechRecovery.test.tsx` — 6 tests pass using the actual provider/buttons and controlled native engine events: retry, source dismissal, text/language change, unrelated-source removal, and stale error/end events after restart. |
| [#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46) Align curator metadata controls with the stored content model | A04 A05 F28 | merged | `main` | Metadata controls plus async-hydration suites: 13 tests pass, covering persisted fields, language switching, translation request fields and delayed full-record loading. |
| [#47](https://github.com/MGRAFF2006/museum-rodenberg/pull/47) Make uploaded media deletion safely retryable | B12 B14 F18 | merged | `main` | `npx vitest run src/test/apiHandlers.test.ts` — 18 tests passed using temporary files, repeated deletion, missing roots, containment/symlinks, directory sentinels, concurrent-removal ENOENT, and permission-error propagation. |
| [#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48) Recover failed audio playback and ignore stale source errors | V16 V25 F43 | open, ready | `main` | `npx vitest run src/components/__tests__/AudioPlayer.test.tsx` — 4 tests pass for rejected native promises, retry, native event-based playing/paused state, source-load error, and pending rejection after source replacement. |
| [#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49) Show copy success only after the clipboard write succeeds | A12 F62 | merged | `main` | `vitest run src/components/Admin/__tests__/clipboardFeedback.test.tsx` (three cases: delayed success, rejected access, missing API). |
| [#50](https://github.com/MGRAFF2006/museum-rodenberg/pull/50) Let curators edit materials and collection tags | F60 | open, ready | `main` | `vitest run src/components/Admin/__tests__/arrayMetadata.test.tsx` (three integration cases: exhibition/artifact tags and artifact materials, including clearing). |
| [#51](https://github.com/MGRAFF2006/museum-rodenberg/pull/51) Run production login throttling before JSON parsing | B03 F12 | open, ready | `fix/admin-api-error-status` | `npx vitest run src/test/productionLoginLimits.test.ts src/test/loginLimits.test.ts src/test/content-auth.test.ts` — 10 tests passed. |
| [#52](https://github.com/MGRAFF2006/museum-rodenberg/pull/52) Skip unfinished gallery rows when saving content | A03 F21 | merged | `main` | Two regression cases fail on PR #35 before the fix, for both editor types. |
| [#53](https://github.com/MGRAFF2006/museum-rodenberg/pull/53) Document explicit collection seeding and reject the migration placeholder | B33 O20 | open, ready | `fix/content-revision-guards` | Four Node tests execute the actual placeholder handler and actual seed CLI body with a fake client and shipped JSON: successful authenticated import, missing secret, and a failed write with credential-safe error handling. |
| [#54](https://github.com/MGRAFF2006/museum-rodenberg/pull/54) Include article-only media in visitor galleries | V06 | merged | `main` | `npx vitest run src/test/mediaGallery.test.tsx` — 30 tests pass, including all existing #22 cases plus both entity routes with no media query, all article embeds, hidden-attribute exclusion, and desktop article Media action. |
| [#55](https://github.com/MGRAFF2006/museum-rodenberg/pull/55) Validate uploaded media container signatures | B04 F05 | merged | `main` | `node --test server/upload-media.test.js` — 17 tests passed, including declared-JPEG HTML/SVG, empty files, batch rollback, all permitted extensions, classic QuickTime, one-byte header chunks and byte preservation. Existing stream completion, exact limits, crashes, collision and interruption checks remain … |
| [#56](https://github.com/MGRAFF2006/museum-rodenberg/pull/56) Keep protected translation tokens distinct from ordinary prose | B23 F33 | open, ready | `main` | `npx vitest run src/test/translationProxy.test.ts` — 6 tests passed, covering literal placeholder-like prose, eleven distinct destinations with dollar syntax, paragraph spacing, modified token spacing/case and invalid input/output. |
| [#57](https://github.com/MGRAFF2006/museum-rodenberg/pull/57) Stop the development session when a required service exits | O15 | merged | `main` | Eight Node tests run the actual Bash script with fake services and a fake health check: failure and clean exit of either service, watcher failure during startup, initial schema failure, SIGINT, and SIGTERM. They assert peer termination and a single cleanup. |
| [#58](https://github.com/MGRAFF2006/museum-rodenberg/pull/58) Preserve unseen translations and remove only deliberately cleared rows | B16 | open, ready | `fix/content-revision-guards` | 25 focused tests pass: complete and partial source payloads, intentional loaded-language deletion, unseen-language/detail preservation, explicit known-detail clearing, complete-replacement compatibility and operation flags omitted from records. |
| [#59](https://github.com/MGRAFF2006/museum-rodenberg/pull/59) Stop retries for permanent translator failures and invalid output | B26 B27 F34 | merged | `main` | `npx vitest run src/test/translationFailures.test.ts src/test/translationProxy.test.ts src/test/translationDeadline.test.ts src/utils/__tests__/translationRetries.test.ts` — 36 tests passed. Includes actual proxy/client boundaries for provider 400/401/403/404/422, no accidental logout, transient 408/429/50… |
| [#60](https://github.com/MGRAFF2006/museum-rodenberg/pull/60) Reject duplicate QR identities across museum content | B20 | open, ready | `fix/content-revision-guards` | 84 focused Vitest tests across QR guards/preflight, revision/auth boundaries, editor save contracts, validation, and rendered draft recovery. |
| [#61](https://github.com/MGRAFF2006/museum-rodenberg/pull/61) Preserve CommonMark media boundaries across rendering and translation | V32 T04 | open, ready | `fix/translation-placeholder-collisions` | `npm exec vitest run src/test/generatorMediaProtection.test.ts src/test/markdownBoundaries.test.tsx src/utils/__tests__/markdownUtils.test.ts src/utils/__tests__/translationUtils.test.ts src/test/translationProxy.test.ts` — **76 passed**. Includes actual ReactMarkdown rendering, the server adapter and a re… |
| [#62](https://github.com/MGRAFF2006/museum-rodenberg/pull/62) Reject stale content deletion using captured identity and revision | B21-D01 B21 | open, ready | `fix/content-revision-guards` | 37 focused tests pass for real-wire stale deletion, legacy versions, recreation, zero partial writes, editor draft recovery and protected API behavior; Convex TypeScript pass. |

| [#63](https://github.com/MGRAFF2006/museum-rodenberg/pull/63) Make Compose regression fixtures self-contained | O08 O09 O12 O21; #19 feedback | open, ready | `main` | `node --test scripts/__tests__/compose-isolation.test.mjs`: six passing, including real Compose 5.5.1 and both flag-capability branches. Hosted Test, Build and current Type Check job pass; schema deployment skipped. |
| [#64](https://github.com/MGRAFF2006/museum-rodenberg/pull/64) Report secret-safe schema deployment failure categories | O06 O07; #15 feedback | open, ready | `main` | `node --test scripts/__tests__/push-convex.test.mjs`: 27 passing, including actual native CLI option rejection without a deployment contact, bounded diagnostic classification and secret suppression. Historical production failure cause remains unknown. |

## Current review-feedback inventory

The 26 implementation PRs below are open and ready as of this feedback snapshot,
excluding this documentation follow-up. Earlier workflow credential/scope blockers
are resolved. Hosted test failures on branches retaining the old Compose fixture
are explained by #63; do not weaken those assertions or copy unrelated fixture
changes into every branch. Review #63 first, then forward-update branches after
its normal merge. Stacked PRs still need target-eligible CI and integration checks.

| Open ready PRs | Focus / dependency |
| --- | --- |
| #3 → #9 → #21 → #51 | Authorization, login limits, request errors, production parser ordering |
| #3 → #17 → #27 → #42 | Validation, explicit save contract, strict captured revision/document identity |
| #42 → #62 → #8 / #12 | Versioned deletion, membership consistency and featured integrity |
| #42 → #43 | Preserve galleries omitted by partial writes |
| #42 → #58 / #53 | Deliberate translation removal and explicit seeding documentation; both now directly based on #42 |
| #42 → #60 | Global QR uniqueness; deployed-record preflight still required before rollout |
| #26 → #14 → #34 | Compatible lint loader, effective TypeScript checks, enforced CI lint; current retargeted tooling stack |
| #56 → #61 | Distinct protected tokens followed by CommonMark media boundaries |
| #30 | Search history, including first-entry push and subsequent-edit replacement |
| #48 | Audio promise/event recovery; real native playback remains unverified |
| #50 | Curator tags/materials controls |
| #11 | Native backup/recovery, now ready after the real isolated drill |
| #32 | Credential/stale-head deployment guards; seven fixture cases pass; hosted scheduling unverified |
| #63 | Current-main Compose fixture prerequisite for hosted native-test success |
| #64 | Secret-safe diagnostics; does not establish the original deployment failure's cause |

### Current focused integration evidence

- The unpublished `verify/full-feedback-20261006` assembly combines all 26 ready
  implementation branches on current main. `npm run typecheck` passes all three
  projects; normal `npm run lint` passes with zero errors and seven existing
  warnings. Integration exposed and corrected test-fixture listener typing in
  #9/#21 and narrow selection-switch props in #58 without weakening assertions.
- In that assembly, 22 focused Vitest files pass all 189 tests across editor saves,
  membership/deletion/revisions/QR identity, metadata, audio/search/Markdown,
  production login and translation handlers. Four native suites pass 47 tests:
  `node --test scripts/__tests__/{compose-isolation,production-runtime,push-convex,backup-convex}.test.mjs`.
  These are selected regressions, not a complete device or production validation.
- The combined production Vite/PWA build passed with a synthetic loopback
  Convex URL (`museum-feedback-build` finished with exit 0). No server credential
  or production backend was used; generated build files remain ignored.
- Assembly conflict resolutions preserve all QR/audio/materials translation keys,
  explicit empty-string metadata clearing with normalized arrays, both language
  snapshot and QR error imports, and the actionable seeding error with no unused
  context argument. The local verification branch is not published or merged;
  later independent PR merges may require these same combinations.
- The assembled backend feedback graph passed 165 Vitest cases and 19 native
  Node cases. The deliberate-translation-removal race was also independently
  checked against #42: 20 save/removal cases passed, including the two original
  reproductions, and 42 focused cases passed. These totals describe the named
  backend graph, not every remaining PR or unprepared finding.
- #61's updated parser graph passed 113 tests and a project build. A separate
  clean production-only dependency install started the actual Express server and
  passed HTTP startup checks; no Docker application image was built and no
  production backend was contacted. Native camera/audio/browser behavior remains
  outside these checks.
- Updated #3/#48 hosted runs had no reported Vitest failure paths; their remaining
  native-test failures were the current-main Compose fixture addressed by #63.
  #63's hosted current Type Check, Test and Build jobs succeeded; deployment was
  skipped. The current no-op root Type Check is still replaced only by #14.

### Native backup feedback outcome

Tmux `museum-backup-drill` completed with exit 0 on 2026-10-06. Convex CLI
1.32.0 and cached backend image
`sha256:1cd901be5d7de21bdba700d69dc7e47e91e2e77d87e70356a16ea04fde22d6e8`
ran against two new loopback-only backends with the current museum schema/functions
and temporary synthetic helpers. The actual #11 backup implementation exported
all seven museum tables and native file storage; default ZIP import into the empty
destination preserved all ten records exactly, including IDs, creation times,
translations, featured settings and relationships. Native storage bytes and both
filesystem uploads matched, including nested paths and a filename containing
spaces. Manifest sizes/SHA-256 matched, source media remained intact, and both
owned containers/anonymous volumes and temporary projects/archives were removed.
Existing museum containers, data and credentials were untouched. #11 is ready;
production-scale recovery, restored-app browsing and enforcement of the required
cross-system write freeze remain unverified.

### Remaining operational checks

- Historical production schema run `37504202670` reports only exit 1 because #15
  suppressed native CLI diagnostics. Its original cause cannot be recovered from
  those logs. #64 emits fixed diagnostic categories without raw secret-bearing
  output; private backend logs/configuration checks remain necessary. The agent
  did not rerun deployment.
- #60's shipped-seed preflight covered 18 records. Audit an existing-record export
  from the actual deployed backend before QR uniqueness rollout; do not infer
  production cleanliness from seeds or automatically rewrite/backfill records.
- N01 remains deferred until curator-supplied route/audience/duration; N05 and N06
  remain deferred pending educator demand and agreed source/credit fields. Other
  unprepared findings and opportunities retain their original rows and decisions.

## Review and merge sequence

1. Review #63 first to remove the reproduced current-main native-test failure. Authorization #3 remains urgent; then #9 → #21 → #51 completes login/request handling. Media isolation #6, ingestion #10/#55 and editor dependency #39 are already merged; deployed behavior is not inferred from that status.
2. Review #3 → #17 → #27 → #42, followed by #43, #58, #53 and #60. #58 and #53 now directly stack on #42. #8/#12 stack on #62 versioned deletion, which stacks on #42; preserve indirect version increments. Before any later deployment, audit actual deployed QR records and coordinate compatible editor/backend bundles. No deployment or backfill is authorized by this backlog.
3. Tooling is now #26 → #14 → #34. Preserve Node 22, native-test discovery and merged Vite/TipTap patches when integrating manifests/workflows. #32 guards production schema jobs; #64 diagnoses failures without raw CLI output. The historical deployment failure remains an open operational question.
4. Review #56 → #61 together with the already merged #13/#16/#59 translation preservation/deadline/failure behavior and #28 media classifier. Existing #61 sibling conflicts still need explicit integration; do not overwrite the classifier or retry semantics.
5. Review remaining independent #30 search, #48 audio and #50 curator array metadata. Already merged hydration/metadata/media hooks must retain #37's translation-save guard and #42's captured version contract when later branches integrate.
6. #11 is ready after its actual native recovery drill; review the documented filesystem write-freeze requirement and production-scale/restored-app limits. No production recovery or backup is implied.
7. Next unprepared fixes: authoritative media-reference deletion, editor-session recovery, full bulk translation + per-language persisted freshness, generator failure bookkeeping, draft navigation, remaining visitor accessibility/localization/loading states. Optional N02/N03/N04/N07 follow correctness work. N01/N05/N06 stay deferred by the user's explicit decisions.

## Superseded prepared work

No duplicate PR is opened for these branches. Keep local work recoverable; do not merge them alongside their replacements.

| Prepared branch / draft | Published replacement |
| --- | --- |
| `fix/editor-gallery-rows` | #4, #35, #52 |
| `fix/explicit-content-field-clears` | #27, #42, #58 |
| `fix/review-backup-recovery` | #11 (open, ready; real isolated native recovery drill passed) |
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
- Every PR created or worked on is registered with T3; final thread inventory is checked before handoff. #63 hosted Test/Build/current Type Check passes. Other updated branches can retain hosted failures from the current-main Compose fixture until #63 lands. Stacked child branches without check rollups rely on documented local checks until their target is eligible; successful historical runs do not certify every current head.
- The agent performed no production writes, production seed/schema/deployment command, real translator call, PR merge or shared-history rewrite. The user merged 36 campaign PRs; their main-branch workflow attempted deployment separately. Native recovery validation used only temporary synthetic local backends, source deployment and seed helpers, then removed its owned resources.
- Earlier native browser attempts were unavailable; this feedback batch used rendered DOM regressions and local HTTP checks. Real camera, codecs, speech engine, assistive technology and curator UX checks remain. No screenshots or device validation are claimed.
- Native backup export/import and startup of two isolated Convex Docker backends were performed successfully for #11. The full Compose application stack, production recovery and an agent-triggered GitHub Actions schema dispatch were not performed. Other fixtures are not operational round-trip evidence.
- Standalone branches often retain pre-existing app type/lint diagnostics fixed by separate #14/#26/#34. Check the combined result after integrating their dependencies; no rules/assertions were weakened.

## Recovered earlier integration evidence

The concurrent thread recorded the checks below on the explicitly named earlier heads/graphs. They supplement current focused results; current #11 has 13 fixtures and #8/#12 now stack on #62. They are historical results, not verification of the current 62-PR implementation inventory or every current head. The real #11 recovery result and latest host states are recorded above.

- GitHub authentication and all actual base refs were checked before publishing. Branches were pushed normally; PRs were opened or updated through authenticated `gh`/GitHub API and linked to the T3 thread. At that earlier publication stage the agent had merged no PR and main was `26133b5`; after the user's merges current main is `c09904a`.
- [#39](https://github.com/MGRAFF2006/museum-rodenberg/pull/39): clean `npm ci --ignore-scripts`, installed-version check and real Tiptap/jsdom initialization/edit/Markdown/undo/redo smoke pass. No advisory exploit was executed.
- [#11](https://github.com/MGRAFF2006/museum-rodenberg/pull/11): `node --test scripts/__tests__/backup-convex.test.mjs` passes 11 isolated cases including archive byte recovery and failure cleanup. That earlier head had no native backend ZIP round-trip; the subsequent 13-regression head and real recovery drill above replace that limitation, and #11 is now ready.
- [#15](https://github.com/MGRAFF2006/museum-rodenberg/pull/15): `node --test scripts/__tests__/push-convex.test.mjs` passes 20 isolated environment/failure/signal cases; Convex typecheck passes. Actual deploy was never invoked; `--typecheck=enable` is required by the wrapper.
- [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14): `npm run typecheck` passes app, tooling and Convex projects. A temporary app source type error was rejected with exit 2; its file was removed afterward.
- An isolated local integration worktree combines [#3](https://github.com/MGRAFF2006/museum-rodenberg/pull/3)/[#4](https://github.com/MGRAFF2006/museum-rodenberg/pull/4)/[#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14), the original [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) revision commit, [#43](https://github.com/MGRAFF2006/museum-rodenberg/pull/43)/[#44](https://github.com/MGRAFF2006/museum-rodenberg/pull/44)/[#46](https://github.com/MGRAFF2006/museum-rodenberg/pull/46)/[#49](https://github.com/MGRAFF2006/museum-rodenberg/pull/49)/[#50](https://github.com/MGRAFF2006/museum-rodenberg/pull/50)/[#45](https://github.com/MGRAFF2006/museum-rodenberg/pull/45)/[#48](https://github.com/MGRAFF2006/museum-rodenberg/pull/48) and the protected-adapter fixture updates. `npm run typecheck` passes; 12 focused suites pass all 63 tests. Five fixture failures discovered on the first integration run were corrected by retaining the same assertions and mocking the authenticated adapter. The final run used CLI-only `--testTimeout 30000` under unrelated compiler load; repository timeouts/checks were not weakened.
- `npm run build` in that integration worktree passes with PWA generation (tmux `museum-publication-build` finished with exit 0). The existing Browserslist age warning remains. Integration tests (tmux `museum-publication-tests`) also finished with exit 0. These are local integration checks, not PR merges or backend deployment.
- Earlier [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) at `6a3b187` was independently reviewed and rerun for 24 revision/auth/draft cases after its forward integration with [#27](https://github.com/MGRAFF2006/museum-rodenberg/pull/27) and existing-ID preservation. The named earlier heads [#8](https://github.com/MGRAFF2006/museum-rodenberg/pull/8) (`5aaae34`) and [#12](https://github.com/MGRAFF2006/museum-rodenberg/pull/12) (`8628726`) already contain the necessary membership/flag revision increments; their isolated combination with [#42](https://github.com/MGRAFF2006/museum-rodenberg/pull/42) passes 41 focused tests, including six additional competing-draft boundaries. Removing just the two membership and one feature revision increments makes all six new cases fail by accepting stale drafts; restoring them passes all 41 again, with Convex typecheck and scoped test lint/diff checks. Equivalent local implementations were not pushed over those remote fixes. The 63-test integration above predates that forward integration, so it does not certify the entire latest open-PR graph.
- Native audio playback was attempted using an actual-component fixture and local WAV. HTTP succeeded but both T3 tab navigations failed in the automation client; no component interaction, native playback or screenshot was obtained. The transient fixture and owned server session were removed/stopped.
- Focused native and DOM suites in each new PR exercise actual handlers/components with filesystem or provider stubs where appropriate. No external translator, production backend, paid service, schema deployment or persistent media write was used. Standalone frontend checks still inherit baseline diagnostics until [#14](https://github.com/MGRAFF2006/museum-rodenberg/pull/14); standard lint needs [#26](https://github.com/MGRAFF2006/museum-rodenberg/pull/26)/[#34](https://github.com/MGRAFF2006/museum-rodenberg/pull/34). CLI-only lint workarounds are disclosed rather than represented as normal lint success.
