# create-agent-system

> Claude Code Agent Teams 기반 개발 시스템을 프로젝트에 스캐폴딩하는 CLI 도구

---

## 프로젝트 요약

| 항목 | 값 |
|------|---|
| 이름 | `create-agent-system` |
| 형태 | CLI (npx 실행) + Claude Code 플러그인 (향후) |
| 언어 | TypeScript (Node.js) |
| 패키지 매니저 | pnpm |
| 라이선스 | MIT |
| 모노레포 | 아님 (MVP는 단일 패키지) |

---

## MVP 범위 정의

### In Scope (v0.1.0)

**1. 스캐폴딩 (파일 생성)**
- 인터랙티브 프롬프트로 설정 수집
- 프리셋 기반 빠른 시작 (solo-dev, small-team, full-team)
- 프로젝트 디렉토리에 파일 생성:
  - `CLAUDE.md`
  - `.claude/agents/*.md`
  - `.claude/skills/*/SKILL.md`
  - `.claude/settings.json` (Agent Teams 활성화)
- 기존 프로젝트에 추가 가능 (기존 파일 덮어쓰지 않음, 충돌 시 확인)

**2. 검증 (생성 후 유효성 체크)**
- YAML frontmatter 파싱 유효성
- 필수 필드 존재 확인 (name, description)
- 지원되는 frontmatter 필드만 사용했는지 확인 (name, description, tools, model, permissionMode, skills)
- 스킬 참조 유효성 (에이전트의 skills 필드가 실제 존재하는 스킬 디렉토리를 가리키는지)
- CLAUDE.md의 @import 경로 유효성

**3. 실행 (Claude Code 연동)**
- 생성 완료 후 `claude` 명령어 실행 옵션
- `--permission-mode plan`으로 plan mode 진입
- Agent Teams 환경변수 자동 설정

### Out of Scope (v0.1.0)

- Claude Code 플러그인 패키징
- 커뮤니티 레지스트리 (에이전트/스킬 공유)
- 웹 UI / 대시보드
- 프리셋 커스터마이징 UI (프리셋 선택 후 수동 편집으로 대체)
- CI/CD 통합

---

## 프리셋 설계

### solo-dev (1인 개발자, 기본값)

v2.3의 Small 프로젝트 경로에 해당.

```yaml
name: solo-dev
description: "1인 개발자용. 축약된 워크플로우, 핵심 에이전트만."
scale: small

agents:
  po-pm: { enabled: true, model: opus }
  architect: { enabled: false }  # Orchestrator가 인라인 처리
  cto: { enabled: false }        # Orchestrator가 자체 점검
  designer: { enabled: false }   # 기존 디자인 시스템 재사용 또는 최소 토큰
  test-writer: { enabled: true, model: opus }
  frontend-dev: { enabled: true, model: opus }
  backend-dev: { enabled: true, model: opus }
  qa-reviewer: { enabled: true, model: opus }

workflow:
  review_max_rounds: 0           # Review Loop 생략
  qa_mode: lite                  # E2E 없음, 유닛 + 코드 리뷰
  visual_qa_level: 1             # Spot Check만
  epic_based: false              # 플랫 티켓

skills:
  - scoring
  - tdd-workflow
  - ticket-writing
  - cr-process
  # visual-qa, design-system, adr-writing은 비활성
```

### small-team (2-5명, 중간 경로)

v2.3의 Medium 프로젝트 경로에 해당.

```yaml
name: small-team
description: "소규모 팀용. CTO 리뷰 포함, EPIC 기반 개발."
scale: medium

agents:
  po-pm: { enabled: true, model: opus }
  architect: { enabled: true, model: opus }
  cto: { enabled: true, model: opus }
  designer: { enabled: true, model: opus }
  test-writer: { enabled: true, model: opus }
  frontend-dev: { enabled: true, model: opus }
  backend-dev: { enabled: true, model: opus }
  qa-reviewer: { enabled: true, model: opus }

workflow:
  review_max_rounds: 5
  qa_mode: standard
  visual_qa_level: 2              # Standard
  epic_based: true

skills:
  - scoring
  - visual-qa
  - tdd-workflow
  - adr-writing
  - ticket-writing
  - design-system
  - cr-process
```

