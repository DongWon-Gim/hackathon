# RetroLens

[![CI](https://github.com/DongWon-Gim/hackathon/actions/workflows/ci.yml/badge.svg)](https://github.com/DongWon-Gim/hackathon/actions/workflows/ci.yml)
[![CD](https://github.com/DongWon-Gim/hackathon/actions/workflows/cd.yml/badge.svg)](https://github.com/DongWon-Gim/hackathon/actions/workflows/cd.yml)

**AI 기반 팀 회고 관리 도구** — K/P/T(Keep/Problem/Try) 프레임워크로 익명 피드백을 수집하고, Claude AI로 문체를 중립화하여 익명성을 강화하며, AI 인사이트를 생성합니다.

## 데모

**Production:** [https://hackathon-rouge-tau.vercel.app](https://hackathon-rouge-tau.vercel.app)

| 계정 | 이메일 | 비밀번호 | 역할 |
|------|--------|----------|------|
| 팀장 | leader@retrolens.app | leader1234 | LEADER |
| 팀원 | member@retrolens.app | member1234 | MEMBER |

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Nuxt 3 (Vue 3 + TypeScript) |
| 스타일링 | Tailwind CSS |
| 데이터베이스 | Turso (libSQL/SQLite) + Prisma ORM |
| 인증 | JWT + bcrypt, httpOnly 쿠키 |
| AI | Anthropic Claude Haiku |
| 배포 | Vercel |
| 테스트 | Vitest (단위/통합) + Playwright (E2E) |

## 빠른 시작

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env에 TURSO_DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY 입력

# DB 스키마 동기화 + 시드 데이터 생성
npx prisma db push
npx prisma db seed

# 개발 서버 실행
npm run dev
```

## 개발 명령어

```bash
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint

# 테스트
npm run test                  # 단위 + 통합 테스트 (Vitest)
npx vitest run --coverage     # 커버리지 포함 실행
npx playwright test           # E2E 테스트 (dev 서버 필요)

# DB
npx prisma db push            # 스키마 적용
npx prisma db seed            # 시드 데이터 생성
npx prisma studio             # DB GUI
```

## 테스트 현황

### 단위 + 통합 테스트 (Vitest)

| 구분 | 파일 수 | 테스트 수 |
|------|---------|-----------|
| 단위 (server API) | 13 | 125 |
| 단위 (composables) | 2 | 26 |
| 통합 (API flow) | 2 | 4 |
| **합계** | **17** | **155** |

**커버리지:** Lines 69% / Functions 83% / Branches 67% (임계값: 50%)

### E2E 테스트 (Playwright)

| 시나리오 | 테스트 수 | 상태 |
|---------|-----------|------|
| 인증 및 팀 합류 (SCR-000~001) | 9 | 통과 |
| 피드백 입력 (SCR-003) | 5 | 통과 |
| 대시보드 + 인사이트 (SCR-004) | 6 | 통과 |
| **합계** | **20** | **20/20** |

E2E 테스트 실행 전 `npx prisma db seed`로 시드 데이터를 생성하고 환경 변수를 설정하세요:

```bash
TEST_SESSION_ID=seed-session-active-001
CLOSED_SESSION_ID=seed-session-closed-001
EMPTY_SESSION_ID=seed-session-empty-001
VALID_INVITE_CODE=DEMO-TEAM-002
```

## CI/CD 파이프라인

```
push to develop/staging
  └─ CI: lint → build → test (coverage ≥ 50%)
       └─ 통과 시 CD: Vercel Preview 배포

push to master
  └─ CD: Vercel Production 배포
```

- **CI** (`.github/workflows/ci.yml`): ESLint → Nuxt 빌드 → Vitest 커버리지 검증
- **CD** (`.github/workflows/cd.yml`): develop → Vercel Preview, master → Vercel Production

## 프로젝트 구조

```
retrolens/
├── server/api/        # API 엔드포인트 (Nuxt Server Routes)
├── pages/             # Vue 페이지 (파일 기반 라우팅)
├── components/        # 재사용 컴포넌트
├── composables/       # useAuth, useFeedback, useSession, useToast
├── prisma/            # 스키마 + 마이그레이션 + 시드
├── tests/
│   ├── unit/          # Vitest 단위 테스트
│   ├── integration/   # Vitest 통합 테스트
│   └── e2e/           # Playwright E2E 테스트
└── docs/plan/         # PRD, 아키텍처, 화면 설계서
```

## 핵심 기능

- **익명 피드백**: DB에 userId 저장 없이 팀 소속만 검증 → DB 레벨 익명성 보장
- **AI 문체 변환**: 개인적 말투/이모지 제거, 의미 보존 (Claude Haiku)
- **AI 인사이트**: 세션 피드백 전체 분석 → 요약문 + 핵심 이슈 3~5개 + 권장 액션
- **액션 아이템**: 인사이트 이슈에서 바로 액션 아이템 생성, 진행 상태 추적

## 기획 문서

| 문서 | 내용 |
|------|------|
| `docs/plan/PRD.md` | 제품 요구사항, 기능 목록, 우선순위 |
| `docs/plan/architecture.md` | 기술 아키텍처, API 설계, DB 스키마 |
| `docs/plan/test-strategy.md` | 테스트 전략, TC 목록 (TC-001~TC-049) |
| `docs/plan/screen-plan.md` | 12개 화면 UI/UX 상세 설계 |
| `docs/plan/cicd-plan.md` | CI/CD 파이프라인 설계 |
