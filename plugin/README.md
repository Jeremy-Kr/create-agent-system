# create-agent-system Plugin

Claude Code Agent Teams 스캐폴딩 도구 플러그인.

## 설치

```bash
claude plugin add create-agent-system
```

## 커맨드

### /scaffold

프로젝트에 Claude Code Agent Teams 시스템을 스캐폴딩합니다.

```
/scaffold                          # 인터랙티브 모드
/scaffold --preset solo-dev --yes  # 논인터랙티브 모드
```

프리셋:
- **solo-dev** — 1인 개발, 축약 워크플로우
- **small-team** — 소규모 팀, EPIC 기반
- **full-team** — 대규모 프로젝트, 풀 프로세스

### /add

커뮤니티 레지스트리에서 에이전트, 스킬, 프리셋을 설치합니다.

```
/add security-reviewer             # 에이전트/스킬 설치
/add --type agent security-reviewer
```

### /search

커뮤니티 레지스트리를 검색합니다.

```
/search testing                    # 키워드 검색
/search --type skill testing       # 스킬만 검색
```

### /validate

현재 프로젝트의 Agent Teams 설정을 검증합니다.

```
/validate                          # 전체 검증
/validate --quiet                  # 오류만 출력
```

## 라이선스

MIT
