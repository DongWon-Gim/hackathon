# RetroLens — 테스트·CI/CD·모니터링 완료 보고서

- **작성일:** 2026-03-15
- **대상 평가 항목:** 검증 계획 (테스트 전략 + CI/CD 및 자동화)

---

## 1. 테스트 최종 현황

### 1.1 테스트 수량 및 통과 현황

| 구분 | 파일 수 | 테스트 수 | 통과 | 실패 |
|------|:------:|:--------:|:----:|:----:|
| 단위 (Vitest) | 18 | 151 | 151 | 0 |
| 통합 (Vitest) | 2 | 4 | 4 | 0 |
| E2E (Playwright) | 3 | 25 | 25 | 0 |
| **합계** | **23** | **180** | **180** | **0** |

### 1.2 커버리지 달성 현황

| 지표 | 임계값 | 달성값 |
|------|:------:|:------:|
| Lines | 50% | **69%** |
| Functions | 50% | **69%** |
| Branches | 50% | **64%** |

**커버리지 측정 범위:** `server/api/**`, `server/utils/**`, `server/middleware/**`

**브라우저 코드 제외 이유 및 대체 검증:**
- `composables/`, `pages/`, `components/` — Nuxt 런타임 컨텍스트(useState, useCookie 등) 없이 Node.js에서 실행 불가
- 대체 검증: Playwright E2E 25개 시나리오가 전체 사용자 플로우를 브라우저에서 직접 검증

### 1.3 TC 설계 대비 구현 추적

| TC 범위 | 설계 | 구현 |
|---------|:----:|:----:|
| TC-001~012 (인증) | 12개 | ✅ 구현 |
| TC-013~017 (세션) | 5개 | ✅ 구현 |
| TC-018~026 (피드백+AI 변환) | 9개 | ✅ 구현 |
| TC-027~033 (대시보드+인사이트) | 7개 | ✅ 구현 |
| TC-034~042 (투표+액션 아이템) | 9개 | ✅ 구현 |
| TC-043~045 (JWT 유틸) | 3개 | ✅ 구현 |
| TC-046~049 (E2E 시나리오) | 4개 | ✅ 구현 |

---

## 2. E2E 테스트 이력 — 초기 실패 및 해결

### 2.1 초기 8개 실패 원인

E2E 테스트 최초 실행 시 25개 중 8개가 실패했다.

**증상:** `Locator.click: Element is not visible` 또는 요소 미발견

**원인 분석:**
- 개발 순서가 "컴포넌트 → 테스트" 역순으로 작성됨
- 테스트에서 `data-testid` 속성으로 요소를 찾으나, 컴포넌트에 `data-testid`가 미구현

**해결 과정:**
1. 실패한 8개 테스트의 selector 패턴 분석
2. 각 컴포넌트/페이지에 `data-testid` 속성 추가
3. E2E `loginAsMember()` 헬퍼 함수 구현 (반복 로그인 코드 추출)
4. 재실행 → 25/25 전체 통과

**커밋:** `b3e5f9d fix: E2E 테스트 data-testid 추가 및 로그인 헬퍼 구현 (25/25 통과)`

### 2.2 교훈

테스트 선행 작성(TDD) 원칙을 지키지 않아 E2E 구현과 컴포넌트 구현이 어긋났다. 이후 스프린트에서는 E2E 시나리오를 먼저 작성하고 data-testid를 설계 단계에서 확정하는 방식으로 전환했다.

---

## 3. CI 파이프라인 현황

### 3.1 워크플로우 구성 (`.github/workflows/ci.yml`)

```
Push/PR to develop, master
  ├── job: lint        → ESLint (eslint.config.js, TypeScript flat config)
  ├── job: build       → Nuxt build (더미 env 사용)
  ├── job: test        → Vitest --coverage (임계값 50%)
  └── job: e2e-smoke   → Playwright auth 구조 검증
```

### 3.2 CI 실행 이력

| 커밋 | 설명 | CI 결과 | 비고 |
|------|------|:-------:|------|
| `b3e5f9d` | E2E data-testid 수정 | ✅ 통과 | 코드 구현 최종 커밋 |
| `42b0960` | 커버리지 69% + CI 설정 | ✅ 통과 | CI 파이프라인 완성 |
| `05e6115` | AI 폴백 + JSDoc | ✅ 통과 | |
| `2edbf07` | dev-log 작성 | ✅ 통과 | 문서 커밋 |
| `b1e8b19` | 모니터링 추가 | ✅ 통과 | CI 재정상화 |

> **Note:** 문서 전용 커밋(`docs:` prefix) 일부가 ESLint v9 설정 파일 부재로 CI 실패한 이력이 있음. `eslint.config.js` 추가 후 (`b1e8b19`) 정상화.

### 3.3 ESLint 설정 이력

