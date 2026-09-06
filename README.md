# RUVORA ThreadPort

ThreadPort 0.1.0 is a standalone, dependency-free **offline compatibility inspector** with a tested synthetic conversation core. Native Codex export/import is blocked. It does not read live Codex stores, transfer accounts, reinject summaries, start models, or execute imported tools.

The original [design](docs/source/THREADPORT_DESIGN.md), [contracts](docs/source/THREADPORT_CONTRACTS.md), and [implementation addendum](docs/THREADPORT_IMPLEMENTATION_ADDENDUM.md) remain byte-for-byte unchanged. The implemented subset and departures are recorded in [implementation status](docs/IMPLEMENTATION_STATUS.md). [한국어 사용법](docs/USAGE_KO.md).

## Why ThreadPort exists

ThreadPort's long-term goal is to let someone share a Codex conversation through a selected completed turn, so another person can continue from that history using their own environment and authentication. The unit of transfer is an explicitly bounded history with provenance. Preserving that continuity does not promise hidden model-state replication or identical future answers.

**The sharing boundary must hold in the package itself.** Later turns must not travel in metadata or ancestor files simply because the receiving model would not normally see them. Messages, roles and tool-call/result pairing must remain coherent, and unsupported history must be reported. **History does not carry present authority:** imported text cannot grant credentials, install tools or authorize execution in the recipient's environment. These requirements explain why native transfer stays blocked even though local package inspection works. See the [original product design](docs/source/THREADPORT_DESIGN.md).

## Technical architecture

```text
Supported source + completed-turn boundary -> history validation/materialization
  -> bounded synthetic ZIP -> static package inspection -> compatibility report

Fixture operation: immutable plan -> local approval -> journaled output
  -> owned-output reconciliation (no native session creation)
```

Versioned source and package contracts isolate format assumptions. Strict parsing checks unknown fields, record order and tool pairing; the bounded ZIP reader checks membership, compression limits and content integrity without extracting files. Hashes detect inconsistency, but do not authenticate a sender or prove their source was truthful.

For the synthetic operation core, SQLite with FULL synchronous WAL preserves immutable plans, approval bindings and operation intent. Outputs use atomic no-replace publication. After response loss, recovery checks the exact owned output instead of blindly creating another artifact. CLI and stdio MCP share this local service boundary. The [implementation addendum](docs/THREADPORT_IMPLEMENTATION_ADDENDUM.md) defines the intended contracts; [implementation status](docs/IMPLEMENTATION_STATUS.md) records the smaller implemented profile and its limits.

## Direction

Native portability requires a qualified source adapter, a history materializer that closes references within the selected boundary, and a recipient adapter that creates an independent durable session without automatically executing it. G0 must demonstrate resumption after the sender is stopped and inaccessible; G3 must demonstrate real discovery and continuation across distinct machines, accounts and apps. These are future acceptance requirements. The present product remains an offline inspector and synthetic test core until that evidence exists.

## Run locally

Requires Node 24+ with builtin `node:sqlite` on PATH. After cloning, no npm install, network, browser, or socket listener is needed.

```sh
git clone https://github.com/ruvora/codex-threadport.git threadport
cd threadport
node src/cli.mjs capabilities
node src/cli.mjs inspect-source fixtures/conversation.json first
node --test
```

Additional CLI examples:

```sh
node src/cli.mjs help
node src/cli.mjs inspect-source fixtures/conversation.json first
node src/cli.mjs preview-source fixtures/conversation.json first
node src/cli.mjs --root /absolute/operator-owned/input-directory inspect-package example.zip
node src/cli.mjs --root /absolute/operator-owned/input-directory preview-import example.zip
node src/cli.mjs export unavailable-plan
```

Paths are relative to the explicitly chosen root (default: current directory). Inspect calls do not create state. Preview calls write content-free reports under `.threadport/reports/`. `export` and `import` exit **3** with `GATE_UNVERIFIED`. Validation errors exit **1**; successful local inspection exits **0**. Never point the root at a personal Codex store. Hidden input paths, traversal, symlinks and hardlinks are rejected. The caller must supply only files they are authorized to inspect.

## What works

- Closed versioned JSON schemas, duplicate-key/UTF-8/depth validation, completed-prefix materialization and exact tool pairing for `threadport.synthetic-source/1.0.0`.
- Static validation of the six-file `threadport.package/1.0.0` ZIP **synthetic-v1 profile**. Arbitrary native packages, ancestors, compaction, attachments, workspace files and authority-bearing records are unsupported.
- STORE/DEFLATE inspection without extraction; header consistency, CRC32, SHA-256, path/entry/ratio/byte limits, content/index/boundary consistency.
- Durable local diagnostic previews and fixture plans; locally generated approval MACs bound to plan, target, policy and expiration; idempotency and partial-operation reconciliation.
- CLI and newline-delimited stdio MCP with no socket listener. `tools/list` exposes exact closed input schemas and effect annotations.

