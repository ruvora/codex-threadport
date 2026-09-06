# Implementation status — 0.1.0

This file reports implementation scope; it does not replace or modify the prior addendum. The historical failed run `run_5aefa9cb-9399-424d-9b7a-71682ed20e01` remains a historical failure. No unrelated ThreadFold/Workspace work was resumed here.

## G0 assessment

The prior addendum was reread and reused. Both original drafts were read completely and retain their recorded SHA-256 digests. Existing probe sources at `/tmp/ruvora-fork-probe.uBOsmd/{probe,transfer-probe}.mjs` were read only; their fallback copies the complete sessions lineage. That route is prohibited. Sources contain a loopback mock and constant status claims; they were not executed in this run. No personal session histories, authentication/config files or native stores were read.

Existing `/tmp/ruvora-fork-schema.983HcM/v2/ThreadForkParams.json` and `ThreadResumeParams.json` were inspected read-only. Their hashes remain `674134467796c011068b9dd5efc912de4560fa31f65c0fb2163f14e352be7a61` and `324e96004c49de35935cade3386958431c93a4fd3997a839f9796772ea4c8072`. They are draft-07 schemas with unstable path/history fields. The history field is explicitly restricted to Codex Cloud. These fields establish no safe import route. CLI/runtime association is not newly verified. Prior documented CLI/probe observations remain historical, not fresh native tests.

No new OpenAI API research was performed over the network in this offline resume. Prior official-document research in the addendum is retained, with its limitations. A safe native adapter, full stable storage specification, inaccessible-source native restart proof and G3 cross-machine/account/app evidence remain unavailable. G0 and G3 are **NOT VERIFIED**.

## Implemented boundaries and explicit deviations

| Addendum area | Implemented | Remaining / limitation |
| --- | --- | --- |
| Versioned adapters | Only `threadport.synthetic-source/1.0.0`, strict schema and completed prefix | No native Codex adapter, lineage flattening, pagination, compaction or hidden reasoning |
| Package contract | Six-file `threadport.package/1.0.0`, synthetic-v1 profile only; exact record/index/tool/role comparisons | Native claims rejected; transformed_history and attachments unsupported |
| Resource policy | `threadport.policy/0.1.0`: 8 MiB compressed / 16 MiB expanded / six entries / 100:1 | Conservative bounded in-memory parser, not proposed 250 MiB streaming policy; no OS RSS guarantee |
| Local tools | Separate `threadport.tools/0.1.0` and preview/inspection 0.1.0 contracts, closed MCP arguments | Not the addendum's full executable local/1.0.0 native plans |
| Durable plans | `threadport.fixture-operation/0.1.0`, SQLite FULL/WAL, immutable package snapshot, target/root/policy digest binding | Fixture plans only; native prepare returns a blocked diagnostic with no executable plan |
| Approvals | Generated local random key, exact receipt MAC and local journal lookup, expiry, atomic one-operation consumption | Human CLI TTY only; no approval tool or native permission transfer |
| Operations | Fixture ZIP export; fixture import reconciliation receipt; idempotency conflicts; durable intent and no blind retry | Fixture import is not a session creation or model resume. Native operations always blocked |
| Recovery | Exact owned-output validation, restart/partial-write tests, attention on missing/corrupt output | No native correlation strategy, destructive rollback or automatic attention cleanup |
| CLI/MCP | Direct Node CLI and newline JSON-RPC stdio, no sockets | Host installation and additional transports not verified |
| Packaging | Manifest, companion MCP configuration, skill, schema artifacts; Node checks and subsequent official plugin/skill structure validation passed | Initial default-Python PyYAML failure retained; use the isolated validation Python. No install/publication/marketplace actions |

Runtime schemas in `src/` are the validation source of truth. `scripts/generate-schemas.mjs` exports matching JSON Schema artifacts. Semantic constraints such as tool pairing, exact archive membership, hashes and terminal boundaries are additional mandatory checks in code. Unknown fields and versions fail closed. Empty/unavailable output is never conflated.

The fixture adapter remaps source IDs to bounded ordinal aliases. It includes no source suffix, source paths, original metadata, hooks or credentials. Its input deliberately has no ancestry. Unknown references are rejected rather than resolved by copying full ancestors. Package inspection cannot establish honesty of a sender's declared source or semantically detect every secret; it reports this limitation.

