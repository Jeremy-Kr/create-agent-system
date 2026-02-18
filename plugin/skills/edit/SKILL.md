---
name: edit
description: "기존 Agent Teams 설정을 시각적으로 편집. 에이전트/워크플로우/스킬 변경 시 사용."
user-invocable: true
allowed-tools: Bash(npx:*), Bash(cd:*), Read, Glob
---

# /edit

기존 agent-system.config.yaml 설정을 인터랙티브하게 편집합니다.

## 사용법

```bash
npx create-agent-system edit [--target <path>]
```

## 플로우

1. 현재 설정 로드 (agent-system.config.yaml 필수)
2. 현재 설정 요약 표시
3. 편집할 섹션 선택:
   - **Agents** — 에이전트 활성화/비활성화
   - **Workflow** — 리뷰 라운드, QA 모드, Visual QA, EPIC 기반
   - **Skills** — 스킬 활성화/비활성화
   - **All** — 전체 편집
4. 변경 diff 표시
5. 저장 방법 선택:
   - Config만 저장
   - Config 저장 + re-scaffold
   - 취소

## 사전 요구사항

`agent-system.config.yaml` 파일이 존재해야 합니다. 없으면 먼저 `/scaffold --save-config`로 생성하세요.
