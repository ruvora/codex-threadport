# ThreadPort 로컬 사용법

현재 버전은 **검사·호환성 미리보기와 합성 코어 검증용**입니다. G0/G3가 미검증이므로 실제 Codex 세션 내보내기·가져오기는 항상 차단합니다. 요약 재주입이나 전체 원본 계보 복사는 제공하지 않습니다.

Node 24 이상이 필요하며 설치할 npm 의존성은 없습니다. 저장소 루트에서 다음을 실행합니다.

```sh
/Users/sin-yebin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/cli.mjs capabilities
/Users/sin-yebin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/cli.mjs inspect-source fixtures/conversation.json first
/Users/sin-yebin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/cli.mjs preview-source fixtures/conversation.json first
```

`inspect-source`는 합성 이력 형식만 수용합니다. 실제 개인 rollout, 인증, 설정 파일을 입력하지 마세요. `preview-source`는 `.threadport/reports/`에 원문 없이 진단을 저장합니다. 다른 입력 디렉터리는 `--root /절대/입력/디렉터리`로 지정하고, 파일은 그 안의 상대 경로로 넘깁니다. 숨김 경로·상위 경로 이탈·심볼릭 링크·hardlink는 거절합니다.

패키지는 `inspect-package example.zip`, 가져오기 미리보기는 `preview-import example.zip`입니다. ZIP을 디스크에 풀지 않고 검사합니다. 현재 synthetic-v1 프로필 외 형식은 거절하며, 검사 통과는 네이티브 재개 가능이나 게시자 신원 인증을 뜻하지 않습니다. 코드·도구·hook·지침·모델은 실행하지 않습니다.

합성 작업의 승인/복구 흐름은 README의 `fixture-plan → fixture-approve → fixture-apply` 예시를 따릅니다. 승인은 사람이 실제 터미널에서 전체 planDigest를 입력해야 합니다. 모델이 제공한 `approved:true`, 서명 키, MCP 승인은 인정하지 않습니다. 같은 요청은 같은 idempotency key를 사용하고, `attention`이면 `fixture-reconcile`로 상태를 확인합니다. 새 key로 무조건 재생성하거나 기존 파일을 삭제하지 마세요. `fixture_import`는 패키지 검증 후 로컬 영수증만 생성하며 Codex 세션은 만들지 않습니다.

stdio MCP는 `node src/cli.mjs mcp`로 실행합니다. JSON-RPC 한 메시지당 한 줄이고 64 KiB 제한입니다. `.mcp.json`의 `node`는 호스트 PATH에 Node 24 이상이 있어야 합니다. 이번 작업에는 플러그인 설치나 마켓플레이스 등록이 포함되지 않았습니다.

종료 코드: 성공한 로컬 검사 `0`, 입력/검증 오류 `1`, 네이티브 gate 차단 `3`. `scripts/g0-harness.mjs`도 합성 검사 뒤 G0/G3 **NOT VERIFIED**를 출력하며 의도적으로 `3`을 반환합니다. 이것을 건너뛴 성공으로 집계하지 않습니다.

실제 다른 계정·PC의 앱 발견/열기/재개와 안전한 네이티브 어댑터는 남은 출시 관문입니다. 원본 두 문서와 기존 부록은 수정하지 않았으며, 과거 실패 실행 기록을 이번 테스트 성공으로 바꾸지 않습니다.
