export type NotebookSummary = {
  id: number;
  title: string;
  tag: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type NotebookRecord = NotebookSummary & {
  contentJson: string;
  plainTextLength: number;
};

export type SaveNotebookPayload = {
  id: number;
  title: string;
  tag: string | null;
  contentJson: string;
  plainTextLength: number;
};

export type StoredImage = {
  filePath: string;
};

export type OutlineHeading = {
  key: string;
  text: string;
  level: number;
  pos: number;
  children: OutlineHeading[];
};

export type EditorDraft = {
  contentJson: string;
  plainTextLength: number;
  outline: OutlineHeading[];
};

