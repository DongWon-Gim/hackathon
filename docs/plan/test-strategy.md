# RetroLens 테스트 전략 문서

- **작성일:** 2026-03-14
- **기반 문서:** PRD v1.2.0, architecture.md v1.0.0, screen-plan.md v1.0.0, plan-2/changes.md, plan-2/api.md
- **버전:** 1.0.0

---

## 1. 테스트 도구 선정

| 구분 | 도구 | 선정 근거 |
|------|------|----------|
| 단위 테스트 | Vitest | Vite 기반 빠른 실행, Nuxt 3와 호환성 우수, TypeScript 네이티브 지원, 기존 기술 스택에 이미 포함 |
| 통합 테스트 | Vitest + `@nuxt/test-utils` | Nuxt Server Routes를 직접 호출하는 통합 테스트 지원, 별도 서버 불필요 |
| E2E 테스트 | Playwright | 해커톤 특성상 설치 간편, Chromium 내장, Nuxt 공식 지원, 시나리오 기반 테스트 직관적 |
| 커버리지 | c8 (Vitest 내장) | Vitest에 기본 포함, 별도 설정 최소화, Istanbul 호환 리포트 포맷 지원 |
| 모킹 | Vitest (vi.mock) | prisma 클라이언트, Claude API, JWT 유틸 모킹에 사용, 별도 라이브러리 불필요 |

---

## 2. 테스트 범위

| 계층 | 테스트 대상 | 우선순위 | 커버리지 목표 |
|------|-----------|:--------:|:-----------:|
| 단위 | JWT 유틸, 입력 검증, 인증 API 핸들러, 피드백 API 핸들러, 인사이트 API 핸들러, 액션 아이템 API | P0 | 80% |
| 단위 | useAuth composable, useFeedback composable | P0 | 70% |
| 통합 | 인증 플로우 (회원가입→로그인→me), 피드백 제출 익명성, 투표 중복 방지, 인사이트 생성 | P0 | 70% |
| 통합 | 액션 아이템 CRUD, 세션 CRUD, 팀 관리 API | P1 | 60% |
| E2E | 신규 가입→팀 합류→홈 진입 시나리오 | P1 | 핵심 흐름 |
| E2E | 피드백 제출 (AI 변환 ON/OFF), 대시보드 조회, 인사이트 생성 시나리오 | P1 | 핵심 흐름 |

**우선순위 기준:**
- P0 기능(FEAT-000, FEAT-001, FEAT-002, FEAT-002-1, FEAT-004, FEAT-005)의 단위/통합 테스트를 우선 작성한다.
- 단위 테스트 → 통합 테스트 → E2E 테스트 순서로 작성한다.
- 해커톤 목표: 핵심 비즈니스 로직 50% 이상 커버리지 달성.

---

## 3. 테스트 케이스 설계

### FEAT-000: 인증 (로그인/회원가입)

---

#### TC-001
- **TC ID:** TC-001
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 유효한 입력으로 회원가입 성공 시 user 객체와 JWT 토큰을 반환한다
- **사전 조건:** DB에 동일 이메일 없음
- **입력:** `{ email: "test@example.com", password: "password123", name: "테스트" }`
- **기대 결과:** HTTP 201, `{ user: { id, email, name, role: "MEMBER" }, token: string }`
- **우선순위:** P0

#### TC-002
- **TC ID:** TC-002
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 이미 등록된 이메일로 회원가입 시 409 DUPLICATE_EMAIL 에러를 반환한다
- **사전 조건:** 동일 이메일 사용자가 DB에 존재
- **입력:** `{ email: "existing@example.com", password: "password123", name: "테스트" }`
- **기대 결과:** HTTP 409, `{ code: "DUPLICATE_EMAIL" }`
- **우선순위:** P0

#### TC-003
- **TC ID:** TC-003
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 비밀번호가 8자 미만일 때 회원가입 시 400 VALIDATION_ERROR를 반환한다
- **사전 조건:** 없음
- **입력:** `{ email: "test@example.com", password: "abc123", name: "테스트" }`
- **기대 결과:** HTTP 400, `{ code: "VALIDATION_ERROR" }`
- **우선순위:** P0

