import { transformStyle } from '~/server/utils/claude'
import { validateRequired, validateMaxLength } from '~/server/utils/validation'

/**
 * POST /api/ai/transform
 * AI 문체 변환: 피드백의 개인적 말투·이모지를 중립적 문어체로 변환한다.
 *
 * 폴백 전략: Claude API 호출 실패 시 원문을 그대로 반환하고
 * `transformFailed: true` 플래그를 함께 반환한다.
 * 클라이언트는 이 플래그를 보고 원문으로 제출하거나 재시도 안내를 표시한다.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { content } = body ?? {}

  validateRequired(content, '피드백 내용')
  validateMaxLength(content, 500, '피드백 내용')

  try {
    const transformed = await transformStyle(content)
    return { original: content, transformed, transformFailed: false }
  } catch (e) {
    // AI 서비스 장애 시 원문 반환 (익명 제출은 계속 가능하도록 폴백)
    console.warn('[AI transform] 변환 실패, 원문 반환:', (e as Error).message)
    return { original: content, transformed: content, transformFailed: true }
  }
})
