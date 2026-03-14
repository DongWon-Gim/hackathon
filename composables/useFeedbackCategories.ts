export const FEEDBACK_CATEGORIES = [
  { value: 'KEEP' as const, label: 'Keep', emoji: '✅', textColor: 'text-keep' },
  { value: 'PROBLEM' as const, label: 'Problem', emoji: '🔴', textColor: 'text-problem' },
  { value: 'TRY' as const, label: 'Try', emoji: '💡', textColor: 'text-try' }
] as const
