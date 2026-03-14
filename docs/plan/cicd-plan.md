# RetroLens CI/CD 파이프라인 설계서

- **작성일:** 2026-03-14
- **최종 수정:** 2026-03-15 (자동 헬스체크 + 자동 롤백 + 모니터링 워크플로우 추가)
- **버전:** 1.3.0

---

## 1. 플랫폼 및 브랜치 전략

| 항목 | 선택 | 근거 |
|------|------|------|
| CI/CD 플랫폼 | GitHub Actions | 코드 저장소와 동일 플랫폼, 무료 티어, Vercel 통합 지원 |
| 배포 대상 | Vercel | Nuxt 3 네이티브 지원, 브랜치별 Preview 자동 배포, 무료 티어 |
| DB | Turso (libSQL) | Vercel 서버리스 환경 호환, Staging/Production DB 분리 |

### 브랜치-환경 매핑 (실제 구현)

```
feature/* ──→ develop ──→ master
                │              │
                ↓              ↓
            Staging         Production
          (Preview URL)    (hackathon-rouge-tau.vercel.app)
```

| 브랜치 | 트리거 | 배포 환경 | DB |
|--------|--------|----------|-----|
| `develop` | push/merge | Staging (Vercel Preview) | `TURSO_DATABASE_URL_STAGING` |
| `master` | push/merge | Production | `TURSO_DATABASE_URL` |
| `feature/*` → PR | PR open/update | CI 검증만 (배포 없음) | `file:./test.db` (CI 로컬) |

> **Note:** 초기 설계(`develop → staging → master` 3단계)에서 해커톤 기간 단순화를 위해 `staging` 브랜치를 제거하고 `develop → master` 2단계로 운영. Vercel Preview 배포가 staging 역할 수행.

---

## 2. 파이프라인 전체 구조

```
┌──────────────────────────────────────────────────────────────────────┐
│  CI (.github/workflows/ci.yml)                                        │
│                                                                       │
│  [Push/PR to develop, staging, master]                                │
│         │                                                             │
│         ├──► job: lint ─────────────────────────────────────────────►│
│         │         └── npm ci → prisma generate → eslint              │
│         │                                                             │
│         ├──► job: build (needs: lint) ─────────────────────────────►│
│         │         └── npm ci → prisma generate → nuxt build          │
│         │              └── 빌드용 더미 환경변수 사용 (런타임 불필요)   │
│         │                                                             │
│         └──► job: test (needs: lint) ──────────────────────────────►│
│                   └── npm ci → prisma generate → db push            │
│                        → vitest run --coverage (임계값: 50%)         │
│                        → coverage 아티팩트 업로드 (7일 보존)          │
│                                                                       │
│  job: e2e-smoke (needs: build) ────────────────────────────────────► │
│         └── db push → seed → playwright install chromium             │
│              → E2E smoke (인증 구조 검증, 실제 API 불필요 케이스)     │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  CD (.github/workflows/cd.yml)                                        │
│                                                                       │
│  develop push ──► job: deploy-staging                                 │
│         └── vercel pull(preview) → vercel build → vercel deploy      │
│              → Preview URL 출력                                       │
│                                                                       │
│  master push ──► job: deploy-production                               │
│         └── vercel pull(production) → vercel build --prod            │
│              → vercel deploy --prod → Production URL 출력            │
│              → Health check (GET /api/auth/me → 401 기대)            │
│              → 실패 시: vercel rollback --yes (자동 롤백)            │
│              → 실패 시: GitHub Issue 자동 생성 (알림)               │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  Monitor (.github/workflows/monitor.yml)                              │
│                                                                       │
│  매시간 정각 (cron: '0 * * * *') ──► job: health-check              │
│         └── GET /api/auth/me → 401 확인                              │
│              → 실패 시: GitHub Issue 자동 생성 (중복 방지)           │
│              → 수동 트리거 (workflow_dispatch) 지원                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 실제 워크플로우 파일 내용

### 3.1 CI — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [develop, staging]
  pull_request:
    branches: [develop, staging, master]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
        env:
          TURSO_DATABASE_URL: file:./ci.db   # 빌드용 더미 (런타임 불사용)
          TURSO_AUTH_TOKEN: ""
          JWT_SECRET: ci-build-secret
          ANTHROPIC_API_KEY: sk-dummy-build-key
      - run: test -d .output && echo "Build output directory exists"

  test:
    runs-on: ubuntu-latest
    needs: lint
    env:
      TURSO_DATABASE_URL: file:./test.db     # CI 격리 SQLite 파일
      TURSO_AUTH_TOKEN: ""
      JWT_SECRET: ${{ secrets.JWT_SECRET || 'ci-test-secret-for-pr' }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY || 'sk-dummy-test-key' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma db push --force-reset
      - run: npx vitest run --coverage
        # vitest.config.ts 임계값: lines/functions/branches 50%
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  e2e-smoke:
    runs-on: ubuntu-latest
    needs: build
    env:
      TURSO_DATABASE_URL: file:./test.db
      TURSO_AUTH_TOKEN: ""
      JWT_SECRET: ci-test-secret-for-pr
      ANTHROPIC_API_KEY: sk-dummy-test-key
      BASE_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma db push --force-reset && npx prisma db seed
      - run: npx playwright install --with-deps chromium
      - run: |
          npx playwright test tests/e2e/scenarios/auth.spec.ts \
            --grep "로그인 페이지|회원가입 페이지|비로그인" \
            --reporter=list
        # 전체 E2E는 실제 Turso + ANTHROPIC_API_KEY 필요 → 로컬/스테이징 수동 실행
```

