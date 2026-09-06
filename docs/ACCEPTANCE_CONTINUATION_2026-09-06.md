# ThreadPort 최종 로컬 수용 검토 — 2026-09-06

판정: **요청된 세 가지 후속 로컬 기준은 수용한다. 네이티브 이전 제품의 출시 수용은 하지 않는다.** 기존 blocked mode와 합성 fixture 구현을 재사용했다. 이번 검토에서 추가 수정이 필요한 제품 내부 결함은 발견하지 못했다. 이는 아래 대조 범위의 자체 검토이며 독립 검토나 완전한 보안 증명이 아니다.

## 보존과 판정 범위

다음 실행의 실패 판정과 로그는 역사적 기록으로 유지한다.

- `task_a4a28f29-2462-4a8b-b6ef-005b84746ffe`
- `run_559a37d3-7777-4f7e-bba2-303047d18052`
- Turn `01a074fd-6768-7640-9588-32c3e8944b5a`
- 더 이전 `run_5aefa9cb-9399-424d-9b7a-71682ed20e01`의 실패도 변경하지 않는다.

읽기 전용 외부 참조:

- [EVIDENCE_RECONCILIATION_2026-09-06.md](/Users/sin-yebin/Desktop/project/codex-control-plane/docs/EVIDENCE_RECONCILIATION_2026-09-06.md)
- [INCIDENT_CONTINUATION_2026-09-06.md](/Users/sin-yebin/Desktop/project/codex-control-plane/docs/INCIDENT_CONTINUATION_2026-09-06.md)

첫 참조의 구조화된 명령 비교 수정은 과거 Port 명령 `exec-2281ed7e-188e-4577-a235-7cf6df801565`의 문자열 표현 차이로 생긴 evidence identity 충돌을 설명한다. 수정된 실행 플러그인 `0.14.0+172588febcab`의 판정 보완은 ThreadPort 제품 통과 증거가 아니다. 외부 프로젝트의 369/373개 테스트 수나 설치 결과를 Port 결과로 합산하지 않는다. 외부 문서·registry·프로젝트는 수정하지 않았다.

이번 변경은 **이 새 문서 하나**다. 기존 README, 구현 문서, 부록, source, 코드, 테스트, 원출력은 덮어쓰지 않았다. 재구현·위임·새 스레드·작업 그래프·설치·게시·커밋·push는 하지 않았다. Workspace 프로젝트가 아니므로 `workspace-lock.json` 및 source pin drift 검사는 해당 없음이다. 현재 구현 파일 다수가 Git untracked이므로 이 문서는 커밋에 결합된 빌드 증명도 아니다.

## 요청 기준별 수용

| 기준 | 판정 | 현재 근거와 한계 |
| --- | --- | --- |
| 기존 산출물과 원본 문서 보존, 완료 구현 중복 금지 | 수용 | 두 source 전문과 기존 부록을 읽고 아래 보존 지문을 재확인했다. 기존 코드·테스트·로그 재사용, 이번 구현 변경 없음 |
| 실제 발견된 로컬 결함 수정 및 필요한 증거, 또는 미발견 명시 | 수용 | 앞선 FIFO 및 journal root/계획 검증 보완을 현재 코드와 4개 실패→통과 및 16개 영향 범위 원출력에 대조했다. 이번 범위에서는 추가 결함을 발견하지 못했다. 새 테스트는 실행하지 않음 |
| 공식 검증의 과거 환경 실패/후속 통과 구분, G0/G3 및 출시 제한 보존 | 수용 | 현재 README·IMPLEMENTATION_STATUS·VERIFICATION은 초기 PyYAML 실패와 격리 Python 공식 검사 exit 0을 이미 구분한다. G0/G3 exit 3 및 네이티브 차단과 일치하므로 기존 문서 재수정 불필요 |

세 기준 중 이번 로컬 검토의 미충족 항목은 발견하지 못했다. 아래 제품 계약의 한계·미충족은 별도로 유지한다.

## 원본 계약과 현재 코드 대조

기준 문서는 [설계 원문](source/THREADPORT_DESIGN.md) §4·8·10, [계약 원문](source/THREADPORT_CONTRACTS.md) §2·4–8, [보존된 부록](THREADPORT_IMPLEMENTATION_ADDENDUM.md) §3–9다. 원문의 목표·규범과 현재 구현을 동일시하지 않는다. 현재 차이는 [IMPLEMENTATION_STATUS](IMPLEMENTATION_STATUS.md), [README](../README.md), [한국어 사용법](USAGE_KO.md), [SECURITY](../SECURITY.md)에 명시되어 있다.

