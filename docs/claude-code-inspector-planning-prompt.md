# Claude Code Inspector — 기획 프롬프트

> 이 프롬프트를 Claude Code에서 그대로 사용하세요.
> 프로젝트 디렉토리를 만든 후 `claude` 를 실행하고 이 내용을 붙여넣으면 됩니다.

---

## 프롬프트 시작

너는 Go + Bubbletea 기반 TUI 애플리케이션 아키텍트야. 지금부터 "Claude Code Inspector"라는 프로젝트의 기획을 함께 진행할 거야. 아래 요구사항과 기술 스펙을 바탕으로 **PRD(Product Requirements Document)를 `docs/PRD.md`에**, **기술 설계 문서를 `docs/TECHNICAL_DESIGN.md`에**, **구현 로드맵을 `docs/ROADMAP.md`에** 작성해줘.

---

### 1. 프로젝트 개요

**Claude Code Inspector**는 현재 사용자의 머신에 존재하는 모든 Claude Code 설정 파일을 스캔하고, 계층 구조(Managed → Project → User)별로 한눈에 보여주는 터미널 기반 대시보드 TUI 도구야.

**해결하려는 문제:**
- Claude Code의 설정이 최소 8개 이상의 파일/디렉토리에 분산되어 있음
- 어떤 설정이 어디서 오는지, 어떤 우선순위로 적용되는지 파악하기 어려움
- `settings.json`, `CLAUDE.md`, hooks, agents, skills, commands, MCP 서버, plugins 등이 각각 다른 경로에 존재
- 설정 충돌(conflict)이 발생해도 디버깅이 어려움

**타겟 사용자:** Claude Code를 적극적으로 사용하는 개발자

---

### 2. 스캔 대상 파일 — 완전한 목록 (공식 문서 기반)