### 3.2 CD — `.github/workflows/cd.yml`

```yaml
name: CD

on:
  push:
    branches: [develop, master]

jobs:
  deploy-staging:          # develop push → Vercel Preview
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: ${{ steps.deploy.outputs.preview-url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci && npx prisma generate
      - run: npm install --global vercel@latest
      - run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
        env: { VERCEL_ORG_ID: ..., VERCEL_PROJECT_ID: ... }
      - run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL_STAGING }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN_STAGING }}
      - id: deploy
        run: |
          DEPLOY_URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "preview-url=$DEPLOY_URL" >> $GITHUB_OUTPUT

  deploy-production:       # master push → Vercel Production
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    environment:
      name: production
      url: https://hackathon-rouge-tau.vercel.app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci && npx prisma generate
      - run: npm install --global vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env: { VERCEL_ORG_ID: ..., VERCEL_PROJECT_ID: ... }
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}
      - id: deploy
        run: |
          DEPLOY_URL=$(vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }})
          echo "production-url=$DEPLOY_URL" >> $GITHUB_OUTPUT
```

---

## 4. 환경변수 관리 전략

### 4.1 환경별 변수 분리

| 변수 | CI (test job) | CI (build job) | Staging | Production |
|------|:---:|:---:|:---:|:---:|
| `TURSO_DATABASE_URL` | `file:./test.db` | `file:./ci.db` | `libsql://…-staging.turso.io` | `libsql://…-prod.turso.io` |
| `TURSO_AUTH_TOKEN` | `""` | `""` | `secrets.TURSO_AUTH_TOKEN_STAGING` | `secrets.TURSO_AUTH_TOKEN` |
| `JWT_SECRET` | `secrets.JWT_SECRET` (fallback: 고정값) | `ci-build-secret` | Vercel 환경변수 | Vercel 환경변수 |
| `ANTHROPIC_API_KEY` | `secrets.ANTHROPIC_API_KEY` (fallback: dummy) | `sk-dummy-build-key` | Vercel 환경변수 | Vercel 환경변수 |

**핵심 설계 결정:**
- **CI 빌드 단계**: 런타임에 실제 DB/AI가 불필요하므로 더미 값 사용. `process.env`를 읽는 Prisma generate는 더미 URL로 통과.
- **CI 테스트 단계**: 로컬 SQLite(`file:./test.db`)로 격리. 실제 Turso 자격증명 불필요. `ANTHROPIC_API_KEY`는 단위 테스트에서 vi.fn() mock으로 처리되므로 dummy 값으로 통과.
- **런타임(Staging/Production)**: Vercel 대시보드에 저장된 환경변수 사용. GitHub Secrets → `vercel pull`로 빌드 시 주입.

### 4.2 GitHub Secrets 목록

| Secret 이름 | 용도 |
|------------|------|
| `VERCEL_TOKEN` | Vercel CLI 인증 |
| `VERCEL_ORG_ID` | Vercel 조직 식별자 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 식별자 |
| `TURSO_DATABASE_URL` | Production Turso DB URL |
| `TURSO_AUTH_TOKEN` | Production Turso 인증 토큰 |
| `TURSO_DATABASE_URL_STAGING` | Staging Turso DB URL |
| `TURSO_AUTH_TOKEN_STAGING` | Staging Turso 인증 토큰 |
| `JWT_SECRET` | CI 테스트용 JWT 서명 키 |
| `ANTHROPIC_API_KEY` | CI 테스트용 Claude API 키 |

