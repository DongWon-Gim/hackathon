import { transformStyle } from '~/server/utils/claude'
import { ERROR } from '~/server/utils/error'
import { validateRequired, validateMaxLength } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { content } = body ?? {}

  validateRequired(content, '피드백 내용')
  validateMaxLength(content, 500, '피드백 내용')

  let transformed: string
  try {
    transformed = await transformStyle(content)
  } catch (e) {
    console.error('[AI transform error]', e)
    throw ERROR.AI_SERVICE_ERROR()
  }

  return { original: content, transformed }
})
