# ThreadPort 구현 부록 v0.3 — 계약과 증거 관문

작성일: 2026-09-06. 이 문서는 별도의 구현 명세다. 제품 코드·네이티브 어댑터·플러그인 구현 완료를 뜻하지 않는다. [설계 원문](source/THREADPORT_DESIGN.md)과 [v0.2 계약 원문](source/THREADPORT_CONTRACTS.md)은 변경하지 않는다. 아래의 MUST/금지는 앞으로 구현할 때 적용할 규칙이며, 관찰된 호스트 동작과 구분한다.

**현재 판정: G0 = unverified, G3 = unverified. 네이티브 export/import 실행 허용 어댑터 목록은 비어 있다.** 검사와 미리보기 구현은 가능하다. 스키마 필드, 모의 모델, 원문·요약 재주입, 전체 계보 복사는 독립 이력 성공으로 인정하지 않는다.

## 1. 보존 및 조사 범위

두 원문을 끝까지 읽었다. 최초 읽기 전에 기록한 SHA-256과 크기는 다음과 같으며, 작업 종료 시 재계산하여 두 최초 지문과 일치함을 확인했다.

| 원문 | 바이트 / 줄 | 최초 SHA-256 |
| --- | --- | --- |
| `docs/source/THREADPORT_DESIGN.md` | 13,000 / 227 | `bb80d57d55cf4b0fa7bce836fc696730b8ab1ac0af78801c0222f17d2278869c` |
| `docs/source/THREADPORT_CONTRACTS.md` | 9,433 / 105 | `a060dcf65554e31977d09d83b62b0fb2a4055a13ccf457a4dd59d6f8bfc557ac` |

저장소의 tracked 파일은 조사 당시 `.gitignore`와 두 원문이었다. 저장소 내부 파일 목록 및 `/`, `/Users`, 사용자 홈, Desktop, project, 저장소 루트, `docs`, `docs/source`의 `AGENTS.md` 존재 여부를 확인했으며 해당 경로에는 없었다. `.gitignore`는 `.threadport/`, `*.ruvora-port`, DB·환경 비밀 파일 등을 제외한다. 원문의 `RUVORA_WORKSPACE_DESIGN.md` 링크 대상은 조사 당시 저장소 목록에 없었다. 그 문서의 내용을 추정하지 않는다.

프로브 두 파일은 전체를 읽기만 했다. 프로브 실행, 세션 생성·복사·재개, DB 열기, 실제 계정 조회, 설치·배포는 하지 않았다. 로컬 스키마는 아래 지정 파일의 구조·설명·해시를 읽었다. 모든 Codex 내부 포맷을 조사했다는 뜻은 아니다. 현재 CLI에는 `--version`만 실행했으며 PATH alias 생성 불가 경고와 함께 `codex-cli 0.153.4`를 출력했다.

## 2. 증거 목록: 관찰, 보고, 가설

### 2.1 직접 읽은 로컬 자료

| 식별자 | 경로 및 지문 | 관찰 범위와 제한 |
| --- | --- | --- |
| L1 | `/Applications/ChatGPT.app/Contents/Resources/codex`; SHA-256 `4ca47945439f9251fe35f4cbe071369192cd9a6c5a3a17b75c7a11ad548a9c7f` | 현재 실행 파일 버전 0.153.4. 과거 프로브 바이너리가 아니다. 이 바이너리에서 새 스키마를 생성하지 않았다. |
| L2 | `/tmp/ruvora-fork-schema.983HcM/codex_app_server_protocol.v2.schemas.json`; `e5f798fd1343c539f01fedea0e8a84a43c080fcca4615c80eb04a5edab4f7d0a` | v2 프로토콜 묶음. 개별 JSON Schema는 draft-07. 원문은 0.153.1 실험과 연결하지만 생성 명령·당시 바이너리 지문을 묶은 영수증은 확보하지 못했다. |
| L3 | `/tmp/codex-app-schema.VtbpJI/codex_app_server_protocol.v2.schemas.json`; `a586cdc50f84c56c7654387e869b470a689796fa1c57678dcafb5921bb2d5255` | L2와 전체 묶음은 다르다. 아래 5개 개별 스키마 해시는 같다. 생성 CLI 버전 미확인. |
| L4 | `/tmp/threadhub-schema.Hs6jgv/codex_app_server_protocol.v2.schemas.json`; `e5f798fd1343c539f01fedea0e8a84a43c080fcca4615c80eb04a5edab4f7d0a` | L2와 같은 묶음 지문. 생성 CLI 버전 미확인. |
| L5 | `/tmp/threadhub-schema.nxtn6H/v2/ThreadForkParams.ts`; `ea9dd8fb39979f32293a31f98e599509430b7cc80840b2a0afc90a2b953e942e` | 생성된 TS 선언. 이 디렉터리의 v2 JSON 묶음 읽기는 ENOENT였고 이후 TS 파일을 확인했다. 디렉터리 자체가 없거나 스키마 전체가 누락됐다는 뜻이 아니다. |
| L6 | 같은 TS 디렉터리의 `v2/ThreadResumeParams.ts`; `e4f64c88205dbba2bf87635d12b9c5803dd6f19b84b5682a71df7fdcf87862fb` | TS 생성 도구 표기만 있으며 CLI 버전 증거는 없다. |
| P1 | `/tmp/ruvora-fork-probe.uBOsmd/probe.mjs`; 5,227 bytes; `10f25dc81783133e607d592a0fc4a3786b3c2341774128f86361c27891060f2a` | 동일 PC, 두 CODEX_HOME, loopback 모의 Responses, ACK 응답. 소스의 assertions/출력식은 실제 실행 결과가 아니다. |
| P2 | `/tmp/ruvora-fork-probe.uBOsmd/transfer-probe.mjs`; 8,437 bytes; `6d0cd2d9fb06634970eb8576c082653edde80726080140b5bb2f9bd057bb7000` | 경로 fork → 단일 rollout 복사 → 전체 sessions 복사 fallback. `importByRolloutPath`는 오류 여부를 반영한다. 소스는 실행 중 수정됐을 수 있어 남은 파일과 특정 과거 실행의 동일성은 미확인. |

L2/L3/L4에서 확인한 개별 파일 지문은 다음과 같다. 상대 경로는 각 디렉터리 기준이다.

