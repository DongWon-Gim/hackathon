/**
 * Claude API 클라이언트 유틸리티
 *
 * 두 가지 AI 기능을 제공한다:
 * 1. transformStyle: 피드백 문체 변환 (개인 말투 → 중립 문어체)
 * 2. generateInsight: 세션 피드백 전체 분석 → 요약 + 핵심 이슈
 *
 * 클라이언트는 싱글톤으로 관리하여 불필요한 재초기화를 방지한다.
 * 모델: claude-haiku-4-5-20251001 (빠른 응답, 비용 효율)
 */
import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: useRuntimeConfig().anthropicApiKey
    })
  }
  return _client
}

const MODEL = 'claude-haiku-4-5-20251001'

/**
 * 피드백 문체 변환
 *
 * 개인 특유의 말투·이모지·감탄사·비공식적 표현을 중립 문어체로 변환한다.
 * 의미와 내용은 그대로 유지한다.
 *
 * @param content 원본 피드백 텍스트 (최대 500자)
 * @returns 변환된 중립 문어체 텍스트
 * @throws Error — 모델 호출 실패 시. 호출부(transform.post.ts)에서 원문 반환 폴백 처리.
 */
export async function transformStyle(content: string): Promise<string> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `아래 피드백을 읽고, 내용과 의미는 그대로 유지하되 개인 특유의 말투, 이모지, 감탄사, 비공식적 표현을 중립적이고 객관적인 문어체로 변환해주세요. 변환된 텍스트만 출력하세요.

피드백: ${content}`
      }
    ]
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text.trim()
}

/**
 * AI 인사이트 생성
 *
 * 세션의 전체 피드백(K/P/T)을 분석하여 요약문과 핵심 이슈를 반환한다.
 * - summary: 2~3문장 요약
 * - issues: PROBLEM 우선 핵심 이슈 3~5개, 각 이슈에 구체적 권장 액션 포함
 *
 * 모델이 마크다운 코드블록(```json)으로 감싸 응답하는 경우를 처리하기 위해
 * 파싱 전 코드블록을 제거한다.
 *
 * @param feedbacks K/P/T 카테고리별 피드백 배열
 * @returns 요약문 + 이슈 배열 (JSON 파싱 결과)
 * @throws Error — 모델 호출 실패 또는 JSON 파싱 실패 시.
 *                 호출부(insights.post.ts)에서 buildFallback() 폴백 처리.
 */
export async function generateInsight(feedbacks: { category: string; content: string }[]): Promise<{
  summary: string
  issues: { title: string; description: string; action: string }[]
}> {
  const client = getClient()

  const feedbackText = feedbacks
    .map((f) => `[${f.category}] ${f.content}`)
    .join('\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `아래는 팀 회고 세션의 피드백 목록입니다 (KEEP=잘한점, PROBLEM=문제점, TRY=시도할것).

${feedbackText}

다음 JSON 형식으로만 응답해주세요 (마크다운 코드블록 없이 순수 JSON):
{
  "summary": "전체 피드백을 2~3문장으로 요약",
  "issues": [
    {
      "title": "핵심 이슈 제목",
      "description": "이슈 설명 1~2문장",
      "action": "구체적인 권장 액션"
    }
  ]
}

issues는 3~5개를 추출하고, PROBLEM 카테고리를 우선적으로 반영하세요.`
      }
    ]
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')

  // 마크다운 코드블록 제거 후 파싱
  const raw = block.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(raw)
}
