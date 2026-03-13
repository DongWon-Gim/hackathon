import { verifyToken } from '../utils/jwt'
import { ERROR } from '../utils/error'
import type { JwtPayload } from '~/types'

const PUBLIC_ROUTES = [
  '/api/auth/register',
  '/api/auth/login'
]

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  // 공개 라우트는 인증 스킵
  if (!path.startsWith('/api/') || PUBLIC_ROUTES.includes(path)) {
    return
  }

  const cookieToken = getCookie(event, 'auth_token')
  const headerToken = getRequestHeader(event, 'authorization')?.replace('Bearer ', '')
  const token = cookieToken || headerToken

  if (!token) {
    throw ERROR.UNAUTHORIZED()
  }

  try {
    const payload = verifyToken(token) as JwtPayload
    event.context.auth = payload
  } catch {
    throw ERROR.UNAUTHORIZED()
  }
})

// context 타입 확장
declare module 'h3' {
  interface H3EventContext {
    auth: JwtPayload
  }
}
