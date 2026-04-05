import type { BorderStyle, FontFamily, ModuleType, PageSize } from './common';

export interface NotebookSummary {
  id: string;
  title: string;
  instrumentName: string;
  pageSize: PageSize;
  coverColor: string;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookDetail {
  id: string;
  title: string;
  instrumentId: string;
  instrumentName: string;
  pageSize: PageSize;
  coverColor: string;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
  styles: NotebookModuleStyle[];
}

export interface NotebookModuleStyle {
  id: string;
  notebookId: string;
  moduleType: ModuleType;
  backgroundColor: string;
  borderColor: string;
  borderStyle: BorderStyle;
  borderWidth: number;
  borderRadius: number;
  headerBgColor: string;
  headerTextColor: string;
  bodyTextColor: string;
  fontFamily: FontFamily;
}

export interface NotebookIndex {
  entries: NotebookIndexEntry[];
}

export interface NotebookIndexEntry {
  lessonId: string;
  title: string;
  createdAt: string;
  startPageNumber: number;
}

export type CreateNotebookStyleInput = Omit<NotebookModuleStyle, 'id' | 'notebookId'>;

export interface CreateNotebookRequest {
  title: string;
  instrumentId: string;
  pageSize: PageSize;
  coverColor: string;
  styles?: CreateNotebookStyleInput[];
}
