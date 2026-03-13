# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**RetroLens** — AI 기반 팀 회고 관리 도구. K/P/T(Keep/Problem/Try) 프레임워크로 익명 피드백을 수집하고, Claude AI로 문체를 중립화하여 익명성을 강화하며, AI 인사이트를 생성한다.

- **개발 체제:** 1인 풀스택, 해커톤 (2일)
- **현재 상태:** 기획/설계 완료, 구현 착수 전

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Nuxt 3 (Vue 3 + TypeScript) — 서버/클라이언트 통합, 파일 기반 라우팅 |
| 스타일링 | Tailwind CSS |
| 백엔드 API | Nuxt Server Routes (`server/api/`) |
| 데이터베이스 | SQLite + Prisma ORM |
| 인증 | JWT (jsonwebtoken) + bcrypt, httpOnly 쿠키 |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| 배포 | Vercel |
| 테스트 | Vitest |

---

## 개발 명령어 (구현 후 기준)

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트
npm run lint

# 테스트 전체 실행
npm run test

# 단일 테스트 파일 실행
npx vitest run tests/unit/server/auth.test.ts

# DB 마이그레이션
npx prisma migrate dev

# DB 클라이언트 생성
npx prisma generate

# Seed 실행 (관리자 계정 등)
npx prisma db seed
```

환경변수는 `.env` 파일에 설정한다 (`.env.example` 참조):
- `JWT_SECRET` — JWT 서명 키
- `ANTHROPIC_API_KEY` — Claude API 키
- `DATABASE_URL` — SQLite 파일 경로 (예: `file:./dev.db`)

---

## 아키텍처

### 디렉토리 구조

```
retrolens/
├── server/
│   ├── api/               # API 엔드포인트 (Nuxt Server Routes)
│   │   ├── auth/          # 인증 (register, login, me)
│   │   ├── teams/         # 팀 관리
│   │   ├── sessions/      # 회고 세션 CRUD
│   │   ├── feedbacks/     # 익명 피드백 + AI 문체 변환
│   │   ├── votes/         # 피드백 투표
│   │   ├── insights/      # AI 인사이트 생성/공유
│   │   ├── action-items/  # 액션 아이템
│   │   └── admin/         # 관리자 전용 API
│   ├── middleware/
│   │   └── auth.ts        # JWT 검증 미들웨어 (모든 /api/* 적용)
│   └── utils/
│       ├── jwt.ts         # JWT 유틸리티
│       ├── prisma.ts      # Prisma 클라이언트 싱글톤
│       ├── claude.ts      # Claude API 클라이언트
│       └── validation.ts  # 서버 입력 검증
├── pages/                 # Vue 페이지 (파일 기반 라우팅)
├── components/            # 재사용 가능한 Vue 컴포넌트
├── composables/           # useAuth, useSession, useFeedback, useToast
├── middleware/            # 클라이언트 라우팅 가드
├── layouts/               # default.vue (GNB 포함), auth.vue
├── types/                 # 공통 TypeScript 타입
├── prisma/
│   ├── schema.prisma      # DB 스키마
│   └── seed.ts
└── tests/
    └── unit/
        ├── server/        # API 핸들러 단위 테스트
        └── composables/   # Composable 단위 테스트
```

### 데이터 모델 핵심 설계

**익명성 보장 (가장 중요한 설계 원칙):**
- `Feedback` 테이블에 `userId` 필드가 **존재하지 않는다** — DB 레벨에서 익명성 보장
- 피드백 저장 API에서 JWT로 팀 소속만 검증한 후, `userId`를 저장하지 않음
- `Vote` 테이블에는 `userId` 있음 (실명 투표)

```
User (ADMIN/LEADER/MEMBER)
 └── Team
      └── Session (ACTIVE/CLOSED)
           ├── Feedback (익명, userId 없음)
           │    └── Vote (실명, userId 있음)
           └── Insight (AI 생성)
                └── ActionItem
```

### 권한 체계

| 역할 | 접근 범위 |
|------|----------|
| ADMIN | 전체 (팀/사용자 관리, 통계) |
| LEADER | 본인 팀 세션 생성/마감, 인사이트 생성/공유, 액션 아이템 |
| MEMBER | 피드백 제출, 투표, 대시보드 조회 |

모든 API는 `/api/auth/register`, `/api/auth/login` 제외하고 JWT 미들웨어가 인증을 강제한다.

### AI 연동

두 가지 AI 기능 (`server/utils/claude.ts`):
1. **문체 변환** (`POST /api/feedbacks/transform`): 피드백의 개인적 말투/이모지 제거, 의미 보존
2. **인사이트 생성** (`POST /api/insights/generate`): 세션 전체 피드백 분석 → 요약문 + 핵심 이슈 3~5개 + 권장 액션

AI 실패 시 폴백: 문체 변환 실패 → 원문 반환, 인사이트 실패 → 에러 반환

### 에러 처리

서버 에러는 `server/utils/error.ts`의 `createApiError(statusCode, code, message)` 함수로 통일한다.

주요 에러 코드: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `TEAM_MISMATCH`, `SESSION_CLOSED`, `DUPLICATE_VOTE`, `AI_SERVICE_ERROR`

클라이언트는 `composables/useApi.ts`의 래퍼를 통해 에러를 공통 처리한다 (토스트 알림, 401 시 로그인 리다이렉트).

---

## 기획 문서 위치

모든 설계 결정의 근거는 아래 문서에 있다:

| 파일 | 내용 |
|------|------|
| `docs/plan/PRD.md` | 제품 요구사항, 기능 목록(FEAT-000~015), 우선순위(P0/P1/P2) |
| `docs/plan/architecture.md` | 기술 아키텍처 전체 상세 (API 설계, DB 스키마, 컴포넌트 설계) |
| `docs/plan/task-plan.md` | 48개 태스크(TASK-001~048), 의존성, 스프린트 배정 |
| `docs/plan/screen-plan.md` | 12개 화면(SCR-000~008) UI/UX 상세 |
| `docs/plan/planning-analysis.md` | 요구사항 분석(REQ-B001~REQ-U010), 기능 명세 |

## 에이전트 역할

`agents/` 디렉토리에 각 에이전트의 역할과 입력/출력 형식이 정의되어 있다. 문서 작성 및 설계 작업 시 해당 에이전트 프롬프트를 참조한다.