#### TC-004
- **TC ID:** TC-004
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 이메일 형식이 잘못된 경우 회원가입 시 400 VALIDATION_ERROR를 반환한다
- **사전 조건:** 없음
- **입력:** `{ email: "not-an-email", password: "password123", name: "테스트" }`
- **기대 결과:** HTTP 400, `{ code: "VALIDATION_ERROR" }`
- **우선순위:** P0

#### TC-005
- **TC ID:** TC-005
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 올바른 이메일/비밀번호로 로그인 성공 시 user 객체와 JWT 토큰을 반환한다
- **사전 조건:** 해당 이메일의 사용자가 DB에 존재
- **입력:** `{ email: "test@example.com", password: "password123" }`
- **기대 결과:** HTTP 200, `{ user, token: string }`
- **우선순위:** P0

#### TC-006
- **TC ID:** TC-006
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 잘못된 비밀번호로 로그인 시 401 INVALID_CREDENTIALS 에러를 반환한다
- **사전 조건:** 해당 이메일의 사용자가 DB에 존재
- **입력:** `{ email: "test@example.com", password: "wrongpassword" }`
- **기대 결과:** HTTP 401, `{ code: "INVALID_CREDENTIALS" }`
- **우선순위:** P0

#### TC-007
- **TC ID:** TC-007
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 비활성화된 사용자 계정으로 로그인 시 401을 반환한다
- **사전 조건:** isActive: false인 사용자가 DB에 존재
- **입력:** `{ email: "inactive@example.com", password: "password123" }`
- **기대 결과:** HTTP 401, `{ code: "UNAUTHORIZED" }` 또는 `INVALID_CREDENTIALS`
- **우선순위:** P1

#### TC-008
- **TC ID:** TC-008
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 유효한 JWT 토큰으로 /api/auth/me 호출 시 현재 사용자 정보를 반환한다
- **사전 조건:** 유효한 JWT 토큰
- **입력:** Authorization 헤더에 유효한 토큰
- **기대 결과:** HTTP 200, `{ user: { id, email, name, role, teamId } }`
- **우선순위:** P0

#### TC-009
- **TC ID:** TC-009
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** JWT 토큰 없이 인증 필요 API 호출 시 401 UNAUTHORIZED를 반환한다
- **사전 조건:** 없음
- **입력:** 토큰 없이 `/api/auth/me` 호출
- **기대 결과:** HTTP 401, `{ code: "UNAUTHORIZED" }`
- **우선순위:** P0

#### TC-010
- **TC ID:** TC-010
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 유효한 팀 초대 코드로 팀 합류 성공 시 team 정보를 반환한다
- **사전 조건:** 팀이 DB에 존재하고 해당 inviteCode를 가짐
- **입력:** `{ inviteCode: "valid-invite-code" }`
- **기대 결과:** HTTP 200, `{ team: { id, name } }`
- **우선순위:** P0

#### TC-011
- **TC ID:** TC-011
- **관련 기능:** FEAT-000
- **테스트 유형:** 단위
- **설명:** 잘못된 팀 초대 코드로 합류 시도 시 400 INVALID_INVITE_CODE 에러를 반환한다
- **사전 조건:** 해당 코드의 팀이 존재하지 않음
- **입력:** `{ inviteCode: "invalid-code" }`
- **기대 결과:** HTTP 400, `{ code: "INVALID_INVITE_CODE" }`
- **우선순위:** P0

#### TC-012
- **TC ID:** TC-012
- **관련 기능:** FEAT-000
- **테스트 유형:** 통합
- **설명:** 회원가입 → 로그인 → me 조회 전체 플로우가 정상 동작한다
- **사전 조건:** 빈 DB
- **입력:** 순서대로 register, login, me API 호출
- **기대 결과:** 각 단계 성공, me 응답의 user 정보가 회원가입 정보와 일치
- **우선순위:** P0

---

### FEAT-001: 회고 세션 생성

---

#### TC-013
- **TC ID:** TC-013
- **관련 기능:** FEAT-001
- **테스트 유형:** 단위
- **설명:** 팀장 권한으로 세션 생성 시 세션 객체와 고유 ID를 반환한다
- **사전 조건:** LEADER 역할의 사용자, 팀 존재
- **입력:** `{ title: "Sprint 12 회고", projectName: "RetroLens" }`
- **기대 결과:** HTTP 201, `{ session: { id, title, projectName, status: "ACTIVE" } }`
- **우선순위:** P0

