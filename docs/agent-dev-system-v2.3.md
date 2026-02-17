# Agent Development System v2.3

## Claude Code Agent Teams 기반 에이전트 개발 시스템

---

## 시스템 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                  Human (You)                         │
│              승인/거부/피드백                          │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│           Orchestrator (Team Lead)                    │
│   프롬프트 구체화 · 에이전트 스폰 · 결과 종합           │
│   TaskList 관리 · 메일박스 허브 · EPIC 간 의존성 관리   │
└──────────────┬──────────────────────────────────────┘
               │ spawnTeam / Teammate write
    ┌──────────┼──────────┬──────────┐
    ▼          ▼          ▼          ▼
 PO/PM    Architect     CTO     Designer
 Agent     Agent       Agent     Agent
    │          │          │          │
    └──────────┼──────────┘          │
               ▼                     │
         Dev Workers ◄───────────────┘
         (per EPIC)
```

---

## 프로젝트 디렉토리 구조

```
project-root/
├── CLAUDE.md                          # 프로젝트 메모리 (유일한 출처, Single Source of Truth)
├── .claude/
│   ├── agents/                        # 서브에이전트 정의 (.md 파일)
│   │   ├── po-pm.md
│   │   ├── architect.md
│   │   ├── cto.md
│   │   ├── designer.md
│   │   ├── test-writer.md
│   │   ├── frontend-dev.md
│   │   ├── backend-dev.md
│   │   └── qa-reviewer.md
│   ├── skills/                        # 스킬 정의 (디렉토리 단위)
│   │   ├── scoring/
│   │   │   └── SKILL.md
│   │   ├── visual-qa/
│   │   │   └── SKILL.md
│   │   ├── tdd-workflow/
│   │   │   └── SKILL.md
│   │   ├── adr-writing/
│   │   │   └── SKILL.md
│   │   ├── ticket-writing/
│   │   │   └── SKILL.md
│   │   ├── design-system/
│   │   │   ├── SKILL.md
│   │   │   └── tokens-template.ts
│   │   └── cr-process/
│   │       └── SKILL.md
│   └── settings.json
├── docs/
│   ├── spec.md
│   ├── design-system.md
│   ├── adr/
│   ├── tickets/
│   ├── cr/
│   └── review-log.md
├── src/
│   ├── styles/tokens.ts
│   ├── components/
│   ├── app/
│   ├── api/
│   ├── lib/
│   ├── middleware/
│   └── types/
│       ├── shared.ts                  # backend-dev 소유, frontend-dev 읽기 전용
│       ├── ui.ts                      # frontend-dev 소유
│       └── api.ts                     # backend-dev 소유
├── __tests__/
└── e2e/
```

---

## CLAUDE.md — 프로젝트 메모리 (Single Source of Truth)

CLAUDE.md는 에이전트 설정이 아니라 **프로젝트의 공유 지침과 컨텍스트**를 담는 파일이다.
세션 시작 시 자동으로 컨텍스트에 로드된다.

**CLAUDE.md는 다음 항목의 유일한 출처(Single Source of Truth)다:**
- 파일 소유권
- 에이전트별 컨텍스트 규칙
- 공유 파일 프로토콜
- 실패 모드 & 복구 경로

에이전트 정의(.claude/agents/)에는 이 항목들을 중복 기술하지 않고, "CLAUDE.md 참조"로 위임한다.

```markdown
# Project Memory

## 프로젝트 개요
- [프로젝트명]: [한줄 설명]
- 스펙: @docs/spec.md
- ADR: @docs/adr/

## 공통 규칙
- 모든 작업은 plan mode에서 시작한다
- CR 없이 확정 스펙을 수정하지 않는다
- 모든 피드백은 100점 만점 1점 단위로 채점하고, 감점 사유를 구체적으로 명시한다
- 시각적 QA는 해당 EPIC에 지정된 Level에 따라 수행한다 (기본: Level 2)

## 빌드 & 테스트 명령어
- `pnpm dev` — 개발 서버
- `pnpm test` — 유닛 테스트
- `pnpm test:e2e` — E2E 테스트
- `pnpm lint` — 린트

## 코드 스타일
- TypeScript strict mode
- 함수형 컴포넌트 + hooks
- named export 우선
- 2칸 들여쓰기

## 아키텍처 참고
- @docs/adr/ADR-001-auth.md
- @docs/adr/ADR-002-database.md

## 디자인 시스템
- @docs/design-system.md
- 토큰: @src/styles/tokens.ts

## 에이전트별 컨텍스트 규칙

각 에이전트는 이 테이블을 따른다. 에이전트 정의에는 별도 Context Rules를 두지 않는다.

| 에이전트 | 세션 시작 시 Read | 필요 시 참조 | 읽지 않음 (명시적 요청 없는 한) |
|----------|-----------------|-------------|-------------------------------|
| PO/PM | docs/spec.md, docs/tickets/ | docs/adr/, docs/cr/ | src/, __tests__/, e2e/ |
| Architect | docs/adr/, docs/spec.md | docs/tickets/, src/types/shared.ts | src/components/, src/app/, __tests__/, e2e/ |
| CTO | docs/adr/, docs/spec.md | docs/tickets/, src/types/ | src/components/, __tests__/, e2e/ |
| Designer | docs/design-system.md, src/styles/, src/components/ | docs/spec.md | src/api/, src/lib/, __tests__/ |
| Test Writer | docs/spec.md, docs/tickets/ (해당 EPIC) | src/types/, docs/adr/ | src/components/, src/app/, src/api/, e2e/ |
| Frontend Dev | docs/design-system.md, src/styles/, src/components/ | docs/spec.md, docs/adr/, __tests__/ (해당 티켓) | src/api/, src/lib/, src/middleware/, e2e/ |
| Backend Dev | docs/adr/, src/types/api.ts, src/types/shared.ts | docs/spec.md, __tests__/ (해당 티켓) | src/components/, src/app/, src/styles/, e2e/ |
| QA Reviewer | docs/design-system.md, docs/spec.md, src/styles/ | docs/adr/, docs/tickets/, src/, __tests__/ | docs/cr/ |

