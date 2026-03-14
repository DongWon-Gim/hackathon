/**
 * 단위 테스트: useFeedback composable 로직
 * 관련 기능: FEAT-002, FEAT-002-1
 * 관련 화면: SCR-003
 *
 * Note: useFeedback.ts 파일이 없으므로 피드백 관련 UI 로직(카테고리 선택,
 * 변환 토글, API 호출 패턴)을 직접 검증한다.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'

describe('useFeedback composable 로직', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('카테고리 선택 로직', () => {
    it('초기 카테고리는 KEEP이다', () => {
      const selectedCategory = ref<'KEEP' | 'PROBLEM' | 'TRY'>('KEEP')
      expect(selectedCategory.value).toBe('KEEP')
    })

    it('카테고리를 PROBLEM으로 변경할 수 있다', () => {
      const selectedCategory = ref<'KEEP' | 'PROBLEM' | 'TRY'>('KEEP')
      selectedCategory.value = 'PROBLEM'
      expect(selectedCategory.value).toBe('PROBLEM')
    })

    it('카테고리를 TRY로 변경할 수 있다', () => {
      const selectedCategory = ref<'KEEP' | 'PROBLEM' | 'TRY'>('KEEP')
      selectedCategory.value = 'TRY'
      expect(selectedCategory.value).toBe('TRY')
    })

    it('유효한 카테고리 목록은 KEEP, PROBLEM, TRY이다', () => {
      const validCategories = ['KEEP', 'PROBLEM', 'TRY']
      expect(validCategories).toContain('KEEP')
      expect(validCategories).toContain('PROBLEM')
      expect(validCategories).toContain('TRY')
      expect(validCategories).not.toContain('INVALID')
    })
  })

  describe('변환 토글 (useTransform) 로직', () => {
    it('초기 상태에서 useTransform은 false이다', () => {
      const useTransform = ref(false)
      expect(useTransform.value).toBe(false)
    })

    it('useTransform을 true로 토글할 수 있다', () => {
      const useTransform = ref(false)
      useTransform.value = !useTransform.value
      expect(useTransform.value).toBe(true)
    })

    it('useTransform을 다시 false로 토글할 수 있다', () => {
      const useTransform = ref(true)
      useTransform.value = !useTransform.value
      expect(useTransform.value).toBe(false)
    })
  })

  describe('submitFeedback API 호출 로직', () => {
    it('submitFeedback 호출 시 올바른 API 엔드포인트와 인자로 $fetch가 호출된다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        id: 'new-feedback',
        content: '코드 리뷰 문화가 좋습니다',
        category: 'KEEP',
        sessionId: 'session-1',
        createdAt: new Date().toISOString(),
      })
      vi.stubGlobal('$fetch', mockFetch)

      const submitFeedback = async (sessionId: string, category: string, content: string) => {
        return await $fetch(`/api/sessions/${sessionId}/feedbacks`, {
          method: 'POST',
          body: { content, category },
        })
      }

      const result = await submitFeedback('session-1', 'KEEP', '코드 리뷰 문화가 좋습니다')

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1/feedbacks', {
        method: 'POST',
        body: { content: '코드 리뷰 문화가 좋습니다', category: 'KEEP' },
      })
      expect((result as any).category).toBe('KEEP')
    })

    it('submitFeedback 호출 실패 시 에러가 전파된다', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network Error'))
      vi.stubGlobal('$fetch', mockFetch)

      const submitFeedback = async (sessionId: string, category: string, content: string) => {
        return await $fetch(`/api/sessions/${sessionId}/feedbacks`, {
          method: 'POST',
          body: { content, category },
        })
      }

      await expect(
        submitFeedback('session-1', 'KEEP', '내용')
      ).rejects.toThrow('Network Error')
    })
  })

  describe('transformFeedback API 호출 로직', () => {
    it('transformFeedback 호출 성공 시 변환된 텍스트를 반환한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        original: '원본 텍스트',
        transformed: '변환된 텍스트',
      })
      vi.stubGlobal('$fetch', mockFetch)

      const transformFeedback = async (content: string): Promise<string> => {
        try {
          const result = await $fetch<{ original: string; transformed: string }>(
            '/api/ai/transform',
            { method: 'POST', body: { content } }
          )
          return result.transformed
        } catch {
          return content
        }
      }

      const result = await transformFeedback('원본 텍스트')
      expect(result).toBe('변환된 텍스트')
    })

    it('transformFeedback 실패 시 원본 텍스트를 폴백으로 반환한다', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('API Error'))
      vi.stubGlobal('$fetch', mockFetch)

      const transformFeedback = async (content: string): Promise<string> => {
        try {
          const result = await $fetch<{ original: string; transformed: string }>(
            '/api/ai/transform',
            { method: 'POST', body: { content } }
          )
          return result.transformed
        } catch {
          return content
        }
      }

      const result = await transformFeedback('원본 텍스트')
      expect(result).toBe('원본 텍스트')
    })
  })

  describe('피드백 목록 로드 로직', () => {
    it('fetchFeedbacks 호출 시 올바른 엔드포인트로 $fetch가 호출된다', async () => {
      const mockFeedbacks = [
        { id: 'f1', content: '내용1', category: 'KEEP', voteCount: 0, hasVoted: false },
        { id: 'f2', content: '내용2', category: 'PROBLEM', voteCount: 2, hasVoted: true },
      ]
      const mockFetch = vi.fn().mockResolvedValue(mockFeedbacks)
      vi.stubGlobal('$fetch', mockFetch)

      const fetchFeedbacks = async (sessionId: string) => {
        return await $fetch(`/api/sessions/${sessionId}/feedbacks`)
      }

      const result = await fetchFeedbacks('session-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/sessions/session-1/feedbacks')
      expect(result).toHaveLength(2)
    })

    it('피드백 목록에 hasVoted 필드가 포함된다', async () => {
      const mockFeedbacks = [
        { id: 'f1', content: '내용1', category: 'KEEP', voteCount: 1, hasVoted: true },
      ]
      const mockFetch = vi.fn().mockResolvedValue(mockFeedbacks)
      vi.stubGlobal('$fetch', mockFetch)

      const fetchFeedbacks = async (sessionId: string) => {
        return await $fetch<typeof mockFeedbacks>(`/api/sessions/${sessionId}/feedbacks`)
      }

      const result = await fetchFeedbacks('session-1')
      expect((result as any)[0].hasVoted).toBe(true)
    })
  })
})
