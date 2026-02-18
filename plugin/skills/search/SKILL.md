---
name: search
description: "커뮤니티 레지스트리에서 에이전트/스킬/프리셋 검색."
user-invocable: true
allowed-tools: Bash(npx:*)
---

# /search

커뮤니티 레지스트리에서 에이전트, 스킬, 프리셋을 검색합니다.

## 사용법

```bash
npx create-agent-system search <query> [options]
```

옵션:
- `--type <type>` — 항목 타입 필터 (agent, skill, preset)
- `--tag <tag>` — 태그 필터

## 예시

```bash
# 키워드 검색
npx create-agent-system search testing

# 타입 필터
npx create-agent-system search --type skill testing

# 태그 필터
npx create-agent-system search --tag security

# 전체 목록 보기
npx create-agent-system list
npx create-agent-system list --type agent
```

## 결과

검색 결과는 이름, 설명, 타입, 태그를 포함하며 관련도 순으로 정렬됩니다.
마음에 드는 항목을 찾으면 `/add` 커맨드로 설치할 수 있습니다.