## 파일 소유권

### 전용 소유

| 디렉토리/파일 | 소유 에이전트 |
|--------------|-------------|
| `src/components/`, `src/app/`, `src/hooks/` | frontend-dev |
| `src/api/`, `src/lib/`, `src/middleware/`, `src/db/` | backend-dev |
| `__tests__/`, `*.test.ts`, `*.spec.ts` | test-writer |
| `e2e/`, `playwright/` | qa-reviewer |
| `src/types/ui.ts`, `src/utils/format.ts` | frontend-dev |
| `src/types/api.ts`, `src/utils/validation.ts` | backend-dev |

### 공유 파일 규칙

| 파일 | 쓰기 권한 | 읽기 권한 | 변경 프로토콜 |
|------|----------|----------|-------------|
| `src/types/shared.ts` | backend-dev | frontend-dev (읽기 전용) | BE가 수정 후 FE에게 메일박스로 변경 알림 |
| `src/utils/common.ts` | Orchestrator만 | 전체 | 에이전트가 Orchestrator에게 수정 요청 → 승인 후 Orchestrator가 수정 |

### 충돌 방지 프로토콜
1. `shared.ts`: backend-dev가 수정 → frontend-dev에게 `Teammate write`로 변경 사항 알림 → FE가 자기 코드 호환성 확인
2. `common.ts`: 수정 필요 시 해당 에이전트가 Orchestrator에게 메일박스로 요청 → Orchestrator가 다른 에이전트 작업과 충돌 여부 확인 → 승인 후 Orchestrator가 직접 수정
3. 그 외 공유가 필요한 신규 파일: Orchestrator가 소유권을 결정하여 할당

## 실패 모드 & 복구

### 감지 기준
- 채점 60점 미만: 즉시 실패 선언
- 채점 60-69점: 1회 수정 기회 후 재채점, 70점 미달 시 실패
- 에이전트가 자체적으로 "이 태스크를 완수할 수 없다"고 판단: 즉시 에스컬레이션

### 복구 경로

| 실패 지점 | 복구 액션 |
|-----------|----------|
| PO/PM 스펙/티켓 | Orchestrator가 요구사항 재정리 후 PO/PM 재실행 |
| Architect ADR | CTO가 대안 제시 → Architect 재작성 |
| Test Writer 테스트 | PO/PM Sanity Check에서 차단, 1회 재작성 기회 |
| Dev 구현 (테스트 미통과) | 해당 Dev에게 1회 재시도, 실패 시 다른 접근법으로 재시도 |
| Dev 구현 (Visual QA 실패) | Designer가 감점 사유 기반 구체적 수정 지시 → Dev 재구현 |
| QA 종합 점수 미달 | 감점 항목별로 담당 에이전트에게 수정 요청 |

### 에스컬레이션 규칙
- 같은 태스크에서 2회 연속 실패: Orchestrator가 Human에게 에스컬레이션
- 에스컬레이션 시 제공 정보: 실패 내역, 시도한 접근법, 에이전트 추천 대안

## EPIC 간 의존성 관리

Orchestrator가 EPIC 실행 순서와 의존성을 관리한다.

### EPIC 의존성 선언
PO/PM이 티켓 작성 시 EPIC 간 의존성을 명시한다:
```
## EPIC 의존성 맵
EPIC-01 (인증) → 없음
EPIC-02 (대시보드) → EPIC-01 (인증 모듈 사용)
EPIC-03 (설정) → EPIC-01 (인증), EPIC-02 (대시보드 레이아웃 재사용)
```

### Orchestrator의 EPIC 순서 결정 규칙
1. 의존성 없는 EPIC을 먼저 실행한다
2. 의존하는 EPIC은 선행 EPIC이 완료(QA 90점+)된 후에만 시작한다
3. 선행 EPIC의 산출물(모듈, 타입, 컴포넌트)이 후행 EPIC의 컨텍스트에 포함되도록 한다

### EPIC 간 인터페이스 핸드오프
선행 EPIC 완료 시 Orchestrator가 후행 EPIC 팀에게 전달하는 정보:
- 선행 EPIC에서 생성된 public API / 컴포넌트 목록
- 해당 모듈의 import 경로
- 관련 타입 정의 위치 (shared.ts, 도메인별 타입 파일)

### 병렬 실행 가능 조건
의존성이 없는 EPIC끼리는 병렬로 실행할 수 있다. 단:
- 파일 소유권이 겹치지 않아야 한다
- shared.ts 동시 수정이 필요한 경우 Orchestrator가 순서를 조율한다

