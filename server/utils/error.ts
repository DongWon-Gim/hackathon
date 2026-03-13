export function createApiError(statusCode: number, code: string, message: string) {
  return createError({
    statusCode,
    data: { code, message }
  })
}

export const ERROR = {
  VALIDATION_ERROR: (message: string) => createApiError(400, 'VALIDATION_ERROR', message),
  INVALID_INVITE_CODE: () => createApiError(400, 'INVALID_INVITE_CODE', '유효하지 않은 팀 코드입니다'),
  UNAUTHORIZED: () => createApiError(401, 'UNAUTHORIZED', '로그인이 필요합니다'),
  INVALID_CREDENTIALS: () => createApiError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다'),
  FORBIDDEN: () => createApiError(403, 'FORBIDDEN', '접근 권한이 없습니다'),
  TEAM_MISMATCH: () => createApiError(403, 'TEAM_MISMATCH', '접근 권한이 없습니다'),
  SESSION_CLOSED: () => createApiError(403, 'SESSION_CLOSED', '이 세션은 마감되었습니다'),
  NOT_FOUND: (resource = '요청한 데이터') => createApiError(404, 'NOT_FOUND', `${resource}를 찾을 수 없습니다`),
  DUPLICATE_EMAIL: () => createApiError(409, 'DUPLICATE_EMAIL', '이미 등록된 이메일입니다'),
  DUPLICATE_VOTE: () => createApiError(409, 'DUPLICATE_VOTE', '이미 투표한 피드백입니다'),
  AI_SERVICE_ERROR: () => createApiError(502, 'AI_SERVICE_ERROR', 'AI 서비스에 일시적인 문제가 있습니다'),
  INTERNAL: () => createApiError(500, 'INTERNAL_ERROR', '일시적인 오류가 발생했습니다')
}
