---
name: scaffold
description: "프로젝트에 Claude Code Agent Teams 스캐폴딩 생성. 에이전트 시스템 초기 설정, 새 프로젝트 세팅 시 사용."
user-invocable: true
allowed-tools: Bash(npx:*), Bash(cd:*), Read, Glob
---

# /scaffold

프로젝트에 Claude Code Agent Teams 기반 개발 시스템을 스캐폴딩합니다.

## 사용법

### 인터랙티브 모드 (기본)

```bash
npx create-agent-system
```

프리셋 선택, 프로젝트 이름, 기술 스택 확인 등을 대화형으로 진행합니다.

### 논인터랙티브 모드

```bash
npx create-agent-system --preset <preset> --yes [options]
```

옵션:
- `--preset, -p` — 프리셋 이름 (solo-dev, small-team, full-team)
- `--project-name, -n` — 프로젝트 이름
- `--target, -t` — 대상 디렉토리 (기본: 현재 디렉토리)
- `--no-run` — Claude Code 자동 실행 건너뛰기
- `--yes, -y` — 대화형 프롬프트 건너뛰기
- `--dry-run` — 파일 생성 없이 미리보기만
- `--save-config` — agent-system.config.yaml로 설정 저장

## 프리셋

| 프리셋 | 대상 | 에이전트 | 워크플로우 |
|--------|------|---------|-----------|
| solo-dev | 1인 개발 | 5개 (핵심만) | 축약, 리뷰 없음 |
| small-team | 2-5명 | 8개 (전체) | EPIC 기반, 표준 리뷰 |
| full-team | 대규모 | 8개 (전체) | 풀 프로세스, Strict QA |

## 기존 프로젝트 충돌 처리

기존 CLAUDE.md나 .claude/ 디렉토리가 있으면 충돌 처리 옵션을 제공합니다:
- **병합** — 기존 내용 유지, 새 섹션 추가
- **덮어쓰기** — 새 내용으로 교체
- **건너뛰기** — 해당 파일 생성 건너뛰기

## 생성 파일

- `CLAUDE.md` — 프로젝트 메모리 및 에이전트 규칙
- `.claude/agents/*.md` — 에이전트 정의
- `.claude/skills/*/SKILL.md` — 스킬 정의
- `.claude/settings.json` — Agent Teams 설정
