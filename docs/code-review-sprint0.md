# Sprint 0 코드리뷰 (dd30492 ~ 43714d6)

**리뷰일:** 2026-03-13
**리뷰어:** Claude Code (code-reviewer agent)

---

## 커밋 1 — dd30492: 패키지 설치 및 기반 설정

### 보안 이슈
- **[Critical] JWT secret 미검증** — `useRuntimeConfig().jwtSecret`이 undefined면 에러 없이 서명됨 → **수정 완료** (폴백값 추가)
- **[Important] AUTH 미들웨어 Bearer prefix** — `replace('Bearer ', '')`로 처리하나, 정규식 `/^Bearer\s+/`가 더 안전

### 버그
- **[Bug] claude.ts JSON 파싱 미처리** — `generateInsight()`의 `JSON.parse`가 마크다운 코드블록 포함 시 실패 가능

---

## 커밋 2 — d13c837: 인증 API

### 보안 이슈
- **[Critical] teams/join — 팀 중복 가입 미차단** — 이미 팀이 있는 사용자가 다른 팀으로 변경 가능 → **수정 완료** (join.vue 리다이렉트)
- **[Important] logout — 쿠키 삭제 옵션 불일치** — `deleteCookie`에 `httpOnly`, `secure`, `sameSite` 옵션 미전달

### 코드 품질
- **[Suggestion] me.get.ts — isActive 체크 누락** — 비활성화 계정이 기존 JWT로 /api/auth/me 호출 가능

---

## 커밋 3 — b246852: 세션 CRUD API

### 보안 이슈
- **[Important] 세션 마감 시 ALREADY_CLOSED 체크 없음** — 이미 마감된 세션 재마감 시 불필요한 DB 쓰기

### 버그
- **[Bug] sessions/index.post.ts — 날짜 입력 검증 없음** — `new Date('garbage')`가 Invalid Date 생성

---

## 커밋 4 — d9b9967: 피드백/인사이트/AI/통계 API

### 잘 된 점
- `feedbacks.post.ts`에서 `userId` 완전 배제 — 익명성 설계 원칙 완벽 준수
- `feedbacks.get.ts` 응답에서 `userSessionId` 제외 — 클라이언트에 익명 식별자 미노출

### 보안 이슈
- **[Critical] insights.post.ts — 세션당 인사이트 중복 생성 무제한** — 서버 측 방어 없음, API 직접 호출 시 Claude API 비용 폭증 가능

### 버그
- **[Bug] stats.get.ts — userSessionId null 피드백 참여자 집계 누락**
- **[Bug] insights.get.ts — JSON.parse 예외 미처리** → DB 데이터 손상 시 500

---

## 커밋 5 — 3f8fab6: 라이트 그린 테마

### 코드 품질
- **[Suggestion] keep/success/accent 세 토큰이 동일 색상(#16a34a)** — 의도적이면 CSS 변수로 통일 권장

---

## 커밋 6 — 2c1b4b7: 레이아웃 + 모바일 GNB

### 보안 이슈
- **[Important] useAuth.ts — 모듈 스코프 ref SSR 상태 오염** → **수정 완료** (useState로 교체)

### 잘 된 점
- GNB 모바일 전환을 CSS transform으로 처리 (DOM 추가/제거 없음)
- `watch(route.path)`로 모바일 링크 클릭 시 사이드바 자동 닫힘

---

## 커밋 7 — bafb195: 페이지 UI 개선

### 버그
- **[Critical] admin/teams.vue — deleteTeam method: 'POST'** → DELETE여야 함 → **수정 완료**
- **[Bug] admin/teams.vue — `/api/teams`, `/api/teams/:id` 엔드포인트 미구현** — CRUD 기능 동작 불가

---

## 커밋 8 — 43714d6: 피드백 입력 + 대시보드

### 버그
- **[Critical] dashboard.vue — 인사이트 생성 API 경로 오류** (`/api/insights/generate` → `/api/sessions/{id}/insights`) → **수정 완료**
- **[Critical] insights.get.ts — 배열 반환으로 인해 빈 배열 truthy 문제** → **수정 완료** (단일 객체/null 반환)
- **[Bug] textarea maxlength="2000" vs 서버 500자 검증 불일치** → **수정 완료**
- **[Bug] AITransformModal — 중복 제출 방지 로직 없음**

---

## 수정 완료 목록

| # | 이슈 | 상태 |
|---|------|------|
| 1 | 인사이트 API 경로 오류 | **수정됨** |
| 2 | insights.get.ts 배열→단일 객체 | **수정됨** |
| 3 | admin/teams.vue DELETE 메서드 | **수정됨** |
| 4 | textarea maxlength 불일치 | **수정됨** |
| 5 | JWT secret 미설정 폴백 | **수정됨** |
| 6 | 팀 중복 가입 차단 | **수정됨** |
| 7 | useAuth SSR 상태 오염 | **수정됨** |

## 미수정 (해커톤 이후)

| # | 이슈 | 우선순위 |
|---|------|---------|
| 1 | AITransformModal 중복 제출 방지 | Important |
| 2 | 인사이트 중복 생성 서버 방어 | Important |
| 3 | insights JSON.parse try/catch | Suggestion |
| 4 | stats userSessionId null 집계 | Suggestion |
| 5 | admin/teams API 미구현 | Sprint 2 |