#### TC-014
- **TC ID:** TC-014
- **관련 기능:** FEAT-001
- **테스트 유형:** 단위
- **설명:** 팀원(MEMBER) 권한으로 세션 생성 시도 시 403 FORBIDDEN을 반환한다
- **사전 조건:** MEMBER 역할의 사용자
- **입력:** `{ title: "Sprint 12 회고", projectName: "RetroLens" }`
- **기대 결과:** HTTP 403, `{ code: "FORBIDDEN" }`
- **우선순위:** P0

#### TC-015
- **TC ID:** TC-015
- **관련 기능:** FEAT-001
- **테스트 유형:** 단위
- **설명:** 세션 제목 없이 세션 생성 시도 시 400 VALIDATION_ERROR를 반환한다
- **사전 조건:** LEADER 역할의 사용자
- **입력:** `{ projectName: "RetroLens" }` (title 누락)
- **기대 결과:** HTTP 400, `{ code: "VALIDATION_ERROR" }`
- **우선순위:** P0

#### TC-016
- **TC ID:** TC-016
- **관련 기능:** FEAT-001
- **테스트 유형:** 단위
- **설명:** 팀장이 ACTIVE 상태 세션을 마감 처리 시 status가 CLOSED로 변경된다
- **사전 조건:** LEADER 역할, ACTIVE 상태 세션 존재
- **입력:** POST `/api/sessions/:id/close`
- **기대 결과:** HTTP 200, `{ session: { status: "CLOSED" } }`
- **우선순위:** P0

#### TC-017
- **TC ID:** TC-017
- **관련 기능:** FEAT-001
- **테스트 유형:** 단위
- **설명:** 세션 목록 조회 시 현재 사용자의 팀 세션만 반환한다
- **사전 조건:** 사용자가 팀에 소속, 다른 팀의 세션도 DB에 존재
- **입력:** GET `/api/sessions`
- **기대 결과:** HTTP 200, 응답에 본인 팀 세션만 포함
- **우선순위:** P0

---

### FEAT-002: 익명 피드백 입력

---

#### TC-018
- **TC ID:** TC-018
- **관련 기능:** FEAT-002
- **테스트 유형:** 단위
- **설명:** 피드백 제출 시 DB에 userId 없이 저장되고, 응답에도 userId가 없다
- **사전 조건:** ACTIVE 상태 세션, 팀 소속 사용자
- **입력:** `{ sessionId, category: "KEEP", content: "좋은 점이 있습니다" }`
- **기대 결과:** HTTP 201, DB에 저장된 Feedback 레코드에 userId 필드가 null/undefined
- **우선순위:** P0

#### TC-019
- **TC ID:** TC-019
- **관련 기능:** FEAT-002
- **테스트 유형:** 단위
- **설명:** 마감된 세션에 피드백 제출 시 403 SESSION_CLOSED를 반환한다
- **사전 조건:** CLOSED 상태 세션
- **입력:** `{ sessionId: closedSessionId, category: "KEEP", content: "내용" }`
- **기대 결과:** HTTP 403, `{ code: "SESSION_CLOSED" }`
- **우선순위:** P0

#### TC-020
- **TC ID:** TC-020
- **관련 기능:** FEAT-002
- **테스트 유형:** 단위
- **설명:** 다른 팀의 세션에 피드백 제출 시 403 TEAM_MISMATCH를 반환한다
- **사전 조건:** 다른 팀의 ACTIVE 세션
- **입력:** `{ sessionId: otherTeamSessionId, category: "KEEP", content: "내용" }`
- **기대 결과:** HTTP 403, `{ code: "TEAM_MISMATCH" }`
- **우선순위:** P0

#### TC-021
- **TC ID:** TC-021
- **관련 기능:** FEAT-002
- **테스트 유형:** 단위
- **설명:** 유효하지 않은 카테고리 값으로 피드백 제출 시 400 VALIDATION_ERROR를 반환한다
- **사전 조건:** ACTIVE 상태 세션
- **입력:** `{ sessionId, category: "INVALID", content: "내용" }`
- **기대 결과:** HTTP 400, `{ code: "VALIDATION_ERROR" }`
- **우선순위:** P0

