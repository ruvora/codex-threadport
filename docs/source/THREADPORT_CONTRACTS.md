# ThreadPort 구현 설계 v0.2

작성일: 2026-09-06. 상태: 제안 계약, G0 미통과. [기존 실험과 요구사항](THREADPORT_DESIGN.md)을 대체하지 않고 구체화한다.

## 1. 제품의 약속과 제한

받는 사람의 저장 환경에서 원본 접근 없이 독립 세션을 이어 쓰는 것이 목표다. 원격 초대 서비스가 아니다. 기존 실험은 같은 PC의 서로 다른 저장소와 모의 모델에 한정됐으며 계정 간 이전·다른 PC·앱 발견은 미검증이다.

보존 수준을 세 가지로 명시한다.

- exact_stored_history: 지원 형식의 선택 범위에 대해 의미 있는 저장 항목의 보존을 검증. 숨겨진 모델 상태나 압축 전 소실 정보 복원이 아님.
- transformed_history: 가림·권한 지침 재분류·형식 변환 등 의미 있는 변경이 있는 경우. 변경 보고서를 받는 사람이 확인해야 함.
- summary_only: 참고 문서 전달. 세션 포크 기능으로 광고하지 않고 MVP의 대체 성공으로 인정하지 않음.

받는 환경의 권한 정책을 우회하는 원본 지침은 승계하지 않는다. 역할·도구 기록을 보존하는 것과 그 지침에 현재 실행 권한을 주는 것은 별개다. 플랫폼에서 이 구분을 안전하게 표현하지 못하면 해당 형식은 unsupported로 처리한다.

## 2. G0의 대안 실험

| 경로 | 검증할 것 | 현재 판정 |
| --- | --- | --- |
| 공식 API의 독립 내보내기/가져오기 | 참조 없는 패키지 생성·신규 ID·시점 경계 | 지원 경로 확립 필요 |
| 버전 고정 materializer | 참조 계보를 안전한 독립 이력으로 평탄화, 호스트 재개 | 내부 형식 의존 위험; 미검증 |
| 새 세션에 원문 항목 재주입 | 역할·도구 쌍·앱 표시·재개 의미의 동등성 | 동일 포크로 간주하지 않음; 비교 실험만 |

원본 계보 전체 복사는 비공유 데이터 유출을 재현했으므로 출시 경로에서 금지한다. G0 실패 시 preview/compatibility 검사만 제공하고 export/import 실행은 닫는다.

## 3. 데이터와 파일 포맷 제안

컨테이너는 ZIP, 확장자는 `.ruvora-port`, UTF-8 JSON manifest를 기본 제안으로 한다. 구현 검증 전 고정 표준이라고 주장하지 않는다.

| 레코드 | 필수 내용 |
| --- | --- |
| ExportPlan | planId, revision, sourceRef, boundaryTurnId, sourceDigest, selection, fidelity, policyVersion, planDigest |
| Manifest | schemaVersion, packageId, producerVersion, codexVersion, historyFormat, boundary, fidelity, files[], transforms[], requirements |
| HistoryIndex | ordered item IDs, original role/type, tool call pairing, content digests, source locators |
| ImportPlan | packageDigest, adapterVersion, targetEnvironment, newWorkspacePath, capabilityDiff, expectedEffects, planDigest |
| ImportReceipt | operationId, packageId/digest, newThreadRef, verifiedHistoryDigest, createdPaths, source lineage assertion |

외부로 전달하는 sourceRef는 사용자 이름·절대 경로 대신 패키지 내부 별칭으로 치환한다. 로컬 원본과의 매핑은 보내는 쪽에만 저장한다. 출처 정보는 서명 검증 전까지 보내는 사람의 주장이지 인증된 신원이 아니다.

manifest의 files[]는 상대 경로, byteLength, sha256, mediaType, purpose를 갖는다. 파일 목록에 없는 archive entry, 중복·대소문자 충돌 경로, 절대 경로, `..`, symlink/hardlink, device 항목은 거절한다.

대화 MVP의 초깃값 제안: 압축 100 MiB, 해제 250 MiB, 10,000 entries, 압축비 100:1 이하. 작은 메모리의 streaming 검사로 제한을 먼저 적용하고 한도 초과는 자르지 않고 실패한다. 값은 성능 fixture로 조정하며 호환성을 깨는 정책 변경은 version을 올린다.

## 4. 내보내기 알고리즘

1. adapter가 버전·historyFormat을 판별하고 지원 여부를 반환한다.
2. 완료 경계의 원본 지문을 고정한다. 이후 append가 생겨도 승인된 prefix가 동일한지 재검증한다.
3. 참조 graph를 순회해 허용된 prefix의 의존 항목만 수집한다. cycle, missing parent, unknown record type은 실패한다.
4. 도구 호출·응답의 대응과 attachment 의존성을 검증한다. 범위 밖 항목을 끌어와 쌍을 맞추지 않는다.
5. materializer가 독립 표현을 생성한다. 원본 파일 자체는 수정하지 않는다.
6. 정책·민감 정보·권한 승계 검사 후 fidelity와 transforms를 미리 보여준다.
7. 승인된 contentDigest로 staging package를 생성한다.
8. 모든 파일·manifest·attachment에서 금지된 범위가 없는지 fixture 검사와 구조 검증을 수행한다.
9. 검증 성공 후에만 완성 파일로 publish한다. 기본 산출물은 로컬 파일이며 업로드·전송은 하지 않는다.

