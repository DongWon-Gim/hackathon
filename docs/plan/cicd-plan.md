# RetroLens CI/CD 파이프라인 설계서

- **작성일:** 2026-03-14
- **기반 문서:** architecture.md v1.0.0, test-strategy.md v1.0.0
- **버전:** 1.0.0

---

## 1. CI/CD 플랫폼 선정

| 항목 | 선택 | 근거 |
|------|------|------|
| CI/CD 플랫폼 | GitHub Actions | 코드 저장소와 동일 플랫폼, 무료 티어 충분, Vercel 공식 통합 지원 |
| 컨테이너 | 불필요 (ubuntu-latest 러너) | Turso 원격 DB로 별도 컨테이너 불필요, 해커톤 단순성 우선 |
| 배포 대상 | Vercel | Nuxt 3 네이티브 지원, 브랜치별 Preview 배포 자동화, 무료 티어 |
| 패키지 매니저 | npm | 프로젝트 기본 설정 (`package-lock.json` 존재) |

---

## 2. 파이프라인 구조

```
[Push / PR] → [Install] → [Lint] → [Build] → [Test] → [Deploy]
```

### 단계별 설명

#### Install
- `npm ci` 로 의존성 설치 (캐시 활용)
- Prisma Client 생성 (`prisma generate`)
- **성공 조건:** 의존성 설치 완료, exit code 0

#### Lint
- `npm run lint` (ESLint)
- TypeScript 타입 오류 포함
- **성공 조건:** 에러 0개 (warning은 허용)
- **실패 시:** PR 블로킹, 에러 로그 출력

#### Build
- `npm run build` (Nuxt 3 빌드)
- 빌드 결과물 유효성 확인
- **성공 조건:** `.output/` 디렉토리 생성 완료
- **실패 시:** PR 블로킹, 빌드 에러 로그 출력

#### Test
- 단위 테스트: `npm run test` (Vitest)
- 커버리지: `--coverage` 플래그 적용
- **성공 조건:** 모든 테스트 통과, 커버리지 임계값 충족 (lines 50%)
- **실패 시:** PR 블로킹, 실패 케이스 상세 로그

#### Deploy
- Vercel CLI 또는 Vercel GitHub Integration을 통한 자동 배포
- 브랜치별 배포 환경 분리
- **성공 조건:** Vercel 배포 성공, 헬스체크 응답
- **실패 시:** Slack/이메일 알림 (해커톤에서는 GitHub Actions 로그로 대체)

---

## 3. 워크플로우 정의

| 워크플로우 | 파일 | 트리거 | 단계 | 용도 |
|-----------|------|--------|------|------|
| CI | `ci.yml` | develop/staging 브랜치 PR 생성/업데이트, push | lint → build → test (커버리지 포함) | PR 코드 품질 검증 |
| CD (Staging) | `cd.yml` | develop 브랜치 push (PR merge) | build → deploy to staging | Staging 환경 자동 배포 |
| CD (Production) | `cd.yml` | staging 브랜치 push (PR merge) | build → deploy to production | 프로덕션 배포 |

> **Note:** develop → staging → master 순서의 브랜치 전략을 사용한다.
> - `develop`: 기능 개발 통합 브랜치 → Staging 환경 배포
> - `staging`: QA 검증 브랜치 → Staging 환경 (최종 확인용)
> - `master`: 프로덕션 브랜치 → Production 배포

---

## 4. 품질 게이트

PR merge 전 반드시 통과해야 하는 조건:

| 게이트 | 기준 | 실패 시 동작 |
|--------|------|------------|
| Lint | ESLint 에러 0개 | PR 블로킹 (required status check) |
| Build | Nuxt 빌드 성공 | PR 블로킹 |
| 단위 테스트 | 모든 테스트 통과 | PR 블로킹 |
| 커버리지 | lines/functions/branches 50% 이상 | PR 블로킹 |

**커버리지 임계값 근거:** test-strategy.md의 해커톤 목표 (핵심 비즈니스 로직 50% 이상)

---

## 5. 환경 구성

### 환경별 배포

| 환경 | 용도 | 배포 트리거 | Vercel 프로젝트 설정 |
|------|------|------------|---------------------|
| Staging | 개발 통합 검증, QA | develop 브랜치 push | Preview 배포 (`develop` 브랜치) |
| Production | 실서비스 | master 브랜치 push | Production 배포 (`master` 브랜치) |

### GitHub Secrets 설정

| Secret 이름 | 용도 | 설정 위치 |
|------------|------|----------|
| `VERCEL_TOKEN` | Vercel API 토큰 | GitHub Repository Secrets |
| `VERCEL_ORG_ID` | Vercel 조직 ID | GitHub Repository Secrets |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | GitHub Repository Secrets |
| `TURSO_DATABASE_URL` | Turso Production DB URL | GitHub Repository Secrets |
| `TURSO_AUTH_TOKEN` | Turso Production 인증 토큰 | GitHub Repository Secrets |
| `TURSO_DATABASE_URL_STAGING` | Turso Staging DB URL | GitHub Repository Secrets |
| `TURSO_AUTH_TOKEN_STAGING` | Turso Staging 인증 토큰 | GitHub Repository Secrets |
| `JWT_SECRET` | JWT 서명 키 (CI 테스트용) | GitHub Repository Secrets |
| `ANTHROPIC_API_KEY` | Claude API 키 (CI 테스트용) | GitHub Repository Secrets |

### Vercel 환경변수 설정

Vercel 대시보드에서 환경별로 아래 변수를 설정한다:

| 변수 | Staging | Production |
|------|---------|------------|
| `TURSO_DATABASE_URL` | Turso Staging DB URL | Turso Production DB URL |
| `TURSO_AUTH_TOKEN` | Staging 인증 토큰 | Production 인증 토큰 |
| `JWT_SECRET` | Staging용 시크릿 | Production용 시크릿 |
| `ANTHROPIC_API_KEY` | 공용 API 키 | 공용 API 키 |

> **보안 원칙:** 민감 정보는 코드에 하드코딩하지 않고 반드시 GitHub Secrets 또는 Vercel 환경변수로 관리한다.

---

## 6. 캐시 전략

| 캐시 대상 | 캐시 키 | 효과 |
|----------|--------|------|
| npm 의존성 | `package-lock.json` 해시 | Install 단계 시간 단축 (~50%) |
| Nuxt 빌드 캐시 | `.nuxt/` (선택적) | 증분 빌드로 Build 단계 가속 |

---

## 7. 브랜치 보호 규칙 (GitHub Repository Settings 권장)

`master` 및 `staging` 브랜치에 적용:
- Pull Request 필수 (직접 push 금지)
- CI 상태 체크 필수 (`CI / lint`, `CI / build`, `CI / test`)
- 승인 리뷰 1명 이상 (해커톤에서는 선택)