### 4.3 보안 원칙

- 모든 민감 정보는 GitHub Secrets 또는 Vercel 환경변수로만 관리. 코드/로그에 하드코딩 금지.
- PR에서 fork 리포지토리 기여 시 Secrets 접근 차단 (GitHub 기본 정책). fallback 더미 값으로 CI는 통과하되, 실제 API는 호출되지 않음.
- `JWT_SECRET || 'ci-test-secret-for-pr'` 패턴: PR CI에서 Secrets 없어도 단위 테스트 통과 가능.

---

## 5. 품질 게이트

PR merge 전 필수 통과 조건 (`ci.yml` 실제 구현):

| 게이트 | 조건 | 실패 시 |
|--------|------|---------|
| **Lint** | ESLint 에러 0개 | PR 블로킹 |
| **Build** | `.output/` 생성 성공 | PR 블로킹 |
| **Test** | 모든 테스트 통과 + coverage lines ≥ 50% | PR 블로킹 |
| **E2E Smoke** | 페이지 구조/리다이렉트 검증 통과 | PR 블로킹 |

**커버리지 임계값** (`vitest.config.ts`):
```typescript
coverage: {
  thresholds: { lines: 50, functions: 50, branches: 50 }
}
```
현재 달성: **lines 69%** (임계값 50% 초과).

---

## 6. 배포 자동화 상세

### 6.1 Staging 배포 흐름 (develop push)

```
develop에 push
  → cd.yml 트리거
  → vercel pull --environment=preview  (Vercel에서 환경변수 가져옴)
  → vercel build  (TURSO_DATABASE_URL_STAGING 사용)
  → vercel deploy --prebuilt  (Vercel CDN에 배포)
  → Preview URL 생성 (예: retrolens-abc123.vercel.app)
  → GitHub Actions 로그에 URL 출력
```

### 6.2 Production 배포 흐름 (master push)

```
master에 push
  → cd.yml 트리거
  → vercel pull --environment=production
  → vercel build --prod  (TURSO_DATABASE_URL Production 사용)
  → vercel deploy --prebuilt --prod
  → Production URL 갱신: https://hackathon-rouge-tau.vercel.app
  → [자동] Health check: GET /api/auth/me → HTTP 401 기대
      ✅ 통과: 배포 완료
      ❌ 실패: vercel rollback --yes 자동 실행 + GitHub Issue 생성
```

**Vercel의 자동 롤백 메커니즘:** Vercel은 각 배포를 독립적인 immutable snapshot으로 저장한다. `vercel deploy` 실패 시 이전 배포가 유지되어 서비스 중단이 발생하지 않는다.

### 6.3 모니터링 자동화 (monitor.yml)

배포 후에도 지속적으로 프로덕션 상태를 감시한다.

```
매시간 정각 (cron: '0 * * * *')
  → monitor.yml 트리거
  → GET https://hackathon-rouge-tau.vercel.app/api/auth/me
      ✅ HTTP 401/200: 정상 → 로그에 기록하고 종료
      ❌ 기타: GitHub Issue 자동 생성
           - 중복 이슈 방지 (열린 'production-incident' 이슈 존재 시 스킵)
           - 대응 절차 자동 포함
```

---

## 7. 롤백 전략

### 7.1 자동 롤백 (cd.yml 헬스체크 연동)

배포 직후 헬스체크 실패 시 `vercel rollback` CLI 명령이 **자동 실행**된다.

```yaml
# cd.yml 실제 구현 (deploy-production job)
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
  uses: actions/github-script@v7
  # → GitHub Issue 자동 생성 (워크플로우 링크 포함)
```

### 7.2 수동 롤백 (헬스체크 외 장애 발생 시)

**방법 1 — Vercel CLI (권장):**
```bash
vercel rollback --yes   # 직전 배포로 즉시 롤백 (~30초)
```

**방법 2 — Vercel 대시보드:**
```
Vercel Dashboard → Deployments → 이전 배포 선택 → "Promote to Production"
소요 시간: ~30초
```

**방법 3 — Git revert + 재배포:**
```bash
git revert HEAD        # 문제 커밋 revert
git push origin master # CD 트리거 → 자동 재배포
```

