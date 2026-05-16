export interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName: string | null
  lastName: string | null
  language: string
  defaultPageSize: string | null
  defaultInstrumentId: string | null
  avatarUrl: string | null
  scheduledDeletionAt: string | null
}
