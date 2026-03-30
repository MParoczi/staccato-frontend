import type { Language, PageSize } from './common';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: Language;
  defaultPageSize: PageSize | null;
  defaultInstrumentId: string | null;
  avatarUrl: string | null;
  scheduledDeletionAt: string | null;
}
