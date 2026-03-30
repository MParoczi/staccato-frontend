export interface PdfExport {
  id: string;
  notebookId: string;
  notebookTitle: string;
  status: 'Pending' | 'Processing' | 'Ready' | 'Failed';
  createdAt: string;
  completedAt: string | null;
  lessonIds: string[] | null;
}
