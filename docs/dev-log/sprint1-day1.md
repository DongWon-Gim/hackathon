# Sprint 1 — Day 1 개발 로그 (2026-03-13 후반 ~ 2026-03-14 전반)

## 개요
Sprint 1: 투표, 인사이트 공유, 실시간 폴링, AI 폴백 등 P1 기능 완성.
Sprint 0 코드리뷰 결과 반영 및 버그 수정.

---

## 커밋 이력

### `1cd6d14` — 피드백 입력 페이지 실시간 카운트 폴링 (TASK-027)
- K/P/T 별 제출 수를 5초 간격으로 자동 갱신
- `useFetch` + `refreshInterval` 활용
- 세션 마감 후에는 폴링 중단

### `f379aa6` — 피드백 투표 API (TASK-028)
- `POST /api/feedbacks/:id/vote` — 1인 1표 제한 (중복 시 DUPLICATE_VOTE)
- `DELETE /api/feedbacks/:id/vote` — 투표 취소
- Vote 테이블에 userId 저장 (실명 투표, 피드백과 분리)

### `4eb1b15` — 투표 버튼 UI + 정렬 (TASK-029)
- 피드백 카드에 좋아요 버튼 (내가 투표한 경우 하이라이트)
- 투표순/최신순 정렬 토글
- 낙관적 업데이트 패턴 적용

### `9ff2a00` — 인사이트 공유 API (TASK-030, 031)
- `PATCH /api/insights/:id/share` — isShared 토글
- `GET /api/insights/shared` — 팀 전체 공유 인사이트 목록

### `bec853e` — 공유 인사이트 목록 화면 (TASK-031)
- `pages/insights/shared.vue` — 공유된 인사이트 카드 목록
- 인사이트 상세 (요약 + 이슈 목록) 표시

### `1019f1b` — 대시보드 5초 폴링 (TASK-027)
- 대시보드 피드백/투표 데이터 5초 자동 갱신
- 팀원이 실시간으로 제출한 피드백 반영

### `e90f4de` — AI 인사이트 폴백 구현
- Claude API 실패 시 피드백 기반 임시 인사이트 생성 (`buildFallback`)
- PROBLEM 피드백 우선 3개 + TRY 피드백 2개로 이슈 구성
- HTTP 에러 대신 `{ isFallback: true, preview }` 반환

### `b95639d` — Sprint 0 코드리뷰 Critical/Important 이슈 수정
- LEADER 권한 체크 강화
- 입력 검증 누락 엔드포인트 보완

### `c6a1b9c` — 세션 목록 인사이트 공유 표시
- 홈 화면 세션 카드에 인사이트 공유 뱃지 추가

### `1ff5abc` — Sprint 0 코드리뷰 문서화
- `docs/code-review-sprint0.md` 생성
- Critical/Important/Minor 이슈 분류 및 해결 여부 기록

---

## 커밋 이력 (2026-03-14)

### `2243685` / `c900b93` — Sprint 2 API + 프론트엔드 구현
- 액션 아이템 CRUD: `GET/POST /api/sessions/:id/actions`, `PATCH /api/actions/:id`
- 히스토리: `GET /api/sessions/:id/history`
- 대시보드 액션 아이템 섹션 (체크박스 토글, 담당자/기한 표시)

### `1715366` / `3ee0585` / `2f859b4` — 런타임 버그 수정
- `readBody` 스트림 소비 순서 오류 수정 (DB 쿼리 전에 먼저 호출)
- `readBody` undefined 반환 시 빈 객체 폴백
- `generateInsight` JSON 파싱 시 마크다운 코드블록 제거

### `482385` / `d7e924` — UI 개선
- AI 인사이트 실패 시 "임시 데이터 사용" 선택 모달
- 인사이트 삭제 버튼 추가
- 세션 카드 상태별 배경색 차별화 (ACTIVE: 흰색, CLOSED: 회색)
- 인사이트 완료 세션 카드 테두리 강조

### `88c84de` — Sprint 1/2 코드리뷰 반영
- 액션 아이템 접근 권한 강화
- 응답 필드 일관성 개선

### `f6adf61` — 새로고침 로그아웃 버그 수정
- `useAuth`의 `useState` 초기화 타이밍 문제
- 페이지 새로고침 시 `/api/auth/me` 재호출로 세션 복원

---

## 주요 기술 결정

| 결정 | 이유 |
|------|------|
| AI 폴백 buildFallback | Claude API 장애 시에도 팀장이 인사이트 생성 완료 가능 |
| `isFallback: true` 플래그 | 클라이언트가 임시 데이터임을 UI로 명시할 수 있도록 |
| 대시보드 5초 폴링 | WebSocket 대신 단순 폴링 — 해커톤 환경에서 안정성 우선 |
| 낙관적 투표 업데이트 | 서버 응답 전에 UI 즉시 반영하여 반응성 향상 |
