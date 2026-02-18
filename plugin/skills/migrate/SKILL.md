---
name: migrate
description: "Agent Teams 설정을 최신 버전으로 마이그레이션. 버전 업그레이드 시 사용."
user-invocable: true
allowed-tools: Bash(npx:*), Bash(cd:*), Read, Glob
---

# /migrate

Agent Teams 설정을 이전 버전에서 최신 버전으로 마이그레이션합니다.

## 사용법

```bash
npx create-agent-system migrate [--dry-run] [--target-version <ver>] [--yes]
```

옵션:
- `--dry-run` — 변경 내용 미리보기만 (실제 수정 안 함)
- `--target-version` — 대상 버전 지정 (기본: 1.0)
- `--yes, -y` — 확인 프롬프트 건너뛰기

## 지원 마이그레이션 경로

| 소스 | 대상 | 변경 내용 |
|------|------|----------|
| v0.1 (config 없음) | v0.2 | .claude/ 파일 스캔 → config 파일 생성 |
| v0.2 | v1.0 | version 업데이트, language 필드 추가 |

## 플로우

1. 현재 버전 자동 감지
2. 마이그레이션 경로 계산
3. 변경 내용 표시
4. 사용자 확인
5. 마이그레이션 실행
6. 결과 검증 (validate)
