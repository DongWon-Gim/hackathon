export type Role = 'ADMIN' | 'LEADER' | 'MEMBER'
export type SessionStatus = 'ACTIVE' | 'CLOSED'
export type FeedbackCategory = 'KEEP' | 'PROBLEM' | 'TRY'
export type ActionItemStatus = 'PENDING' | 'COMPLETED'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  teamId: string | null
}

export interface JwtPayload {
  userId: string
  role: Role
  teamId: string | null
}

export interface ApiError {
  code: string
  message: string
}

export interface Team {
  id: string
  name: string
  inviteCode: string
  createdAt: string
}

export interface Session {
  id: string
  title: string
  projectName: string
  status: SessionStatus
  periodStart: string | null
  periodEnd: string | null
  createdAt: string
  teamId: string
  creatorId: string
  hasInsight?: boolean
  hasSharedInsight?: boolean
}

export interface Feedback {
  id: string
  content: string
  category: FeedbackCategory
  sessionId: string
  createdAt: string
  voteCount: number
  hasVoted?: boolean
}

export interface Issue {
  title: string
  description: string
  action: string
}

export interface Insight {
  id: string
  summary: string
  issues: Issue[]
  isShared: boolean
  sessionId: string
  createdAt: string
}

export interface ActionItem {
  id: string
  content: string
  status: ActionItemStatus
  dueDate: string | null
  assigneeId: string | null
  assigneeName: string | null
  feedbackId: string | null
  insightId: string | null
  createdAt: string
}