### full-team (풀 프로세스)

v2.3의 Large 프로젝트 경로에 해당.

```yaml
name: full-team
description: "대규모 프로젝트. 모든 에이전트, 풀 리뷰 사이클, Strict Visual QA."
scale: large

agents:
  po-pm: { enabled: true, model: opus }
  architect: { enabled: true, model: opus }
  cto: { enabled: true, model: opus }
  designer: { enabled: true, model: opus }
  test-writer: { enabled: true, model: opus }
  frontend-dev: { enabled: true, model: opus }
  backend-dev: { enabled: true, model: opus }
  qa-reviewer: { enabled: true, model: opus }

workflow:
  review_max_rounds: 5
  qa_mode: standard
  visual_qa_level: 3              # Strict
  epic_based: true

skills:
  - scoring
  - visual-qa
  - tdd-workflow
  - adr-writing
  - ticket-writing
  - design-system
  - cr-process
```

---

## 기술 스택

| 영역 | 선택 | 사유 |
|------|------|------|
| 런타임 | Node.js 20+ | TS 생태계, npx 배포 |
| 언어 | TypeScript (strict) | Jeremy 전문 영역 |
| CLI 프레임워크 | **clack** (@clack/prompts) | 모던 인터랙티브 프롬프트, 깔끔한 UX |
| 인자 파싱 | **citty** 또는 **commander** | 경량, 타입 안전 |
| 템플릿 엔진 | **Handlebars** | 마크다운 템플릿에 변수 주입 |
| YAML 파싱 | **yaml** (npm:yaml) | frontmatter 파싱/검증 |
| 파일 시스템 | **fs-extra** | 디렉토리 생성, 복사, 충돌 감지 |
| 테스트 | **Vitest** | 빠르고 TS 네이티브 |
| 빌드 | **tsup** | 번들링, CJS/ESM 듀얼 |
| 린트 | **Biome** | ESLint+Prettier 대체, 빠름 |

---

## 디렉토리 구조

```
create-agent-system/
├── src/
│   ├── index.ts                    # CLI 엔트리포인트
│   ├── cli/
│   │   ├── prompts.ts              # 인터랙티브 프롬프트 (clack)
│   │   ├── args.ts                 # CLI 인자 파싱
│   │   └── runner.ts               # Claude Code 실행 연동
│   ├── core/
│   │   ├── scaffolder.ts           # 파일 생성 엔진
│   │   ├── validator.ts            # 생성 후 검증
│   │   ├── preset-loader.ts        # 프리셋 YAML 로드
│   │   └── template-renderer.ts    # Handlebars 렌더링
│   ├── types/
│   │   ├── config.ts               # 설정 타입 정의
│   │   ├── preset.ts               # 프리셋 타입
│   │   └── agent.ts                # 에이전트 정의 타입
│   └── utils/
│       ├── fs.ts                   # 파일 시스템 유틸
│       ├── detect.ts               # 기존 프로젝트 감지 (package.json, tsconfig 등)
│       └── constants.ts            # 상수
├── templates/
│   ├── agents/
│   │   ├── po-pm.md.hbs
│   │   ├── architect.md.hbs
│   │   ├── cto.md.hbs
│   │   ├── designer.md.hbs
│   │   ├── test-writer.md.hbs
│   │   ├── frontend-dev.md.hbs
│   │   ├── backend-dev.md.hbs
│   │   └── qa-reviewer.md.hbs
│   ├── skills/
│   │   ├── scoring/SKILL.md.hbs
│   │   ├── visual-qa/SKILL.md.hbs
│   │   ├── tdd-workflow/SKILL.md.hbs
│   │   ├── adr-writing/SKILL.md.hbs
│   │   ├── ticket-writing/SKILL.md.hbs
│   │   ├── design-system/SKILL.md.hbs
│   │   └── cr-process/SKILL.md.hbs
│   └── claude-md.hbs               # CLAUDE.md 템플릿
├── presets/
│   ├── solo-dev.yaml
│   ├── small-team.yaml
│   └── full-team.yaml
├── tests/
│   ├── scaffolder.test.ts
│   ├── validator.test.ts
│   ├── preset-loader.test.ts
│   └── template-renderer.test.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── biome.json
├── vitest.config.ts
├── LICENSE
├── README.md
├── CONTRIBUTING.md
└── CLAUDE.md                       # 이 프로젝트 자체의 에이전트 시스템!
```

