# RetroLens 기술 아키텍처 설계서

- **작성일:** 2026-03-13
- **기반 문서:** PRD v1.2.0, 기획 분석 문서, 화면 기획서
- **버전:** 1.0.0

---

## 1. 기술 스택

| 영역 | 기술 | 선정 근거 |
|------|------|----------|
| 프론트엔드 프레임워크 | Nuxt 3 | SSR/SSG 지원, 파일 기반 라우팅, 서버/클라이언트 통합 개발으로 1인 개발 생산성 극대화 |
| 언어 | TypeScript | 타입 안전성으로 런타임 에러 사전 방지, IDE 자동완성 지원 |
| 스타일링 | Tailwind CSS | 유틸리티 우선 CSS로 빠른 UI 구현, 별도 디자인 시스템 없이도 일관된 UI 가능 |
| 백엔드 API | Nuxt 3 Server Routes | 별도 백엔드 서버 불필요, 프론트엔드와 동일 프로젝트에서 API 개발 |
| 데이터베이스 | SQLite | 별도 DB 서버 불필요, 파일 기반으로 설정 간편, 해커톤에 적합 |
| ORM | Prisma | 타입 안전한 DB 쿼리, 마이그레이션 자동화, 스키마 기반 개발 |
| 인증 | JWT (jsonwebtoken + bcrypt) | 세션 서버 불필요, 토큰 기반 무상태 인증, 구현 단순 |
| AI | Anthropic Claude Haiku API (claude-haiku-4-5-20251001) | 문체 변환 및 인사이트 생성에 최적화된 언어 모델 |
| 배포 | Vercel | Nuxt 3 네이티브 지원, 무료 티어로 해커톤 배포 가능 |
| 테스트 | Vitest | Vite 기반 빠른 실행 속도, Nuxt 3와 호환성 우수 |

---