#### TC-022
- **TC ID:** TC-022
- **관련 기능:** FEAT-002
- **테스트 유형:** 단위
- **설명:** 2000자를 초과하는 피드백 내용 제출 시 400 VALIDATION_ERROR를 반환한다
- **사전 조건:** ACTIVE 상태 세션
- **입력:** `{ sessionId, category: "KEEP", content: "a".repeat(2001) }`
- **기대 결과:** HTTP 400, `{ code: "VALIDATION_ERROR" }`
- **우선순위:** P1

#### TC-023
- **TC ID:** TC-023
- **관련 기능:** FEAT-002
- **테스트 유형:** 통합
- **설명:** 동일 세션에 카테고리별 다중 피드백 제출 시 모두 저장된다
- **사전 조건:** ACTIVE 상태 세션
- **입력:** KEEP 1개, PROBLEM 2개, TRY 1개 피드백 순차 제출
- **기대 결과:** DB에 4개 Feedback 레코드 저장, 각 userId 없음
- **우선순위:** P0

---

### FEAT-002-1: AI 문체 변환

---

#### TC-024
- **TC ID:** TC-024
- **관련 기능:** FEAT-002-1
- **테스트 유형:** 단위
- **설명:** 유효한 텍스트로 변환 요청 시 변환된 텍스트를 반환한다 (Claude API 모킹)
- **사전 조건:** Claude API 모킹 설정
- **입력:** `{ content: "배포할 때마다 30분씩 걸리는 거 진짜 미치겠음... ㅠㅠ" }`
- **기대 결과:** HTTP 200, `{ transformed: "배포 프로세스에 약 30분이 소요되어 개선이 필요합니다." }` (모킹된 응답)
- **우선순위:** P0

#### TC-025
- **TC ID:** TC-025
- **관련 기능:** FEAT-002-1
- **테스트 유형:** 단위
- **설명:** Claude API 호출 실패 시 원본 텍스트를 폴백으로 반환한다
- **사전 조건:** Claude API 에러 응답 모킹
- **입력:** `{ content: "원본 텍스트" }`
- **기대 결과:** HTTP 200, `{ transformed: "원본 텍스트" }` (폴백)
- **우선순위:** P0

#### TC-026
- **TC ID:** TC-026
- **관련 기능:** FEAT-002-1
- **테스트 유형:** 단위
- **설명:** 빈 텍스트로 변환 요청 시 400 VALIDATION_ERROR를 반환한다
- **사전 조건:** 없음
- **입력:** `{ content: "" }`
- **기대 결과:** HTTP 400, `{ code: "VALIDATION_ERROR" }`
- **우선순위:** P1

---

### FEAT-004: 팀 대시보드

---

#### TC-027
- **TC ID:** TC-027
- **관련 기능:** FEAT-004
- **테스트 유형:** 단위
- **설명:** 대시보드 조회 시 해당 세션의 전체 피드백을 카테고리별로 반환한다
- **사전 조건:** 세션에 KEEP 2개, PROBLEM 3개, TRY 1개 피드백 존재
- **입력:** GET `/api/sessions/:id/dashboard`
- **기대 결과:** HTTP 200, feedbacks 배열에 6개 항목, 각 항목에 category, content 포함
- **우선순위:** P0

#### TC-028
- **TC ID:** TC-028
- **관련 기능:** FEAT-004
- **테스트 유형:** 단위
- **설명:** 다른 팀의 세션 대시보드 접근 시 403 TEAM_MISMATCH를 반환한다
- **사전 조건:** 다른 팀 소속 세션
- **입력:** GET `/api/sessions/otherTeamSessionId/dashboard`
- **기대 결과:** HTTP 403, `{ code: "TEAM_MISMATCH" }`
- **우선순위:** P0

#### TC-029
- **TC ID:** TC-029
- **관련 기능:** FEAT-004
- **테스트 유형:** 단위
- **설명:** 피드백이 없는 세션의 대시보드 조회 시 빈 배열을 반환한다
- **사전 조건:** 피드백이 없는 세션
- **입력:** GET `/api/sessions/:id/dashboard`
- **기대 결과:** HTTP 200, `{ feedbacks: [], insight: null }`
- **우선순위:** P0

---

### FEAT-005: AI 인사이트 생성

---

