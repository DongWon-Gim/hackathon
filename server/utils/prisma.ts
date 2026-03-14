import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

declare global {
  var __prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL!
  const authToken = process.env.TURSO_AUTH_TOKEN
  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}

const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export default prisma
