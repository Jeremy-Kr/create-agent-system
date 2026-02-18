---
name: add
description: "커뮤니티 레지스트리에서 에이전트/스킬/프리셋 추가 설치. 프로젝트 확장 시 사용."
user-invocable: true
allowed-tools: Bash(npx:*), Read, Write, Glob
---

# /add

커뮤니티 레지스트리에서 에이전트, 스킬, 프리셋을 검색하고 프로젝트에 설치합니다.

## 사용법

```bash
npx create-agent-system add <names...> [options]
```

옵션:
- `--type <type>` — 항목 타입 필터 (agent, skill, preset)
- `--force` — 기존 파일 덮어쓰기
- `--yes, -y` — 확인 프롬프트 건너뛰기

## 예시

```bash
# 이름으로 설치
npx create-agent-system add security-reviewer

# 타입 지정
npx create-agent-system add --type agent security-reviewer

# 여러 항목 한번에 설치
npx create-agent-system add security-reviewer tdd-workflow api-testing

# 강제 덮어쓰기
npx create-agent-system add security-reviewer --force
```

## 의존성 해석

설치할 항목에 의존성이 있으면 자동으로 감지하고 함께 설치할지 확인합니다.
예: 에이전트가 특정 스킬을 참조하는 경우, 해당 스킬도 같이 설치 제안.

## 설치 위치

| 타입 | 설치 경로 |
|------|----------|
| agent | `.claude/agents/<name>.md` |
| skill | `.claude/skills/<name>/SKILL.md` |
| preset | `presets/<name>.yaml` |