Static validation only establishes consistency of the supplied package. A malicious sender can write false history and recompute all hashes. It does not authenticate the sender or prove that a claimed boundary matches a real source. Text is untrusted; this version does not claim comprehensive secret detection.

## Synthetic operation workflow

This is an explicit local core exercise, never a native transfer. `fixture_export` publishes an owned fixture ZIP. `fixture_import` writes an owned reconciliation receipt referencing the staged package, **not a Codex session**. Both keep `nativeThreadRef:null` and never run a model. Input must be the synthetic schema; the sample file contains no personal data.

```sh
node src/cli.mjs fixture-plan fixtures/conversation.json first fixture_export
node src/cli.mjs fixture-approve PLAN_ID
node src/cli.mjs fixture-apply PLAN_ID APPROVAL_ID UNIQUE_KEY_AT_LEAST_16_CHARS
node src/cli.mjs operation OPERATION_ID
node src/cli.mjs fixture-reconcile OPERATION_ID
```

Replace IDs with actual returned values. Approval prints the full plan and requires a human terminal to type the exact plan digest. It cannot be piped or issued via MCP. No signing secret argument or `approved:true` is accepted. Approval receipts remain local. The fixture plan stores immutable package bytes; the source is not reread at execution. Reuse the same idempotency key to retrieve the same operation. Never use a new key to bypass an `attention` state.

The SQLite journal uses FULL synchronous WAL transactions. Intent is committed before any output. Outputs use fsync and atomic no-replace publication. Reconciliation checks an exact operation-owned output; absence or corruption stays `attention`. Existing files are never overwritten or rolled back. There is no automatic cleanup of unresolved artifacts. Protect `.threadport/` as private local state; do not publish or copy it. Use a fresh dedicated root when the bounded plan/report quotas are reached.

## MCP and plugin package

The package includes `.codex-plugin/plugin.json`, `.mcp.json`, and `skills/threadport/SKILL.md`. `.mcp.json` uses `node` on the host PATH and `${CODEX_PLUGIN_ROOT}`; it confines inputs and previews to the plugin checkout by default. For a separately configured stdio client, explicitly supply an operator-owned input root:

```sh
node src/cli.mjs --root /absolute/operator-owned/input-directory mcp
```

Supported protocol negotiation: `2024-11-05`, `2025-03-26`, `2025-06-18`. Stdio is one JSON-RPC message per line, max 64 KiB. No HTTP, resources, prompts, approval issuance or model tools are implemented. `port_get_operation` is conservatively marked non-read-only because SQLite may update shared-memory bookkeeping despite a read-only database connection.

Validate this checkout without installing:

```sh
node scripts/validate-package.mjs
node --test
node scripts/g0-harness.mjs
```

The last command performs fresh-process synthetic package inspection and restart checks, removes its isolated temp directory, then deliberately exits **3** for **native G0/G3 NOT VERIFIED**. It is not a native resumability harness or an isolation attestation. Exact native prerequisites remain in the original addendum, section 8. Official structural plugin and skill validation passed in a Python environment with PyYAML; earlier missing-dependency failures remain in the historical record. The Node validator is an additional subset/stdio check. See the [verification report](docs/VERIFICATION.md) and [2026-09-06 acceptance](docs/ACCEPTANCE_CONTINUATION_2026-09-06.md) for dated results. Schema regeneration, when developing schema changes, uses `node scripts/generate-schemas.mjs`. Installation and host ingestion remain unverified.

## Release gates

| Gate | Status | Evidence boundary |
| --- | --- | --- |
| G0 independent native history | **NOT VERIFIED** | No safe native import adapter or inaccessible-source native resume proof |
| G1 conversation MVP | Partial local/synthetic coverage | Automated core tests; native operation lifecycle remains blocked |
| G2 workspace transfer | Excluded | No workspace copying |
| G3 real users | **NOT VERIFIED** | No distinct-PC/account/app discovery or actual model continuation |
| G4 packaging/release | Local package validated | Source available on GitHub; native installation and marketplace distribution unverified |

No environment flag, package field or approval can open native execution. Adding a native adapter requires separately reviewed implementation and all G0/G3 evidence, including tool-history preservation, package-wide boundary exclusion, source isolation, sender termination, receiver restart, source immutability, and actual app/account/machine verification. See [security policy](SECURITY.md) and [verification report](docs/VERIFICATION.md).
