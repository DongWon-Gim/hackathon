# Plan-2: UX 변경 — 대시보드 액션 아이템

**파일:** `pages/session/[id]/dashboard.vue`

---

## 변경 개요

| 항목 | Before | After |
|------|--------|-------|
| 액션 아이템 추가 폼 | 인라인 `div` (카드 내부) | `<Teleport to="body">` 모달 |
| 진입 방법 | "+" 버튼 토글 | "+" 버튼 → 빈 모달 / 이슈 카드 버튼 → 프리필 모달 |
| 이슈 카드 | 이슈 제목/설명/액션만 표시 | + 액션 아이템 추가 버튼 / 전환됨 표시 |
| 중복 전환 방지 | 없음 | issueIndex 기반 전환 여부 체크 |

---

## 상태 변수

```ts
// Before
const showActionForm = ref(false)

// After
const showActionModal = ref(false)
const prefillIssueIndex = ref<number | null>(null)
```

---

## 이슈 카드 버튼 로직

```html
<div v-if="isLeader" class="mt-2">
  <!-- 아직 전환 안 된 이슈: 버튼 표시 -->
  <button
    v-if="!usedIssueIndices.has(i)"
    @click="openIssueAction(issue.action, i)"
  >
    + 액션 아이템 추가
  </button>
  <!-- 전환된 이슈: 표시만 -->
  <span v-else class="text-xs text-ink-muted">✓ 전환됨</span>
</div>
```

### 전환 여부 판별

```ts
const usedIssueIndices = computed(() =>
  new Set(actions.value?.filter(a => a.issueIndex !== null).map(a => a.issueIndex as number))
)
```

---

## 모달 열기 흐름

```
이슈 카드 버튼 클릭
  → openIssueAction(issue.action, i)
  → newActionContent = issue.action  (프리필)
  → prefillIssueIndex = i
  → showActionModal = true

"+" 헤더 버튼 클릭
  → prefillIssueIndex = null
  → showActionModal = true
  → newActionContent = ''  (빈 폼)
```

---

## 모달 저장 흐름

```
addAction()
  → POST /api/sessions/:id/actions
      body: { content, dueDate?, insightId?, issueIndex? }
  → refreshActions()
  → cancelActionForm()   ← 모달 닫기 + 상태 초기화

cancelActionForm()
  → showActionModal = false
  → prefillIssueIndex = null
  → newActionContent = ''
  → newActionDueDate = ''
```

---

## 모달 구현 패턴

기존 AI 실패 폴백 모달과 동일한 패턴 사용:

```html
<Teleport to="body">
  <Transition name="modal">
    <div v-if="showActionModal" class="fixed inset-0 z-[200] ...">
      <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" @click="cancelActionForm" />
      <div class="relative z-10 card max-w-md w-full p-6">
        ...
      </div>
    </div>
  </Transition>
</Teleport>
```

- 배경 클릭 시 닫힘
- `<Transition name="modal">` — 기존 `.modal-enter-active` 스타일 재사용