---

## 핵심 타입 정의

```typescript
// types/config.ts
export interface AgentSystemConfig {
  preset: PresetName;
  projectName: string;
  scale: 'small' | 'medium' | 'large';
  agents: Record<AgentName, AgentConfig>;
  workflow: WorkflowConfig;
  skills: SkillName[];
  techStack?: TechStackInfo;
}

export interface AgentConfig {
  enabled: boolean;
  model: 'opus' | 'sonnet' | 'haiku';
}

export interface WorkflowConfig {
  reviewMaxRounds: number;
  qaMode: 'lite' | 'standard';
  visualQaLevel: 0 | 1 | 2 | 3;
  epicBased: boolean;
}

export type PresetName = 'solo-dev' | 'small-team' | 'full-team' | 'custom';
export type AgentName = 'po-pm' | 'architect' | 'cto' | 'designer' 
                       | 'test-writer' | 'frontend-dev' | 'backend-dev' | 'qa-reviewer';
export type SkillName = 'scoring' | 'visual-qa' | 'tdd-workflow' | 'adr-writing'
                       | 'ticket-writing' | 'design-system' | 'cr-process';

// types/preset.ts
export interface Preset {
  name: PresetName;
  description: string;
  scale: 'small' | 'medium' | 'large';
  agents: Record<AgentName, AgentConfig>;
  workflow: WorkflowConfig;
  skills: SkillName[];
}

// types/agent.ts
export interface AgentFrontmatter {
  name: string;
  description: string;
  tools?: string;
  model?: 'opus' | 'sonnet' | 'haiku' | 'inherit';
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'ignore';
  skills?: string;  // comma-separated
}
```

---

## CLI 사용자 플로우

### 1. 기본 사용 (인터랙티브)

```bash
$ npx create-agent-system

┌  create-agent-system v0.1.0
│
◆  프리셋을 선택하세요:
│  ● Solo Dev (1인 개발, 축약 워크플로우)
│  ○ Small Team (표준 워크플로우, EPIC 기반)
│  ○ Full Team (풀 프로세스, Strict QA)
│  ○ Custom (직접 구성)
└

◆  프로젝트 이름:
│  my-awesome-app
└

◆  기술 스택을 감지했습니다:
│  Next.js 15 + TypeScript + Tailwind CSS + pnpm
│  맞나요? (Y/n)
└

◇  파일 생성 중...
│  ✔ CLAUDE.md
│  ✔ .claude/agents/po-pm.md
│  ✔ .claude/agents/test-writer.md
│  ✔ .claude/agents/frontend-dev.md
│  ✔ .claude/agents/backend-dev.md
│  ✔ .claude/agents/qa-reviewer.md
│  ✔ .claude/skills/scoring/SKILL.md
│  ✔ .claude/skills/tdd-workflow/SKILL.md
│  ✔ .claude/skills/ticket-writing/SKILL.md
│  ✔ .claude/skills/cr-process/SKILL.md
│  ✔ .claude/settings.json
└

◇  검증 중...
│  ✔ YAML frontmatter 유효
│  ✔ 필수 필드 존재
│  ✔ 지원 필드만 사용
│  ✔ 스킬 참조 유효
│  ✔ 11 파일, 5 에이전트, 4 스킬
└

◆  Claude Code로 바로 시작할까요?
│  ● Yes — plan mode로 시작
│  ○ No — 나중에 직접 실행
└

◇  Claude Code 시작 중...
│  $ CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --permission-mode plan
└

✔  완료! 즐거운 개발 되세요.
```