#### TC-030
- **TC ID:** TC-030
- **관련 기능:** FEAT-005
- **테스트 유형:** 단위
- **설명:** 팀장이 충분한 피드백이 있는 세션에서 인사이트 생성 요청 시 성공한다 (Claude API 모킹)
- **사전 조건:** LEADER 권한, 세션에 피드백 최소 1개 이상, Claude API 응답 모킹
- **입력:** POST `/api/insights/generate` `{ sessionId }`
- **기대 결과:** HTTP 201, `{ insight: { summary, issues: [...], isShared: false } }`
- **우선순위:** P0

#### TC-031
- **TC ID:** TC-031
- **관련 기능:** FEAT-005
- **테스트 유형:** 단위
- **설명:** 팀원(MEMBER) 권한으로 인사이트 생성 시도 시 403 FORBIDDEN을 반환한다
- **사전 조건:** MEMBER 역할의 사용자
- **입력:** POST `/api/insights/generate` `{ sessionId }`
- **기대 결과:** HTTP 403, `{ code: "FORBIDDEN" }`
- **우선순위:** P0

#### TC-032
- **TC ID:** TC-032
- **관련 기능:** FEAT-005
- **테스트 유형:** 단위
- **설명:** Claude API 호출 실패 시 502 AI_SERVICE_ERROR를 반환한다
- **사전 조건:** LEADER 권한, Claude API 에러 응답 모킹
- **입력:** POST `/api/insights/generate` `{ sessionId }`
- **기대 결과:** HTTP 502, `{ code: "AI_SERVICE_ERROR" }`
- **우선순위:** P0

#### TC-033
- **TC ID:** TC-033
- **관련 기능:** FEAT-005
- **테스트 유형:** 단위
- **설명:** 인사이트의 issues 필드가 유효한 JSON 배열로 파싱된다
- **사전 조건:** 인사이트가 DB에 저장된 상태
- **입력:** Insight 조회
- **기대 결과:** issues 필드가 JSON.parse 가능한 문자열이며 배열 구조
- **우선순위:** P0

---

### FEAT-006: 피드백 투표

---

#### TC-034
- **TC ID:** TC-034
- **관련 기능:** FEAT-006
- **테스트 유형:** 단위
- **설명:** 처음 투표 시 Vote 레코드가 생성되고 투표 수가 1 증가한다
- **사전 조건:** 피드백 존재, 해당 사용자의 투표 없음
- **입력:** POST `/api/votes` `{ feedbackId }`
- **기대 결과:** HTTP 201, `{ vote: { userId, feedbackId } }`
- **우선순위:** P1

#### TC-035
- **TC ID:** TC-035
- **관련 기능:** FEAT-006
- **테스트 유형:** 단위
- **설명:** 동일 피드백에 중복 투표 시도 시 409 DUPLICATE_VOTE를 반환한다
- **사전 조건:** 해당 사용자가 이미 해당 피드백에 투표
- **입력:** POST `/api/votes` `{ feedbackId }`
- **기대 결과:** HTTP 409, `{ code: "DUPLICATE_VOTE" }`
- **우선순위:** P1

#### TC-036
- **TC ID:** TC-036
- **관련 기능:** FEAT-006
- **테스트 유형:** 단위
- **설명:** 투표 취소 시 Vote 레코드가 삭제된다
- **사전 조건:** 해당 사용자의 투표 레코드 존재
- **입력:** DELETE `/api/votes` `{ feedbackId }`
- **기대 결과:** HTTP 200, `{ success: true }`
- **우선순위:** P1

---

### FEAT-007: 인사이트 공유

---

#### TC-037
- **TC ID:** TC-037
- **관련 기능:** FEAT-007
- **테스트 유형:** 단위
- **설명:** 팀장이 인사이트 공유 ON 설정 시 isShared가 true로 변경된다
- **사전 조건:** LEADER 권한, 인사이트 존재 (isShared: false)
- **입력:** PUT `/api/insights/:id/share` `{ isShared: true }`
- **기대 결과:** HTTP 200, `{ insight: { isShared: true } }`
- **우선순위:** P1

#### TC-038
- **TC ID:** TC-038
- **관련 기능:** FEAT-007
- **테스트 유형:** 단위
- **설명:** 공유된 인사이트 목록에는 isShared: true인 인사이트만 포함된다
- **사전 조건:** isShared: true 1개, isShared: false 1개 인사이트 존재
- **입력:** GET `/api/insights/shared`
- **기대 결과:** HTTP 200, 응답에 공유 인사이트만 포함
- **우선순위:** P1