| 계약 영역 | 현재 파일 근거 | 로컬 수용 / 한계 / 제품 미충족 |
| --- | --- | --- |
| 버전·지원 레코드·완료 경계 | `src/history.mjs`: SOURCE, materialize, checkRecords | 합성 schema만 허용하고 완료 prefix, 순서, 같은 turn의 호출/결과를 검사한다. native 참조·pagination·compaction·첨부는 미지원 |
| 패키지·해시·한도·경로 | `src/package.mjs`: schemas, inspectPackage; `src/fs.mjs`: readBounded; 기존 core ZIP 테스트 | synthetic-v1의 정확한 6파일, 폐쇄형 필드, 이력/index/hash 대조. 8/16 MiB의 별도 policy/0.1.0이다. 원안의 250 MiB streaming·OS 메모리 강제 한도 구현으로 수용하지 않음 |
| 권한·출처 | `src/history.mjs`, `src/package.mjs`, `src/service.mjs` | historical_data, unverified_claim, 빈 환경 권한, nativeExecutable=false. 체크섬은 신원·실제 원본 경계·의미적 비밀 부재의 증명이 아님 |
| 승인·계획 | `src/cli.mjs`: fixture-approve; `src/journal.mjs`: plan, approve, verify | 사람이 TTY에서 정확한 digest를 승인한다. 로컬 키/DB 결합, 만료·대상 결합, nonce 소비는 fixture 계약이다. MCP 승인이나 native 권한 이전 없음 |
| 내구성·복구 | `src/journal.mjs`: tx, apply, reconcile; `src/fs.mjs`: publish | intent 선기록, no-replace publish, 기존 operation 재사용, 불명확한 결과 attention. 후속 root/plan 검증 수정이 현재 남아 있음. 실제 native correlation·전원 장애·Hub 정리/복원 증거는 없음 |
| 로컬 CLI/MCP·패키지 | `src/cli.mjs`, `src/mcp.mjs`, `.codex-plugin/plugin.json`, `.mcp.json` | stdio 및 구조 검사 과거 성공. PATH의 Node 24+가 필요하다. 호스트 설치·UI·플러그인 로딩·업데이트/제거 데이터 보존은 미검증 |
| native 실행 차단 | `src/service.mjs`: gates 및 create/apply 분기; `src/cli.mjs`: 오류 종료 | native 두 API는 GATE_UNVERIFIED, CLI exit 3. fixture_import는 nativeThreadRef:null 영수증이며 세션이나 요약 재주입이 아님 |

앞선 보완의 대응은 구체적으로 `readBounded`의 사전 regular-file 검사·O_NONBLOCK·dev/ino 대조, `Journal.assertRoot`의 현재 root 확인, `reconcile`의 원래 plan digest/kind/package/history 대조다. `test/continuation.test.mjs`의 네 사례가 각각 FIFO, 열린 journal의 root 교체, 복사한 부분 작업의 root 교체, operation planDigest 변조를 검사한다. 현재 구현에서 해당 방어가 제거되거나 기록과 반대로 바뀐 사항은 발견하지 못했다. 같은 사용자에 의한 임의 코드/DB 변경과 모든 ancestor 경로 경쟁까지 방어한다고 확대하지 않는다.

## 기존 실행 증거 — 이번에 재실행하지 않음

다음 수치와 종료 코드는 저장된 `command`, `exit_code`, `output`을 읽어 확인했다. 파일 안의 명령은 **과거 실행 명령**이며 이번 실행 내역이 아니다.

| 기존 원출력 | 실제 과거 결과 | 인정 범위 |
| --- | --- | --- |
| [final-tests.json](evidence/final-tests.json) | exit 0; tests 46, pass 46, fail 0, skipped 0 | 후속 FIFO/root 보완 이전 전체 suite. 경계 누출·도구 쌍·미지원 형식·경로/중복/한도/hash·승인·idempotency·부분 복구·stdio 검사 |
| [continuation-before.json](evidence/continuation-before.json) | exit 1; tests 4, pass 0, fail 4 | 후속 실제 결함 재현; FIFO timeout과 누락된 예외. 실패 원출력 유지 |
| [continuation-after.json](evidence/continuation-after.json) | exit 0; tests 4, pass 4, fail 0 | 동일 네 회귀의 수정 후 결과 |
| [continuation-affected.json](evidence/continuation-affected.json) | exit 0; tests 16, pass 16, fail 0 | 선택된 기존 영향 범위. 문서 byte 불변, CLI gate, approval/recovery/concurrency 포함 |
| [plugin.json](evidence/plugin.json) | exit 0; valid=true, stdioInitializeExit=0 | 저장소 Node validator 및 stdio 진입점 검사; installationVerified=false |
| [final-offline-harness.json](evidence/final-offline-harness.json) | **exit 3; G0/G3 NOT VERIFIED** | 합성 패키지 새 프로세스/재시작 검사. 자식 inspect exit 0을 부모 native gate 통과로 해석하지 않음 |

