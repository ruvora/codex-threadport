# Local security policy

ThreadPort treats package bytes and historical text as untrusted data. It has no Codex client, native store writer, network client, socket server, model execution or tool activation path. All native export/import calls terminate at a hard gate. Synthetic fixtures never count as native G0/G3.

The trusted boundary is the operator-owned Node process and private input root. A hostile process running as the same OS user can modify program code or the approval database; this version is not an OS sandbox against that adversary. Keep the input/state directory private and do not place it on an untrusted shared filesystem. Portable Node path checks cannot prevent every concurrent ancestor-directory swap by another same-user writer. Symlinks, hardlinks, hidden input paths, traversal and nonregular files are rejected, with regular-file checks before open, nonblocking no-follow opens, device/inode comparisons and bounded reads. No archive extraction is performed.

## Enforced limits (policy/0.1.0)

- Compressed input 8 MiB; aggregate expanded data 16 MiB; one entry 8 MiB; exactly six package files; ratio <=100:1 per entry and total.
- Control JSON files 1 MiB, history index 8 MiB, history records 8 MiB, record line 1 MiB, 10,000 materialized records.
- Strict UTF-8 and duplicate-key rejection, JSON depth <=32 and <=200,000 parsed nodes. Unknown versions, object fields, roles and record kinds fail closed.
- Source <=8 MiB, <=1,000 turns, <=10,000 items per turn, bounded by total parsing limits. All selected turns must be completed; every call has exactly one later result in that same turn.
- MCP line <=64 KiB, operations serialized in each process; SQLite transactions serialize competing writers with a 3-second busy timeout.
- At most 32 fixture plans and 128 diagnostic reports per root. Approvals expire within 30 minutes. State is retained, not silently garbage-collected.

These conservative limits are smaller than the addendum's proposed policy/1.0.0. The implementation uses bounded buffers, not a streaming 250 MiB parser. No OS RSS/CPU hard limit is claimed; use a host process supervisor for hostile workloads. ZIP unknown flags, ZIP64, encryption, comments, extra fields, noncanonical metadata, duplicate names and inconsistent local/central headers are rejected. CRC32 and SHA-256 do not authenticate provenance. No semantic secret scanner or complete confidential-data guarantee is claimed.

## Approval and durability

Only a local human TTY flow can issue approvals through the CLI. MCP cannot issue them. A random local key is generated with Node crypto and stays in the private SQLite registry. Caller-provided signing keys and booleans have no role. Receipts bind the exact immutable plan, package digest, target, policy, root and expiry; consumption is transactional. Changed plans or staged packages are rejected. Open journal instances recheck root identity; reconciliation also validates the immutable plan/target binding and operation digests before changing status. Import grants no ongoing execution permission.

The fixture journal persists intent before publishing with fsync and no-replace link/unlink publication. Unknown response outcome is reconciled against exact operation-owned output, never retried blindly. Crash between linking and unlinking can leave an extra hardlink; this deliberately stays attention rather than guessing ownership or deleting files. There is no destructive rollback. Fixture import creates only a nonexecuting local receipt, not a native session. Native create/restart/reconciliation remains unavailable.

## Reporting and scope

Report issues to the repository owner through the already established private review channel. No public security contact or hosted reporting service is configured. Do not include credentials or personal histories in reports. Tests use generated synthetic temp roots and remove only those roots. No installation, cross-account tests, privileged probes, marketplace registration or external publication is authorized by this implementation.