---

### FEAT-008: 액션 아이템 (plan-2 변경 포함)

---

#### TC-039
- **TC ID:** TC-039
- **관련 기능:** FEAT-008
- **테스트 유형:** 단위
- **설명:** 팀장이 액션 아이템 생성 시 sessionId가 저장되고 올바른 응답을 반환한다 (plan-2 변경)
- **사전 조건:** LEADER 권한, 세션 존재
- **입력:** POST `/api/sessions/:id/actions` `{ content: "CI/CD 파이프라인 개선", issueIndex: 0 }`
- **기대 결과:** HTTP 201, `{ actionItem: { id, content, sessionId, issueIndex: 0 } }`
- **우선순위:** P1

#### TC-040
- **TC ID:** TC-040
- **관련 기능:** FEAT-008
- **테스트 유형:** 단위
- **설명:** 액션 아이템 목록 조회 시 sessionId 기반 단일 쿼리로 올바른 결과를 반환한다 (plan-2 변경)
- **사전 조건:** 세션에 액션 아이템 2개 존재
- **입력:** GET `/api/sessions/:id/actions`
- **기대 결과:** HTTP 200, `{ actions: [ { sessionId, issueIndex, ... }, ... ] }`
- **우선순위:** P1

#### TC-041
- **TC ID:** TC-041
- **관련 기능:** FEAT-008
- **테스트 유형:** 단위
- **설명:** 액션 아이템 상태 변경(PATCH) 시 session 직접 포함으로 팀 검증이 올바르게 동작한다 (plan-2 변경)
- **사전 조건:** 액션 아이템 존재 (sessionId 직접 저장), 팀 소속 사용자
- **입력:** PATCH `/api/actions/:id` `{ status: "COMPLETED" }`
- **기대 결과:** HTTP 200, `{ actionItem: { status: "COMPLETED" } }`
- **우선순위:** P1

#### TC-042
- **TC ID:** TC-042
- **관련 기능:** FEAT-008
- **테스트 유형:** 단위
- **설명:** 다른 팀의 액션 아이템 상태 변경 시도 시 403 TEAM_MISMATCH를 반환한다
- **사전 조건:** 다른 팀의 세션에 속한 액션 아이템
- **입력:** PATCH `/api/actions/:id` `{ status: "COMPLETED" }`
- **기대 결과:** HTTP 403, `{ code: "TEAM_MISMATCH" }`
- **우선순위:** P1

---

### 서버 유틸리티 단위 테스트

---

#### TC-043
- **TC ID:** TC-043
- **관련 기능:** FEAT-000 (공통)
- **테스트 유형:** 단위
- **설명:** JWT 토큰 생성 후 검증 시 동일한 페이로드를 반환한다
- **사전 조건:** JWT_SECRET 환경변수 설정
- **입력:** `{ userId: "user1", role: "MEMBER", teamId: "team1" }`
- **기대 결과:** 생성된 토큰 검증 시 동일한 payload 반환
- **우선순위:** P0

#### TC-044
- **TC ID:** TC-044
- **관련 기능:** FEAT-000 (공통)
- **테스트 유형:** 단위
- **설명:** 만료된 JWT 토큰 검증 시 에러를 발생시킨다
- **사전 조건:** 만료된 토큰 (expiresIn: -1s)
- **입력:** 만료된 JWT 토큰
- **기대 결과:** 토큰 검증 함수가 에러를 throw
- **우선순위:** P0

#### TC-045
- **TC ID:** TC-045
- **관련 기능:** FEAT-000 (공통)
- **테스트 유형:** 단위
- **설명:** 변조된 JWT 토큰 검증 시 에러를 발생시킨다
- **사전 조건:** 없음
- **입력:** 서명이 잘못된 토큰
- **기대 결과:** 토큰 검증 함수가 에러를 throw
- **우선순위:** P0

---

### E2E 시나리오 테스트

---

#### TC-046
- **TC ID:** TC-046
- **관련 기능:** FEAT-000, SCR-000, SCR-000-1, SCR-000-2, SCR-001
- **테스트 유형:** E2E
- **설명:** 신규 사용자가 회원가입 → 로그인 → 팀 합류 → 홈 화면 진입까지 정상 완료된다
- **사전 조건:** 팀과 초대 코드가 DB에 존재
- **입력:** 브라우저 시나리오 (회원가입 폼 입력 → 로그인 → 팀 코드 입력)
- **기대 결과:** SCR-001 홈 화면이 표시되고 팀 세션 목록이 로드됨
- **우선순위:** P1

