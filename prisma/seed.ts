import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import bcrypt from 'bcrypt'

const url = process.env.TURSO_DATABASE_URL!
const authToken = process.env.TURSO_AUTH_TOKEN
const libsql = createClient({ url, authToken })
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('Seeding database...')

  // 샘플 팀
  const adminteam = await prisma.team.upsert({
    where: { inviteCode: 'DEMO-TEAM-001' },
    update: {},
    create: {
      name: 'IT본부',
      inviteCode: 'DEMO-TEAM-001'
    }
  })

  // 관리자 계정
  const adminPassword = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@retrolens.app' },
    update: {},
    create: {
      email: 'admin@retrolens.app',
      password: adminPassword,
      name: '관리자',
      role: 'ADMIN',
      teamId: adminteam.id
    }
  })

  // 샘플 팀
  const team = await prisma.team.upsert({
    where: { inviteCode: 'DEMO-TEAM-002' },
    update: {},
    create: {
      name: '개발팀',
      inviteCode: 'DEMO-TEAM-002'
    }
  })

  // 팀장 계정
  const leaderPassword = await bcrypt.hash('leader1234', 10)
  const leader = await prisma.user.upsert({
    where: { email: 'leader@retrolens.app' },
    update: {},
    create: {
      email: 'leader@retrolens.app',
      password: leaderPassword,
      name: '팀장',
      role: 'LEADER',
      teamId: team.id
    }
  })

  // 멤버 계정
  const memberPassword = await bcrypt.hash('member1234', 10)
  await prisma.user.upsert({
    where: { email: 'member@retrolens.app' },
    update: {},
    create: {
      email: 'member@retrolens.app',
      password: memberPassword,
      name: '개발자',
      role: 'MEMBER',
      teamId: team.id
    }
  })

  // 샘플 회고 세션 (ACTIVE — 피드백 있음)
  const activeSession = await prisma.session.upsert({
    where: { id: 'seed-session-active-001' },
    update: {},
    create: {
      id: 'seed-session-active-001',
      title: 'Sprint 1 회고',
      projectName: 'RetroLens',
      status: 'ACTIVE',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-14'),
      teamId: team.id,
      creatorId: leader.id
    }
  })

  // 기존 피드백 삭제 후 재생성 (upsert 불가)
  await prisma.feedback.deleteMany({ where: { sessionId: activeSession.id } })

  const keepFeedbacks = [
    '코드 리뷰 문화가 잘 정착되어 코드 품질이 향상되었습니다.',
    '일일 스탠드업 미팅으로 팀 진행 상황 공유가 원활해졌습니다.',
    '페어 프로그래밍을 통해 복잡한 기능을 빠르게 구현할 수 있었습니다.',
  ]
  const problemFeedbacks = [
    '배포 프로세스에 약 30분이 소요되어 개선이 필요합니다.',
    '테스트 커버리지가 낮아 리팩토링 시 불안감이 있습니다.',
    '문서화가 부족하여 온보딩 시간이 길어지고 있습니다.',
  ]
  const tryFeedbacks = [
    'CI/CD 파이프라인 최적화를 통해 배포 시간을 단축해보겠습니다.',
    '단위 테스트 작성을 스프린트 완료 기준에 포함시켜 보겠습니다.',
    '기술 문서 작성을 위한 별도 시간을 스프린트에 할당해보겠습니다.',
  ]

  for (const content of keepFeedbacks) {
    await prisma.feedback.create({ data: { content, category: 'KEEP', sessionId: activeSession.id } })
  }
  for (const content of problemFeedbacks) {
    await prisma.feedback.create({ data: { content, category: 'PROBLEM', sessionId: activeSession.id } })
  }
  for (const content of tryFeedbacks) {
    await prisma.feedback.create({ data: { content, category: 'TRY', sessionId: activeSession.id } })
  }

  // 샘플 회고 세션 (CLOSED) — 인사이트 생성 테스트용 피드백 포함
  const closedSession = await prisma.session.upsert({
    where: { id: 'seed-session-closed-001' },
    update: {},
    create: {
      id: 'seed-session-closed-001',
      title: 'Sprint 0 회고',
      projectName: 'RetroLens',
      status: 'CLOSED',
      periodStart: new Date('2026-02-15'),
      periodEnd: new Date('2026-02-28'),
      teamId: team.id,
      creatorId: leader.id
    }
  })

  await prisma.feedback.deleteMany({ where: { sessionId: closedSession.id } })
  const closedKeepFeedbacks = [
    '초기 아키텍처 설계가 잘 이루어져 개발 방향이 명확했습니다.',
    '팀원 간 역할 분담이 원활하게 이루어졌습니다.',
  ]
  const closedProblemFeedbacks = [
    '요구사항 정의가 불충분하여 중간에 방향 수정이 필요했습니다.',
    '환경 설정에 예상보다 많은 시간이 소요되었습니다.',
  ]
  const closedTryFeedbacks = [
    '다음 스프린트부터 요구사항 문서를 더 구체적으로 작성하겠습니다.',
    '개발 환경 설정을 스크립트로 자동화하겠습니다.',
  ]
  for (const content of closedKeepFeedbacks) {
    await prisma.feedback.create({ data: { content, category: 'KEEP', sessionId: closedSession.id } })
  }
  for (const content of closedProblemFeedbacks) {
    await prisma.feedback.create({ data: { content, category: 'PROBLEM', sessionId: closedSession.id } })
  }
  for (const content of closedTryFeedbacks) {
    await prisma.feedback.create({ data: { content, category: 'TRY', sessionId: closedSession.id } })
  }

  // 빈 세션 (피드백 없음)
  await prisma.session.upsert({
    where: { id: 'seed-session-empty-001' },
    update: {},
    create: {
      id: 'seed-session-empty-001',
      title: 'Sprint 2 회고',
      projectName: 'RetroLens',
      status: 'ACTIVE',
      teamId: team.id,
      creatorId: leader.id
    }
  })

  console.log('✅ Seed complete')
  console.log('   Admin: admin@retrolens.app / admin1234')
  console.log('   Leader: leader@retrolens.app / leader1234')
  console.log('   Member: member@retrolens.app / member1234')
  console.log(`   Team invite code: ${team.inviteCode}`)
  console.log('   TEST_SESSION_ID=seed-session-active-001')
  console.log('   CLOSED_SESSION_ID=seed-session-closed-001')
  console.log('   EMPTY_SESSION_ID=seed-session-empty-001')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
