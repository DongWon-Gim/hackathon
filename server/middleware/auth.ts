import { verifyToken } from '../utils/jwt'
import { ERROR } from '../utils/error'
import prisma from '../utils/prisma'
import type { JwtPayload } from '~/types'

const PUBLIC_ROUTES = [
  '/api/auth/register',
  '/api/auth/login'
]

export default defineEventHandler(async (event) => {
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

  let payload: JwtPayload
  try {
    payload = verifyToken(token) as JwtPayload
  } catch {
    throw ERROR.UNAUTHORIZED()
  }

  // 계정 비활성화 여부 실시간 확인
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true } })
  if (!user || !user.isActive) {
    throw ERROR.UNAUTHORIZED()
  }

  event.context.auth = payload
})

// context 타입 확장
declare module 'h3' {
  interface H3EventContext {
    auth: JwtPayload
  }
}
