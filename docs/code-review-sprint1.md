# Sprint 1 코드리뷰 (1ff5abc ~ c6a1b9c)

**리뷰일:** 2026-03-13
**리뷰어:** Claude Code (code-reviewer agent)

---

## 커밋 1 — 1cd6d14: 피드백 입력 페이지 실시간 카운트 폴링 (TASK-027)

### 잘 된 점
- `onMounted`/`onUnmounted`로 인터벌 생명주기 정확히 관리
- ACTIVE 세션에만 폴링 실행 (`session.value?.status === 'ACTIVE'` 조건)

---

## 커밋 2 — f379aa6: 피드백 투표 API 구현 (TASK-028)

### 잘 된 점
- DB 레벨 `@@unique([userId, feedbackId])` 제약으로 중복 투표 이중 방어
- `TEAM_MISMATCH` 체크로 타 팀 피드백 접근 차단

### 이슈 (리뷰 후 수정됨)
- **[Important] 마감 세션 투표 차단 없음** — `SESSION_CLOSED` 체크 누락 → **b95639d에서 수정**

---

## 커밋 3 — 4eb1b15: 투표 버튼 UI 및 투표순/최신순 정렬 (TASK-029)

### 잘 된 점
- 투표순 정렬은 클라이언트 computed로 처리 (불필요한 API 재호출 없음)
- 본인 투표 여부(`hasVoted`)에 따른 버튼 색상 구분

### 이슈 (리뷰 후 수정됨)
- **[Important] votingId 단일 string** — 다른 항목 동시 투표 가능 → **b95639d에서 Set으로 수정**
- **[Important] 대시보드 폴링이 CLOSED 세션에서도 실행** → **b95639d에서 수정**

---

## 커밋 4 — 9ff2a00: 인사이트 공유 토글 API + 공유 인사이트 목록 API (TASK-030, 031)

### 잘 된 점
- `PATCH` 사용 (아키텍처 문서의 `PUT`보다 의미상 더 정확)
- `LEADER`/`ADMIN` 권한 체크 일관 적용

### 이슈 (리뷰 후 수정됨)
- **[Critical] shared.get.ts — `teamId` 필터로 크로스팀 공유 기능 무력화** → **b95639d에서 수정**
- **[Critical] shared.get.ts — `JSON.parse` 예외 미처리** → 손상 행 존재 시 전체 500 → **b95639d에서 수정**
- **[Important] share.patch.ts — `isShared` 런타임 boolean 검증 없음** → **b95639d에서 수정**
- **[Important] shared.vue — 팀명 미표시** (TASK-031 완료 조건 미달) → **b95639d에서 수정**

---

## 커밋 5 — bec853e: 공유 인사이트 목록 화면 (TASK-031)

### 잘 된 점
- `toggle()` 함수에서 `new Set(expanded.value)`로 Vue 반응형 트리거 정확히 처리

---

## 커밋 6 — 1019f1b: 대시보드 피드백/투표 폴링 추가

### 잘 된 점
- 투표 진행 중 폴링 스킵으로 UI 충돌 방지

---

## 커밋 7 — e90f4de: AI 인사이트 생성 실패 시 폴백

### 잘 된 점
- AI 오류 시 에러 반환 대신 피드백 기반 임시 인사이트 생성
- summary에 임시 인사이트임을 명시하여 사용자 혼동 방지
- PROBLEM → TRY 우선순위로 이슈 구성 (최대 5개)

### 코드 품질
- **[Suggestion] 폴백 인사이트의 `title`이 "개선 필요" / "시도 제안"으로 고정** — 피드백 수가 많을 때 카드가 단조로워질 수 있음

---

## 커밋 8 — b95639d: 코드리뷰 Critical/Important 이슈 수정

| 이슈 | 수정 내용 |
|------|-----------|
| shared.get.ts teamId 필터 | 제거 → 전체 공유 인사이트 노출 |
| JSON.parse 예외 | try/catch 래핑 |
| 마감 세션 투표 | SESSION_CLOSED 체크 추가 |
| isShared 검증 | typeof boolean 검사 |
| ACTIVE 세션만 폴링 | session.status 조건 추가 |
| votingId → Set | 동시 다중 투표 방어 |
| 팀명 미표시 | API에 team name 포함, 카드에 노출 |

---

## 커밋 9 — c6a1b9c: 세션 목록 인사이트 공유 여부 표시

### 잘 된 점
- sessions API에서 `insights` 조회 후 `hasSharedInsight` boolean으로 노출 (최소 데이터)
- `take: 1`로 불필요한 전체 조회 방지

---

## 수정 완료 목록

| # | 이슈 | 상태 |
|---|------|------|
| 1 | shared.get.ts 크로스팀 공유 무력화 (Critical) | **수정됨** |
| 2 | shared.get.ts JSON.parse 예외 미처리 (Critical) | **수정됨** |
| 3 | 마감 세션 투표 차단 없음 (Important) | **수정됨** |
| 4 | isShared 런타임 검증 없음 (Important) | **수정됨** |
| 5 | 대시보드 폴링 CLOSED 세션에서도 실행 (Important) | **수정됨** |
| 6 | votingId 단일값 동시 투표 허용 (Important) | **수정됨** |
| 7 | 공유 인사이트 카드 팀명 미표시 (Important) | **수정됨** |

## 미수정 (해커톤 이후)

| # | 이슈 | 우선순위 |
|---|------|---------|
| 1 | 폴백 인사이트 title 고정값 | Suggestion |
| 2 | categories 상수 중복 (index.vue / dashboard.vue) | Suggestion |
| 3 | "Latest" 정렬이 API 기본 순서에 묵시적 의존 | Suggestion |