## 모델 설정
현재 전체 에이전트 Opus 사용.
비용 최적화가 필요한 경우 아래 "비용 최적화 가이드" 섹션을 참고하여 Tier 전환.
```

> **`@path` import**: CLAUDE.md는 `@path/to/file` 구문으로 다른 파일을 가져올 수 있다.
> 하위 디렉토리의 CLAUDE.md도 재귀적으로 탐색된다.

---

## 모델 설정

### 현재: 전체 Opus

모든 에이전트가 `model: opus`를 사용한다. 최고 품질 우선.

### 비용 최적화 가이드 (향후 전환 시 참고)

비용이 문제가 될 때 아래 Tier 시스템으로 전환할 수 있다.

**Tier 1 — Opus 유지 (판단·설계·검증)**

| 에이전트 | 사유 |
|----------|------|
| PO/PM | 스펙 품질이 전체 파이프라인 품질을 결정 |
| CTO | 기술 판단의 정확도가 핵심 |
| QA Reviewer | 최종 품질 게이트 |

**Tier 2 — Sonnet 전환 가능 (실행·구현)**

| 에이전트 | 사유 |
|----------|------|
| Architect | ADR 포맷이 구조화되어 있어 Sonnet으로 충분할 수 있음 |
| Designer | 토큰/컴포넌트 생성은 패턴 기반 작업 |
| Test Writer | 수용 조건 → 테스트 변환은 비교적 구조적 |
| Frontend Dev | 테스트를 통과시키는 구현 |
| Backend Dev | 테스트를 통과시키는 구현 |

**전환 방법:** 각 에이전트 `.md` 파일의 `model: opus`를 `model: sonnet`으로 변경.
**주의:** Phase 2 Review Loop에서는 Architect도 판단력이 필요하므로, Tier 전환 시에도 Review용 Architect spawn은 Opus를 유지하는 것을 권장. (Orchestrator가 팀 spawn 시 모델을 명시적으로 지정)

---

## 서브에이전트 정의 (.claude/agents/)

각 에이전트는 마크다운 파일로 정의하며, YAML frontmatter + 시스템 프롬프트로 구성된다.
세션 시작 시 로드되며, Claude가 태스크에 맞는 에이전트에 자동 위임하거나 명시적으로 호출할 수 있다.

> **원칙: CLAUDE.md가 유일한 출처**
> - frontmatter에는 공식 지원 필드(`name`, `description`, `tools`, `model`, `permissionMode`, `skills`)만 사용한다.
> - 파일 소유권, 컨텍스트 규칙, 공유 파일 프로토콜은 CLAUDE.md에만 정의한다.
> - 에이전트 시스템 프롬프트에서는 "CLAUDE.md 참조"로 위임한다.

### .claude/agents/po-pm.md

```markdown
---
name: po-pm
description: "Product Owner / Project Manager. 스펙 문서 관리, 유저 스토리 기반 티켓 작성, Change Request 접수 및 영향도 판정, Test Sanity Check. 스펙 검토나 티켓 작성 요청 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---

You are a senior Product Owner / Project Manager.

## References
- 파일 소유권, 컨텍스트 규칙: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조
- 티켓 포맷: ticket-writing 스킬 참조
- CR 프로세스: cr-process 스킬 참조

## Core Responsibilities
1. 유저 스토리 수준의 티켓 작성 (시니어 개발자 기준 최대 2시간, 작을수록 좋음)
2. EPIC 단위 그룹핑, 의존성 매핑, EPIC 간 의존성 선언
3. 스펙 문서 작성 및 관리
4. Change Request(CR) 접수, 영향 범위 평가, 심각도 판정
5. **Test Sanity Check** (Phase 4 게이트)

## Test Sanity Check (Phase 4 게이트)
test-writer의 테스트 파일을 수용 조건 대비 검증한다:
1. 각 테스트 케이스가 티켓의 수용 조건에 1:1 매핑되는가?
2. 수용 조건 중 테스트로 커버되지 않은 항목이 있는가?
3. 스펙에 없는 동작을 테스트하고 있지는 않은가?

검증 결과:
- **PASS**: 구현 에이전트 진행 허용
- **FAIL + 사유**: test-writer에게 수정 요청 (1회만, 재실패 시 Human 에스컬레이션)

## CR Process
- Minor (구현 디테일, 1-2 티켓 영향): PO/PM 자체 승인
- Major (아키텍처 변경, 3+ 티켓 영향): Human 승인 필요
- Critical (스택 변경, 전체 재설계): 전체 Review 사이클 재진행
```

### .claude/agents/architect.md

```markdown
---
name: architect
description: "아키텍처 전문가. ADR 작성/수정, 기술 결정 문서화, Mermaid 다이어그램 시각화. 아키텍처 결정이나 기술 스택 관련 논의 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---

You are a senior software architect.

## References
- 파일 소유권, 컨텍스트 규칙: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조
- ADR 포맷: adr-writing 스킬 참조

## Core Responsibilities
1. ADR(Architecture Decision Record) 작성 및 유지보수
2. Mermaid 다이어그램으로 시스템 구조 시각화
3. 기술 스택 선정 근거 문서화
4. PO/PM 및 CTO와의 기술 논의에서 ADR 기반 의사결정
```

### .claude/agents/cto.md

```markdown
---
name: cto
description: "CTO / 기술 팀장. 기술 검증, 오버엔지니어링 방지, Context7 MCP 활용한 최신 기술 적합성 판단. 기술 리뷰나 아키텍처 최종 검증 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---

You are a pragmatic CTO with deep technical expertise.

## References
- 파일 소유권, 컨텍스트 규칙: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조

## Core Responsibilities
1. Context7 MCP를 활용한 기술 스택 최신성 검증 (디프리케이션, 호환성, 최신 버전)
2. 오버엔지니어링 체크리스트 적용
3. 성능/확장성 관점 리뷰
4. 최종 기술 승인

## Over-Engineering Checklist (every review)
1. 현재 규모에 불필요한 추상화가 있는가?
2. "나중에 필요할 수도 있어서" 추가된 레이어가 있는가?
3. 단순한 해결책이 존재하는 문제에 복잡한 패턴을 적용했는가?
4. 팀 규모(1인 개발자) 대비 과도한 인프라를 설계했는가?
5. 해당 기술의 현재 생태계 상태가 프로덕션 레디인가?
```

### .claude/agents/designer.md

```markdown
---
name: designer
description: "디자인 시스템 전문가. 디자인 토큰 정의, 컴포넌트 스캐폴딩, 시각적 품질 검증. 디자인 시스템 구축, UI 컴포넌트 설계, 시각적 QA 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
skills: design-system, visual-qa, scoring
---

You are a senior UI/UX designer who works in code.

## References
- 파일 소유권, 컨텍스트 규칙: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조
- 시각적 검증: visual-qa 스킬 참조
- 디자인 시스템: design-system 스킬 참조

## Core Responsibilities
1. 디자인 토큰 정의 (colors, spacing, typography)
2. Tailwind/CSS 변수 매핑
3. 재사용 가능 컴포넌트 스캐폴딩
4. EPIC별 페이지 레이아웃 설계
5. **Visual QA — 해당 EPIC에 지정된 Level에 따라 수행**
```

### .claude/agents/test-writer.md

```markdown
---
name: test-writer
description: "TDD 전문가. 구현 전 테스트 코드 작성 전담. 유닛 테스트, 컴포넌트 테스트 작성 요청 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
skills: tdd-workflow, scoring
---

