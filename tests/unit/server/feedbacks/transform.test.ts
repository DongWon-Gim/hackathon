/**
 * 단위 테스트: POST /api/ai/transform (AI 문체 변환)
 * 관련 기능: FEAT-002-1
 * 관련 화면: SCR-003-1
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockClaudeTransform, resetMocks, createMockEvent } from '../../../helpers/mocks'
import handler from '~/server/api/ai/transform.post'

describe('POST /api/ai/transform', () => {
  beforeEach(() => {
    resetMocks()
  })

  // TC-024: 유효한 텍스트로 변환 요청 시 변환된 텍스트 반환 (Claude API 모킹)
  it('[TC-024] 유효한 텍스트로 변환 요청 시 변환된 텍스트를 반환한다', async () => {
    const originalText = '배포할 때마다 30분씩 걸리는 거 진짜 미치겠음... ㅠㅠ'
    const transformedText = '배포 프로세스에 약 30분이 소요되어 개선이 필요합니다.'
    mockClaudeTransform.mockResolvedValue(transformedText)

    const event = createMockEvent({
      body: { content: originalText },
    })
    const result = await handler(event)

    expect(result.transformed).toBe(transformedText)
    expect(result.original).toBe(originalText)
    expect(mockClaudeTransform).toHaveBeenCalledWith(originalText)
  })

  // TC-025: Claude API 호출 실패 시 원문 반환 폴백 (transformFailed: true)
  it('[TC-025] Claude API 호출 실패 시 원문을 반환하고 transformFailed: true를 응답한다', async () => {
    mockClaudeTransform.mockRejectedValue(new Error('API Error'))
    const originalText = '원본 텍스트'

    const event = createMockEvent({
      body: { content: originalText },
    })
    const result = await handler(event)

    // AI 실패 시 에러를 throw하지 않고 원문 반환 (사용자가 계속 제출 가능)
    expect(result.original).toBe(originalText)
    expect(result.transformed).toBe(originalText)
    expect(result.transformFailed).toBe(true)
  })

  // TC-026: 빈 텍스트로 변환 요청 시 400 VALIDATION_ERROR
  it('[TC-026] 빈 텍스트로 변환 요청 시 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { content: '' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  it('[EDGE] content가 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: {},
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  it('[EDGE] content가 500자를 초과하면 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { content: 'a'.repeat(501) },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  it('변환 성공 시 original과 transformed가 모두 포함된 응답을 반환한다', async () => {
    const originalText = '코드 리뷰가 너무 늦어서 답답해요'
    const transformedText = '코드 리뷰 처리 시간이 지연되어 불편함이 있습니다.'
    mockClaudeTransform.mockResolvedValue(transformedText)

    const event = createMockEvent({
      body: { content: originalText },
    })
    const result = await handler(event)

    expect(result).toHaveProperty('original')
    expect(result).toHaveProperty('transformed')
    expect(result.original).toBe(originalText)
    expect(result.transformed).toBe(transformedText)
  })
})