## 2. 시스템 구조도

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트 (브라우저)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Vue 3 Pages │  │ Composables  │  │ Pinia Store (Auth) │  │
│  │ + Components│  │ (useAuth,    │  │                    │  │
│  │             │  │  useSession) │  │                    │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────┘  │
│         └────────────────┼────────────────────┘              │
│                          │ $fetch / useFetch                 │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼───────────────────────────────────┐
│                    Nuxt 3 Server (SSR)                        │
│  ┌───────────────────────┼────────────────────────────────┐  │
│  │              /api/* Server Routes                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │  │
│  │  │ Auth     │  │ Session  │  │ Feedback          │    │  │
│  │  │ Handlers │  │ Handlers │  │ Handlers          │    │  │
│  │  └──────────┘  └──────────┘  └───────────────────┘    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │  │
│  │  │ Insight  │  │ Admin    │  │ Vote              │    │  │
│  │  │ Handlers │  │ Handlers │  │ Handlers          │    │  │
│  │  └──────────┘  └──────────┘  └───────────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │ Middleware        │  │ Utils                            │  │
│  │ - auth.ts         │  │ - jwt.ts (토큰 생성/검증)        │  │
│  │ - role-guard.ts   │  │ - claude.ts (AI API 호출)       │  │
│  └──────────────────┘  │ - validation.ts (입력 검증)      │  │
│                         └──────────────────────────────────┘  │
│                                    │                          │
│              ┌─────────────────────┼──────────────┐          │
│              │                     │              │          │
│              ▼                     ▼              ▼          │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Prisma ORM       │  │ Claude API   │  │ bcrypt       │   │
│  │       │          │  │ (외부 서비스) │  │ (비밀번호    │   │
│  │       ▼          │  │              │  │  해싱)       │   │
│  │ ┌────────────┐   │  └──────────────┘  └──────────────┘   │
│  │ │  SQLite    │   │                                        │
│  │ │  (파일 DB) │   │                                        │
│  │ └────────────┘   │                                        │
│  └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

**데이터 흐름 요약:**
1. 클라이언트(Vue 3 페이지)에서 `useFetch`/`$fetch`로 API 호출
2. Nuxt Server Routes에서 요청 수신, JWT 미들웨어로 인증/인가 검증
3. Prisma ORM을 통해 SQLite DB 조회/저장
4. AI 기능 요청 시 Claude API 호출 후 결과 반환
5. SSR로 초기 페이지 렌더링, 이후 클라이언트 사이드 하이드레이션

---

## 3. 디렉토리 구조

```
retrolens/
├── nuxt.config.ts                 # Nuxt 설정
├── package.json
├── tsconfig.json
├── tailwind.config.ts             # Tailwind 설정
├── prisma/
│   ├── schema.prisma              # 데이터 모델 정의
│   ├── migrations/                # DB 마이그레이션
│   └── seed.ts                    # 초기 데이터 (관리자 계정 등)
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.post.ts   # 회원가입         FEAT-000
│   │   │   ├── login.post.ts      # 로그인           FEAT-000
│   │   │   └── me.get.ts          # 현재 사용자 조회  FEAT-000
│   │   ├── teams/
│   │   │   ├── join.post.ts       # 팀 합류           FEAT-000
│   │   │   ├── index.get.ts       # 팀 목록 (관리자)  FEAT-010
│   │   │   ├── index.post.ts      # 팀 생성 (관리자)  FEAT-010
│   │   │   ├── [id].put.ts        # 팀 수정 (관리자)  FEAT-010
│   │   │   ├── [id].delete.ts     # 팀 삭제 (관리자)  FEAT-010
│   │   │   └── [id]/
│   │   │       └── members.get.ts # 팀원 목록         FEAT-010
│   │   ├── sessions/
│   │   │   ├── index.get.ts       # 세션 목록          FEAT-001
│   │   │   ├── index.post.ts      # 세션 생성          FEAT-001
│   │   │   ├── [id].get.ts        # 세션 상세          FEAT-001
│   │   │   └── [id]/
│   │   │       ├── close.patch.ts   # 세션 마감         FEAT-001
│   │   │       ├── feedbacks.get.ts # 피드백 목록       FEAT-002
│   │   │       ├── feedbacks.post.ts # 피드백 제출(익명) FEAT-002
│   │   │       ├── stats.get.ts     # 참여 현황         FEAT-003
│   │   │       ├── insights.get.ts  # 인사이트 조회     FEAT-005
│   │   │       ├── insights.post.ts # AI 인사이트 생성  FEAT-005
│   │   │       ├── insights.delete.ts # 인사이트 삭제   FEAT-005
│   │   │       ├── actions.get.ts   # 액션 아이템 목록  FEAT-008
│   │   │       ├── actions.post.ts  # 액션 아이템 생성  FEAT-008
│   │   │       └── history.get.ts   # 활동 이력         FEAT-009
│   │   ├── ai/
│   │   │   └── transform.post.ts  # AI 문체 변환 (폴백: 원문 반환) FEAT-002-1
│   │   ├── feedbacks/
│   │   │   └── [id]/
│   │   │       ├── vote.post.ts   # 투표               FEAT-006
│   │   │       └── vote.delete.ts # 투표 취소           FEAT-006
│   │   ├── actions/
│   │   │   └── [id].patch.ts      # 액션 아이템 상태 변경 FEAT-008
│   │   ├── insights/
│   │   │   ├── [id]/
│   │   │   │   └── share.patch.ts # 인사이트 공유 토글  FEAT-007
│   │   │   └── shared.get.ts      # 공유된 인사이트 목록 FEAT-007
│   │   └── admin/
│   │       ├── users/
│   │       │   ├── index.get.ts   # 사용자 목록         FEAT-011
│   │       │   └── [id].put.ts    # 사용자 역할/상태 변경 FEAT-011
│   │       └── stats.get.ts       # 전체 통계           FEAT-012
│   ├── middleware/
│   │   └── auth.ts                # JWT 인증 미들웨어
│   └── utils/
│       ├── jwt.ts                 # JWT 유틸리티
│       ├── prisma.ts              # Prisma 클라이언트 싱글톤
│       ├── claude.ts              # Claude API 클라이언트
│       └── validation.ts          # 서버 입력 검증
├── pages/
│   ├── login.vue                  # SCR-000 로그인
│   ├── register.vue               # SCR-000-1 회원가입
│   ├── join.vue                   # SCR-000-2 팀 합류
│   ├── index.vue                  # SCR-001 홈 (세션 목록)
│   ├── new.vue                    # SCR-002 세션 생성
│   ├── session/
│   │   └── [id]/
│   │       ├── index.vue          # SCR-003 피드백 입력
│   │       └── dashboard.vue      # SCR-004 대시보드
│   ├── insights/
│   │   └── shared.vue             # SCR-005 공유된 인사이트
│   └── admin/
│       ├── index.vue              # SCR-006 관리자 대시보드
│       ├── teams.vue              # SCR-007 팀 관리
│       └── users.vue              # SCR-008 사용자 관리
├── components/
│   ├── common/
│   │   ├── GNB.vue                # 상단 네비게이션 바
│   │   ├── LoadingSpinner.vue     # 로딩 스피너
│   │   ├── ConfirmDialog.vue      # 확인 다이얼로그
│   │   ├── Toast.vue              # 토스트 알림
│   │   ├── EmptyState.vue         # 빈 상태 안내
│   │   └── Badge.vue              # 상태 뱃지
│   ├── auth/
│   │   └── AuthForm.vue           # 로그인/회원가입 공통 폼
│   ├── session/
│   │   ├── SessionCard.vue        # 세션 목록 카드
│   │   └── SessionForm.vue        # 세션 생성 폼
│   ├── feedback/
│   │   ├── FeedbackForm.vue       # 피드백 입력 폼
│   │   ├── FeedbackCard.vue       # 피드백 카드 (투표 포함)
│   │   ├── CategoryTabs.vue       # K/P/T 카테고리 탭
│   │   └── StyleTransformModal.vue # AI 문체 변환 모달
│   ├── insight/
│   │   ├── InsightPanel.vue       # 인사이트 표시 패널
│   │   └── SharedInsightCard.vue  # 공유 인사이트 카드
│   └── admin/
│       ├── StatsCard.vue          # 통계 요약 카드
│       ├── TeamTable.vue          # 팀 관리 테이블
│       └── UserTable.vue          # 사용자 관리 테이블
├── composables/
│   ├── useAuth.ts                 # 인증 상태 관리
│   ├── useSession.ts              # 세션 데이터 관리
│   ├── useFeedback.ts             # 피드백 데이터 관리
│   └── useToast.ts                # 토스트 알림 관리
├── middleware/
│   ├── auth.global.ts             # 전역 인증 가드
│   ├── team-required.ts           # 팀 배정 필수 가드
│   ├── leader-only.ts             # 팀장 이상 권한 가드
│   └── admin-only.ts              # 최고관리자 권한 가드
├── layouts/
│   ├── default.vue                # 기본 레이아웃 (GNB 포함)
│   └── auth.vue                   # 인증 레이아웃 (GNB 없음)
├── types/
│   └── index.ts                   # 공통 타입 정의
├── tests/
│   ├── unit/
│   │   ├── server/                # API 핸들러 단위 테스트
│   │   └── composables/           # Composable 단위 테스트
│   └── setup.ts                   # 테스트 설정
└── .env                           # 환경 변수 (JWT_SECRET, ANTHROPIC_API_KEY 등)
```

### 화면 ID - 페이지 매핑

| 화면 ID | 화면명 | 페이지 파일 | 라우트 경로 |
|---------|--------|------------|------------|
| SCR-000 | 로그인 | `pages/login.vue` | `/login` |
| SCR-000-1 | 회원가입 | `pages/register.vue` | `/register` |
| SCR-000-2 | 팀 합류 | `pages/join.vue` | `/join` |
| SCR-001 | 홈 | `pages/index.vue` | `/` |
| SCR-002 | 세션 생성 | `pages/new.vue` | `/new` |
| SCR-003 | 피드백 입력 | `pages/session/[id]/index.vue` | `/session/:id` |
| SCR-003-1 | AI 문체 변환 | `components/feedback/StyleTransformModal.vue` | (모달) |
| SCR-004 | 대시보드 | `pages/session/[id]/dashboard.vue` | `/session/:id/dashboard` |
| SCR-005 | 공유된 인사이트 | `pages/insights/shared.vue` | `/insights/shared` |
| SCR-006 | 관리자 대시보드 | `pages/admin/index.vue` | `/admin` |
| SCR-007 | 팀 관리 | `pages/admin/teams.vue` | `/admin/teams` |
| SCR-008 | 사용자 관리 | `pages/admin/users.vue` | `/admin/users` |

---

## 4. 데이터 모델

### 4.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── 사용자 ───
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt 해시
  name      String
  role      Role     @default(MEMBER)
  isActive  Boolean  @default(true)
  teamId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  team        Team?        @relation(fields: [teamId], references: [id])
  votes       Vote[]
  actionItems ActionItem[] @relation("assignee")
  sessions    Session[]    @relation("creator")
}

enum Role {
  ADMIN   // 최고관리자
  LEADER  // 팀장
  MEMBER  // 팀원
}

// ─── 팀 ───
model Team {
  id         String   @id @default(cuid())
  name       String
  inviteCode String   @unique @default(cuid())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  members  User[]
  sessions Session[]
}

// ─── 회고 세션 ───
model Session {
  id          String        @id @default(cuid())
  title       String
  projectName String
  status      SessionStatus @default(ACTIVE)
  periodStart DateTime?
  periodEnd   DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  teamId      String
  creatorId   String

  team      Team       @relation(fields: [teamId], references: [id])
  creator   User       @relation("creator", fields: [creatorId], references: [id])
  feedbacks Feedback[]
  insights  Insight[]
}

enum SessionStatus {
  ACTIVE  // 진행중
  CLOSED  // 마감
}

// ─── 피드백 (익명 - userId 절대 저장하지 않음!) ───
model Feedback {
  id        String           @id @default(cuid())
  content   String
  category  FeedbackCategory
  sessionId String
  createdAt DateTime         @default(now())

  // 주의: userId 필드 없음! 익명성 보장 핵심 정책
  // 서버에서도 피드백 작성자를 추적할 수 없음

  session     Session      @relation(fields: [sessionId], references: [id])
  votes       Vote[]
  actionItems ActionItem[]
}

enum FeedbackCategory {
  KEEP
  PROBLEM
  TRY
}

// ─── 투표 (실명 - userId 저장) ───
model Vote {
  id         String   @id @default(cuid())
  userId     String
  feedbackId String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id])
  feedback Feedback @relation(fields: [feedbackId], references: [id])

  @@unique([userId, feedbackId]) // 1인 1표 보장
}

// ─── AI 인사이트 ───
model Insight {
  id        String  @id @default(cuid())
  summary   String  // 요약문
  issues    String  // JSON 문자열: [{title, description, action}]
  isShared  Boolean @default(false)
  sessionId String
  createdAt DateTime @default(now())

  session     Session      @relation(fields: [sessionId], references: [id])
  actionItems ActionItem[]
}

// ─── 액션 아이템 ───
model ActionItem {
  id         String           @id @default(cuid())
  content    String
  status     ActionItemStatus @default(PENDING)
  dueDate    DateTime?
  assigneeId String?
  feedbackId String?
  insightId  String?
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  assignee User?     @relation("assignee", fields: [assigneeId], references: [id])
  feedback Feedback? @relation(fields: [feedbackId], references: [id])
  insight  Insight?  @relation(fields: [insightId], references: [id])
}

enum ActionItemStatus {
  PENDING    // 대기
  COMPLETED  // 완료
}
```

### 4.2 엔티티 관계도

```
User ──────────── Team
 │  N:1 (teamId)   │
 │                  │ 1:N
 │                  ▼
 │              Session
 │  1:N (creator)  │
 │                 │ 1:N
 │                 ▼
 │             Feedback ←── (userId 없음! 익명)
 │                │
 │     ┌──────────┼──────────┐
 │     │ 1:N      │ 1:N      │
 │     ▼          ▼          │
 │   Vote      ActionItem    │
 │   (실명)       ▲          │
 │                │          │
 │              Insight ◄────┘
 │                │ 1:N (session)
 │                │
 └────────────────┘

관계 요약:
- Team 1:N User (팀에 여러 팀원)
- Team 1:N Session (팀에 여러 세션)
- User 1:N Session (팀장이 세션 생성)
- Session 1:N Feedback (세션에 여러 피드백)
- Feedback 1:N Vote (피드백에 여러 투표)
- User 1:N Vote (사용자가 여러 투표, 실명)
- Session 1:N Insight (세션에 여러 인사이트)
- Feedback/Insight 1:N ActionItem (액션 아이템 출처)
- User 1:N ActionItem (담당자)

핵심: Feedback 테이블에 userId 없음 (익명성 보장)
핵심: Vote 테이블에 userId 있음 (실명 투표)
```

---

## 5. API 설계

### 5.1 인증 API (FEAT-000)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| POST | `/api/auth/register` | 회원가입 | X | - | `{email, password, name}` | `{user, token}` | FEAT-000 |
| POST | `/api/auth/login` | 로그인 | X | - | `{email, password}` | `{user, token}` | FEAT-000 |
| GET | `/api/auth/me` | 현재 사용자 조회 | O | ALL | - | `{user}` | FEAT-000 |

### 5.2 팀 API (FEAT-000, FEAT-010)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| POST | `/api/teams/join` | 팀 합류 (초대 코드) | O | ALL | `{inviteCode}` | `{team}` | FEAT-000 |
| GET | `/api/teams` | 팀 목록 | O | ADMIN | - | `{teams[]}` | FEAT-010 |
| POST | `/api/teams` | 팀 생성 | O | ADMIN | `{name}` | `{team}` | FEAT-010 |
| PUT | `/api/teams/:id` | 팀 수정 | O | ADMIN | `{name}` | `{team}` | FEAT-010 |
| DELETE | `/api/teams/:id` | 팀 삭제 | O | ADMIN | - | `{success}` | FEAT-010 |
| GET | `/api/teams/:id/members` | 팀원 목록 | O | ADMIN | - | `{members[]}` | FEAT-010 |

### 5.3 세션 API (FEAT-001, FEAT-003, FEAT-004)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| GET | `/api/sessions` | 본인 팀 세션 목록 | O | ALL | - | `{sessions[]}` | FEAT-001 |
| POST | `/api/sessions` | 세션 생성 | O | LEADER+ | `{title, projectName, periodStart?, periodEnd?}` | `{session}` | FEAT-001 |
| GET | `/api/sessions/:id` | 세션 상세 | O | TEAM | - | `{session}` | FEAT-001 |
| PATCH | `/api/sessions/:id/close` | 세션 마감 | O | LEADER+ | - | `{session}` | FEAT-001 |
| GET | `/api/sessions/:id/stats` | 참여 현황 (K/P/T 카운트 + 참여자 수) | O | TEAM | - | `{KEEP, PROBLEM, TRY, participants}` | FEAT-003 |
| GET | `/api/sessions/:id/history` | 세션 활동 이력 | O | TEAM | - | `{activities[]}` | FEAT-009 |

### 5.4 피드백 API (FEAT-002, FEAT-002-1)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| GET | `/api/sessions/:id/feedbacks` | 세션 피드백 목록 | O | TEAM | - | `{feedbacks[]}` | FEAT-002 |
| POST | `/api/sessions/:id/feedbacks` | 피드백 제출 (익명) | O | TEAM | `{category, content, userSessionId?}` | `{feedback}` | FEAT-002 |
| POST | `/api/ai/transform` | AI 문체 변환 (폴백: 원문 반환) | O | TEAM | `{content}` | `{original, transformed, transformFailed}` | FEAT-002-1 |

> **익명성 구현:** `/api/sessions/:id/feedbacks` POST 핸들러에서 JWT로 팀 소속을 검증한 후, DB 저장 시 userId를 의도적으로 제외한다.
>
> **AI 폴백:** `/api/ai/transform`은 Claude API 실패 시 원문을 `transformed`로 반환하고 `transformFailed: true`를 응답한다. 클라이언트는 이 플래그로 사용자에게 원문 제출 여부를 안내한다.

### 5.5 투표 API (FEAT-006)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| POST | `/api/feedbacks/:id/vote` | 투표 | O | TEAM | - | `{vote}` | FEAT-006 |
| DELETE | `/api/feedbacks/:id/vote` | 투표 취소 | O | TEAM | - | `{success}` | FEAT-006 |

### 5.6 인사이트 API (FEAT-005, FEAT-007)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| GET | `/api/sessions/:id/insights` | 인사이트 조회 | O | TEAM | - | `{insight \| null}` | FEAT-005 |
| POST | `/api/sessions/:id/insights` | AI 인사이트 생성 (폴백: 샘플 데이터) | O | LEADER+ | `{useFallback?}` | `{insight} \| {isFallback, preview}` | FEAT-005 |
| DELETE | `/api/sessions/:id/insights` | 인사이트 삭제 | O | LEADER+ | - | `{success}` | FEAT-005 |
| PATCH | `/api/insights/:id/share` | 공유 토글 | O | LEADER+ | `{isShared}` | `{insight}` | FEAT-007 |
| GET | `/api/insights/shared` | 공유된 인사이트 목록 | O | ALL | - | `{insights[]}` | FEAT-007 |

### 5.7 액션 아이템 API (FEAT-008)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| GET | `/api/sessions/:id/actions` | 액션 아이템 목록 | O | TEAM | - | `{actions[]}` | FEAT-008 |
| POST | `/api/sessions/:id/actions` | 액션 아이템 생성 | O | LEADER+ | `{content, issueIndex?, assigneeId?, dueDate?}` | `{action}` | FEAT-008 |
| PATCH | `/api/actions/:id` | 상태/담당자/기한 변경 | O | TEAM | `{status?, assigneeId?, dueDate?}` | `{action}` | FEAT-008 |

### 5.8 관리자 API (FEAT-011, FEAT-012)

| 메서드 | 경로 | 설명 | 인증 | 권한 | 요청 Body | 응답 | 관련 기능 |
|--------|------|------|------|------|----------|------|----------|
| GET | `/api/admin/users` | 사용자 목록 | O | ADMIN | `?search=` | `{users[]}` | FEAT-011 |
| PUT | `/api/admin/users/:id` | 사용자 역할/상태 변경 | O | ADMIN | `{role?, isActive?}` | `{user}` | FEAT-011 |
| GET | `/api/admin/stats` | 전체 통계 | O | ADMIN | - | `{teams, users, sessions, feedbacks, trends}` | FEAT-012 |

### 5.9 권한 약어 설명

| 약어 | 의미 |
|------|------|
| ALL | 로그인한 모든 사용자 |
| TEAM | 해당 팀 소속 사용자 |
| LEADER+ | 팀장 또는 최고관리자 |
| ADMIN | 최고관리자만 |

---

## 6. 컴포넌트 설계

### 6.1 공통 컴포넌트

| 컴포넌트 | 책임 | Props (입력) | Events (출력) | 사용 화면 |
|----------|------|-------------|--------------|----------|
| `GNB` | 상단 네비게이션, 메뉴 렌더링, 권한별 메뉴 표시 | - | - | 전체 (auth 레이아웃 제외) |
| `LoadingSpinner` | 비동기 처리 중 로딩 표시 | `size?: string` | - | 전체 |
| `ConfirmDialog` | 되돌릴 수 없는 작업 전 확인 | `title, message, confirmText, isOpen` | `confirm, cancel` | SCR-003, 007, 008 |
| `Toast` | 성공/실패 일시 알림 | `message, type, duration` | `close` | 전체 |
| `EmptyState` | 데이터 없을 때 안내 + CTA | `message, actionText?, actionTo?` | - | SCR-001, 004, 005 |
| `Badge` | 상태 표시 (진행중/마감, 역할) | `label, variant` | - | SCR-001, 007, 008 |

### 6.2 페이지 컴포넌트

| 컴포넌트 | 책임 | 의존 컴포넌트 | 사용 Composable | 관련 화면 |
|----------|------|-------------|----------------|----------|
| `pages/login.vue` | 로그인 폼, 인증 처리 | `AuthForm` | `useAuth` | SCR-000 |
| `pages/register.vue` | 회원가입 폼, 유효성 검사 | `AuthForm` | `useAuth` | SCR-000-1 |
| `pages/join.vue` | 팀 코드 입력, 합류 처리 | - | `useAuth` | SCR-000-2 |
| `pages/index.vue` | 세션 목록 표시, 세션 생성 진입 | `SessionCard, EmptyState, Badge` | `useSession, useAuth` | SCR-001 |
| `pages/new.vue` | 세션 생성 폼, URL 발급 | `SessionForm` | `useSession` | SCR-002 |
| `pages/session/[id]/index.vue` | 피드백 입력, 카테고리 선택, AI 변환 | `FeedbackForm, CategoryTabs, StyleTransformModal` | `useFeedback` | SCR-003 |
| `pages/session/[id]/dashboard.vue` | 피드백 목록, 인사이트, 투표, 액션 아이템 | `FeedbackCard, InsightPanel, CategoryTabs` | `useFeedback, useSession` | SCR-004 |
| `pages/insights/shared.vue` | 공유 인사이트 목록 | `SharedInsightCard, EmptyState` | - | SCR-005 |
| `pages/admin/index.vue` | 전체 통계, 관리 허브 | `StatsCard` | - | SCR-006 |
| `pages/admin/teams.vue` | 팀 CRUD, 팀원 관리 | `TeamTable, ConfirmDialog` | - | SCR-007 |
| `pages/admin/users.vue` | 사용자 역할/상태 관리 | `UserTable, ConfirmDialog` | - | SCR-008 |

### 6.3 도메인 컴포넌트

| 컴포넌트 | 책임 | Props | Events |
|----------|------|-------|--------|
| `AuthForm` | 로그인/회원가입 공통 폼 렌더링, 유효성 검사 | `mode: 'login' \| 'register'` | `submit(formData)` |
| `SessionCard` | 세션 정보 카드 표시 | `session` | `click` |
| `SessionForm` | 세션 생성 폼 입력 필드 | - | `submit(formData)` |
| `FeedbackForm` | 피드백 내용 입력 + AI 변환 토글 | `sessionId, disabled` | `submit(feedback)` |
| `FeedbackCard` | 피드백 내용 표시 + 투표 버튼 | `feedback, currentUserVote` | `vote(feedbackId)` |
| `CategoryTabs` | K/P/T 카테고리 탭 전환 | `counts: {keep, problem, try}, active` | `change(category)` |
| `StyleTransformModal` | AI 문체 변환 전/후 비교 모달 | `original, isOpen` | `submit(transformed), cancel` |
| `InsightPanel` | AI 인사이트 결과 표시 | `insight, canGenerate, canShare` | `generate, toggleShare` |
| `SharedInsightCard` | 공유된 인사이트 카드 | `insight` | `toggle` |
| `StatsCard` | 통계 수치 카드 | `label, value, icon?` | - |
| `TeamTable` | 팀 목록 테이블 + CRUD 액션 | `teams` | `create, edit, delete, selectTeam` |
| `UserTable` | 사용자 목록 테이블 + 역할/상태 변경 | `users` | `changeRole, toggleActive` |

---

## 7. 에러 처리 전략

### 7.1 에러 코드 체계

| HTTP 상태 | 에러 코드 | 설명 | 사용자 메시지 예시 |
|----------|----------|------|-----------------|
| 400 | `VALIDATION_ERROR` | 입력값 유효성 검사 실패 | "이메일 형식이 올바르지 않습니다" |
| 400 | `INVALID_INVITE_CODE` | 잘못된 팀 초대 코드 | "유효하지 않은 팀 코드입니다" |
| 401 | `UNAUTHORIZED` | 인증 토큰 없음/만료 | "로그인이 필요합니다" |
| 401 | `INVALID_CREDENTIALS` | 이메일/비밀번호 불일치 | "이메일 또는 비밀번호가 올바르지 않습니다" |
| 403 | `FORBIDDEN` | 권한 부족 | "접근 권한이 없습니다" |
| 403 | `TEAM_MISMATCH` | 다른 팀 리소스 접근 | "접근 권한이 없습니다" |
| 403 | `SESSION_CLOSED` | 마감된 세션에 피드백 시도 | "이 세션은 마감되었습니다" |
| 404 | `NOT_FOUND` | 리소스 미발견 | "요청한 데이터를 찾을 수 없습니다" |
| 409 | `DUPLICATE_EMAIL` | 이메일 중복 | "이미 등록된 이메일입니다" |
| 409 | `DUPLICATE_VOTE` | 중복 투표 | "이미 투표한 피드백입니다" |
| 500 | `INTERNAL_ERROR` | 서버 내부 에러 | "일시적인 오류가 발생했습니다" |
| 502 | `AI_SERVICE_ERROR` | Claude API 호출 실패 | "AI 서비스에 일시적인 문제가 있습니다" |

### 7.2 서버 에러 처리

```typescript
// server/utils/error.ts
export function createApiError(statusCode: number, code: string, message: string) {
  return createError({
    statusCode,
    data: { code, message }
  })
}

// 사용 예시: server/api/auth/login.post.ts
throw createApiError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다')
```

**서버 에러 처리 원칙:**
- 모든 API 핸들러에서 try-catch로 예외 포착
- Prisma 에러는 공통 매퍼로 변환 (유니크 제약 위반 -> 409, 레코드 미발견 -> 404)
- Claude API 실패 시 폴백 처리 (문체 변환 실패 -> 원문 반환 + 경고, 인사이트 실패 -> 샘플 데이터)
- 예상치 못한 에러는 500으로 처리, 상세 내용은 서버 로그에만 기록

### 7.3 클라이언트 에러 처리

```typescript
// composables/useApi.ts
export function useApi() {
  const toast = useToast()

  async function request<T>(url: string, options?: any): Promise<T> {
    try {
      return await $fetch<T>(url, options)
    } catch (error: any) {
      const code = error.data?.data?.code || 'INTERNAL_ERROR'
      const message = error.data?.data?.message || '오류가 발생했습니다'

      if (code === 'UNAUTHORIZED') {
        navigateTo('/login')
        return
      }

      toast.error(message)
      throw error
    }
  }

  return { request }
}
```

**클라이언트 에러 처리 원칙:**
- `useApi` 래퍼로 공통 에러 처리 (토스트 알림, 인증 실패 시 로그인 리다이렉트)
- 폼 유효성 검사는 제출 전 클라이언트에서 1차 수행 (서버 검증은 별도 유지)
- 네트워크 에러 시 "네트워크 연결을 확인해주세요" 안내
- AI 기능 에러 시 사용자에게 폴백 옵션 제공 (원문 제출 등)

---

## 8. 보안 고려사항

### 8.1 JWT 인증/인가

| 항목 | 구현 방식 |
|------|----------|
| 토큰 저장 | httpOnly 쿠키 (XSS 방지) |
| 토큰 만료 | 24시간 (해커톤 기준, 운영 시 단축 가능) |
| 토큰 페이로드 | `{userId, role, teamId}` — 최소 정보만 포함 |
| 인증 미들웨어 | 모든 `/api/*` 요청에서 토큰 검증 (`/api/auth/register`, `/api/auth/login` 제외) |
| 권한 검증 | API 핸들러에서 `role` 기반 접근 제어 (ADMIN, LEADER, MEMBER) |

### 8.2 비밀번호 보안

| 항목 | 구현 방식 |
|------|----------|
| 해싱 | bcrypt (salt rounds: 10) |
| 유효성 | 최소 8자, 영문+숫자 조합 (클라이언트 + 서버 이중 검증) |
| 전송 | HTTPS를 통한 암호화 전송 |

### 8.3 피드백 익명성 보장 (핵심 보안 정책)

**구현 원칙:**
1. **DB 레벨:** Feedback 테이블에 userId, userIp 등 식별 가능한 필드를 절대 저장하지 않음
2. **API 레벨:** 피드백 저장 API에서 인증 토큰으로 팀 소속만 검증한 후, 저장 시 사용자 정보를 의도적으로 제외
3. **로그 레벨:** 피드백 제출 요청 로그에 사용자 식별 정보와 피드백 내용을 함께 기록하지 않음
4. **AI 레벨:** AI 문체 변환으로 개인 특유의 말투/표현 제거하여 텍스트 기반 식별도 차단
5. **정책 레벨:** 피드백 제출 후 수정/삭제 불가 (수정/삭제 이력으로 작성자 추적 방지)

```typescript
// server/api/feedbacks/index.post.ts (의사 코드)
export default defineEventHandler(async (event) => {
  const user = event.context.auth  // JWT에서 추출
  const body = await readBody(event)

  // 1. 팀 소속 검증 (인증 목적)
  const session = await prisma.session.findUnique({ where: { id: body.sessionId } })
  if (session.teamId !== user.teamId) throw createApiError(403, 'TEAM_MISMATCH', '...')

  // 2. 피드백 저장 (userId 의도적 제외!)
  await prisma.feedback.create({
    data: {
      content: body.content,
      category: body.category,
      sessionId: body.sessionId
      // userId: 절대 저장하지 않음!
    }
  })

  // 3. 응답에도 사용자 정보 미포함
  return { success: true }
})
```

### 8.4 입력 검증

| 검증 대상 | 검증 항목 |
|----------|----------|
| 이메일 | 형식 유효성 (정규식), 길이 제한 (255자) |
| 비밀번호 | 최소 8자, 영문+숫자 조합, 길이 제한 (128자) |
| 이름 | 필수 입력, 길이 제한 (50자) |
| 피드백 내용 | 필수 입력, 길이 제한 (2000자), XSS 이스케이프 |
| 세션 제목 | 필수 입력, 길이 제한 (200자) |
| 카테고리 | enum 값 검증 (KEEP, PROBLEM, TRY) |
| ID 파라미터 | 형식 검증 (cuid 패턴) |

**검증 위치:** 클라이언트(UX 목적) + 서버(보안 목적) 이중 검증. 서버 검증이 최종 권한.

### 8.5 기타 보안 사항

| 항목 | 대응 |
|------|------|
| XSS | 피드백 등 사용자 입력 HTML 이스케이프, Vue의 기본 이스케이프 활용 |
| CSRF | SameSite 쿠키 속성 + Nuxt의 기본 CSRF 보호 |
| Rate Limiting | AI API 호출 빈도 제한 (비용 관리 + 남용 방지) |
| 환경 변수 | `JWT_SECRET`, `ANTHROPIC_API_KEY` 등 민감 정보는 `.env`에 보관, 코드에 하드코딩 금지 |
| 에러 메시지 | 서버 에러 상세 내용은 로그에만 기록, 클라이언트에는 일반적 메시지 반환 |

---

## 부록: 기능-API-화면 추적 매트릭스

| 기능 ID | 기능명 | API 엔드포인트 | 화면 ID | 우선순위 |
|---------|--------|---------------|---------|---------|
| FEAT-000 | 인증 | `/api/auth/*`, `/api/teams/join` | SCR-000, 000-1, 000-2 | P0 |
| FEAT-001 | 세션 생성 | `/api/sessions`, `/api/sessions/:id`, `/api/sessions/:id/close` | SCR-001, 002 | P0 |
| FEAT-002 | 익명 피드백 | `/api/feedbacks` | SCR-003 | P0 |
| FEAT-002-1 | AI 문체 변환 | `/api/feedbacks/transform` | SCR-003, 003-1 | P0 |
| FEAT-003 | 참여 현황 | `/api/sessions/:id/stats` | SCR-003 | P1 |
| FEAT-004 | 대시보드 | `/api/sessions/:id/dashboard` | SCR-004 | P0 |
| FEAT-005 | AI 인사이트 | `/api/sessions/:id/insights` | SCR-004 | P0 |
| FEAT-006 | 투표 | `/api/feedbacks/:id/vote` | SCR-004 | P1 |
| FEAT-007 | 인사이트 공유 | `/api/insights/:id/share`, `/api/insights/shared` | SCR-004, 005 | P1 |
| FEAT-008 | 액션 아이템 | `/api/sessions/:id/actions`, `/api/actions/:id` | SCR-004 | P1 |
| FEAT-009 | 히스토리 비교 | (대시보드 API 확장) | SCR-004 | P1 |
| FEAT-010 | 팀 관리 | `/api/teams/*` | SCR-007 | P1 |
| FEAT-011 | 사용자 관리 | `/api/admin/users/*` | SCR-008 | P1 |
| FEAT-012 | 전체 통계 | `/api/admin/stats` | SCR-006 | P1 |