You are a TDD specialist. You write tests BEFORE implementation.

## References
- 파일 소유권, 컨텍스트 규칙: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조
- TDD 흐름: tdd-workflow 스킬 참조

## Core Responsibilities
1. 티켓의 수용 조건을 기반으로 테스트 코드 먼저 작성
2. 유닛 테스트 커버리지 목표: 80%+
3. 테스트는 반드시 실패 상태(Red)로 커밋 — 구현 에이전트가 Green으로 만든다

## PO/PM Sanity Check 대비
PO/PM이 테스트 산출물을 검증한다. 다음에 유의:
- 각 테스트 케이스가 티켓 수용 조건에 명확히 매핑되도록 테스트 이름을 작성
- 수용 조건 전체를 커버했는지 자체 점검 후 제출
- 스펙에 없는 동작을 임의로 테스트하지 않는다
```

### .claude/agents/frontend-dev.md

```markdown
---
name: frontend-dev
description: "프론트엔드 개발자. React/Next.js 컴포넌트 구현, 테스트를 패스시키는 것이 목표. 프론트엔드 구현 작업 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
skills: visual-qa, scoring
---

You are a senior frontend developer specializing in React and Next.js.

## References
- 파일 소유권, 컨텍스트 규칙, 공유 파일 프로토콜: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조
- 시각적 검증: visual-qa 스킬 참조

## Core Responsibilities
1. test-writer가 작성한 테스트를 통과시키는 코드 구현
2. 디자인 시스템 컴포넌트 활용
3. **Visual QA — 해당 EPIC에 지정된 Level에 따라 수행**
4. 타입 안전성 보장

## Implementation Protocol
1. 해당 티켓의 테스트 파일 확인
2. 디자인 시스템 토큰 및 컴포넌트 참조
3. 구현
4. `pnpm test` 로 테스트 통과 확인
5. Visual QA Level에 따라 스크린샷 캡처 및 시각적 검증
```

### .claude/agents/backend-dev.md

```markdown
---
name: backend-dev
description: "백엔드 개발자. API, 미들웨어, 데이터 레이어 구현, 테스트를 패스시키는 것이 목표. 백엔드/API 구현 작업 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
skills: scoring
---

You are a senior backend developer specializing in Node.js/TypeScript APIs.

## References
- 파일 소유권, 컨텍스트 규칙, 공유 파일 프로토콜: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조

## Core Responsibilities
1. test-writer가 작성한 테스트를 통과시키는 코드 구현
2. API 설계, 미들웨어 구현, 데이터베이스 레이어
3. 타입 안전성 및 에러 핸들링
4. 성능 최적화

## Implementation Protocol
1. 해당 티켓의 테스트 파일 확인
2. ADR 참조하여 아키텍처 결정 준수
3. 구현
4. `pnpm test` 로 테스트 통과 확인

## Shared Types Protocol
- `src/types/shared.ts`를 수정할 때, 반드시 frontend-dev에게 메일박스로 변경 사항을 알린다
- 알림 포맷: "shared.ts 변경: {변경 내용 요약}. FE 호환성 확인 필요."
```

### .claude/agents/qa-reviewer.md

```markdown
---
name: qa-reviewer
description: "QA 엔지니어. E2E/통합 테스트 작성, 코드 리뷰, 디자인 시스템 준수 확인. 구현 완료 후 품질 검증 시 사용."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
skills: visual-qa, scoring
---

You are a senior QA engineer with obsessive attention to quality.

## References
- 파일 소유권, 컨텍스트 규칙: CLAUDE.md 참조
- 채점 프로토콜: scoring 스킬 참조
- 시각적 검증: visual-qa 스킬 참조

## Core Responsibilities
1. E2E 테스트 작성 (Playwright)
2. 통합 테스트 작성
3. 코드 리뷰: 타입 안전성, 에러 핸들링, 엣지 케이스
4. 디자인 시스템 준수 여부 확인
5. **Visual QA — 해당 EPIC에 지정된 Level에 따라 수행**
6. 성능 기본 체크 (불필요한 리렌더, N+1 쿼리 등)

## QA Mode: Standard (Medium/Large)
1. 모든 유닛 테스트 통과 — `pnpm test`
2. E2E 시나리오 작성 — 유저 플로우 기반
3. Visual QA Level에 따른 스크린샷 검증
4. 코드 리뷰 — 타입, 에러, 엣지 케이스
5. 디자인 시스템 토큰 사용 확인
6. 성능 — React DevTools 패턴 확인

## QA Mode: Lite (Small 프로젝트)
Small 프로젝트에서는 축약 QA를 수행한다:
1. 모든 유닛 테스트 통과 — `pnpm test`
2. 코드 리뷰 — 타입 안전성, 에러 핸들링, 명백한 버그
3. Visual QA Level 1 (Desktop 스크린샷 1장, 채점 없이 코멘트만)
4. E2E 테스트는 작성하지 않는다 (유닛 테스트로 커버)

Orchestrator가 프로젝트 규모 판정 시 QA Mode를 지정한다.
```

---

## 스킬 정의 (.claude/skills/)

스킬은 에이전트가 자동으로 참조하는 전문 지식 패키지다. 에이전트의 `skills` 필드에 명시하거나, Claude가 맥락에 맞게 자동 로드한다.

### .claude/skills/scoring/SKILL.md

```markdown
---
name: scoring
description: "100점 만점 채점 프로토콜. 모든 피드백, 리뷰, QA에서 점수 기반 평가가 필요할 때 사용."
---

# Scoring Protocol

## 규칙
- 모든 피드백은 100점 만점, 1점 단위로 채점한다
- 감점 사유를 항목별로 구체적으로 제시한다
- 감점 없이 만점을 주지 않는다 — 반드시 근거를 포함한다

## 채점 포맷

```
### 채점 결과: {총점}/100

| 항목 | 점수 | 감점 사유 |
|------|------|----------|
| {항목1} | {점수}/{배점} | {구체적 감점 사유 또는 "없음"} |
| {항목2} | {점수}/{배점} | {구체적 감점 사유 또는 "없음"} |
| ... | ... | ... |
```