| 상대 경로 | SHA-256 |
| --- | --- |
| `v2/ThreadForkParams.json` | `674134467796c011068b9dd5efc912de4560fa31f65c0fb2163f14e352be7a61` |
| `v2/ThreadResumeParams.json` | `324e96004c49de35935cade3386958431c93a4fd3997a839f9796772ea4c8072` |
| `v2/ThreadReadParams.json` | `dfe040c6ac71d30795b8be3f3ff232e66f362a37f883b491e5d1ea367f470db4` |
| `v2/ThreadTurnsListParams.json` | `2a8b93d7d4437cc25e16a1dde16d8db3c338d39e16c5eece2a56e943a21577d7` |
| `v2/ThreadItemsListParams.json` | `ff56040c327ecdd30ef02affac9bc71fab64031e8980f2b4fea9fd8a888160b4` |

관찰한 필드 의미:

- `ThreadForkParams`: 필수 `threadId`, inclusive `lastTurnId`, exclusive `beforeTurnId`; 두 경계는 함께 사용할 수 없다. `path`는 unstable이며 비어 있지 않으면 ID보다 우선한다. 이는 임의 rollout을 독립 패키지로 가져올 수 있다는 보장이 아니다.
- `ThreadResumeParams.history`: unstable이며 Codex Cloud 전용 사용 제한이 설명에 있다. ThreadPort의 제품 경로로 선택하지 않는다. `ResponseItem` 배열 수용과 영속성·권한 격리·앱 발견은 다른 문제다.
- `ThreadReadParams.includeTurns`와 페이지 API는 읽기 표면이다. `itemsView` 기본은 `summary`; `notLoaded`, `summary`, `full`을 구분한다. 빈 배열만 보고 이력이 없다고 판단하지 않는다. `full`도 저장소 전체의 자기완결성을 증명하지 않는다.
- 응답 타입 union에는 message, agent_message, reasoning, local_shell_call, function_call/output, custom_tool_call/output, tool_search_call/output, web_search_call, image_generation_call, compaction 계열, other가 보인다. 타입 존재는 ThreadPort 지원 선언이 아니다.

### 2.2 남아 있는 합성 산출물

`/tmp/ruvora-fork-probe.uBOsmd`에는 sender/receiver 디렉터리 4쌍, inbox 사본, state-a/b, rollout, SQLite/WAL 등이 존재한다. DB 내용은 조사하지 않았다. 파일 목록에서 별도 프로브 stdout/stderr 보고서나 캡처된 요청 JSON 파일을 찾지 못했다. 일부 이력 파일이 있다는 것과 실행 로그가 있다는 것은 다르다.

다음은 마지막 이름의 fixture(`1788621295733`)에서 직접 파싱한 사실이다. 기본 경로는 위 프로브 디렉터리다.

| 상대 경로 | SHA-256 | 직접 관찰 |
| --- | --- | --- |
| `inbox-1788621295733/shared.jsonl` | `9f38b766545135e51572e9e17e1fa9c87944abf7f0c6e816cd3c0de0a11d426b` | 28,380 bytes; 비공유 표식 없음; 원본 `forked_from_id` 존재 |
| `receiver-1788621295733/sessions/2026/09/06/rollout-2026-09-06T00-14-55-01a07223-10a9-7d42-a214-91b940596305.jsonl` | `14e1d0582c3bafafe43f582f1a4fd680f717e98a4c549d4737639ef8d96f537d` | 42,899 bytes; `MARKER_PRIVATE_R9` 존재. sender의 해당 원본 사본과 같은 지문 |
| `receiver-1788621295733/sessions/2026/09/06/rollout-2026-09-06T00-14-56-01a07223-12c8-7e91-a65c-784676410bb4.jsonl` | `b9df6a0308abb9da4d1709151a580d8fee48cafcab1aa7319192e7ad5d1303dd` | 36,933 bytes; 비공유 표식 없음; 다른 fork 참조 존재 |

이 fixture의 메타데이터는 `cli_version: 0.153.1`, `history_mode: paginated`다. 프로브 소스는 config에 `history_mode: legacy`를 설정한다. **요청 설정과 실제 저장 모드를 동일시할 수 없다.** 원인(설정 위치, 기본값, 내부 전환 등)은 가설이며 이번에는 확인하지 않았다. 조사한 JSONL의 top-level 타입은 session_meta, event_msg, response_item, world_state, turn_context, token_usage_record이고 response_item 타입은 message뿐이었다. 도구 쌍의 재개 보존 증거는 없다.

P2의 sender 중지는 SIGTERM 전송만 하며 종료 완료를 기다리거나 원본 파일 접근을 차단하지 않는다. `senderOfflineDuringContinuation: true`, `authCopied: false` 등의 상수 출력은 격리 증거가 아니다. 원본 불변 검사는 fork 파일 하나의 지문이고 전체 source 파일 집합의 전후 검사가 아니다. receiver 재시작도 고정 150ms 대기여서 프로세스 종료의 직접 증거가 필요하다. 모의 요청은 메모리에만 쌓인다. 따라서 원문에 기록된 과거 성공은 **보고된 실험 결과**로 보존하되 G0 영수증으로 승격하지 않는다.

### 2.3 공식 문서 조사와 확보하지 못한 근거