### 2. 논인터랙티브 (CI/스크립트용)

```bash
$ npx create-agent-system \
    --preset solo-dev \
    --project-name my-app \
    --no-run \
    --yes
```

### 3. 기존 프로젝트에 추가

```bash
$ cd existing-project
$ npx create-agent-system

◆  기존 파일 감지:
│  ⚠ CLAUDE.md가 이미 존재합니다
│  ● 병합 (기존 내용 유지, 새 섹션 추가)
│  ○ 덮어쓰기
│  ○ 건너뛰기
└
```

### 4. 검증만 실행

```bash
$ npx create-agent-system validate

◇  검증 중...
│  ✔ .claude/agents/ — 8 에이전트
│  ✔ .claude/skills/ — 7 스킬
│  ✔ CLAUDE.md — 유효
│  ⚠ qa-reviewer.md: skills 필드에 "visual-qa" 참조하지만 .claude/skills/visual-qa/ 없음
└
```

---

## 검증 규칙 상세

```typescript
// core/validator.ts가 체크하는 항목들

interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];    // 실패 조건
  warnings: ValidationIssue[];  // 경고 (실행 가능하지만 권장하지 않음)
}

// Errors (생성 실패)
// - YAML frontmatter 파싱 실패
// - name 필드 누락
// - description 필드 누락
// - 지원하지 않는 frontmatter 필드 사용 (context, model-review-override 등)
// - model 값이 유효하지 않음 (opus|sonnet|haiku|inherit 외)
// - skills 참조가 존재하지 않는 디렉토리를 가리킴
// - CLAUDE.md @import 경로가 존재하지 않는 파일을 가리킴

// Warnings (실행 가능, 개선 권장)
// - description이 너무 짧음 (< 20자)
// - description이 너무 김 (> 1024자)
// - tools 필드 없음 (전체 도구 상속됨 — 의도적인지 확인)
// - 에이전트 정의에 File Ownership 등 CLAUDE.md에 있어야 할 내용이 중복됨
// - 프리셋의 비활성 에이전트 파일이 존재함 (혼란 가능)
```

---

## 템플릿 예시

### templates/agents/frontend-dev.md.hbs

```handlebars
---
name: frontend-dev
description: "프론트엔드 개발자. React/Next.js 컴포넌트 구현, 테스트를 패스시키는 것이 목표. 프론트엔드 구현 작업 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: {{model}}
{{#if skills}}skills: {{skills}}{{/if}}
---

You are a senior frontend developer specializing in React and Next.js.

## References
- 파일 소유권, 컨텍스트 규칙, 공유 파일 프로토콜: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조
{{#if visualQa}}- 시각적 검증: visual-qa 스킬 참조{{/if}}

## Core Responsibilities
1. test-writer가 작성한 테스트를 통과시키는 코드 구현
2. 디자인 시스템 컴포넌트 활용
{{#if visualQa}}3. **Visual QA — 해당 EPIC에 지정된 Level에 따라 수행**{{/if}}
{{#unless visualQa}}3. 코드 품질 및 타입 안전성 보장{{/unless}}
4. 타입 안전성 보장

## Implementation Protocol
1. 해당 티켓의 테스트 파일 확인
2. 디자인 시스템 토큰 및 컴포넌트 참조
3. 구현
4. `{{packageManager}} test` 로 테스트 통과 확인
{{#if visualQa}}5. Visual QA Level에 따라 스크린샷 캡처 및 시각적 검증{{/if}}
```

### templates/claude-md.hbs