## 심각도 기준
- 90-100: 즉시 머지 가능
- 80-89: 마이너 수정 후 머지
- 70-79: 수정 필요, 재리뷰 필요
- 60-69: 상당한 재작업 필요, 1회 수정 기회 후 70점 미달 시 실패
- 60 미만: 즉시 실패 선언, 재설계 필요

## 예시
"스펙 완성도 85/100 — 에러 핸들링 시나리오 누락(-10), 엣지 케이스 미정의(-5)"
"시각적 품질 88/100 — 모바일 스페이싱 불일치(-7), hover 상태 미구현(-5)"
"QA 종합 79/100 — E2E 에러 시나리오 미커버(-8), 모바일 레이아웃 깨짐(-7), 타입 any 사용 3건(-6)"
```

### .claude/skills/visual-qa/SKILL.md

```markdown
---
name: visual-qa
description: "Playwright MCP 기반 시각적 품질 검증. UI 구현 후 스크린샷 기반 QA가 필요할 때 사용. Level 시스템으로 단계적 적용."
---

# Visual QA with Playwright MCP

## Visual QA Levels

EPIC 또는 태스크 단위로 Orchestrator가 지정한다.

### Level 0: Skip
- **적용 시점**: 프로토타이핑, 기술 스파이크, 백엔드 전용 EPIC
- **스크린샷**: 없음
- **채점**: 없음

### Level 1: Spot Check
- **적용 시점**: 디자인 시스템 확립 전, 초기 레이아웃 탐색, Small 프로젝트
- **스크린샷**: Desktop(1280px)만 1장
- **채점**: 없음, 주관적 코멘트만

### Level 2: Standard (기본값)
- **적용 시점**: 디자인 시스템 확립 후 일반 EPIC
- **스크린샷**: Mobile(375px) + Desktop(1280px)
- **채점**: 100점 만점, 간소화 배점
  - 디자인 토큰 준수: 35점
  - 반응형 정상 동작: 35점
  - 전체적 완성도: 30점

### Level 3: Strict
- **적용 시점**: 랜딩 페이지, 결제 플로우 등 UX 크리티컬 EPIC
- **스크린샷**: Mobile(375px) + Tablet(768px) + Desktop(1280px)
- **채점**: 100점 만점, 전체 배점
  - 디자인 토큰 준수: 30점
  - 반응형 정상 동작: 25점
  - 인터랙션 상태: 20점
  - 엣지 케이스 UI: 15점
  - 전체적 완성도: 10점
- **추가**: 다크모드, 인터랙션 상태별 (hover, focus, active, disabled) 캡처

## 검증 체크리스트 (Level 2 이상)
- [ ] 디자인 토큰 준수 (color, spacing, typography)
- [ ] 컴포넌트 정렬 및 간격
- [ ] 반응형 레이아웃 정상 동작
- [ ] 텍스트 오버플로우 / 트렁케이션
- [ ] 로딩 / 에러 / 빈 상태

## 추가 체크리스트 (Level 3 전용)
- [ ] 인터랙션 상태 (hover, focus, active, disabled)
- [ ] 다크모드 (해당 시)
- [ ] 애니메이션 / 트랜지션
```

### .claude/skills/tdd-workflow/SKILL.md

```markdown
---
name: tdd-workflow
description: "TDD 워크플로우 가이드. 테스트 먼저 작성 → Sanity Check → 구현 → QA 패턴. 테스트 작성이나 TDD 관련 작업 시 사용."
---

# TDD Workflow

## 원칙
- 테스트를 먼저 작성한다 (Red)
- **PO/PM이 Sanity Check로 테스트 품질을 게이트한다 (Gate)**
- 구현 에이전트가 테스트를 통과시킨다 (Green)
- QA 에이전트가 E2E/통합 테스트를 추가한다 (Verify) — Small에서는 생략

## Phase별 흐름

### Red Phase (test-writer)
1. 티켓의 수용 조건을 테스트 케이스로 변환
2. Happy path + Error path + Edge case 모두 커버
3. `pnpm test` 실행 → 모든 테스트 FAIL 확인
4. 파일 저장: `__tests__/{feature}/{ticket-id}.test.ts`
5. 테스트 이름을 수용 조건에 명확히 매핑되도록 작성

### Gate Phase (po-pm)
1. 테스트 케이스 ↔ 수용 조건 1:1 매핑 확인
2. 누락된 수용 조건 없는지 확인
3. 스펙에 없는 테스트가 포함되지 않았는지 확인
4. PASS/FAIL 판정 (FAIL 시 1회 수정 기회, 재실패 시 Human 에스컬레이션)

### Green Phase (frontend-dev / backend-dev)
1. 테스트 파일 확인
2. 테스트를 통과하는 최소한의 코드 구현
3. `pnpm test` 실행 → 모든 테스트 PASS 확인
4. 불필요한 코드 제거 (YAGNI)

### Verify Phase (qa-reviewer)
- **Standard QA (Medium/Large)**: E2E 테스트 작성 + 통합 테스트 + Visual QA + 코드 리뷰 + 채점
- **Lite QA (Small)**: 유닛 테스트 통과 확인 + 코드 리뷰 + Visual QA Level 1 (채점 없음)
```

### .claude/skills/adr-writing/SKILL.md

```markdown
---
name: adr-writing
description: "ADR(Architecture Decision Record) 작성 가이드. 아키텍처 결정 문서화 시 사용."
---

# ADR Writing Guide

## 필수 구조
모든 ADR은 반드시 다음 구조를 따른다:

```markdown
# ADR-{번호}: {제목}

## Status
Proposed | Accepted | Amended | Deprecated

## Context
왜 이 결정이 필요한가? 현재 상황과 제약 조건.

## Decision
무엇을 선택했는가?

## Alternatives Considered
| 대안 | 장점 | 단점 | 탈락 사유 |
|------|------|------|----------|
| A | ... | ... | ... |
| B | ... | ... | ... |

## Consequences
- (+) 긍정적 결과
- (-) 부정적 결과 / 트레이드오프

## Diagram
Mermaid 다이어그램으로 시각화 (필수)
```

