# 로컬 검증 및 자체 검토 기록

이 기록은 이번 로컬 구현의 실행 결과이며 이전 실패 run을 통과로 변경하지 않는다. 독립 검토는 수행하지 않았다. 테스트는 네트워크·브라우저·socket 없이 Node 내장 모듈과 합성 임시 디렉터리에서 실행했다.

Node 실행 경로:

```text
/Users/sin-yebin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

| 실행 명령 (위 Node 경로 사용) | 실제 결과 | 범위 |
| --- | --- | --- |
| `node --test` 초기 실행 | exit 0; 34 tests, 34 pass, 0 fail | 기본 코어·CLI/MCP·승인·복구 |
| `node --test` 확장 실행 | exit 0; 41 tests, 41 pass, 0 fail | 재해시 악성 패키지·UTF-8·계획 변조 등 추가 |
| `node --test` 자체 검토 후 실행 | exit 0; 45 tests, 45 pass, 0 fail, skipped 0 | DEFLATE, 두 프로세스 idempotency, 비정상 종료 복구 포함 |
| `node --test` inode 회귀 추가 실행 | **exit 1; 46 tests, 44 pass, 2 fail** | SQLite 잠금 설정 순서와 합성 복사 권한 문제 발견 |
| `node --test` 두 문제 수정 후 최종 실행 | **exit 0; 46 tests, 46 pass, 0 fail, skipped 0** | 전체 로컬 회귀 검사 통과 |
| `node scripts/validate-package.mjs` | exit 0; valid=true; stdioInitializeExit=0 | 저장소 Node 검증기의 manifest/skill/MCP 실제 진입점 검사 |
| `node scripts/g0-harness.mjs` | **exit 3; G0/G3 NOT VERIFIED** | 합성 패키지의 새 프로세스 검사 및 재시작 검사만 성공 |
| `node src/cli.mjs inspect-source fixtures/conversation.json first` | exit 0; recordCount=5; nativeExecutable=false | README 로컬 검사 예시 실행 |
| `node scripts/generate-schemas.mjs` | exit 0 | 런타임 validator에서 폐쇄형 JSON Schema 생성 |
| `python3 …/plugin-creator/scripts/validate_plugin.py <repo>` | **exit 1**; ModuleNotFoundError: yaml | PyYAML 부재로 검증기 실행 실패; 설치하거나 통과로 간주하지 않음 |
| `python3 …/skill-creator/scripts/quick_validate.py <repo>/skills/threadport` | **exit 1**; ModuleNotFoundError: yaml | 같은 의존성 제약; Node의 명시적 frontmatter 부분집합 검사를 별도로 수행 |

명령은 개별 실행했다. 원출력과 tool이 반환한 exit_code는 [evidence/tests.json](evidence/tests.json), [evidence/plugin.json](evidence/plugin.json), [evidence/offline-harness.json](evidence/offline-harness.json)에 저장했다. 추가 실패 출력은 [regression-failure.json](evidence/regression-failure.json), 수정 후 최종 출력은 [final-tests.json](evidence/final-tests.json)에 보존했다. 초기 offline-harness 출력의 argv는 ISOLATED_TEMP로 정규화한 표시용 명령이며 실제 argv 증거로 사용하지 않는다. 하네스 명령 기록을 실제 argv로 수정한 뒤 재실행한 [final-offline-harness.json](evidence/final-offline-harness.json)도 exit 3이며 G0/G3 미검증이다. 이 파일들의 output은 도구가 노출한 출력이며 별도 stdout/stderr 분리가 없으면 분리했다고 주장하지 않는다. 테스트 수는 실제 runner 출력의 수치다.

자동 검사의 핵심 범위는 boundary 이후 표식의 ZIP 전체/모든 entry 부재, 도구 ID 순서/대응/누락, 미지원 형식/역할/필드, unsafe path/중복/CRC/hash/한도, stale/위조 승인, idempotency conflict, 부분 생성과 프로세스 재시작 복구다. 원본 source 두 문서와 기존 부록의 SHA-256 불변도 테스트한다.

네이티브 독립 이력 재개·실계정·다른 PC·앱 발견은 실행되지 않았고 G0/G3는 계속 미검증이다. 합성 fixture import가 만드는 것은 로컬 영수증이며 네이티브 세션이 아니다. 패키지 설치·마켓플레이스·GitHub 생성·push·배포는 수행하지 않았다. 남은 출시 조건은 기존 부록 §8과 IMPLEMENTATION_STATUS.md의 gate matrix를 따른다.

## 후속 보완: 공식 검증 환경과 로컬 회귀 검사

과거 두 실행의 failed 상태, 위 46개 테스트 성공, G0/G3 하네스 exit 3 기록은 그대로 보존한다. 지정된 incident 문서는 읽기 전용으로 참조했다. 그 문서의 후속 공식 패키지 검증 통과는 이전 PyYAML 실패를 삭제하거나 네이티브 출시를 승인하는 결과가 아니다.

이번 스레드에서 실제 실행한 공식 검증:

```sh
/tmp/ruvora-plugin-validation/bin/python -B /Users/sin-yebin/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/sin-yebin/Desktop/project/threadport
/tmp/ruvora-plugin-validation/bin/python -B /Users/sin-yebin/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/sin-yebin/Desktop/project/threadport/skills/threadport
```

각 명령을 개별 실행했으며 모두 exit 0이었다. 노출된 출력은 각각 `Plugin validation passed: /Users/sin-yebin/Desktop/project/threadport`와 `Skill is valid!`다. 이는 공식 구조 검사 통과이며 설치·호스트 로딩·실계정 연동 검증은 아니다. 기본 Python은 변경하지 않았다.

| 이번 검사 | 실제 결과 | 새 증거 |
| --- | --- | --- |
| `node --test test/continuation.test.mjs` 수정 전 | exit 1; 4 tests, 0 pass, 4 fail | [재현 출력](evidence/continuation-before.json) |
| 같은 명령 수정 후 | exit 0; 4 tests, 4 pass, 0 fail | [회귀 통과 출력](evidence/continuation-after.json) |
| `node --test --test-name-pattern='file reader\|publication\|journal\|approval\|plan\|reconcil\|retry\|processes\|inode\|byte-identical' test/core.test.mjs` | exit 0; 16 tests, 16 pass, 0 fail | [영향 범위 검사 출력](evidence/continuation-affected.json) |

Node는 위에 기재한 절대 경로를 사용했다. 새 FIFO 재현 fixture 생성에만 시스템 `mkfifo`를 사용했으며, Node 자식 프로세스의 타임아웃으로 기존 blocking open을 확인했다. 모든 새 쓰기는 프로젝트 또는 격리된 합성 임시 디렉터리에 한정했다. 전체 46개 테스트와 G0 하네스를 반복 실행하지 않았으며, 선택 실행 결과를 새 전체-suite 결과로 합산하지 않는다. 원본 문서/부록 SHA-256 불변 검사도 선택된 기존 16개 안에서 통과했다.

수정은 FIFO 열기 전 파일 검사와 nonblocking open, 열려 있는 journal의 현재 root 재검증, reconciliation의 원래 계획/대상/digest 검증이다. 미지원 네이티브 계약과 증거 목록은 IMPLEMENTATION_STATUS.md의 후속 보완 절에 명시했다. G0/G3는 여전히 NOT VERIFIED이며 실제 이전·설치·게시·다른 프로젝트 수정은 수행하지 않았다.