#### TC-047
- **TC ID:** TC-047
- **관련 기능:** FEAT-002, FEAT-002-1, SCR-003, SCR-003-1
- **테스트 유형:** E2E
- **설명:** 팀원이 AI 문체 변환 OFF로 피드백을 작성하고 제출하면 성공 메시지가 표시된다
- **사전 조건:** 로그인된 팀원, ACTIVE 세션
- **입력:** Problem 탭 선택 → 피드백 입력 → AI 변환 OFF → 제출
- **기대 결과:** "피드백이 제출되었습니다" 토스트 메시지 표시, 피드백 카운트 업데이트
- **우선순위:** P1

#### TC-048
- **TC ID:** TC-048
- **관련 기능:** FEAT-002-1, SCR-003-1
- **테스트 유형:** E2E
- **설명:** AI 문체 변환 ON 상태에서 피드백 제출 시 모달이 표시되고 변환 결과를 확인할 수 있다
- **사전 조건:** 로그인된 팀원, ACTIVE 세션
- **입력:** 피드백 입력 → AI 변환 ON → 제출 버튼 클릭
- **기대 결과:** AI 문체 변환 미리보기 모달이 표시되고, 원본/변환 텍스트 모두 노출
- **우선순위:** P1

#### TC-049
- **TC ID:** TC-049
- **관련 기능:** FEAT-005, SCR-004
- **테스트 유형:** E2E
- **설명:** 팀장이 대시보드에서 인사이트 생성 버튼을 클릭하면 로딩 후 인사이트가 표시된다
- **사전 조건:** 로그인된 팀장, 피드백이 있는 세션
- **입력:** 대시보드 접근 → "인사이트 생성" 버튼 클릭
- **기대 결과:** 로딩 스피너 표시 후 요약문, 핵심 이슈 목록이 렌더링됨
- **우선순위:** P1

---

## 4. 테스트 디렉토리 구조

아키텍처의 디렉토리 구조와 plan-2 변경 사항을 반영한 테스트 파일 배치:

```
tests/
├── unit/
│   ├── server/
│   │   ├── auth/
│   │   │   ├── register.test.ts       # TC-001~004 (회원가입)
│   │   │   ├── login.test.ts          # TC-005~007 (로그인)
│   │   │   └── me.test.ts             # TC-008~009 (me 조회)
│   │   ├── teams/
│   │   │   └── join.test.ts           # TC-010~011 (팀 합류)
│   │   ├── sessions/
│   │   │   ├── sessions.test.ts       # TC-013~017 (세션 CRUD)
│   │   │   └── dashboard.test.ts      # TC-027~029 (대시보드)
│   │   ├── feedbacks/
│   │   │   ├── feedbacks.test.ts      # TC-018~023 (익명 피드백)
│   │   │   └── transform.test.ts      # TC-024~026 (AI 문체 변환)
│   │   ├── votes/
│   │   │   └── votes.test.ts          # TC-034~036 (투표)
│   │   ├── insights/
│   │   │   ├── generate.test.ts       # TC-030~033 (인사이트 생성)
│   │   │   └── share.test.ts          # TC-037~038 (인사이트 공유)
│   │   └── actions/
│   │       └── actions.test.ts        # TC-039~042 (액션 아이템, plan-2)
│   ├── utils/
│   │   └── jwt.test.ts                # TC-043~045 (JWT 유틸)
│   └── composables/
│       ├── useAuth.test.ts            # useAuth 상태 관리 테스트
│       └── useFeedback.test.ts        # useFeedback 상태 관리 테스트
├── integration/
│   └── api/
│       ├── auth-flow.test.ts          # TC-012 (회원가입→로그인→me 통합)
│       └── feedback-anonymous.test.ts # TC-023 (익명 피드백 통합)
├── e2e/
│   └── scenarios/
│       ├── auth.spec.ts               # TC-046 (가입→로그인→팀합류→홈)
│       ├── feedback.spec.ts           # TC-047~048 (피드백 제출)
│       └── dashboard.spec.ts          # TC-049 (대시보드 + 인사이트)
├── fixtures/
│   ├── users.ts                       # 테스트용 사용자 픽스처
│   ├── teams.ts                       # 테스트용 팀 픽스처
│   ├── sessions.ts                    # 테스트용 세션 픽스처
│   └── feedbacks.ts                   # 테스트용 피드백 픽스처
└── helpers/
    ├── db.ts                          # 테스트 DB 초기화/정리 헬퍼
    ├── auth.ts                        # 테스트용 JWT 생성 헬퍼
    └── mocks.ts                       # prisma, claude API 모킹 헬퍼
```