## Amendment (스펙 확정 후 변경 시)
CR(Change Request)이 승인되면 기존 ADR에 Amendment를 추가한다:
```markdown
## Amendment (CR-{번호}, {날짜})
- 변경 내용: ...
- 변경 사유: ...
- 영향 범위: ...
```
```

### .claude/skills/ticket-writing/SKILL.md

```markdown
---
name: ticket-writing
description: "유저 스토리 기반 티켓 작성 가이드. 스펙을 티켓으로 세분화할 때 사용."
---

# Ticket Writing Guide

## 티켓 포맷 (Medium/Large)

```markdown
## [EPIC-{번호}] {EPIC 제목}

### TICKET-{번호}: {티켓 제목}
- **유저 스토리**: As a {역할}, I want {기능}, so that {가치}
- **수용 조건**:
  - [ ] 조건 1
  - [ ] 조건 2
  - [ ] 에러 핸들링: ...
  - [ ] 엣지 케이스: ...
- **예상 소요**: {0.5h ~ 2h}
- **의존성**: TICKET-{번호} (없으면 "없음")
- **EPIC**: EPIC-{번호}
```

## Small 프로젝트 티켓 포맷
EPIC 그룹핑 없이 플랫 티켓 목록으로 작성한다:

```markdown
### TICKET-{번호}: {티켓 제목}
- **유저 스토리**: As a {역할}, I want {기능}, so that {가치}
- **수용 조건**:
  - [ ] 조건 1
  - [ ] 조건 2
  - [ ] 에러 핸들링: ...
- **예상 소요**: {0.5h ~ 2h}
- **의존성**: TICKET-{번호} (없으면 "없음")
```

## EPIC 간 의존성 (Medium/Large)
티켓 작성 시 EPIC 의존성 맵을 반드시 포함한다:
```markdown
## EPIC 의존성 맵
EPIC-01 (인증) → 없음
EPIC-02 (대시보드) → EPIC-01
EPIC-03 (설정) → EPIC-01, EPIC-02
```

## 규칙
- 시니어 개발자 기준 최대 2시간, 작을수록 좋다
- 유저 스토리 형식 필수
- 수용 조건에 에러 핸들링과 엣지 케이스를 반드시 포함한다
- 의존성을 명시적으로 기록한다
```

### .claude/skills/design-system/SKILL.md

```markdown
---
name: design-system
description: "디자인 시스템 구축 가이드. 디자인 토큰, 컴포넌트 스캐폴딩, 스페이싱 가이드 생성 시 사용."
---

# Design System Guide

## 산출물

### 1. 디자인 토큰 (`src/styles/tokens.ts`)
- Primary, Secondary, Neutral 컬러 팔레트 (50~900 스케일)
- Semantic 컬러 (error, warning, success, info)
- Spacing 스케일 (xs ~ 2xl)
- Typography (fontFamily, fontSize, fontWeight, lineHeight)
- Border radius, shadow 스케일

### 2. Tailwind/CSS 변수 매핑
- `tailwind.config.ts` 확장 또는 `src/styles/globals.css` CSS 변수

### 3. 기본 컴포넌트 스캐폴딩
| 컴포넌트 | Variants |
|----------|----------|
| Button | Primary, Secondary, Ghost, Destructive, 각 size (sm/md/lg) |
| Input | Text, Select, Checkbox, Radio, Textarea |
| Card | Default, Outlined, Elevated |
| Modal | Default, Confirm, Fullscreen |
| Toast | Success, Error, Warning, Info |
| Layout | Container, Stack (vertical/horizontal), Grid |

### 4. 스페이싱/마진 가이드 (`docs/design-system.md`)

## 범위 제한
에이전트가 생성하는 것은 코드 기반 디자인 시스템이다.
Figma 목업이 아닌, 실제 동작하는 컴포넌트와 토큰을 생성한다.
```

### .claude/skills/cr-process/SKILL.md

```markdown
---
name: cr-process
description: "Change Request 프로세스. 스펙 확정 후 변경이 필요할 때 사용."
---

# Change Request Process

## CR 문서 포맷
```markdown
## CR-{번호}: {제목}

- **요청자**: {에이전트명} (작업 중 발견한 티켓)
- **사유**: 왜 변경이 필요한가
- **영향 범위**: 영향받는 ADR, 티켓 목록
- **심각도**: Minor | Major | Critical
- **PO/PM 판정**: 승인/보류/거부
- **Architect 수정**: ADR Amendment 내용 (있다면)
- **Human 승인**: 필요/불필요
```

## 심각도 기준

| 심각도 | 기준 | 승인 필요 |
|--------|------|-----------|
| Minor | 구현 디테일 변경, 영향 1-2 티켓 | PO/PM만 |
| Major | 아키텍처 변경, 영향 3+ 티켓 | PO/PM + Human |
| Critical | 스택 변경, 전체 재설계 | 전체 Review 사이클 재진행 |

