# Plan-2: Prisma 스키마 변경

---

## ActionItem 모델 변경

### Before

```prisma
model ActionItem {
  id         String    @id @default(cuid())
  content    String
  status     String    @default("PENDING")
  dueDate    DateTime?
  assigneeId String?
  feedbackId String?
  insightId  String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  assignee User?     @relation("assignee", fields: [assigneeId], references: [id])
  feedback Feedback? @relation(fields: [feedbackId], references: [id])
  insight  Insight?  @relation(fields: [insightId], references: [id])
}
```

### After

```prisma
model ActionItem {
  id         String    @id @default(cuid())
  content    String
  status     String    @default("PENDING")
  dueDate    DateTime?
  assigneeId String?
  feedbackId String?
  insightId  String?
  sessionId  String                          // NEW: 세션 직접 참조
  issueIndex Int?                            // NEW: 인사이트 이슈 인덱스 (0-based)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  assignee User?     @relation("assignee", fields: [assigneeId], references: [id])
  feedback Feedback? @relation(fields: [feedbackId], references: [id])
  insight  Insight?  @relation(fields: [insightId], references: [id])
  session  Session   @relation(fields: [sessionId], references: [id])  // NEW
}
```

---

## Session 모델 변경

### Before

```prisma
model Session {
  ...
  team      Team       @relation(fields: [teamId], references: [id])
  creator   User       @relation("creator", fields: [creatorId], references: [id])
  feedbacks Feedback[]
  insights  Insight[]
}
```

### After

```prisma
model Session {
  ...
  team        Team         @relation(fields: [teamId], references: [id])
  creator     User         @relation("creator", fields: [creatorId], references: [id])
  feedbacks   Feedback[]
  insights    Insight[]
  actionItems ActionItem[]  // NEW: 역관계 추가
}
```

---

## 설계 근거

- **sessionId 직접 참조:** 기존 구조에서 ActionItem은 feedback 또는 insight를 통해 간접적으로 session에 연결되어 있었음. GET 시 2개 쿼리 + Set 중복제거가 필요했고, PATCH 시 feedback→session, insight→session 체이닝이 필요했음. sessionId 직접 참조로 이 복잡도를 제거.
- **issueIndex:** 인사이트의 `issues` 배열 인덱스(0-based)를 저장. 어떤 이슈에서 액션 아이템이 생성됐는지 추적하여 동일 이슈에서 중복 전환 방지.
- **마이그레이션 방식:** `prisma db push --force-reset` (해커톤 환경, 기존 데이터 없음)