기존 `.eslintrc` 형식이 ESLint v9과 호환되지 않아 CI lint job이 실패하던 문제를 ESLint v9 flat config(`eslint.config.js`)로 해결했다.

```js
// eslint.config.js — 실제 파일
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.nuxt/**', '.output/**', '**/*.vue', ...] },
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-explicit-any': 'off', ... } },
)
```

---

## 4. CD 파이프라인 현황

### 4.1 워크플로우 구성 (`.github/workflows/cd.yml`)

```
master push
  → vercel pull (production)
  → vercel build --prod
  → vercel deploy --prebuilt --prod
  → [자동] Health check: GET /api/auth/me → HTTP 401 기대
      ✅ 통과 → 배포 완료
      ❌ 실패 → vercel rollback --yes + GitHub Issue 생성
```

### 4.2 배포 현황

| 환경 | URL | 상태 |
|------|-----|------|
| Production | https://hackathon-rouge-tau.vercel.app | 운영 중 |
| Staging (Preview) | Vercel Preview URL (develop push마다 생성) | 운영 중 |

> **CD 방식:** Vercel의 GitHub 통합을 통해 push 시 자동 배포. `cd.yml`은 헬스체크·롤백·알림 자동화를 담당.

### 4.3 자동 롤백 메커니즘

헬스체크 실패 시 자동 롤백이 실행된다 (`cd.yml` 실제 구현):

```yaml
- name: Health check (production)
  id: health-check
  run: |
    sleep 30
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      "${{ steps.deploy.outputs.production-url }}/api/auth/me" --max-time 15)
    [ "$STATUS" = "401" ] || [ "$STATUS" = "200" ] || exit 1

- name: Auto rollback on health check failure
  if: failure() && steps.health-check.outcome == 'failure'
  run: vercel rollback --token=${{ secrets.VERCEL_TOKEN }} --yes

- name: Notify on deployment failure
  if: failure()
  uses: actions/github-script@v7   # GitHub Issue 자동 생성
```

---

## 5. 모니터링 자동화 현황

### 5.1 워크플로우 구성 (`.github/workflows/monitor.yml`)

```
매시간 정각 (cron: '0 * * * *') 또는 workflow_dispatch
  → GET https://hackathon-rouge-tau.vercel.app/api/auth/me
      HTTP 401/200 → ✅ 정상
      기타          → ❌ GitHub Issue 자동 생성 (중복 방지)
```

### 5.2 실제 실행 증적

**수동 트리거 실행 기록 (2026-03-15):**

| 항목 | 내용 |
|------|------|
| 실행 ID | [23094063055](https://github.com/DongWon-Gim/hackathon/actions/runs/23094063055) |
| 트리거 | `workflow_dispatch` (수동) |
| 실행 시각 | 2026-03-14T18:45:44Z |
| 소요 시간 | 4초 |
| 결과 | ✅ 성공 |

**실행 로그 (핵심 부분):**
```
Checking: https://hackathon-rouge-tau.vercel.app/api/auth/me
Health check status: 401
✅ Production is healthy (HTTP 401)
```

**해석:** `/api/auth/me`는 JWT 없이 호출 시 `401 Unauthorized`를 반환한다. 이 응답이 서버가 정상 동작 중임을 증명한다. `404` 또는 `500`, 타임아웃(`000`)이면 장애로 판단한다.

### 5.3 장애 시 자동 알림 흐름

```
헬스체크 실패
  → actions/github-script@v7 실행
  → issues.listForRepo({ labels: 'production-incident', state: 'open' })
  → 열린 이슈 없을 경우에만 issues.create() 실행 (중복 방지)
  → GitHub Issue 생성: 감지 시각, 대상 URL, 대응 절차 포함
```

---

## 6. 종합 자동화 커버리지

| 자동화 항목 | 구현 여부 | 근거 |
|------------|:--------:|------|
| Lint 자동 검사 | ✅ | ci.yml lint job (ESLint flat config) |
| 빌드 검증 | ✅ | ci.yml build job (.output/ 존재 확인) |
| 단위/통합 테스트 + 커버리지 게이트 | ✅ | ci.yml test job (임계값 50%, 달성 69%) |
| E2E 스모크 테스트 | ✅ | ci.yml e2e-smoke job (Playwright) |
| 프로덕션 자동 배포 | ✅ | cd.yml + Vercel GitHub 통합 |
| 배포 후 헬스체크 | ✅ | cd.yml health-check step |
| 헬스체크 실패 시 자동 롤백 | ✅ | cd.yml vercel rollback step |
| 배포 실패 자동 알림 | ✅ | cd.yml github-script (Issue 생성) |
| 주기적 헬스 모니터링 | ✅ | monitor.yml cron 매시간 |
| 모니터링 장애 자동 알림 | ✅ | monitor.yml github-script (중복 방지 포함) |
