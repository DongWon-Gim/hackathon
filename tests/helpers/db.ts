/**
 * 테스트 DB 초기화/정리 헬퍼
 * 통합 테스트에서 사용한다.
 * libsql adapter 패턴 사용 (server/utils/prisma.ts 와 동일한 방식)
 */
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({ url: 'file:./prisma/test.db' })
const adapter = new PrismaLibSQL(libsql)
export const testPrisma = new PrismaClient({ adapter } as any)

/**
 * 모든 테이블 데이터 삭제 (테스트 격리를 위해 각 테스트 전/후에 호출)
 * 외래키 제약 순서를 고려하여 삭제한다.
 */
export async function clearDatabase() {
  await testPrisma.actionItem.deleteMany()
  await testPrisma.vote.deleteMany()
  await testPrisma.insight.deleteMany()
  await testPrisma.feedback.deleteMany()
  await testPrisma.session.deleteMany()
  await testPrisma.user.deleteMany()
  await testPrisma.team.deleteMany()
}

/**
 * 테스트 DB 연결 종료
 */
export async function disconnectDatabase() {
  await testPrisma.$disconnect()
}
