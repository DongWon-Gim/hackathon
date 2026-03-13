import jwt from 'jsonwebtoken'
import type { JwtPayload } from '~/types'

export function signToken(payload: JwtPayload): string {
  const secret = useRuntimeConfig().jwtSecret
  return jwt.sign(payload, secret, { expiresIn: '24h' })
}

export function verifyToken(token: string): JwtPayload {
  const secret = useRuntimeConfig().jwtSecret
  return jwt.verify(token, secret) as JwtPayload
}
