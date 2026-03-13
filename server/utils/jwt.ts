import jwt from 'jsonwebtoken'
import type { JwtPayload } from '~/types'

const FALLBACK_SECRET = 'retrolens-fallback-secret-do-not-use-in-production'

function getSecret(): string {
  return useRuntimeConfig().jwtSecret || FALLBACK_SECRET
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '24h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload
}
