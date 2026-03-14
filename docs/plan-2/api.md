# Plan-2: API 엔드포인트 변경

---

## GET /api/sessions/:id/actions

### 변경 내용: 단일 쿼리로 단순화

**Before** — Promise.all 2쿼리 + Set 중복제거

```ts
const [feedbackActions, insightActions] = await Promise.all([
  prisma.actionItem.findMany({ where: { feedback: { sessionId: id } }, ... }),
  prisma.actionItem.findMany({ where: { insight: { sessionId: id } }, ... })
])
const seen = new Set<string>()
const actions = [...feedbackActions, ...insightActions].filter(a => {
  if (seen.has(a.id)) return false
  seen.add(a.id)
  return true
})
```

**After** — 단일 쿼리

```ts
const actions = await prisma.actionItem.findMany({
  where: { sessionId: id },
  include: { assignee: { select: { name: true } } },
  orderBy: { createdAt: 'desc' }
})
```

### 응답 형태 변경

```ts
// 추가된 필드
{
  sessionId: string   // NEW
  issueIndex: number | null  // NEW
}
```

---

## POST /api/sessions/:id/actions

### 변경 내용: sessionId, issueIndex 저장

**추가 수신 필드:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `issueIndex` | `number` | 선택 | 인사이트 이슈 인덱스 (0-based). 이슈 카드에서 생성 시 전달 |

**저장 로직:**

```ts
const action = await prisma.actionItem.create({
  data: {
    content: content.trim(),
    dueDate: dueDate ? new Date(dueDate) : undefined,
    assigneeId: assigneeId ?? undefined,
    feedbackId: feedbackId ?? undefined,
    insightId: insightId ?? undefined,
    sessionId: id,                                              // NEW: 항상 저장
    issueIndex: typeof issueIndex === 'number' ? issueIndex : undefined  // NEW: 선택적
  },
  ...
})
```

**응답에 sessionId, issueIndex 추가.**

---

## PATCH /api/actions/:id

### 변경 내용: 팀 검증 단순화

**Before** — feedback/insight 체이닝

```ts
const action = await prisma.actionItem.findUnique({
  where: { id },
  include: {
    feedback: { include: { session: true } },
    insight:  { include: { session: true } }
  }
})
const sessionTeamId = action.feedback?.session?.teamId ?? action.insight?.session?.teamId
if (sessionTeamId && sessionTeamId !== teamId) throw ERROR.TEAM_MISMATCH()
```

**After** — session 직접 include

```ts
const action = await prisma.actionItem.findUnique({
  where: { id },
  include: { session: { select: { teamId: true } } }
})
if (!action) throw ERROR.NOT_FOUND('액션 아이템')
if (action.session.teamId !== teamId) throw ERROR.TEAM_MISMATCH()
```

**응답에 sessionId, issueIndex 추가.**