---

## 5. 테스트 실행 전략

### 5.1 로컬 실행 명령어

```bash
# 전체 테스트 실행 (단위 + 통합)
npm run test

# 단위 테스트만 실행
npm run test:unit

# 통합 테스트만 실행
npm run test:integration

# E2E 테스트 실행 (개발 서버 필요)
npm run test:e2e

# 커버리지 리포트 생성
npm run test:coverage

# 특정 파일 실행
npx vitest run tests/unit/server/auth/register.test.ts

# 와치 모드 (개발 중 실시간 실행)
npx vitest watch
```

### 5.2 package.json 스크립트 정의 (권장)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### 5.3 CI 환경 실행

```bash
# CI에서 테스트 DB를 인메모리로 사용하기 위해 환경변수 오버라이드
DATABASE_URL=file:./test.db JWT_SECRET=test-secret npm run test

# E2E는 CI에서 헤드리스 모드로 실행
npx playwright test --reporter=github
```

### 5.4 커버리지 리포트 생성

```bash
# HTML 리포트 생성 (coverage/ 디렉토리)
npx vitest run --coverage --reporter=html

# 터미널 요약 출력
npx vitest run --coverage --reporter=text-summary
```

커버리지 임계값 (`vitest.config.ts` 설정):
```typescript
coverage: {
  thresholds: {
    lines: 50,      // 해커톤 목표
    functions: 50,
    branches: 50,
  }
}
```

### 5.5 테스트 실행 순서

1. **단위 테스트** — 외부 의존성 없이 빠르게 실행 (prisma, claude API 모킹)
2. **통합 테스트** — 테스트 전용 SQLite DB 사용, 각 테스트 전 DB 초기화
3. **E2E 테스트** — 개발 서버 실행 후 Playwright로 브라우저 시나리오 실행

> E2E 테스트는 시간이 가장 오래 걸리므로, PR 검증 시에는 단위+통합만 실행하고 E2E는 선택적으로 실행한다.

---

## 6. 기능-테스트케이스 추적 매트릭스

| 기능 ID | 기능명 | TC ID | 우선순위 |
|---------|--------|-------|---------|
| FEAT-000 | 인증 | TC-001~012, TC-043~045 | P0 |
| FEAT-001 | 세션 생성 | TC-013~017 | P0 |
| FEAT-002 | 익명 피드백 | TC-018~023 | P0 |
| FEAT-002-1 | AI 문체 변환 | TC-024~026 | P0 |
| FEAT-004 | 팀 대시보드 | TC-027~029 | P0 |
| FEAT-005 | AI 인사이트 | TC-030~033 | P0 |
| FEAT-006 | 피드백 투표 | TC-034~036 | P1 |
| FEAT-007 | 인사이트 공유 | TC-037~038 | P1 |
| FEAT-008 | 액션 아이템 (plan-2 포함) | TC-039~042 | P1 |
| E2E 시나리오 | 핵심 사용자 플로우 | TC-046~049 | P1 |

| 화면 ID | 화면명 | 관련 TC |
|---------|--------|--------|
| SCR-000 | 로그인 | TC-005~006, TC-046 |
| SCR-000-1 | 회원가입 | TC-001~004, TC-046 |
| SCR-000-2 | 팀 합류 | TC-010~011, TC-046 |
| SCR-001 | 홈 | TC-017, TC-046 |
| SCR-002 | 세션 생성 | TC-013~016 |
| SCR-003 | 피드백 입력 | TC-018~023, TC-047 |
| SCR-003-1 | AI 문체 변환 모달 | TC-024~026, TC-048 |
| SCR-004 | 대시보드 | TC-027~029, TC-030~033, TC-049 |
| SCR-005 | 공유된 인사이트 | TC-037~038 |
