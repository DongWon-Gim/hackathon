import prisma from '~/server/utils/prisma'
import { ERROR } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const { role } = event.context.auth
  const id = getRouterParam(event, 'id')!

  if (role !== 'ADMIN') throw ERROR.FORBIDDEN()

  const body = await readBody(event)
  const { role: newRole, isActive } = body ?? {}

  if (newRole === undefined && isActive === undefined) {
    throw ERROR.VALIDATION_ERROR('변경할 필드(role 또는 isActive)가 필요합니다')
  }

  if (newRole !== undefined && !['ADMIN', 'LEADER', 'MEMBER'].includes(newRole)) {
    throw ERROR.VALIDATION_ERROR('role은 ADMIN, LEADER, MEMBER 중 하나여야 합니다')
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw ERROR.VALIDATION_ERROR('isActive는 boolean이어야 합니다')
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw ERROR.NOT_FOUND('사용자')

  const updateData: { role?: string; isActive?: boolean } = {}
  if (newRole !== undefined) updateData.role = newRole
  if (isActive !== undefined) updateData.isActive = isActive

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true, teamId: true }
  })

  return { user: updated }
})
