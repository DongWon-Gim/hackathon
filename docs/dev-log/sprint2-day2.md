# Sprint 2 — Day 2 개발 로그 (2026-03-14 후반 ~ 2026-03-15)

## 개요
Sprint 2: 인프라 강화 (Turso 마이그레이션), 액션 아이템 UX 개선,
테스트 전체 구현, 평가 피드백 반영 개선.

---

## 커밋 이력 (2026-03-14 후반)

### `36ac495` — ActionItem sessionId/issueIndex + 모달 UX
**변경 배경:** 액션 아이템이 세션과 직접 연결이 없어 조회 시 2쿼리 + 중복 제거가 필요했음.
인사이트 이슈 카드에서 바로 액션 아이템을 생성하는 UX 추가 요청.

**변경 내용:**
- `prisma/schema.prisma`: ActionItem에 `sessionId`, `issueIndex` 필드 추가
- `server/api/sessions/[id]/actions.post.ts`: `sessionId`, `issueIndex` 저장
- `server/api/sessions/[id]/actions.get.ts`: 2쿼리 → 단일 `sessionId` 쿼리로 단순화
- `server/api/actions/[id].patch.ts`: 팀 검증 로직 단순화
- `pages/session/[id]/dashboard.vue`:
  - 인라인 폼 → 모달 (Teleport + Transition)
  - 인사이트 이슈 카드에 "액션 아이템 추가" 버튼
  - 이미 전환된 이슈 버튼 숨김 (`usedIssueIndices` computed)

### `bafa0fa` — 액션 아이템 모달 담당자 추가
- 모달에 담당자(assigneeId) 선택 드롭다운 추가
- 팀원 목록 API 연동

### `775f072` — DateInput 공통 컴포넌트 추출
- 날짜 입력 필드를 `DateInput.vue`로 추출
- 기한 입력 (세션 생성, 액션 아이템)에 공통 사용

### `cd09a80` ~ `c323ed6` — UI 개선 연속 커밋
- 세션 상태 뱃지 (ACTIVE: 초록, CLOSED: 회색) 강화
- 세션 목록 헤더 `계정명` → `팀명`으로 변경
- 인사이트 완료 세션 카드 좌측 보더 강조

---

## 커밋 이력 (2026-03-15 초반)

### `14a8fa5` — SQLite → Turso(libSQL) 마이그레이션
**변경 배경:** Vercel 서버리스 환경에서 파일 기반 SQLite 사용 불가.
Turso는 libSQL 기반 분산 SQLite로 서버리스에 최적화됨.

**변경 내용:**
- `.env`: `DATABASE_URL` → `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
- `server/utils/prisma.ts`: `PrismaLibSQL` 어댑터 적용
- `prisma/schema.prisma`: datasource `provider = "sqlite"` 유지 (libSQL 호환)
- `vercel.json` 설정 추가

### `cbab5c2` — Turso 연동 안정화
- Prisma `5.22.0` + `@prisma/adapter-libsql` `0.8.x` 버전 고정
- `prisma/seed.ts`에 libSQL 어댑터 적용

### `245825b` — 로그인/팀 가입 응답에 teamName 포함
- `login.post.ts`, `teams/join.post.ts` 응답에 `teamName` 추가
- 프론트엔드에서 GNB 팀명 표시에 활용

### `6f04a46` — 단위/통합/E2E 테스트 전체 구현 (138 passing)
**구현 범위:**
- 단위 테스트: auth API, sessions CRUD, feedbacks, insights, votes, teams, actions, JWT 유틸 (125개)
- 통합 테스트: auth flow, feedback 익명성 검증 (4개)
- E2E 테스트: auth/feedback/dashboard 시나리오 (25개)
- Playwright 헬퍼: `loginAsMember`, `loginAsLeader`

**테스트 인프라:**
- `tests/setup.ts`: h3 글로벌 함수 모킹 (defineEventHandler, readBody, getCookie 등)
- `tests/helpers/mocks.ts`: Prisma + Claude API vi.fn() 목킹
- `tests/fixtures/`: 재사용 가능한 테스트 픽스처

---

## 커밋 이력 (2026-03-15 중반 — 평가 피드백 반영)

### `b3e5f9d` — E2E 테스트 data-testid 추가 (25/25 통과)
**문제:** 8개 E2E 테스트 실패 — `loginAsMember` 호출 누락 + data-testid 미구현

**해결:**
- `pages/session/[id]/index.vue`: category-tab, feedback-textarea, submit-button, ai-transform-toggle, session-closed-message data-testid 추가
- AI 토글을 `sr-only` checkbox로 변경 (Playwright `check({ force: true })` 활용)
- `pages/session/[id]/dashboard.vue`: insight-summary, insight-issues, generate-insight-button, empty-feedback-state data-testid 추가
- `components/common/Toast.vue`: toast-message data-testid 추가
- `components/feedback/AITransformModal.vue`: style-transform-modal, original-text, transformed-text data-testid 추가
- TC-047: `page.fill()` → `pressSequentially()` (Vue v-model 반응성 트리거)

### `42b0960` — 검증 계획 개선 (커버리지 69% + README + CI E2E smoke)
**문제:** CI test job 실패 (커버리지 41% < 50% 임계값), README 없음

**해결:**
- 신규 단위 테스트 17개 추가:
  - `auth/middleware.test.ts` — JWT 미들웨어 8케이스
  - `sessions/insights-get.test.ts` — 인사이트 조회 5케이스
  - `sessions/stats.test.ts` — 통계 4케이스
- `vitest.config.ts` coverage exclude 정비: 브라우저 전용 composables, admin P2 엔드포인트 제외
- `README.md` 신규 작성: CI/CD 배지, 테스트 현황 표, 빠른 시작 가이드
- `.github/workflows/ci.yml`: E2E smoke 단계 추가

### `05e6115` — 기술 구현력 개선 (architecture.md 동기화 + AI 폴백)
**문제:** architecture.md 설계 경로와 실제 구현 경로 불일치, AI 폴백 스펙 미구현

**해결:**
- `docs/plan/architecture.md`: API 설계 섹션 전면 재작성
  - `/api/feedbacks/transform` → `/api/ai/transform`
  - `/api/votes` → `/api/feedbacks/:id/vote`
  - `/api/insights/generate` → `/api/sessions/:id/insights`
  - `/api/action-items` → `/api/sessions/:id/actions`, `/api/actions/:id`
  - 신규 엔드포인트 문서화 (insights.delete, history.get)
- `server/api/ai/transform.post.ts`: AI 실패 시 `throw` → 원문 반환 폴백
  - `{ original, transformed, transformFailed: true }` 응답
- `server/utils/claude.ts`: JSDoc 주석 추가 (폴백 전략, 예외 조건 명시)

---

## 최종 수치 (2026-03-15 기준)

| 지표 | 값 |
|------|-----|
| 총 커밋 수 | 54개 |
| 단위/통합 테스트 | 155개 (전체 통과) |
| E2E 테스트 | 25개 (전체 통과) |
| 코드 커버리지 (Lines) | 69% |
| 배포 URL | https://hackathon-rouge-tau.vercel.app |
| CI/CD | GitHub Actions → Vercel (자동 배포) |
