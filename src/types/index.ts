export interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName: string | null
  lastName: string | null
  language: string
  defaultPageSize: string
  defaultInstrument: string
  avatarUrl: string | null
  scheduledDeletionDate: string | null
}