46+4+16을 현재 전체 suite 수로 합산하지 않는다. 후속 수정 이후 전체 suite를 실행했다는 기록은 없다. 이미 통과한 검사를 영수증 확보 목적으로 반복하지 않았다. 과거 `regression-failure.json` 등 앞선 실패/중간 출력도 그대로 둔다. 초기 `offline-harness.json`의 ISOLATED_TEMP 정규화 argv는 실제 argv 증거로 사용하지 않는다.

공식 검사 이력은 [VERIFICATION](VERIFICATION.md)의 두 절과 외부 incident 기록에서 구분된다.

- 초기 기본 Python: 두 검증기 모두 exit 1, `ModuleNotFoundError: yaml`. 역사적 환경 실패다.
- 후속 격리 Python: 아래 두 명령 각각 exit 0, 출력은 각각 `Plugin validation passed: /Users/sin-yebin/Desktop/project/threadport`, `Skill is valid!`로 기록되어 있다.

```sh
/tmp/ruvora-plugin-validation/bin/python -B /Users/sin-yebin/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/sin-yebin/Desktop/project/threadport
/tmp/ruvora-plugin-validation/bin/python -B /Users/sin-yebin/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/sin-yebin/Desktop/project/threadport/skills/threadport
```

공식 두 실행은 앞선 스레드 도구 출력과 문서 기록이며 별도의 `docs/evidence/` 원출력 JSON은 없다. 이번에 원출력 파일을 새로 확보한 것처럼 만들지 않았다. Node subset validator를 공식 validator로 바꾸어 인용하지도 않는다. 기본 Python의 PyYAML 부재를 현재 패키지 구조의 미해결 결함으로 표시할 이유는 없으며, 공식 통과는 설치·호스트 수용을 증명하지 않는다.

## 이번에 새로 확인한 증거

새 자동 테스트 수는 **0**이다. 수행한 작업은 문서·원출력·대응 코드 읽기와 보존 지문 대조다. 아래 읽기 전용 감사 명령은 개별 실행했고 실제 exit 0이었다(도구 chunk `7a12f5`). 이 지문은 현재 파일을 식별할 뿐 과거 테스트 시점의 코드 해시 영수증을 소급 생성하지 않는다.

```sh
/Users/sin-yebin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --input-type=module -e 'import fs from "node:fs"; import {createHash} from "node:crypto"; for (const p of ["docs/source/THREADPORT_DESIGN.md","docs/source/THREADPORT_CONTRACTS.md","docs/THREADPORT_IMPLEMENTATION_ADDENDUM.md","src/fs.mjs","src/journal.mjs","src/service.mjs","test/continuation.test.mjs","docs/evidence/final-tests.json","docs/evidence/continuation-before.json","docs/evidence/continuation-after.json","docs/evidence/continuation-affected.json"]) { const b=fs.readFileSync(p); console.log(JSON.stringify({path:p,bytes:b.length,sha256:createHash("sha256").update(b).digest("hex")})); }'
```

도구가 노출한 원출력(별도 stdout/stderr 분리는 제공되지 않음):

```jsonl
{"path":"docs/source/THREADPORT_DESIGN.md","bytes":13000,"sha256":"bb80d57d55cf4b0fa7bce836fc696730b8ab1ac0af78801c0222f17d2278869c"}
{"path":"docs/source/THREADPORT_CONTRACTS.md","bytes":9433,"sha256":"a060dcf65554e31977d09d83b62b0fb2a4055a13ccf457a4dd59d6f8bfc557ac"}
{"path":"docs/THREADPORT_IMPLEMENTATION_ADDENDUM.md","bytes":46928,"sha256":"91ba14a58a097555dd58720db1d953db58aa53e50504d5faa694d52e5c32e787"}
{"path":"src/fs.mjs","bytes":2824,"sha256":"60ddbae6f71862ea76286a96d49f9bc5a117737e94ccaf1de5f7ef4cd266d8b0"}
{"path":"src/journal.mjs","bytes":11038,"sha256":"3c50f4d591aa1155530754faa1de512a1cfe9e42e71e215574d3009cd6603ab4"}
{"path":"src/service.mjs","bytes":4227,"sha256":"c3a24508914328361502f106cab7edc733635e62da407b823051826aa0c3fe4b"}
{"path":"test/continuation.test.mjs","bytes":3346,"sha256":"3e52e37adf80d53d12845c5a3680d400f61e432b5e9e2e21690840720e476f8a"}
{"path":"docs/evidence/final-tests.json","bytes":4205,"sha256":"936b724681319e4468e11e829103038e89990ca3c18ae549e4a2a428b6ad9193"}
{"path":"docs/evidence/continuation-before.json","bytes":6058,"sha256":"d27d778159e672d1e2e32ae6487146a50af780f2bd5d82b8dca8e026fbd6b5bc"}
{"path":"docs/evidence/continuation-after.json","bytes":748,"sha256":"0981eac93a1ade2c101e84c406bb75c2a5a2585a6dae2152776420734d16f632"}
{"path":"docs/evidence/continuation-affected.json","bytes":1919,"sha256":"4f8c4d5d94142a533cdc9c49b3917f83105679faf89622f6abe218918093bb3f"}
```

