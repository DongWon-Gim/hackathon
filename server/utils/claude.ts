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

const MODEL = 'claude-haiku-4-5'

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