아래는 Claude Code 공식 문서(https://code.claude.com/docs/en/settings)에서 확인한 **정확한 파일 경로 및 설명**이야. 이 목록을 기반으로 스캐너를 설계해줘.

#### 2.1 Enterprise Managed (최상위 우선순위)
| 파일 | 설명 | OS |
|---|---|---|
| `/Library/Application Support/ClaudeCode/managed-settings.json` | 엔터프라이즈 관리 정책 | macOS |
| `/etc/claude-code/managed-settings.json` | 엔터프라이즈 관리 정책 | Linux/WSL |
| `C:\Program Files\ClaudeCode\managed-settings.json` | 엔터프라이즈 관리 정책 | Windows |
| `/Library/Application Support/ClaudeCode/managed-mcp.json` | 관리형 MCP 서버 | macOS |
| `/etc/claude-code/managed-mcp.json` | 관리형 MCP 서버 | Linux/WSL |
| `C:\Program Files\ClaudeCode\managed-mcp.json` | 관리형 MCP 서버 | Windows |

#### 2.2 User Global (유저 레벨)
| 파일/디렉토리 | 설명 |
|---|---|
| `~/.claude/settings.json` | 유저 글로벌 설정 (permissions, hooks, env 등) |
| `~/.claude/settings.local.json` | 유저 로컬 설정 (동기화 안 됨) |
| `~/.claude/CLAUDE.md` | 모든 프로젝트에 적용되는 글로벌 지침 |
| `~/.claude.json` | 레거시 설정 + OAuth 세션 + MCP 서버 (user/local scope) + 프로젝트별 상태 |
| `~/.mcp.json` | 글로벌 MCP 서버 설정 |
| `~/.claude/commands/*.md` | 글로벌 슬래시 커맨드 |
| `~/.claude/agents/*.md` | 글로벌 서브에이전트 |

#### 2.3 Project Level (프로젝트 레벨)
| 파일/디렉토리 | 설명 | Git |
|---|---|---|
| `<project>/CLAUDE.md` | 프로젝트 지침 (+ 하위 디렉토리의 CLAUDE.md도 탐색) | tracked |
| `<project>/CLAUDE.local.md` | 개인 프로젝트 지침 | gitignored |
| `<project>/.mcp.json` | 프로젝트 MCP 서버 | tracked |
| `<project>/.claude/settings.json` | 프로젝트 공유 설정 | tracked |
| `<project>/.claude/settings.local.json` | 프로젝트 개인 설정 | gitignored |
| `<project>/.claude/commands/*.md` | 프로젝트 슬래시 커맨드 | tracked |
| `<project>/.claude/agents/*.md` | 프로젝트 서브에이전트 | tracked |
| `<project>/.claude/skills/<name>/SKILL.md` | 프로젝트 스킬 | tracked |
| `<project>/.claude/hooks/*.py \| *.sh` | 프로젝트 훅 스크립트 | tracked |
| `<project>/.claude-plugin/plugin.json` | 플러그인 매니페스트 | tracked |

#### 2.4 설정 우선순위 (높은 순)
```
1. Enterprise managed policies (managed-settings.json)
2. CLI 플래그 (런타임, 스캔 불필요)
3. Project local (.claude/settings.local.json)
4. Project shared (.claude/settings.json)
5. User settings (~/.claude/settings.json)
```

---

### 3. 핵심 기능 요구사항

#### 3.1 대시보드 뷰 (메인 화면)
- 좌측: 트리 네비게이션 — Scope별(Managed / Global / Project) 그룹핑
  - 각 Scope 하위에: Settings, CLAUDE.md, MCP, Commands, Agents, Skills, Hooks, Plugins 카테고리
  - 파일이 존재하면 아이콘(✓) 표시, 없으면 회색(✗) 처리
  - 파일 개수 카운트 표시 (예: `Commands (3)`)
- 우측: 선택된 항목의 상세 내용
  - JSON 파일 → 구문 강조(syntax highlight)된 내용 표시
  - MD 파일 → 마크다운 렌더링 또는 raw 텍스트
  - 디렉토리 → 파일 목록

#### 3.2 Settings Merge View (설정 병합 뷰)
- 모든 scope의 `settings.json`을 하나로 병합한 "effective settings" 보여주기
- 각 키 옆에 어느 scope에서 왔는지 출처 태그 표시
  - 예: `permissions.deny` → `[Project Shared]`, `env.NODE_ENV` → `[User Global]`
- 충돌이 있는 키는 하이라이트 (예: User에서 allow한 걸 Project에서 deny)

#### 3.3 Hooks Inspector
- `settings.json` 내 hooks 정의 + `.claude/hooks/` 디렉토리의 스크립트 파일을 매핑
- 이벤트별(PreToolUse, PostToolUse, SessionStart 등) 그룹핑
- 각 훅의 matcher, type(command/prompt/agent), timeout 표시

#### 3.4 MCP Server Overview
- `~/.claude.json`, `~/.mcp.json`, `.mcp.json`, `managed-mcp.json` 모두 통합
- 서버별: name, command, args, scope(어디서 정의됨) 표시
- 중복/충돌 서버 감지

#### 3.5 Quick Summary (상단 바 또는 별도 탭)
- 총 설정 파일 수 / 스캔된 파일 수 / 누락된 파일 수
- 활성 hooks 수, MCP 서버 수, commands 수, agents 수, skills 수
- 마지막 스캔 시간

---

### 4. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 언어 | **Go 1.23+** | 단일 바이너리 배포, 빠른 실행 |
| TUI 프레임워크 | **Bubbletea** (charmbracelet/bubbletea) | Elm 아키텍처, 풍부한 생태계 |
| 스타일링 | **Lipgloss** (charmbracelet/lipgloss) | CSS-like 터미널 스타일링 |
| 컴포넌트 | **Bubbles** (charmbracelet/bubbles) | 트리뷰, 테이블, 뷰포트 등 |
| JSON 파싱 | `encoding/json` (표준 라이브러리) | 추가 의존성 없음 |
| 파일 탐색 | `os`, `filepath` (표준 라이브러리) | 크로스 플랫폼 |
| 구문 강조 | **Chroma** (alecthomas/chroma) | 터미널용 JSON/MD 구문 강조 |
| 마크다운 렌더링 | **Glamour** (charmbracelet/glamour) | Bubbletea 생태계 호환 |

---

### 5. 프로젝트 구조

```
claude-code-inspector/
├── cmd/
│   └── cci/
│       └── main.go                 # 엔트리포인트
├── internal/
│   ├── scanner/
│   │   ├── scanner.go              # 파일 스캐너 (모든 설정 경로 탐색)
│   │   ├── paths.go                # OS별 설정 경로 정의
│   │   └── types.go                # ScanResult, ConfigFile 등 타입
│   ├── merger/
│   │   ├── merger.go               # settings.json 병합 로직
│   │   └── conflict.go             # 충돌 감지
│   ├── parser/
│   │   ├── settings.go             # settings.json 파서
│   │   ├── claude_md.go            # CLAUDE.md 파서
│   │   ├── mcp.go                  # MCP 설정 파서
│   │   ├── hooks.go                # hooks 파서
│   │   └── commands.go             # commands/agents/skills 파서
│   └── tui/
│       ├── app.go                  # Bubbletea 메인 모델
│       ├── views/
│       │   ├── dashboard.go        # 메인 대시보드 뷰
│       │   ├── tree.go             # 좌측 트리 네비게이션
│       │   ├── detail.go           # 우측 상세 패널
│       │   ├── merge_view.go       # Settings Merge View
│       │   ├── hooks_view.go       # Hooks Inspector
│       │   ├── mcp_view.go         # MCP Server Overview
│       │   └── summary.go          # Quick Summary 바
│       ├── styles/
│       │   └── theme.go            # Lipgloss 테마 정의
│       └── keys/
│           └── keymap.go           # 키바인딩 정의
├── docs/
│   ├── PRD.md                      # 생성해줘
│   ├── TECHNICAL_DESIGN.md         # 생성해줘
│   └── ROADMAP.md                  # 생성해줘
├── CLAUDE.md                       # 이 프로젝트의 Claude Code 지침
├── go.mod
├── go.sum
└── README.md
```

---

### 6. 구현 로드맵 가이드

아래 마일스톤 순서로 ROADMAP.md를 구성해줘:

**Phase 1 — Scanner Core (MVP)**
- 모든 설정 경로 정의 (OS 감지 포함)
- 파일 존재 여부 스캔
- ScanResult 구조체 반환
- CLI에서 `cci scan` 으로 결과 텍스트 출력

**Phase 2 — Basic TUI**
- Bubbletea 앱 스캐폴딩
- 좌측 트리 + 우측 상세 패널 레이아웃
- 트리 네비게이션 (j/k, Enter, Esc)
- JSON 파일 내용 표시

**Phase 3 — Parsers & Rich Display**
- settings.json 파싱 (permissions, hooks, env 추출)
- CLAUDE.md 마크다운 렌더링 (Glamour)
- JSON 구문 강조 (Chroma)
- commands/agents/skills 목록 표시

**Phase 4 — Merge View & Conflict Detection**
- 다중 scope settings.json 병합
- 출처 태그 표시
- permission 충돌 감지 및 하이라이트

**Phase 5 — Hooks & MCP Inspector**
- hooks 정의 파싱 + 스크립트 파일 매핑
- 이벤트별 그룹핑 뷰
- MCP 서버 통합 뷰
- 중복 서버 감지

**Phase 6 — Polish & Distribution**
- Quick Summary 바
- 테마 (다크/라이트)
- goreleaser로 바이너리 배포
- Homebrew formula
- README 완성

---

### 7. CLAUDE.md 생성

이 프로젝트의 루트에 `CLAUDE.md`도 함께 생성해줘. 다음을 포함해야 해:
- 프로젝트 스택 (Go, Bubbletea, Lipgloss, Bubbles, Chroma, Glamour)
- 빌드 명령어: `go build -o cci ./cmd/cci`
- 테스트 명령어: `go test ./...`
- 린트 명령어: `golangci-lint run`
- 디렉토리 구조 요약
- 코딩 컨벤션 (Go standard project layout, error wrapping, 테스트 파일 위치 등)

---

### 8. 작업 지시

1. `docs/PRD.md` — 위 요구사항을 기반으로 한 완전한 PRD 작성
2. `docs/TECHNICAL_DESIGN.md` — 아키텍처, 데이터 플로우, 핵심 타입 정의, 컴포넌트 간 인터페이스
3. `docs/ROADMAP.md` — Phase별 마일스톤, 각 Phase의 구체적 태스크 목록, 예상 소요 시간
4. `CLAUDE.md` — 프로젝트 컨텍스트
5. `go.mod` 초기화 (`module github.com/<user>/claude-code-inspector`)
6. `cmd/cci/main.go` — 최소 엔트리포인트 (placeholder)
7. `internal/scanner/paths.go` — OS별 경로 상수 정의

**모든 파일을 실제로 생성해줘. 설명만 하지 말고.**

순서: CLAUDE.md → docs/ → go.mod → 소스 코드

---

## 프롬프트 끝