**방법 4 — 이전 커밋으로 배포 (긴급):**
```bash
git push origin <이전-커밋-sha>:master --force
# ⚠️ force push는 최후 수단
```

### 7.3 DB 롤백

Turso(libSQL)는 자체 포인트-인-타임 복구를 지원하지 않는다. 해커톤 환경의 실용적 전략:

| 상황 | 대응 |
|------|------|
| 스키마 변경 오류 | `prisma db push --force-reset` + `prisma db seed` 재실행 |
| 데이터 손상 | Turso 콘솔에서 SQL 직접 수정 |
| 치명적 장애 | Staging DB를 Production으로 전환 (데이터 손실 감수) |

### 7.4 장애 대응 시나리오

| 장애 | 감지 방법 | 즉각 대응 |
|------|----------|----------|
| 배포 후 서버 오류 | cd.yml 헬스체크 자동 감지 | 자동 `vercel rollback` 실행 |
| 런타임 에러 급증 | monitor.yml 매시간 감지 → GitHub Issue | 수동 `vercel rollback` 또는 revert |
| DB 연결 실패 | monitor.yml → 503 감지 | `TURSO_DATABASE_URL` Vercel 환경변수 수정 후 재배포 |
| AI API 장애 | `transformFailed: true` / 502 응답 | 폴백 로직 자동 작동 (원문 반환 / buildFallback) |
| 이전 배포가 자동 유지 | CD job 빌드 실패 시 | Vercel immutable snapshot이 이전 배포 유지 (서비스 무중단) |

---

## 8. 실제 CI/CD 실행 증적

### 8.1 CI 통과 커밋 이력

| 커밋 | 내용 | CI 결과 |
|------|------|---------|
| `42b0960` | 커버리지 69% + CI E2E smoke 추가 | ✅ 통과 (lines 69%) |
| `b3e5f9d` | E2E 25/25 통과 (data-testid 추가) | ✅ 통과 |
| `05e6115` | AI 폴백 구현 + architecture.md 동기화 | ✅ 통과 |
| `b1e8b19` | ESLint flat config + 모니터링 추가 | ✅ 통과 |

> **CI 재정상화:** 문서 커밋 중 ESLint v9 호환 설정 파일 부재로 lint job 실패 발생. `eslint.config.js`(typescript-eslint flat config) 추가 후 정상화.

### 8.2 모니터링 실행 증적 (monitor.yml)

**수동 트리거 실행 — 2026-03-14T18:45Z:**

| 항목 | 내용 |
|------|------|
| 실행 URL | https://github.com/DongWon-Gim/hackathon/actions/runs/23094063055 |
| 트리거 방식 | `workflow_dispatch` (수동) |
| 소요 시간 | 4초 |
| 결과 | ✅ **성공** |

**실행 로그:**
```
Checking: https://hackathon-rouge-tau.vercel.app/api/auth/me
Health check status: 401
✅ Production is healthy (HTTP 401)
```

**해석:** `/api/auth/me`는 JWT 없이 호출하면 `401 Unauthorized` 반환. 이 응답 = 서버 정상 동작 확인. `000`(타임아웃) / `5xx` 발생 시 GitHub Issue 자동 생성.

### 8.3 배포 현황

| 환경 | URL | 상태 |
|------|-----|------|
| Production | https://hackathon-rouge-tau.vercel.app | ✅ 운영 중 |
| Staging | Vercel Preview URL (develop push마다 생성) | ✅ 자동화됨 |

### 8.4 전체 테스트 현황 (2026-03-15 기준)

| 테스트 종류 | 수량 | 결과 |
|------------|:---:|:---:|
| 단위 테스트 (Vitest) | 151개 | ✅ 전체 통과 |
| 통합 테스트 (Vitest) | 4개 | ✅ 전체 통과 |
| E2E 테스트 (Playwright) | 25개 | ✅ 전체 통과 |
| 코드 커버리지 (Lines) | - | **69%** (임계값 50%) |

---

## 9. 캐시 전략

| 캐시 대상 | 방법 | 효과 |
|----------|------|------|
| npm 의존성 | `actions/setup-node@v4 cache: 'npm'` | `node_modules` 재사용, Install ~50% 단축 |
| Vercel 빌드 | Vercel 자체 캐시 (.vercel/cache) | 변경된 파일만 재빌드 |
