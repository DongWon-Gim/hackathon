import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 관리자 계정
  const adminPassword = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@retrolens.app' },
    update: {},
    create: {
      email: 'admin@retrolens.app',
      password: adminPassword,
      name: '관리자',
      role: Role.ADMIN
    }
  })

  // 샘플 팀
  const team = await prisma.team.upsert({
    where: { inviteCode: 'DEMO-TEAM-001' },
    update: {},
    create: {
      name: '개발팀',
      inviteCode: 'DEMO-TEAM-001'
    }
  })

  // 팀장 계정
  const leaderPassword = await bcrypt.hash('leader1234', 10)
  await prisma.user.upsert({
    where: { email: 'leader@retrolens.app' },
    update: {},
    create: {
      email: 'leader@retrolens.app',
      password: leaderPassword,
      name: '팀장',
      role: Role.LEADER,
      teamId: team.id
    }
  })

  console.log('✅ Seed complete')
  console.log('   Admin: admin@retrolens.app / admin1234')
  console.log('   Leader: leader@retrolens.app / leader1234')
  console.log(`   Team invite code: ${team.inviteCode}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
