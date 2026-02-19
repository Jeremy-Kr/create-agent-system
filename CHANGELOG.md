# Changelog

이 프로젝트는 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 형식을 따릅니다.

## [0.1.0] - 2026-02-19

첫 번째 릴리스.

### Added

- **CLI 코어**: commander 기반 인자 파서 + clack 인터랙티브 프롬프트
- **프리셋**: solo-dev, small-team, full-team 3종 YAML 프리셋
- **스캐폴딩 엔진**: Handlebars 기반 템플릿 렌더링, 에이전트/스킬/CLAUDE.md 파일 생성
- **에이전트 템플릿**: po-pm, architect, cto, designer, test-writer, frontend-dev, backend-dev, qa-reviewer 8종
- **스킬 템플릿**: scoring, visual-qa, tdd-workflow, adr-writing, ticket-writing, design-system, cr-process 7종
- **검증 엔진**: YAML frontmatter 파싱, 필수 필드, 지원 필드, 스킬 참조, @import 경로 검증
- **Claude Code 실행 연동**: `--permission-mode plan` + Agent Teams 환경변수 자동 설정
- **기존 프로젝트 충돌 처리**: `--overwrite` 플래그
- **Custom 프리셋**: 인터랙티브 에이전트/워크플로우/스킬 선택
- **설정 파일**: `agent-system.config.yaml` 지원
- **프리셋 diff**: 프리셋 간 차이 비교 표시
- **커뮤니티 레지스트리**: 에이전트/스킬 검색, 설치 (`add`, `search`, `list` 커맨드)
- **list 명령어**: `--installed` 로컬 에이전트/스킬 목록, `--registry` 레지스트리 목록
- **edit 서브커맨드**: 기존 에이전트 시스템 설정 편집
- **마이그레이션 도구**: 버전 간 설정 업그레이드
- **i18n**: 한국어/영어 지원 (`--lang` 옵션, 자동 감지)
- **Claude Code 플러그인 래퍼**: 플러그인 패키지 구조