OpenAI Docs 스킬로 공식 도메인을 검색하고 [Codex App Server 문서](https://learn.chatgpt.com/docs/app-server)를 실제 열었다(2026-09-06, developers.openai.com에서 redirect). 문서는 설치 CLI별 스키마 생성, `lastTurnId`를 포함하는 fork, read/resume, summary/full 페이지 구분을 설명한다. 같은 문서에는 paginated 생성·전체 이력·재개의 제한도 있다. 로컬 스키마와 과거 fixture를 이 현재 설명에 자동으로 맞추지 않는다. 조회한 페이지에서 `thread/import` 문자열은 발견되지 않았다. 이것은 모든 공식 API에 import가 없다는 증명이 아니다.

확보하지 못한 근거: 지원되는 독립 패키지 import/export API 명세, 내부 rollout/DB의 안정된 완전 명세, 현재 바이너리와 기존 스키마 생성의 연결 기록, 기존 probe의 원시 실행 로그·모델 입력 캡처, 차단된 source 접근 증거, 실제 두 PC·각자 인증·앱 UI E2E, 암호화된 이력의 계정 간 이식 가능성. 네트워크 문서 접근은 가능했지만 이 근거들은 이번 접근 범위에서 확인되지 않았다. API가 원리적으로 불가능하다고 단정하지 않는다.

## 3. 버전과 패키지 규칙 (규범)

패키지 계약 ID는 `threadport.package/1.0.0`, 로컬 도구 계약은 `threadport.local/1.0.0`, 정책은 `threadport.policy/1.0.0`, 중간 이력 표현은 `threadport.history/1.0.0`으로 고정한다. 이 버전은 제안 구현의 버전이며 Codex의 v2와 관계없다. 초기 소비자는 정확히 등록된 버전만 허용한다. patch/minor라도 검증 없이 수용하지 않는다. 기본 배열 길이는 100,000 이하이고 더 작은 개별 한도가 우선한다. 새 필드·새 enum·새 타입·한도 변경은 새 계약과 fixtures를 요구한다. 변환은 원본을 수정하지 않는 명시적 migration이고 새 digest·계획·승인을 만든다.

아래 레코드 표는 폐쇄형 스키마 정의다. 모든 객체는 `additionalProperties:false`, 모든 표기 필드는 필수다. `?` 필드만 생략 가능하며 null은 명시된 union에서만 허용한다. JSON은 BOM 없는 UTF-8, 중복 키·비유한 수·unpaired surrogate 거절, 정수는 0..2^53-1, 깊이는 32 이하. enum은 열거된 값만 허용한다. JSON Schema draft-2020-12 파일과 음성 fixtures로 구현할 예정이며, 이 부록 자체가 실행 가능한 validator는 아니다.

공통 타입: `D` = 소문자 hex SHA-256 64자, `ID` = 생성한 UUID v4 문자열, `Alias` = `[a-z][a-z0-9_-]{0,63}`, `Time` = UTC RFC3339 밀리초 문자열. 자유 표시 문자열은 최대 4,096 UTF-8 bytes다. 호스트 native ID는 로컬에서만 최대 256 bytes 불투명 문자열로 취급한다. content 텍스트는 아래 별도 한도를 따른다.

ZIP은 단일 디스크, STORE/DEFLATE만, ZIP64·암호화·중첩 archive·실행 파일·archive comment·불필요한 extra field를 거절한다. 디렉터리 entry 없이 파일만 담는다. 고정 DOS timestamp, 정규 파일 모드 0600, 정렬된 경로를 사용한다. 확장자는 `.ruvora-port`다. MVP의 정확한 루트 구조:

```text
manifest.json
checksums.json
provenance.json
environment.json
history/index.json
history/records.jsonl
```

첨부 및 `workspace/`는 1.0.0에서 허용하지 않는다. 따라서 일반 10,000-entry 방어 한도 안에 있더라도 위 6개 이외의 entry는 실패한다. `manifest.files`는 manifest와 checksums를 제외한 4개 payload 파일의 정확한 목록이다. `checksums`는 manifest와 그 4개 payload를 나열하고 자기 자신은 제외한다. 이를 통해 자기 해시 순환을 피한다. manifest·checksums도 해시 검증 전에 구조 및 한도 검사한다.

| 레코드 | 정확한 필드 및 관계 |
| --- | --- |
| File | `path:RelPath, byteLength:uint, sha256:D, mediaType:enum(application/json,application/x-ndjson), purpose:enum(history_index,history_records,environment,provenance)`; 경로/목적은 위 고정 파일과 1:1 |
| Boundary | `sourceAlias:Alias, turnAlias:Alias, inclusive:true, terminalStatus:"completed", prefixDigest:D`; 타임스탬프가 아니라 source의 순서 증거로 경계 결정 |
| Transform | `recordAlias:Alias, field:string, kind:enum(redaction,role_reclassification,format_conversion,omission,path_alias), reason:enum(privacy,authority,compatibility), beforeDigest:D, afterDigest:D|null`; 공개하면 위험한 원문·비밀 값은 저장하지 않음 |
| Requirements | `capabilities:Alias[], workspaceIncluded:false, credentialsIncluded:false, executionGranted:false`; 중복 없는 정렬 배열, 최대 64개 |
| Manifest | `schemaVersion:"threadport.package/1.0.0", packageId:ID, producerVersion:string, codexVersion:string, historyFormat:string, sourceSchemaDigest:D, adapterId:Alias, adapterVersion:string, boundary:Boundary, fidelity:enum(exact_stored_history,transformed_history), historyDigest:D, files:File[], transforms:Transform[], requirements:Requirements` |
| Checksums | `schemaVersion:"threadport.package/1.0.0", algorithm:"sha256", files:[{path:RelPath,byteLength:uint,sha256:D}]`; 정확히 5개, 중복 없음 |
| Provenance | `schemaVersion:"threadport.package/1.0.0", sourceAlias:Alias, boundaryTurnAlias:Alias, lineageAliases:Alias[], identityStatus:"unverified_claim", nativeLineage:"not_asserted"`; 최대 64개 alias. 사람 이름·계정 ID·절대 경로 금지 |
| Environment | `schemaVersion:"threadport.package/1.0.0", requestedCapabilities:Alias[], pathAliases:Alias[], instructions:[]`; 각각 최대 64개. 인증·환경변수 값·hook·MCP 설정·승인·활성 goal 금지 |
| HistoryIndex | `schemaVersion:"threadport.history/1.0.0", boundary:Boundary, historyDigest:D, entries:IndexEntry[]`; records와 길이 및 순서 일치 |
| IndexEntry | `ordinal:uint, recordAlias:Alias, turnAlias:Alias, originalType:string, originalRole:enum(user,assistant,system,developer,tool,none), callAlias:Alias|null, contentDigest:D, sourceLocator:{sourceAlias:Alias,ordinal:uint}, recordDigest:D`; sourceLocator는 패키지 범위 내 별칭·순서이며 파일 경로가 아님 |

`RelPath`는 위 고정 ASCII 상대 경로만 허용한다. 공통 archive 검사도 절대 경로, `..`, `.`, 빈 segment, 역슬래시, NUL, drive/UNC, symlink/hardlink/device, 중복, Unicode 정규화 및 대소문자 충돌을 거절해야 한다. local/central ZIP 헤더 불일치, 중첩된 byte range, trailing polyglot 데이터, 미목록 entry도 거절한다. 추출 시 root-relative no-follow/open-exclusive를 사용하고 부모 inode와 root 포함 여부를 다시 확인한다. 경로 문자열 검사만으로 충분하지 않다.

해시 규칙: JSON 객체는 키를 Unicode code-point 순으로 재귀 정렬하고 공백 없이 JSON 직렬화한다. 배열 순서는 유지하며 문자열 내용·개행을 정규화하지 않는다. 수는 위 범위의 정수만 쓴다. 이 알고리즘을 `tp-c14n/1`이라 부른다. `recordDigest`는 해당 HistoryRecord의 canonical bytes, `contentDigest`는 payload canonical bytes의 SHA-256이다. `historyDigest`는 순서대로 각 canonical HistoryRecord 뒤에 LF 1 byte를 붙인 전체 스트림의 SHA-256이다. `prefixDigest`는 경계 내 원본 의미 레코드의 버전별 정규 표현으로 계산하며 모든 의존 항목의 digest를 포함한다. 제외 가능한 필드는 어댑터별 이름 목록으로 고정한다. 전체 파일 hash와 의미 hash는 다른 용도다.

`packageDigest`는 최종 ZIP의 모든 bytes를 해시하며 패키지 외부의 ImportPlan에서 보유한다. 패키지는 자기 packageDigest를 담지 않는다. checksum은 변조·손상을 확인하는 내부 일관성 수단일 뿐 게시자 인증이 아니다. 1.0.0은 서명·암호화를 지원하지 않는다. 두 기능을 있는 것처럼 표시하지 않는다.

## 4. 지원 이력과 fidelity (규범)

HistoryRecord의 공통 필드는 `schemaVersion:"threadport.history/1.0.0", ordinal:uint, recordAlias:Alias, turnAlias:Alias, originalType:string, originalRole:<IndexEntry와 동일>, authority:"historical_data", kind:<아래 enum>, payload:<아래 폐쇄형 객체>`다. ordinal은 0부터 연속, recordAlias는 패키지 전체에서 유일하다. source의 순서·역할·채널·도구 인자·결과를 추적할 수 있어야 한다. IndexEntry의 alias, ordinal, type, role, callAlias, digest는 대응 HistoryRecord와 일치해야 한다. tool 결과 role은 tool, turn_end role은 none이며 message의 originalRole과 payload.role이 다르면 transformed_history로 분류한다.

| kind / payload | 1.0.0의 후보 지원 및 거절 조건 |
| --- | --- |
| `message` / `{role:enum(user,assistant),channel:enum(analysis,commentary,final,none),text:string}` | 저장된 일반 텍스트만. 숨겨진 reasoning 복원이 아님. 알려지지 않은 channel/role이나 비텍스트 content는 unsupported |
| `tool_call` / `{callAlias:Alias,namespace:Alias|null,name:string,argumentsText:string}` | 이름·인자 원문 보존. 파싱·실행하지 않음. 인자가 암호화됐거나 저장되지 않았다면 unsupported |
| `tool_result` / `{callAlias:Alias,outputText:string,status:enum(completed,failed),exitCode:integer|null}` | 원래 존재한 status/exitCode만 대응 가능. 출력이 unavailable/null이면 빈 문자열을 만들지 말고 unsupported. failed는 결과 의미이며 turn 완료 상태와 별개 |
| `turn_end` / `{status:"completed"}` | 경계까지 turn 완료를 원본의 확인된 terminal 기록에 연결 |

이 표는 **중간 표현의 후보 수용 범위**다. 네이티브 import 지원 목록은 현재 공집합이다. `message`만 읽을 수 있어도 네이티브 지원을 true로 바꾸지 않는다. `tool_call/result`에는 검증된 단일 호출·단일 terminal 결과의 대응만 허용한다. callAlias는 패키지 전체에서 유일한 호출을 가리키며 결과는 정확히 한 번, 호출 다음, 같은 완료 turn 안에 있어야 한다. 병렬 호출은 ID로 대응하고 실행 순서를 임의로 직렬화하지 않는다. 스트리밍 결과·여러 결과·누락·cross-turn pair는 별도 어댑터 검증 전 거절한다.

원본 타입→중간 표현 변환은 어댑터가 정확한 저장 형식에 대해 명시한 mapping만 허용한다. 예컨대 Responses `function_call` 필드가 있다고 내부 `ThreadItem` 또는 rollout event를 같은 형식으로 취급하지 않는다. terminal·metadata·usage 등의 제어 레코드는 어댑터가 의미를 완전히 분류해야 한다. `world_state`, `turn_context`, session metadata는 경로·지침·권한·후속 내용이 있을 수 있어 raw 복사하지 않는다. 처리 의미를 모르면 소거하지 않고 실패한다.

다음은 native 1.0.0에서 unsupported: 압축/compaction·암호화 reasoning·agent_message·멀티모달/첨부·image generation·외부 URL/file 참조·동적 tool/search metadata·알 수 없는 타입/역할·모호한 call ID·실행 중/중단된 turn·내용 누락·권한 지침을 안전하게 비활성 데이터로 보존할 수 없는 기록. 참조는 임의 네트워크 fetch로 해결하지 않는다. 향후 attachments를 지원하려면 새 스키마, 안전한 media parser, 내용 검사, boundary 증거가 필요하다.

- `exact_stored_history`: 선택 범위의 의미 있는 저장 레코드를 모두 비교한 경우만. native ID·등록 timestamp·허용된 위치 별칭 같은 비의미 필드의 변경 목록을 별도로 공개한다. 숨겨진 상태·압축 이전 정보·동일 답변을 보장하지 않는다.
- `transformed_history`: 가림, 의미 있는 필드 생략, 역할 재분류, 손실 있는 변환이 하나라도 있으면 이 값. 변환 전후 항목·필드 digest 및 이유와 수신자 검토가 필요하다. 변환 이름만 붙여 미지원 타입을 우회하지 않는다.
- `summary_only`: 로컬 진단/참고 문서의 fidelity 값으로만 허용한다. 이 패키지 Manifest enum에서는 제외한다. 원문 재주입도 native fork와 동일하지 않으며 독립 이력 테스트의 대체 성공이 아니다.

의미 비교에서 무시하는 필드 목록은 어댑터 버전 및 검증 증거에 묶는다. 포괄적인 `metadata` 무시나 timestamp 전체 무시는 금지한다. 원래 사건 시간과 새 등록 시간은 다르다. 역할 변경을 단순 ID 재매핑으로 숨기지 않는다.

## 5. 경계 및 권한 처리 (규범)

내보내기 선택은 시작부터 명시한 마지막 completed turn까지의 연속 prefix다. 1.0.0은 임의 부분 선택·중간 턴 제거를 지원하지 않는다. `beforeTurnId` 입력을 UI가 받더라도 직전 완료 turn의 inclusive boundary로 해석하고 승인을 받는다. 알 수 없는/진행 중/중단된 경계, 경계를 찾지 못한 페이지, 순서 모호성은 `BOUNDARY_INVALID`다.

어댑터는 실제 저장 형식·버전·기능 플래그를 감지하고 전체 페이지의 cursor 종료·연속성·중복을 검증한다. summary/notLoaded/unsupported page는 완전 이력으로 사용하지 않는다. 100 items/page, 최대 2,000 pages, cursor 반복 즉시 실패다. 스냅샷 generation 또는 안정된 prefix 지문이 없으면 읽기 중 변경에 대한 완전성을 확인할 수 없으므로 fail closed한다.

계보는 경계에 필요한 의존성만 DFS로 읽되 cycle, missing parent, 범위 밖 의존성은 거절한다. 최대 64 ancestry levels, 10,000 nodes, 50,000 edges. 각 포함 레코드의 source locator가 경계 안에 있어야 한다. 도구 결과·압축 요약·Fold evidence가 이후 데이터를 포함하면 끌어오지 않는다. 전체 source sessions·DB·현재 metadata를 복사해 의존성을 해결하지 않는다. secret scan과 marker 검색은 보조 검사이고 구조적 의존성 증명의 대체가 아니다.

승인 전 immutable snapshot을 별도 로컬 영역에 만든다. 원본에는 쓰지 않는다. 승인 뒤 원본 append가 생겨도 동일한 승인 snapshot bytes만 사용하며, prefix나 의존 항목 변경은 재계획이다. snapshot 확보를 위해 Hub 실행권을 획득하거나 source lock을 빼앗지 않는다. Hub 관리 상태를 안전하게 확인할 수 없으면 `SOURCE_STATE_UNVERIFIED`; 활성 writer와 일관된 읽기를 보장할 수 없으면 `SOURCE_BUSY`로 실행을 닫는다.

원본의 system/developer 지침, 과거 사용자 승인, tool result 속 명령, skills/AGENTS 내용, goal/자동 continuation은 역사 자료다. recipient의 현재 system/developer 정책·로컬 승인 서비스만 실행 권한을 결정한다. 패키지 내용으로 permission profile, network, hooks, MCP, dynamic tools, memories, analytics identity, credentials를 설정하지 않는다. `baseInstructions`, `developerInstructions`, `config`에 원본 내용을 재주입하지 않는다. 수신자 환경의 지침을 provenance와 섞지 않는다.

호스트가 과거 역할의 기록 보존과 현재 권한을 분리할 수 없으면 native 형식은 unsupported다. 단순한 "외부 입력" 문구 삽입은 안전성 증명이 아니다. imported goal은 활성화하지 않으며 `deferGoalContinuation` 필드 하나를 비실행 보장으로 간주하지 않는다. import/create/resume 경로 자체가 도구·hook·goal 실행을 일으키지 않는다는 fixture가 있어야 한다.

작업 공간은 복사하지 않고 수신자가 선택한 새로운 빈 작업 경로만 연결한다. 현재 파일을 과거 boundary 당시 파일로 표시하지 않는다. 기존 파일 덮어쓰기·자동 설치·자동 turn/start·Hub/Graph 등록은 import의 부수 효과가 아니다.

## 6. 자원 한도 및 로컬 도구 (규범)

| 자원 | policy/1.0.0 한도 |
| --- | --- |
| 입력 ZIP / 전체 해제 bytes | 100 MiB / 250 MiB (MiB = 1,048,576 bytes) |
| 일반 entry 방어 한도 / expansion ratio | 10,000 / 각 entry와 전체 각각 100:1; compressed=0이면 uncompressed도 0만 허용 |
| JSON 제어 파일 | 각각 4 MiB; history/index.json만 64 MiB |
| history/records.jsonl | 200 MiB, 최대 100,000 records, 한 줄 최대 1 MiB |
| 단일 payload text / 변환 목록 | 1 MiB / 최대 100,000건 (제어 파일 bytes 한도도 동시 적용) |
| 파서 깊이 / 메모리 / 동시 작업 | 32 / worker 128 MiB hard cap / native mutation 1개 per target store |
| 작업 staging disk quota | operation당 600 MiB, 로컬 전체 1 GiB; 부족하면 시작 전에 실패 |
| RPC / 정적 검사 / 전체 mutation timeout | 30초 / 120초 / 300초; timeout은 성공이나 안전한 재시도 판정이 아님 |
| 승인 유효시간 / idempotency key | 최대 30분 / `[A-Za-z0-9_-]{16,128}` |

압축 해제 중 실제 bytes, CPU deadline, 메모리를 감시한다. 선언된 크기를 신뢰하지 않고 초과 즉시 abort하며 잘라서 성공하지 않는다. 제한 검사 worker는 네트워크·셸·설치 권한 없이 동작한다. 암호·스크립트·hook은 실행하지 않고 HTML/터미널 제어문자는 preview에서 escape한다. scanner가 중단되면 검토 완료로 표시하지 않는다. signature 없는 package의 주장을 로컬 정책으로 신뢰하지 않는다.

로컬 계약에도 위 폐쇄형·버전 규칙을 적용한다. `LocalSourceRef={storeAlias:Alias,threadId:string}`는 보내는 로컬 전용이며 package에 넣지 않는다. `Target={storeAlias:Alias,storeIdentity:D,newWorkspacePath:string,policyDigest:D,accountBinding:Alias}`는 수신자 로컬 전용이며 비밀 인증값을 포함하지 않는다. `CapabilityDiff={missing:Alias[],disabled:Alias[],changed:Alias[]}`; `Effect={kind:enum(write_package,create_workspace,create_thread,write_registry),targetAlias:Alias}`; `Check={id:Alias,status:enum(passed,failed,unverified,not_applicable),evidenceDigests:D[],reason:string}`다.

| 로컬 레코드 | 정확한 필드 |
| --- | --- |
| ExportPlan | `schemaVersion:"threadport.local/1.0.0",planId:ID,revision:uint,sourceRef:LocalSourceRef,destination:{parentPath:string,parentIdentity:D,fileName:string},boundaryTurnId:string,sourceDigest:D,snapshotDigest:D,selection:{mode:"completed_prefix",workspace:false},fidelity:enum(exact_stored_history,transformed_history),policyVersion:string,adapterVersion:string,previewDigest:D,contentDigest:D,expectedEffects:Effect[],gateEvidenceDigest:D,expiresAt:Time,planDigest:D` |
| ImportPlan | `schemaVersion:"threadport.local/1.0.0",planId:ID,revision:uint,packageDigest:D,adapterVersion:string,targetEnvironment:Target,capabilityDiff:CapabilityDiff,expectedEffects:Effect[],fidelity:enum(exact_stored_history,transformed_history),transforms:Transform[],policyVersion:string,previewDigest:D,gateEvidenceDigest:D,expiresAt:Time,planDigest:D` |
| ApprovalReceipt | `schemaVersion:"threadport.local/1.0.0",approvalId:ID,planId:ID,revision:uint,planDigest:D,action:enum(create_export,apply_import),localPrincipal:Alias,targetBinding:D,approvedAt:Time,expiresAt:Time,nonce:ID,authTag:D` |
| ImportReceipt | `schemaVersion:"threadport.local/1.0.0",operationId:ID,packageId:ID,packageDigest:D,newThreadRef:string,verifiedHistoryDigest:D,createdPaths:string[],lineageAssertion:Provenance,checks:Check[],executionStarted:false` |
| InspectionReport | `schemaVersion:"threadport.local/1.0.0",reportId:ID,supported:boolean,fidelityOptions:enum(exact_stored_history,transformed_history,summary_only)[],blockers:Error[],checks:Check[],gateStatus:{G0:enum(passed,failed,unverified),G3:enum(passed,failed,unverified)},nativeExecutable:boolean` |
| Error | `code:<아래 고정 enum>,retryable:boolean,phase:string,message:string,evidenceDigests:D[]`; 비밀·원문 내용은 message에 복사하지 않음 |

planDigest는 자신을 제외한 plan의 tp-c14n/1 digest다. export contentDigest는 승인된 manifest+payload의 경로/byteLength/sha256 정렬 목록 digest다. output ZIP encoder 변경으로 bytes가 달라지면 승인된 content 목록과 비교해야 한다. import는 exact packageDigest를 묶는다. targetBinding은 ExportPlan destination 또는 ImportPlan Target의 canonical digest다. export fileName은 단일 안전한 basename이며 `.ruvora-port`로 끝나야 하고 부모 경로의 실제 identity를 재검증한다. approval은 로컬 신뢰 서비스가 authTag 자신을 제외한 ApprovalReceipt의 canonical bytes에 HMAC-SHA256을 적용하여 authTag를 발급하고 서명 키는 패키지에 넣지 않는다. caller가 입력한 "approved" boolean은 승인이 아니다. 다른 머신에서 받은 approvalReceipt는 무효다.

사용자는 완성된 preview·fidelity·변환·대상·효과를 보고 승인한다. 승인 revision은 plan revision과 같아야 한다. 승인 nonce는 operation에 원자적으로 소비하며 동일 operation 재조회는 허용하지만 다른 operation에 재사용하지 않는다. revision은 1 이상이다. revision, digest, 대상 identity/정책/계정 binding, 어댑터, gate 증거 변경이나 만료는 새 preview가 필요하다. 모델 실행의 별도 승인도 이미 유효한 로컬 실행 권한이 있으면 그것을 검증·참조할 수 있으나 이전 사용자의 승인을 승계하지 않는다.

도구 이름은 v0.2의 `port_*`를 채택하며 v0.1 별칭을 자동 실행 경로로 노출하지 않는다. 모든 결과는 `{schemaVersion:"threadport.local/1.0.0",ok:boolean,report:InspectionReport|null,plan:ExportPlan|ImportPlan|null,operationId:ID|null,error:Error|null}`의 폐쇄형 envelope다. ok=false이면 error 필수, 실행 성공과 inspect 성공을 혼동하지 않는다.

| 도구 / 필수 입력 (모두 schemaVersion 포함) | 효과와 결과 |
| --- | --- |
| `port_inspect_export` / `threadRef:LocalSourceRef,boundaryTurnId:string` | 일관된 읽기 및 진단만; report |
| `port_prepare_export` / `threadRef:LocalSourceRef,boundaryTurnId:string,destination:{parentPath:string,parentIdentity:D,fileName:string},policyVersion:string,fidelity:string` | snapshot/plan을 로컬 저장; plan 또는 차단 report; readOnly=false |
| `port_create_export` / `planId:ID,revision:uint,approvalReceipt:ApprovalReceipt,idempotencyKey:string` | gate/승인 검증 후 로컬 파일 생성; operationId |
| `port_inspect_package` / `localPath:string` | 안전한 정적 검사; report. private scratch는 종료 시 정리, 영속 상태는 쓰지 않음 |
| `port_prepare_import` / `packageDigest:D,target:Target` | 검증된 로컬 package handle을 digest로 조회해 plan 저장; readOnly=false |
| `port_apply_import` / `planId:ID,revision:uint,approvalReceipt:ApprovalReceipt,idempotencyKey:string` | gate/승인 확인 뒤 신규 데이터만 생성; operationId |
| `port_get_operation` / `operationId:ID` | 읽기 전용 상태 조회. 이 도구만 추가로 `operation:Operation|null` 결과 필드를 갖는 별도 폐쇄형 스키마 |

prepare의 fidelity/policy 문자열은 정확한 지원 enum/version으로 validator가 제한한다. 검사 도구의 readOnly 표기는 사용자/호스트 영속 상태를 바꾸지 않는 구현에만 부여한다. preview 저장은 쓰기다. native 도구의 annotations는 app-server 부수 효과까지 검증한 뒤 부여한다.

Error code enum: `GATE_UNVERIFIED`, `GATE_FAILED`, `UNSUPPORTED_VERSION`, `UNSUPPORTED_HISTORY`, `SOURCE_STATE_UNVERIFIED`, `SOURCE_BUSY`, `MISSING_LINEAGE`, `BOUNDARY_INVALID`, `HISTORY_NOT_SELF_CONTAINED`, `SENSITIVE_CONTENT_REVIEW`, `PACKAGE_LIMIT`, `DIGEST_MISMATCH`, `UNSAFE_PATH`, `ENVIRONMENT_MISMATCH`, `APPROVAL_INVALID`, `PLAN_STALE`, `IDEMPOTENCY_CONFLICT`, `IMPORT_RECONCILIATION_REQUIRED`, `IO_FAILURE`, `TIMEOUT`.

## 7. 내구성, 재시도, reconciliation (규범)

로컬 registry는 SQLite transaction, foreign keys, unique constraints, `synchronous=FULL`과 WAL을 사용한다. DB·WAL·staging 디렉터리는 recipient만 접근 가능한 모드다. registry가 잠기거나 fsync 실패하면 native 쓰기를 시작하지 않는다. 한 target store의 mutation은 OS lock과 journal generation으로 직렬화하며 다른 source writer의 lock을 건드리지 않는다.

`Operation={schemaVersion:"threadport.local/1.0.0",operationId:ID,kind:enum(export,import),planDigest:D,idempotencyKey:string,state:<아래 enum>,generation:uint,checks:Check[],nativeThreadRef:string|null,localPrincipal:Alias,createdPaths:string[],error:Error|null,updatedAt:Time}`. journal에는 plan snapshot, target identity, 예상 효과, native 요청 fingerprint, 생성 시도 ID, 응답 관찰 및 상태 전이를 transaction으로 보존한다. 같은 `(localPrincipal,kind,idempotencyKey)`는 unique다. 같은 key/digest는 기존 operation을 반환하고 다른 digest는 conflict다. terminal 기록은 적어도 30일 보존하며 제거 시에도 key/digest tombstone을 보존해 재실행을 막는다.

Export 상태: `inspected → prepared → approved → materializing → validating → ready`; Import: `inspected → prepared → approved → staging → creating → verifying → imported`. 공통 중단 상태: `blocked`, `failed`, `cancelled`, `attention`. generation CAS로 역행·중복 전이를 막는다. `ready`는 최종 파일 durable publish와 검증 완료, `imported`는 신규 세션 식별·읽기 비교·등록 내구성이 확인됐다는 뜻이다. 사용자 후속 모델 실행을 했다는 뜻은 아니다.

파일 publish: operation UUID staging에서 exclusive 생성 → 내용 및 구조 검증 → file fsync → 동일 파일시스템의 no-replace atomic rename → 부모 directory fsync → registry ready transaction 순서. rename 뒤 journal 확정 전에 crash하면 승인된 최종 파일 digest를 조회해 ready로 확정한다. 목적지의 다른 파일은 덮어쓰지 않는다. 외부 drive의 rename/fsync 의미가 입증되지 않으면 해당 경로를 지원하지 않는다.

Native create는 호출 **전에** `creating` intent를 fsync한다. native ID를 알게 되면 즉시 operation에 묶고, 이력 비교·정책 차단 확인·호스트 영속 저장 확인 후 imported로 확정한다. API가 idempotency key나 조회 가능한 operation correlation을 지원하면 그 검증된 기능을 사용한다. 새 native ID는 source 및 recipient 기존 ID와 달라야 한다. native lineage 재현 여부와 ThreadPort의 별도 provenance를 혼동하지 않는다.

| crash/실패 구간 | 복구 규칙 |
| --- | --- |
| 승인 후 staging 전/중 | immutable snapshot·승인·target 재검증. native create 전이면 동일 operation에서 재시도 가능; 만료면 재계획 |
| creating intent 후 응답 유실 | `attention` + `IMPORT_RECONCILIATION_REQUIRED`; 새 create를 보내지 않음 |
| ID 저장 후 verify 전 | ID의 native read와 예상 digest·target·policy를 비교. turn/start는 보내지 않음 |
| verify 일부 실패 | 신규 세션 ID와 생성 경로를 보고하고 격리. imported로 승격하지 않음 |
| imported 뒤 사용자 turn 발생 | reconciliation은 읽기만; 사용자 데이터 삭제/자동 rollback 금지 |
| 취소 | native write 전에는 staging 정리; 이미 생성됐거나 상태 불명확하면 attention 및 부분 생성 표시 |

응답 유실의 해결은 native correlation으로 후보를 찾고 대상 identity·요청 fingerprint·이력 digest·생성 증거가 정확히 일치하는 **단 하나**임을 검증하는 것이다. 이름, 시간 근접성, thread 목록 차이만으로 ownership을 확정하지 않는다. 0개도 서버가 아직 진행 중일 수 있어 자동 재생성의 근거가 아니다. 2개 이상/조회 불가/host capability 부재는 attention을 유지한다. 이 전략이 검증되지 않은 어댑터는 자동 retry를 지원하지 않으며 G1 출시를 차단한다.

임시 정리는 operation 소유권·canonical path·inode·기록된 hash를 확인한 ThreadPort 전용 파일만 대상으로 한다. symlink로 바뀌면 정리도 중단한다. journal의 snapshot은 계획 메타데이터를 뜻하며 원문 snapshot 파일은 별도 접근 제한 staging에 둔다. snapshot/실패 파일은 기본 24시간 후 정리하되 unresolved attention의 증거는 보존한다. 삭제 재시도 역시 원본, 기존 workspace, native 사용자 turn을 건드리지 않는다. 인증·원문 텍스트는 journal에 쓰지 않고 digest·최소 메타데이터만 기록한다.

## 8. G0/G3 증거 계약 및 gate 정책 (규범)

`GateEvidence`는 버전 `threadport.evidence/1.0.0`의 폐쇄형 레코드로 `schemaVersion:"threadport.evidence/1.0.0",gate:enum(G0,G1,G2,G3,G4), status:enum(passed,failed,unverified), observedAt:Time, tuple:{sourceCliVersion:string,sourceBinaryDigest:D,targetCliVersion:string,targetBinaryDigest:D,sourceSchemaDigest:D,targetSchemaDigest:D,sourceHistoryFormat:string,targetHistoryFormat:string,adapterId:Alias,adapterVersion:string,policyVersion:string,platformPair:string}, fixtureDigest:D, commandRecords:[{argv:string[],exitCode:integer|null,stdoutDigest:D|null,stderrDigest:D|null,outputAvailability:enum(full,partial,unavailable)}], artifacts:[{path:string,sha256:D,byteLength:uint}], checks:Check[]`를 필수로 갖는다. 로그는 합성 데이터만 사용하고 자격증명은 보존하지 않는다. 기록된 path의 실제 파일·digest를 소비자가 확인해야 한다. 이 구조는 향후 evidence 계약이지 이번에 실행한 것처럼 만든 영수증이 아니다.

G0 재현에는 다음을 **모두** 충족해야 한다.

1. 버전 고정된 sender/receiver 바이너리·스키마·OS·history format·어댑터 source commit·fixture와 명령 argv를 보존한다. fresh synthetic source에 두 개 이상의 완료 turn, 실제 저장된 tool call/result, 포함 marker, boundary 직후 비공유 marker를 만든다. reference/compaction/unknown type fixture는 정상 성공 또는 명시적 거절의 기대값을 정한다. 지원 범위별로 분리해 결과를 기록한다.
2. source의 모든 관련 이력 파일과 의존 파일의 경로/digest 목록을 기록한다. 승인한 completed boundary로 실제 후보 패키지를 만든다. 원본 전체 복사·수동 DB 이식·summary 재주입 fallback 없이 실제 제품 어댑터 경로를 사용한다.
3. sender 프로세스 종료 이벤트·exit status를 확인한다. receiver를 별도 VM 또는 서로 접근 불가능한 파일시스템 환경에서 실행하고 source를 mount하지 않는다. 단순 CODEX_HOME 분리는 불충분하다. 원본 경로 read가 실패하는 negative control과 mount/network 정책을 보존한다. 공유 HOME, cache, DB, localhost source 서비스도 차단한다.
4. receiver에는 승인한 패키지만 전달한다. ZIP 전체 구조, payload·manifest·metadata·파일명·extra fields와 풀린 모든 파일에 비공유 marker가 없음을 검사한다. base64/JSON escape 등 fixture에서 사용한 인코딩도 검사한다. 구조적 dependency closure와 포함 locator를 별도로 비교한다. 패키지 외 sender 파일이 필요한 순간 실패다. receiver 저장소에도 범위 밖 사본이 생기지 않아야 한다.
5. fresh receiver에 새 native ID로 가져오고 순서·역할·채널·내용·tool pair의 정규화 비교를 수행한다. 기대값은 source boundary snapshot에서 독립 생성하고 importer가 만든 index만 자기 검증하지 않는다. 재작성 허용 필드는 이름별로 제시한다. 중요한 한 항목이라도 missing/unverified면 실패 또는 unverified다.
6. recipient 전용 승인 아래 후속 turn을 실제 host resume 경로로 실행하고 모델 요청 입력을 캡처한다. 합성 local endpoint는 이 G0의 전송/저장 관찰에 사용할 수 있으나 실제 추론이나 G3 성공으로 부르지 않는다. 포함 context와 tool output 전달, 비공유 context 부재, 반환 turn 완료를 각각 확인한다.
7. receiver 종료를 기다린 뒤 새 프로세스로 재시작하고 같은 새 ID를 읽어 재개한다. 다시 입력을 캡처해 원래 허용 context 및 recipient 추가 context가 있고 비공유 내용이 없는지 확인한다. 원본 접근 차단을 유지한다. 동일 프로세스의 메모리 잔존은 증거가 아니다.
8. source를 오프라인으로 다시 hash하여 전체 사전 목록과 비교하고, source에 recipient turn이 없는지 확인한다. source 변경 없음, 보존 비교, 범위 검사, 격리, 재시작, 권한 비승계 증거와 원시 로그를 하나의 manifest로 연결한다. 모든 check가 passed일 때만 해당 tuple의 G0 passed다.

G3는 G0 통과 tuple의 실제 사용자 환경 검증이다. 서로 다른 물리 PC와 각자 독립 인증을 사용하고, A의 자격증명·설정·원본 이력을 B에 복사하지 않는다. 계정의 비밀값 대신 별개라는 비밀 없는 검증 기록을 남긴다. B는 승인한 패키지만 받아 새 세션을 **실제 Codex 앱에서 발견하고 열어** 허용 과거 내용과 recipient 추가 기록을 확인한다. 앱/CLI/OS 버전, native ID 매핑, 화면 증거와 시간을 기록한다. source 접근 차단·sender 종료 상태에서 실제 모델로 fixture가 지정한 후속 작업을 완료하고 B 재시작 후 다시 연다. A/B 각각에 별도의 비공유 canary를 두어 상대 세션·설정·메모리가 섞이지 않는지 확인하고 A 원본 불변도 검사한다. 앱 발견, 실제 작업 결과, 서로 다른 PC, 별도 인증 중 하나라도 없으면 G3는 unverified다. 단순 답변 문구나 모델의 자기 보고는 충분하지 않다.

G0/G3 fixture 실행 명령과 raw stdout/stderr, 실제 exitCode 및 expected/actual 비교를 보관한다. exit code 0만으로 test 개수나 모든 assertion을 추정하지 않는다. 명령 실패와 출력 관찰을 구분한다. 출력이 null/누락이면 unavailable, 명시적 빈 문자열이면 관찰된 빈 출력, stream 조각이면 partial이다. diagnostic 없는 literal `rg --files`의 exit 1은 no matches를 추론할 수 있지만 출력이 제공되지 않았다면 "exit 1로 no matches 추론; output unavailable"로 기록한다. 출력 유실 자체는 모순이 아니며, 부족한 증거를 통과로 바꾸지 않는다.

게이트 상태는 실행 경로와 분리한다. `failed`는 직접 실패한 해당 검사, `unverified`는 미실행·불충분·유실 증거다. 현재 전체 계보 복사 fixture의 비공유 표식 잔존은 그 경로의 boundary 실패 증거이지만 모든 독립 materializer 가능성의 실패 증명은 아니다. 제품 G0/G3의 현 상태는 unverified다.

매 native mutation 직전에 로컬 신뢰 gate registry의 tuple과 실제 바이너리/스키마/어댑터/정책 digest를 비교한다. 패키지가 주장하는 `passed`는 무시한다. 지원되지 않은 tuple, missing artifact, stale digest, 실행 모드 차이, authority failure는 fail closed다. gate 무시 flag·버전 fallback·best-effort import를 제공하지 않는다.

G1은 G0에 더해 parser·손상 hash·traversal·bomb·unknown record·secret/authority·approval 재사용/변경·writer race·crash/응답 유실·중복 요청·정리 ownership fixtures가 필요하다. G2는 작업 공간 별도 계약과 시점 증거가 있어야 하며 1.0.0에서는 제외다. G3가 미검증이면 실제 사용자용 native 이전을 열지 않는다. G0/G1 통과만으로는 격리된 개발 검증 환경에서만 실험 가능하다. G4 배포는 별도 설치/업데이트/제거·보존 검증과 배포 범위에 필요한 G0/G1/G3 통과를 요구한다. 문서 작성은 이 실험·배포를 수행한 것이 아니다.

## 9. 지금 구현할 수 있는 blocked mode

초기 capability registry는 모든 native adapter에 `nativeExecutable:false`를 반환한다. 사용자는 로컬 source와 완료 boundary를 선택하고, 읽을 수 있는 범위·미지원 타입·계보 의존성·fidelity 후보·민감 정보 위험·자원 한도를 확인할 수 있다. 패키지가 있다면 정적 구조/해시/경로 검사를 실행하고 대상 환경 차이를 미리 볼 수 있다. 진단에서 읽지 못한 부분은 수량 0이 아니라 unknown으로 표시한다.

`port_prepare_*`는 실행 plan을 null로 두고 차단 InspectionReport를 로컬 저장할 수 있지만 실행 승인 버튼은 활성화하지 않는다. unsupported native 형식으로 유효한 실행 계획을 만들어서는 안 된다. `port_create_export`와 `port_apply_import`는 서버에서도 gate 오류를 반환하고 패키지 publish·native write·turn/start를 하지 않는다. UI만 비활성화하고 API를 남겨두는 구현은 금지한다. 보고서에는 gate별 부족한 evidence check와 해당 버전을 보여 준다.

공유 가능한 진단이 필요하면 사용자가 선택한 위치에 `threadport-compatibility-report.json`을 저장한다. `InspectionReport` 스키마를 사용하고 원문 대화·절대 source path·계정·비밀값을 제외한다. 이것은 `.ruvora-port`가 아니며 새 세션을 만들지 않는다. 참고용 요약 기능을 나중에 제공해도 `summary_only`와 별도 사용자 의도를 요구하고 native gate를 통과시키지 않는다.

이 모드의 완료 기준은 검사·preview·진단 저장 및 모든 native 경로의 일관된 차단이다. 별도 acceptance fixtures로 검증해야 한다. 이번 산출물은 그 구현 계약이며 blocked-mode 코드나 테스트를 실행·완성했다고 주장하지 않는다.
