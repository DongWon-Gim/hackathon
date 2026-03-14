/**
 * 단위 테스트: POST /api/auth/login (로그인)
 * 관련 기능: FEAT-000
 * 관련 화면: SCR-000
 */
import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import bcrypt from 'bcrypt'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import { fixtures as userFixtures } from '../../../fixtures/users'
import handler from '~/server/api/auth/login.post'

let realHashedPassword: string

beforeAll(async () => {
  realHashedPassword = await bcrypt.hash('password123', 10)
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    resetMocks()
  })

  // TC-005: 올바른 이메일/비밀번호로 로그인 성공
  it('[TC-005] 올바른 이메일/비밀번호로 로그인 성공 시 user 객체를 반환한다', async () => {
    const userWithTeam = {
      ...userFixtures.memberUser,
      password: realHashedPassword,
      team: { name: '개발1팀' },
    }
    mockPrisma.user.findUnique.mockResolvedValue(userWithTeam)

    const event = createMockEvent({
      body: { email: 'member@example.com', password: 'password123' },
    })
    const result = await handler(event)

    expect(result.user.email).toBe('member@example.com')
    expect(result.user.teamName).toBe('개발1팀')
    expect(result.user.role).toBe('MEMBER')
  })

  it('[TC-005b] 팀이 없는 사용자 로그인 시 teamName은 null이다', async () => {
    const userWithoutTeam = {
      ...userFixtures.noTeamUser,
      password: realHashedPassword,
      team: null,
    }
    mockPrisma.user.findUnique.mockResolvedValue(userWithoutTeam)

    const event = createMockEvent({
      body: { email: 'noteam@example.com', password: 'password123' },
    })
    const result = await handler(event)

    expect(result.user.teamName).toBeNull()
  })

  // TC-006: 잘못된 비밀번호로 로그인 시 401 INVALID_CREDENTIALS
  it('[TC-006] 잘못된 비밀번호로 로그인 시 401 INVALID_CREDENTIALS 에러를 반환한다', async () => {
    const userWithTeam = {
      ...userFixtures.memberUser,
      password: realHashedPassword,
      team: null,
    }
    mockPrisma.user.findUnique.mockResolvedValue(userWithTeam)

    const event = createMockEvent({
      body: { email: 'member@example.com', password: 'wrongpassword123' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'INVALID_CREDENTIALS' },
    })
  })

  // TC-007: 비활성화된 계정으로 로그인 시 401
  it('[TC-007] 비활성화된 사용자 계정으로 로그인 시 401을 반환한다', async () => {
    const inactiveUser = {
      ...userFixtures.inactiveUser,
      password: realHashedPassword,
      team: null,
    }
    mockPrisma.user.findUnique.mockResolvedValue(inactiveUser)

    const event = createMockEvent({
      body: { email: 'inactive@example.com', password: 'password123' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  // 경계값: 존재하지 않는 이메일
  it('[EDGE] 존재하지 않는 이메일로 로그인 시 401 INVALID_CREDENTIALS를 반환한다', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const event = createMockEvent({
      body: { email: 'nonexistent@example.com', password: 'password123' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      data: { code: 'INVALID_CREDENTIALS' },
    })
  })

  it('[EDGE] 이메일 형식이 올바르지 않으면 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { email: 'not-an-email', password: 'password123' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  it('[EDGE] 비밀번호 미입력 시 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { email: 'test@example.com' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })
})
