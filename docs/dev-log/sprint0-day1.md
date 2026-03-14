# Sprint 0 — Day 1 개발 로그 (2026-03-13)

## 개요
해커톤 1일차. 프로젝트 초기 설정부터 핵심 백엔드 API, 프론트엔드 기초 UI까지 구현.

---

## 커밋 이력

### `e49c670` — 프로젝트 초기 설정
- Nuxt 3 + TypeScript + Tailwind CSS 프로젝트 생성
- Prisma 스키마 초안 (User, Team, Session, Feedback, Vote, Insight, ActionItem)
- 기본 레이아웃 구조 (default.vue, auth.vue)
- 환경변수 설정 (.env.example)

### `dd30492` — 패키지 설치 및 기반 설정
- 의존성: `@prisma/client`, `jsonwebtoken`, `bcrypt`, `@anthropic-ai/sdk`
- `server/utils/jwt.ts` — JWT 서명/검증 유틸
- `server/utils/prisma.ts` — Prisma 클라이언트 싱글톤
- `server/middleware/auth.ts` — JWT 인증 미들웨어 (공개 라우트 제외)
- `server/utils/error.ts` — 통일된 API 에러 코드/메시지

### `d13c837` — 인증 API 구현
- `POST /api/auth/register` — 회원가입 (bcrypt 해싱, JWT 발급)
- `POST /api/auth/login` — 로그인 (httpOnly 쿠키 세팅)
- `POST /api/auth/logout` — 로그아웃 (쿠키 삭제)
- `GET /api/auth/me` — 현재 사용자 조회
- `POST /api/teams/join` — 초대 코드로 팀 합류

### `b246852` — 회고 세션 CRUD API
- `GET/POST /api/sessions` — 세션 목록 조회 / 생성 (LEADER 권한)
- `GET /api/sessions/:id` — 세션 상세
- `PATCH /api/sessions/:id/close` — 세션 마감 (LEADER 권한)
- 활성 세션 중복 생성 차단 로직

### `d9b9967` — 피드백/인사이트/AI/통계 API 구현
- `POST /api/sessions/:id/feedbacks` — 익명 피드백 제출 (userId 비저장)
- `GET /api/sessions/:id/feedbacks` — 피드백 목록 (투표 수 포함)
- `POST /api/ai/transform` — AI 문체 변환 (Claude Haiku)
- `POST /api/sessions/:id/insights` — AI 인사이트 생성
- `GET /api/sessions/:id/stats` — K/P/T 카운트 + 참여자 수

### `3f8fab6` ~ `bafb195` — 테마 + 레이아웃 + 페이지 UI
- 라이트 그린 테마 (`bg-base`, `bg-surface`, `accent-*` 커스텀 색상)
- 모바일 반응형 GNB (사이드바 슬라이드, 햄버거 버튼)
- 로그인/회원가입 페이지 UI

### `43714d6` — 피드백 입력 + 대시보드 페이지 구현
- `pages/session/[id]/index.vue` — K/P/T 탭 + 텍스트 입력 + AI 변환 토글
- `pages/session/[id]/dashboard.vue` — 피드백 카드 그리드 + 인사이트 섹션
- Toast 알림 컴포넌트

### `49a1a40` / `6f2d742` — 버그 수정
- API 경로 오기재 수정
- JWT secret 미설정 시 폴백
- 팀 중복 가입 차단

### `c34d339` — useAuth 리팩토링
- 모듈 스코프 `ref` → `useState` 교체 (SSR 하이드레이션 불일치 해결)

---

## 주요 기술 결정

| 결정 | 이유 |
|------|------|
| Feedback에 userId 비저장 | DB 레벨 익명성 보장 — 핵심 차별점 |
| httpOnly 쿠키 인증 | XSS 토큰 탈취 방지 |
| Claude Haiku 선택 | 빠른 응답 속도 + 비용 효율, 문체 변환에 충분한 품질 |
| Prisma 싱글톤 | 서버리스 환경에서 커넥션 풀 낭비 방지 |