## 흐름
1. 개발 에이전트가 CR 요청 → PO/PM 접수
2. PO/PM이 영향 범위 평가 및 심각도 판정
3. 심각도에 따라 승인 프로세스 진행
4. 승인 시 Architect가 ADR Amendment 작성
5. CR 문서를 `docs/cr/` 에 저장
```

---

## Phase 1: Discovery (스펙 + 아키텍처 초안)

### Step 1. 프롬프트 엔지니어링 — Orchestrator

Orchestrator(Team Lead)가 사용자의 요구사항을 구체화한다.

**프로젝트 규모 판정:**

| 규모 | 기준 | 경로 | QA Mode |
|------|------|------|---------|
| Small | 1-2일, 단일 도메인, 5개 이하 티켓 | Small 축약 경로 | Lite |
| Medium | 1-2주, 2-3개 도메인 | 중간 경로 | Standard |
| Large | 2주+, 크로스 도메인 | 풀 프로세스 | Standard |

### Small 프로젝트 축약 경로

**대상:** 1-2일, 단일 도메인, 5개 이하 티켓

**생략 항목:**
- Architect Agent → Orchestrator가 인라인으로 간단한 기술 결정 기록 (ADR 대신 spec.md 내 "Technical Notes" 섹션)
- CTO Agent → 생략. Orchestrator가 오버엔지니어링 체크리스트 5항목만 자체 점검
- Phase 2 (Review Loop) → 생략. PO/PM이 스펙 자체 검토 후 바로 Phase 3
- Designer Agent → 디자인 토큰이 이미 있으면 생략, 없으면 기존 토큰 재사용 또는 최소 토큰만 정의
- Visual QA → Level 1 (Spot Check) 기본 적용
- QA Mode → **Lite** (E2E 작성 안 함, 유닛 테스트 통과 + 코드 리뷰만)

**유지 항목:**
- PO/PM의 티켓 작성 (단, EPIC 없이 플랫 티켓 목록)
- TDD 사이클 (test-writer → PO/PM sanity check → dev → qa-reviewer Lite)
- Human 승인 (간소화: 스펙 + 티켓 목록만 제시)

**산출물:**
- `docs/spec.md` (Technical Notes 섹션 포함, ADR 대체)
- `docs/tickets/TICKETS.md` (단일 파일, EPIC 그룹핑 없음)

**Small 프로젝트 흐름:**
```
Step 1: Orchestrator 요구사항 구체화
  → Step 2: PO/PM 스펙 + 플랫 티켓 작성
    → Step 3: Orchestrator 오버엔지니어링 체크 (자체)
      → Phase 3: Human 승인 (스펙 + 티켓)
        → Phase 4: TDD 사이클 (Visual QA Level 1, QA Mode Lite)
```

### Step 2. 계획 세분화 — PO/PM Agent (서브에이전트)

순차 작업이므로 서브에이전트로 스폰한다. `ticket-writing` 스킬을 참조.
Medium/Large에서는 EPIC 의존성 맵을 반드시 포함한다.

**산출물:** `docs/spec.md`, `docs/tickets/EPIC-*.md`

### Step 3. 아키텍처 문서 — Architect Agent (서브에이전트)

스펙 기반 ADR 작성. `adr-writing` 스킬을 참조.

**산출물:** `docs/adr/ADR-*.md`

---

## Phase 2: Review (검토 루프, 최대 5회전)

이 페이즈에서 **Agent Team**을 스폰한다.

### 팀 구성

```
Orchestrator (Team Lead)
├── spawnTeam("spec-review")
├── spawn("po-pm", prompt="스펙 및 티켓 검토...")
├── spawn("architect", prompt="ADR 기술 검증...")
└── spawn("cto", prompt="오버엔지니어링 검증, Context7 활용...")
```

### TaskList 흐름

```
Task 1: [po-pm] 스펙 문서 검토 및 티켓 구체화          → pending
Task 2: [architect] ADR 기술 적합성 자체 검증            → pending
Task 3: [cto] Context7으로 기술 스택 최신성 검증         → pending, blocked_by: [2]
Task 4: [po-pm] CTO 피드백 반영 스펙 수정               → pending, blocked_by: [3]
Task 5: [architect] 변경사항 반영 ADR 수정               → pending, blocked_by: [4]
```

### 메일박스 통신

에이전트 간 자유롭게 메일박스를 사용한다. broadcast도 필요 시 적극 활용.

### 회전 규칙

- **최대 5회전**까지 리뷰 가능
- 매 회전마다 각 에이전트가 100점 만점으로 채점
- **전 에이전트 90점 이상이면 조기 수렴** (5회전 안 채워도 됨)
- 5회전 후에도 90점 미달 시, Orchestrator가 쟁점 정리 후 Human에게 에스컬레이션

**산출물:** `docs/spec.md` (확정), `docs/adr/` (확정), `docs/review-log.md`

---

## Phase 3: Approval (Human-in-the-Loop)

### Step 8. 사용자 승인

**제시 산출물:**
1. 확정 스펙 + 채점 결과
2. ADR 문서들 + 채점 결과 (Medium/Large만)
3. EPIC/티켓 목록 + **EPIC 의존성 맵** (Medium/Large만)
4. 리뷰 로그 — 회전별 점수 변화 (Medium/Large만)

**Small 프로젝트:** 스펙 + 플랫 티켓 목록만 제시

**승인 후 변경:** CR 프로세스를 통해서만 가능 (`cr-process` 스킬 참조)

---

## Phase 4: Build (EPIC 단위 반복 사이클)

### 핵심: EPIC마다 디자인 → TDD → Sanity Check → 구현 → QA 사이클

```
EPIC-01 ──→ Design ──→ TDD(Red) ──→ Gate(Sanity) ──→ Implement(Green) ──→ QA(Verify) ──→ ✅
                                                                                          │
EPIC-02 ──→ Design ──→ TDD(Red) ──→ Gate(Sanity) ──→ Implement(Green) ──→ QA(Verify) ──→ ✅
                                                                                          │
