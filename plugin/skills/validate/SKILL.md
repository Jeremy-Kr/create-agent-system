---
name: validate
description: "현재 프로젝트의 Agent Teams 설정 검증. 디버깅, 설정 확인 시 사용."
user-invocable: true
allowed-tools: Bash(npx:*), Read, Glob, Grep
---

# /validate

현재 프로젝트의 Claude Code Agent Teams 설정을 검증합니다.

## 사용법

```bash
npx create-agent-system validate [target] [options]
```

옵션:
- `--quiet, -q` — 오류만 출력 (경고 생략)

## 예시

```bash
# 현재 디렉토리 검증
npx create-agent-system validate

# 특정 디렉토리 검증
npx create-agent-system validate ./my-project

# 조용한 모드 (CI 환경용)
npx create-agent-system validate --quiet
```

## 검증 항목

### 오류 (실패 조건)
- YAML frontmatter 파싱 실패
- `name` 필드 누락
- `description` 필드 누락
- 지원하지 않는 frontmatter 필드 사용
- `model` 값이 유효하지 않음 (opus, sonnet, haiku, inherit 외)
- `skills` 참조가 존재하지 않는 디렉토리를 가리킴
- CLAUDE.md `@import` 경로가 존재하지 않는 파일을 가리킴

### 경고 (실행 가능, 개선 권장)
- `description`이 너무 짧음 (< 20자) 또는 너무 김 (> 1024자)
- `tools` 필드 없음 (전체 도구 상속)
- 비활성 에이전트 파일이 존재

## 결과 해석

- 오류가 있으면 exit code 1 반환 — 설정 수정 필요
- 경고만 있으면 exit code 0 반환 — 동작하지만 개선 권장
- 모두 통과하면 에이전트/스킬 개수 요약 표시
