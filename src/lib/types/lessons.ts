export interface LessonSummary {
  id: string;
  title: string;
  createdAt: string;
  pageCount: number;
}

export interface LessonDetail {
  id: string;
  notebookId: string;
  title: string;
  createdAt: string;
  pages: LessonPage[];
}

export interface LessonPage {
  id: string;
  lessonId: string;
  pageNumber: number;
  moduleCount: number;
}