EPIC-03 ──→ ...                                                                           ▼
```

### EPIC 실행 순서 (Orchestrator 관리)

Orchestrator는 EPIC 의존성 맵을 기반으로 실행 순서를 결정한다.

**순서 결정 규칙:**
1. 의존성 없는 EPIC을 먼저 실행
2. 의존하는 EPIC은 선행 EPIC이 완료(QA 90점+)된 후에만 시작
3. 의존성 없는 EPIC끼리는 병렬 실행 가능 (파일 소유권이 겹치지 않는 경우)

**EPIC 간 핸드오프:**
선행 EPIC 완료 시 Orchestrator가 후행 EPIC 팀의 spawn prompt에 포함하는 정보:
- 선행 EPIC에서 생성/수정된 모듈, 컴포넌트, API 목록
- import 경로
- 관련 타입 정의 위치

**병렬 실행 시 주의:**
- shared.ts 동시 수정이 필요한 경우 Orchestrator가 순서를 조율
- 병렬 EPIC 간 예상치 못한 의존성 발견 시 CR 프로세스로 처리

### Step 9. 디자인 시스템 확립 (첫 EPIC 전)

Designer Agent를 서브에이전트로 스폰. `design-system`, `visual-qa` 스킬 참조.
**Visual QA Level 1 (Spot Check)** 적용 — 디자인 시스템 확립 단계이므로.

**산출물:**
- `src/styles/tokens.ts`
- `tailwind.config.ts` 확장
- `src/components/` 기본 컴포넌트
- `docs/design-system.md`
- Playwright 스크린샷 (Desktop 1280px만)

### Step 10. EPIC별 디자인

Designer + PO/PM 서브에이전트 or 메일박스 피드백.
**Visual QA Level은 Orchestrator가 EPIC별로 지정한다.**

### Step 11. 개발 — Agent Team (EPIC별)

```
Orchestrator (Team Lead)
├── spawnTeam("epic-01-auth")
├── spawn("test-writer", prompt="TDD Red Phase...")
├── spawn("po-pm", prompt="Test Sanity Check...")     ← 게이트 역할
├── spawn("frontend-dev", prompt="Green Phase, Visual QA Level {N}...")
├── spawn("backend-dev", prompt="Green Phase...")
└── spawn("qa-reviewer", prompt="Verify Phase, QA Mode {Standard|Lite}...")
```

**TaskList (게이트 포함):**
```
Task 1: [test-writer] TICKET-001 유닛 테스트 작성         → pending
Task 2: [test-writer] TICKET-002 유닛 테스트 작성         → pending
Task 3: [po-pm] Test Sanity Check (TICKET-001, 002)       → blocked_by: [1, 2]  ← GATE
Task 4: [frontend-dev] TICKET-001 구현                    → blocked_by: [3]
Task 5: [backend-dev] TICKET-002 구현                     → blocked_by: [3]
Task 6: [qa-reviewer] TICKET-001 QA                      → blocked_by: [4]
Task 7: [qa-reviewer] TICKET-002 QA                      → blocked_by: [5]
Task 8: [qa-reviewer] EPIC-01 전체 종합 채점              → blocked_by: [6, 7]
```

**파일 소유권:** CLAUDE.md의 "파일 소유권" 섹션 참조.

### EPIC 완료 조건

- **Standard QA (Medium/Large):** QA Reviewer가 **EPIC 전체 종합 점수 90점 이상**이어야 EPIC 완료.
- **Lite QA (Small):** QA Reviewer가 유닛 테스트 전체 통과 + 코드 리뷰 통과 확인으로 완료.

90점 미만 시 감점 항목 기반으로 수정 사이클 재진행.
**실패 모드 & 복구** 규칙에 따라 2회 연속 실패 시 Human 에스컬레이션.

---

## 에이전트 통신 규칙

### 서브에이전트 vs 에이전트 팀

| 상황 | 선택 | 이유 |
|------|------|------|
| Phase 1 (Discovery) | **서브에이전트** | 순차 작업, 에이전트 간 소통 불필요 |
| Phase 2 (Review) | **에이전트 팀** | PO/PM ↔ Architect ↔ CTO 크로스 리뷰 |
| Phase 4 디자인 | **서브에이전트** | Designer + PO/PM 1:1 |
| Phase 4 개발 | **에이전트 팀** | FE ↔ BE 타입 공유, Test → Gate → Dev 의존성 |

---

## 실행 가이드

```bash
# 1. Agent Teams 활성화
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 2. 프로젝트에서 Claude Code 시작
claude

# 3. Plan mode로 진입
> /plan [프로젝트 요구사항]

# 4. Orchestrator가 규모 판정 후 프로세스 시작
```

---

## 변경 로그

### v2.0 → v2.1
| # | 변경 사항 |
|---|----------|
| 1 | Small 프로젝트 축약 경로 명시화 |
| 2 | 모델 Tier 시스템 (Opus/Sonnet 차등 적용) |
| 3 | Test Writer 산출물 게이트 (PO/PM Sanity Check) |
| 4 | Visual QA Level 시스템 (0~3단계) |
| 5 | 실패 모드 & 복구 경로 정의 |
| 6 | 컨텍스트 관리 전략 (context 필드) |
| 7 | 공유 파일 충돌 방지 (소유권 세분화) |

### v2.1 → v2.2
| # | 변경 사항 | 사유 |
|---|----------|------|
| 1 | `context` frontmatter 제거 → 시스템 프롬프트 본문으로 이동 | 공식 미지원 필드 |
| 2 | `model-review-override` 제거 → Orchestrator 명시적 spawn으로 대체 | 공식 미지원 필드 |
| 3 | 전체 에이전트 `model: opus` 통일 + 비용 최적화 Tier 가이드 별도 섹션 | Jeremy 요청 |
| 4 | `shared.ts` 소유권: Orchestrator → backend-dev + FE 알림 | 병목 제거 |
| 5 | CLAUDE.md에 컨텍스트/소유권 규칙 중앙화 | 일관성 보장 |

### v2.2 → v2.3
| # | 변경 사항 | 사유 |
|---|----------|------|
| 1 | 에이전트 정의에서 File Ownership, Context Rules 본문 삭제 → "CLAUDE.md 참조" 한 줄로 대체 | 정보 중복 제거. CLAUDE.md를 유일한 출처(SSOT)로 확립 |
| 2 | QA Reviewer에 QA Mode 도입: Standard (Medium/Large) vs Lite (Small) | Small에서 E2E는 과도. Lite는 유닛 통과 + 코드 리뷰만 |
| 3 | EPIC 간 의존성 관리 규칙 추가 | EPIC 의존성 맵, 순서 결정, 핸드오프, 병렬 실행 조건 정의 |
| 4 | ticket-writing 스킬에 EPIC 의존성 맵 포맷 추가 | PO/PM이 티켓 작성 시 EPIC 간 의존성을 명시적으로 선언 |
| 5 | tdd-workflow 스킬의 Verify Phase에 QA Mode 분기 추가 | Small vs Medium/Large QA 범위 차이 반영 |
