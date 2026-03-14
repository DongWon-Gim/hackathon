# RetroLens Plan-2 변경 사항 개요

- **작성일:** 2026-03-14
- **변경 배경:** Sprint 2 코드리뷰 이후 ActionItem 쿼리 복잡도 개선 + 인사이트 이슈→액션 아이템 전환 UX 추가 요청

---

## 변경 요약

| 카테고리 | 변경 내용 |
|---------|----------|
| DB 스키마 | ActionItem에 `sessionId`, `issueIndex` 필드 추가 |
| 백엔드 | actions.get 단일 쿼리화, actions.post issueIndex 저장, patch 팀 검증 단순화 |
| 프론트엔드 | 인라인 폼 → 모달, 이슈 카드에 액션 아이템 전환 버튼 추가 |
| 타입 | ActionItem 인터페이스에 sessionId, issueIndex 추가 |

---

## 수정 파일 목록

| 파일 | 변경 종류 | 내용 |
|------|----------|------|
| `prisma/schema.prisma` | 스키마 수정 | ActionItem에 sessionId, issueIndex 추가, Session 역관계 추가 |
| `server/api/sessions/[id]/actions.post.ts` | 기능 추가 | issueIndex 수신·저장, 응답에 sessionId/issueIndex 포함 |
| `server/api/sessions/[id]/actions.get.ts` | 리팩터 | 2쿼리+중복제거 → 단일 sessionId 쿼리 |
| `server/api/actions/[id].patch.ts` | 리팩터 | feedback/insight 체이닝 → session 직접 include |
| `types/index.ts` | 타입 추가 | ActionItem에 sessionId: string, issueIndex: number \| null |
| `pages/session/[id]/dashboard.vue` | UX 개선 | 인라인 폼 제거, 모달 추가, 이슈 카드 버튼, 전환 상태 표시 |

---

## 관련 문서

- [schema.md](./schema.md) — 변경된 Prisma 스키마
- [api.md](./api.md) — 변경된 API 엔드포인트 명세
- [ux.md](./ux.md) — 변경된 UX 흐름