원본 두 파일과 부록의 해시는 기존 보존값과 일치한다. 명령의 성공과 제품 기능 검사 성공은 구분한다. 출력 누락을 빈 문자열로 보충하거나 exit 0에서 테스트 수를 추정하지 않았다.

## 미검증 출시 관문과 다음 외부 계약

| 항목 | 현재 판정 | 다음에 필요한 계약·재현 증거 |
| --- | --- | --- |
| G0 native 독립 이력 | **NOT VERIFIED / 출시 기준 미충족** | 검증된 source/target binary·schema·history mode·adapter tuple, 안정 snapshot/pagination 종료, bounded dependency closure, 신규 native ID와 read/restart/resume 계약 |
| G1 실제 대화 이전 | 한계: 합성 코어만 수용 | native 생성의 권한 비승계, 내구성, correlation/idempotency, 응답 유실 복구. fixture ZIP/영수증으로 대체 불가 |
| G2 workspace 이전 | 제외 | 별도 파일 선택·과거 시점·경로 계약. 이 프로젝트에서 실행하지 않음 |
| G3 실제 사용자 E2E | **NOT VERIFIED / 출시 기준 미충족** | 서로 다른 PC·각자 인증·실제 앱 발견/열기·실제 후속 작업·재시작 증거 |
| G4 설치·배포 | 한계: 로컬 구조만 검증 | 호스트 설치/UI/업데이트/제거 및 데이터 보존 검증. 설치·게시 승인과 실행은 별도 |
| 실제 Hub 원자적 정리·승인·복원 | 미검증 / 외부 범위 | Hub 소유권·실행 상태·승인 결합·원자적 상태 전이·복원 계약과 destructive integration 증거. Port fixture journal 테스트로 충족되지 않음 |

G0의 재현은 부록 §8을 따른다. 최소 두 완료 turn과 실제 저장된 도구 쌍, 경계 직후 canary를 둔 격리 합성 native fixture를 사용하고 다음을 모두 연결해야 한다: 실제 sender 종료 status, receiver의 source read 실패 negative control 및 mount/network 차단, 전체 패키지와 receiver 저장소의 범위 밖 데이터 부재, 독립 생성한 경계 내 기대값과 이력/역할/도구 대응 비교, recipient 승인 아래 native 후속 실행, receiver 종료·재시작 후 재개, source 전체 의존 파일의 전후 digest 불변. 실제 argv, exit, 관찰 가능한 raw output, fixture/산출물 digest와 expected/actual을 함께 보존한다. 현재 ZIP 검사 하네스는 이 native 계약을 실행하지 않는다.

G3에는 위 G0 tuple에 더해 물리적으로 다른 PC와 독립 인증의 비밀 없는 증거, 앱/CLI/OS 버전, 신규 ID 매핑, 앱 발견·열기 화면, 실제 모델의 후속 작업 완료, 재시작, 양쪽 비공유 canary 및 원본 불변이 필요하다. 허가나 실행 환경이 없으면 NOT VERIFIED를 유지한다.

과거 내부 `history`/`path` 필드와 모의 probe는 안전한 공개 import 계약을 증명하지 않는다. requested legacy와 관찰된 paginated 모드의 차이도 해소되지 않았다. 전체 ancestor 복사·summary 재주입·패키지가 주장하는 passed·모델 제공 승인으로 gate를 열 수 없다. 이번 검토는 새 OpenAI API 조사나 native probe를 하지 않았으며, 안전한 native 경로가 원리적으로 불가능하다고 단정하지 않는다. 해당 계약과 G0/G3 원시 증거를 확보하기 전까지 production export/import는 계속 차단한다.