실데이터에서 문자열 검사만으로 시점 외 정보 제거를 보장하지 않는다. 구조적 경계 절단과 의존성 목록 검증이 본체이고 marker 검사는 회귀 테스트다. 의미적 비밀 정보의 완전 탐지는 보장하지 않는다.

## 5. 가져오기 알고리즘

1. 파일을 실행하지 않고 제한된 staging 영역에서 형식·크기·해시를 검사한다.
2. adapter version과 fidelity를 검사한다. 미지원 형식의 best-effort import는 하지 않는다.
3. 필요한 도구·경로·모델 구성의 차이를 계산하되 비밀 정보·훅·원본 승인은 적용하지 않는다.
4. 사용자에게 대상과 변환 사항을 보여주고 packageDigest에 묶인 승인을 받는다.
5. 새 작업 공간과 새 세션을 만들고 native ID와 import operation을 먼저 journal에 연결한다.
6. 정규화된 이력 비교로 순서·내용·도구 대응·경계를 확인한다. ID·timestamp 등 새 환경에서 달라져야 하는 필드는 명시적 allowlist로 비교에서 제외한다.
7. 새 session의 read/restart/resume을 검증한다. 모델 실행 없이 할 수 없는 검사는 별도 실행 승인 단계로 남긴다.
8. 등록과 검증 결과를 확정한 뒤 사용자에게 열기·실행을 제시한다. import 성공만으로 turn/start 하지 않는다.

## 6. 도구·상태 계약

| 도구 | 입력 | 결과 |
| --- | --- | --- |
| port_inspect_export | threadRef, boundaryTurnId | supported, fidelity options, blockers |
| port_prepare_export | 선택 범위, policyVersion | 저장된 ExportPlan과 preview |
| port_create_export | planId/revision, approvalReceipt, idempotencyKey | export operation |
| port_inspect_package | localPath | 정적 검사 보고서 |
| port_prepare_import | packageDigest, target | ImportPlan, capabilityDiff |
| port_apply_import | planId/revision, approvalReceipt, idempotencyKey | import operation |
| port_get_operation | operationId | 항목별 검증·실패·복구 상태 |

Export: inspected → prepared → approved → materializing → validating → ready 또는 blocked/failed/cancelled.
Import: inspected → prepared → approved → staging → creating → verifying → imported 또는 attention/failed/cancelled.

동일 idempotencyKey·동일 planDigest는 같은 operation으로 귀결된다. 다른 digest는 충돌이다. session 생성 뒤 응답 유실 시 생성 기록을 조회해 복구하며 blind retry로 세션을 늘리지 않는다. 호스트에 생성 idempotency가 없다면 어댑터 journal의 식별 전략 검증 전 자동 retry는 금지한다.

실패 파일은 격리하고 새 세션이 일부 생겼으면 ID와 상태를 보고한다. 원본이나 사용자 기존 파일을 rollback 대상으로 삼지 않는다. import 후 사용자 Turn이 생기면 자동 제거·복구가 아니라 새 검토 대상이다.

## 7. 기밀성·계보·통합

- 공유 파일은 받는 사람이 복사할 수 있으므로 전달 후 회수를 약속하지 않는다.
- 첫 MVP는 자동 전송·암호화 기능을 약속하지 않는다. 민감 데이터는 사용자가 승인한 보호된 전달 수단이 필요하다.
- 실제 모델 검증에는 받는 사용자 자신의 인증을 사용한다. A의 인증 복사는 금지한다.
- imported lineage는 별도 RUVORA provenance로 보존한다. 호스트가 native fork lineage를 재현하지 못하면 그 사실을 표시한다.
- Fold 통합 기록을 첨부해도 원문 이력의 대체물이 아니다. 원본 범위 밖을 참조하는 summary/evidence는 함께 보내지 않는다.
- 가져온 세션을 Hub 작업으로 등록하거나 Graph를 갱신하는 것은 별도 요청이다.

## 8. 수용 기준

G0: source filesystem을 실제로 읽을 수 없는 격리 환경, sender 종료, 재시작 재개, 분기 이후 데이터의 package-wide 부재, 유효한 tool pair, 원본 digest 불변.
G1: 손상 ZIP, hash mismatch, archive traversal, zip bomb, 비밀 설정, 미지원 역할·형식, partial import·중복 retry 테스트.
G2: 커밋·미커밋·미추적 파일의 선택적 복제, file/history 시점 불일치 표시.
G3: 서로 다른 PC·계정으로 실제 응답과 앱 발견·열기 검증. 동일 PC 모의 테스트로 대신 통과 처리하지 않는다.

에러 예: UNSUPPORTED_HISTORY, MISSING_LINEAGE, BOUNDARY_INVALID, HISTORY_NOT_SELF_CONTAINED, SENSITIVE_CONTENT_REVIEW, PACKAGE_LIMIT, DIGEST_MISMATCH, UNSAFE_PATH, ENVIRONMENT_MISMATCH, IMPORT_RECONCILIATION_REQUIRED.
