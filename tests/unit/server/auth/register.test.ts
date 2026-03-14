/**
 * 단위 테스트: POST /api/auth/register (회원가입)
 * 관련 기능: FEAT-000
 * 관련 화면: SCR-000-1
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { mockPrisma, resetMocks, createMockEvent } from '../../../helpers/mocks'
import handler from '~/server/api/auth/register.post'

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    resetMocks()
  })

  // TC-001: 유효한 입력으로 회원가입 성공
  it('[TC-001] 유효한 입력으로 회원가입 시 user 객체를 반환하고 role은 MEMBER이다', async () => {
    const createdUser = {
      id: 'new-id',
      email: 'test@example.com',
      name: '테스트',
      role: 'MEMBER',
      teamId: null,
      createdAt: new Date(),
    }
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue(createdUser)

    const event = createMockEvent({
      body: { email: 'test@example.com', password: 'password123', name: '테스트' },
    })
    const result = await handler(event)

    expect(result.email).toBe('test@example.com')
    expect(result.role).toBe('MEMBER')
    expect(result.id).toBe('new-id')
    expect(mockPrisma.user.create).toHaveBeenCalledOnce()
  })

  // TC-002: 이미 등록된 이메일로 회원가입 시 409 DUPLICATE_EMAIL
  it('[TC-002] 이미 등록된 이메일로 회원가입 시 409 DUPLICATE_EMAIL 에러를 반환한다', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-id',
      email: 'existing@example.com',
    })

    const event = createMockEvent({
      body: { email: 'existing@example.com', password: 'password123', name: '테스트' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'DUPLICATE_EMAIL' },
    })
  })

  // TC-003: 비밀번호가 8자 미만일 때 400 VALIDATION_ERROR
  it('[TC-003] 비밀번호가 8자 미만일 때 회원가입 시 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { email: 'test@example.com', password: 'abc123', name: '테스트' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  // TC-004: 이메일 형식이 잘못된 경우 400 VALIDATION_ERROR
  it('[TC-004] 이메일 형식이 잘못된 경우 회원가입 시 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { email: 'not-an-email', password: 'password123', name: '테스트' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  // 경계값: 이름이 빈 문자열인 경우
  it('[EDGE] 이름이 빈 문자열인 경우 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { email: 'test@example.com', password: 'password123', name: '' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  // 경계값: 비밀번호가 숫자만으로 구성된 경우
  it('[EDGE] 비밀번호가 숫자만으로 구성된 경우 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { email: 'test@example.com', password: '12345678', name: '테스트' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  // 경계값: 이메일 미입력
  it('[EDGE] 이메일 미입력 시 400 VALIDATION_ERROR를 반환한다', async () => {
    const event = createMockEvent({
      body: { password: 'password123', name: '테스트' },
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: 'VALIDATION_ERROR' },
    })
  })

  // bcrypt.hash가 실제 실행되므로 prisma.user.create에 평문이 아닌 해시가 전달된다
  it('비밀번호는 해시되어 prisma.user.create에 전달된다', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-id',
      email: 'test@example.com',
      name: '테스트',
      role: 'MEMBER',
      teamId: null,
      createdAt: new Date(),
    })

    const event = createMockEvent({
      body: { email: 'test@example.com', password: 'password123', name: '테스트' },
    })
    await handler(event)

    const createCall = mockPrisma.user.create.mock.calls[0][0]
    expect(createCall.data.password).not.toBe('password123')
    expect(createCall.data.password).toMatch(/^\$2b\$/)
  })
})