## Self-review and fixes

This work used sequential local implementation, tests and self-review; **no independent reviewer** was used.

- Prevented an intent-only operation from being blindly created on retry; existing intent now reconciles or stays attention.
- Rejected invalid UTF-8 before record-line conversion can replace bad bytes. Added a rehashed malicious-package regression.
- Applied closed validation to durable plans, approvals and operation records; unknown DB versions reject and close handles.
- Required canonical ZIP metadata, checked DEFLATE consumed bytes, and added tampered boundary/tool/index/environment tests even when checksums are recomputed.
- Marked operation lookup conservatively as non-read-only because SQLite shared-memory housekeeping can write despite a read-only SQL connection.
- Bound approval targets to device/inode identity as well as path. A replacement directory invalidates the plan.
- Moved SQLite busy_timeout before WAL initialization after the concurrent-process test exposed a lock race; retained the failing test output and reran after fixing.
- Bounded retained fixture plan/report counts. No cleanup invents ownership or removes user files.

Residual risks are explicit in SECURITY.md: same-user filesystem races are outside the portable Node trust boundary; fsync durability is local-filesystem dependent; power-loss testing and native host ingestion have not occurred. The offline harness demonstrates only independent *inspection* of synthetic bytes in fresh processes. It deliberately exits 3 and cannot pass native release gates.

## Bounded continuation review — 2026-09-06

The two prior executions retain their failed verdicts. Their completed artifacts and 46-test result were reused rather than reimplemented. The incident reference at `/Users/sin-yebin/Desktop/project/codex-control-plane/docs/INCIDENT_CONTINUATION_2026-09-06.md` was read only; its orchestration fixes and other-project results are not ThreadPort product verification. It reports later official structure validation using an isolated PyYAML 6.0.3 environment. This thread subsequently ran both official validators with that Python and observed exit 0. Default Python's historical failure is not a current unresolved package-structure blocker.

Two local defect areas were reproduced and fixed without changing any schema or native gate:

- `src/fs.mjs`: a FIFO could block the read-only inspector during `open`, before the regular-file check. The reader now checks file type before opening, adds a nonblocking open, and compares device/inode before reading. A bounded child-process test reproduces the former hang without needing a writer, network or socket.
- `src/journal.mjs`: root binding was cached for an open instance, and reconciliation did not validate its operation against the immutable plan/target. Root identity is now rechecked; reconciliation verifies plan digest, kind and package/history digests before completion. Invalid state is rejected without modifying the operation. Recovery does not require a new execution approval or renew an expired one.

The four new regressions failed before the fix (exit 1, 0 pass / 4 fail), then passed (exit 0, 4 pass). Sixteen affected existing tests passed separately (exit 0). The full 46-test suite and G0 harness were not rerun in this continuation. This is self-review, not independent review. Existing source drafts, addendum and evidence files remain unchanged; new receipts are separate.

### Concrete native blockers still outstanding

1. **Source contract:** no qualified native version/schema/binary tuple with complete, stable history snapshots, pagination termination and completed-turn boundary proof. Prior schema fields and the probe's requested/stored history-mode mismatch do not supply that contract.
2. **Materializer contract:** the only implemented source format is synthetic and has no ancestry. Native reference closure, compaction/encrypted-state fidelity, native tool pairing, and historical-role versus current-authority separation have not been implemented or qualified. Full ancestor copying remains prohibited.
3. **Receiver contract:** no verified native creation/import operation that gives a new durable ID, suppresses hooks/tools/goals, binds recipient policies, exposes correlation for ambiguous outcomes, and permits safe read/restart/resume. The fixture import receipt is not such an operation.
4. **G0 evidence:** no native resume after proven sender termination and actual filesystem/network isolation, no complete native history/tool comparison and source immutability proof for a bounded package. Deleting a synthetic source file and inspecting a ZIP in a new process is insufficient.
5. **G3 evidence:** no distinct-machine/account authentication, actual app discovery/opening, or real-model continuation. Official package structure validation adds none of these capabilities or observations.

G0/G3 therefore remain NOT VERIFIED and production export/import remain hard-blocked. Neither package inspection, a reported upstream fix, an approval receipt nor official manifest validation may promote these gates. Native probes, personal histories, installation and publication were outside this continuation.