```handlebars
# Project Memory

## 프로젝트 개요
- {{projectName}}: {{projectDescription}}
{{#if specPath}}- 스펙: @{{specPath}}{{/if}}
{{#if adrPath}}- ADR: @{{adrPath}}{{/if}}

## 공통 규칙
- 모든 작업은 plan mode에서 시작한다
- CR 없이 확정 스펙을 수정하지 않는다
- 모든 피드백은 100점 만점 1점 단위로 채점하고, 감점 사유를 구체적으로 명시한다
{{#if visualQa}}- 시각적 QA는 해당 EPIC에 지정된 Level에 따라 수행한다 (기본: Level {{visualQaLevel}}){{/if}}

## 빌드 & 테스트 명령어
- `{{packageManager}} dev` — 개발 서버
- `{{packageManager}} test` — 유닛 테스트
- `{{packageManager}} test:e2e` — E2E 테스트
- `{{packageManager}} lint` — 린트

## 코드 스타일
- TypeScript strict mode
- 함수형 컴포넌트 + hooks
- named export 우선
- 2칸 들여쓰기

## 에이전트별 컨텍스트 규칙

각 에이전트는 이 테이블을 따른다.

| 에이전트 | 세션 시작 시 Read | 필요 시 참조 | 읽지 않음 |
|----------|-----------------|-------------|----------|
{{#each activeAgents}}
| {{this.displayName}} | {{this.alwaysRead}} | {{this.onDemand}} | {{this.exclude}} |
{{/each}}

## 파일 소유권

### 전용 소유

| 디렉토리/파일 | 소유 에이전트 |
|--------------|-------------|
{{#each fileOwnership}}
| `{{this.path}}` | {{this.owner}} |
{{/each}}

### 공유 파일 규칙

| 파일 | 쓰기 권한 | 읽기 권한 | 변경 프로토콜 |
|------|----------|----------|-------------|
| `src/types/shared.ts` | backend-dev | frontend-dev (읽기 전용) | BE가 수정 후 FE에게 메일박스로 변경 알림 |
| `src/utils/common.ts` | Orchestrator만 | 전체 | 에이전트가 Orchestrator에게 수정 요청 → 승인 후 수정 |

## 실패 모드 & 복구

### 감지 기준
- 채점 60점 미만: 즉시 실패 선언
- 채점 60-69점: 1회 수정 기회 후 재채점, 70점 미달 시 실패

### 에스컬레이션 규칙
- 같은 태스크에서 2회 연속 실패: Orchestrator가 Human에게 에스컬레이션

{{#if epicBased}}
## EPIC 간 의존성 관리
Orchestrator가 EPIC 실행 순서와 의존성을 관리한다.
1. 의존성 없는 EPIC을 먼저 실행
2. 의존하는 EPIC은 선행 EPIC이 완료(QA 90점+)된 후에만 시작
3. 의존성 없는 EPIC끼리는 병렬 실행 가능
{{/if}}

## 모델 설정
현재 전체 에이전트 Opus 사용.
```

---

## 로드맵

### v0.1.0 — MVP (현재)
- [x] CLI 코어 (인터랙티브 + 논인터랙티브)
- [x] 3개 프리셋 (solo-dev, small-team, full-team)
- [x] 스캐폴딩 엔진
- [x] 검증 엔진
- [x] Claude Code 실행 연동
- [x] 기존 프로젝트 충돌 처리

### v0.2.0 — 커스터마이징
- [ ] Custom 프리셋 (인터랙티브 에이전트/워크플로우 선택)
- [ ] `agent-system.config.yaml` 설정 파일 지원
- [ ] 프리셋 간 diff 표시

### v0.3.0 — 커뮤니티 레지스트리
- [ ] 커뮤니티 에이전트/스킬 레지스트리 (GitHub-based)
- [ ] `npx create-agent-system add <agent-name>` 명령어
- [ ] 레지스트리 검색/설치

### v0.4.0 — Claude Code 플러그인
- [ ] 플러그인 래퍼 패키지
- [ ] `/scaffold` 슬래시 커맨드
- [ ] marketplace 배포

### v1.0.0 — 안정화
- [ ] 프리셋 에디터 (TUI)
- [ ] 마이그레이션 도구 (버전 간 설정 업그레이드)
- [ ] 다국어 지원 (한/영)
