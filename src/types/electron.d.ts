export {}

export interface EncyclopediaTopicType {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface EncyclopediaLinkType {
  id: string
  topicId: string
  label: string
  url: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface TodoTaskType {
  id: string
  listId: number
  title: string
  isCompleted: boolean
  sortOrder: number
  createdAt: string
  completedAt: string | null
}

export interface TodoListType {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface TodoStateType {
  list: TodoListType | null
  tasks: TodoTaskType[]
}

export interface NotebookSummaryType {
  id: number
  title: string
  tag: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface NotebookRecordType extends NotebookSummaryType {
  contentJson: string
  plainTextLength: number
}

export interface HelpEntryType {
  id: string
  title: string
  tags: string[]
  steps: (string | { title?: string; text: string })[]
}

export interface PromptEntryType {
  id: string
  title: string
  tags: string[]
  steps: string[]
}

export interface RecycleBinCategoryType {
  id: string
  label: string
  itemCount: number
}

export interface RecycleBinItemType {
  id: string
  category: string
  itemType: string
  originalId: string
  title: string
  deletedAt: string
}

export interface ApplicationSettingsType {
  applicationName: string
  featureThemes: Record<string, string>
  databaseLocation: string
  storageUsedBytes: number
}

declare global {
  interface Window {
    piedPiper?: {
      listEncyclopediaTopics: () => Promise<EncyclopediaTopicType[]>
      createEncyclopediaTopic: (payload: { title: string; description: string }) => Promise<{ id: string }>
      updateEncyclopediaTopic: (id: string, payload: { title: string; description: string }) => Promise<{ ok: true }>
      deleteEncyclopediaTopic: (id: string) => Promise<{ ok: true }>
      getEncyclopediaTopic: (id: string) => Promise<EncyclopediaTopicType | null>
      listEncyclopediaLinks: (topicId: string) => Promise<EncyclopediaLinkType[]>
      createEncyclopediaLink: (topicId: string, payload: { label: string; url: string }) => Promise<{ id: string }>
      updateEncyclopediaLink: (id: string, payload: { label: string; url: string }) => Promise<{ ok: true }>
      deleteEncyclopediaLink: (id: string) => Promise<{ ok: true }>
      openEncyclopediaLink: (url: string) => Promise<{ ok: true }>
      getTodoState: () => Promise<TodoStateType>
      createTodoList: (payload: { name: string }) => Promise<{ ok: true }>
      addTodoTask: (payload: { title: string }) => Promise<{ id: string }>
      setTodoTaskCompleted: (id: string, isCompleted: boolean) => Promise<{ ok: true }>
      deleteTodoList: () => Promise<{ ok: true }>
      listNotebooks: (params: { search: string; tag: string | null; includeTrashed: boolean }) => Promise<NotebookSummaryType[]>
      getNotebook: (id: number) => Promise<NotebookRecordType | null>
      createNotebook: (title: string) => Promise<NotebookRecordType>
      discardEmptyNotebook: (id: number) => Promise<{ discarded: boolean }>
      saveNotebook: (payload: { id: number; title: string; tag: string | null; contentJson: string; plainTextLength: number }) => Promise<NotebookRecordType>
      softDeleteNotebook: (id: number) => Promise<{ ok: true }>
      restoreNotebook: (id: number) => Promise<{ ok: true }>
      permanentlyDeleteNotebook: (id: number) => Promise<{ ok: true }>
      listNotebookTags: () => Promise<string[]>
      renameNotebookTag: (oldTag: string, newTag: string) => Promise<{ ok: true }>
      storeNotebookImage: (filename: string, dataBase64: string) => Promise<string>
      openNotebookLink: (url: string) => Promise<{ ok: true }>
      exportNotebookPdf: (payload: { title: string; contentHtml: string }) => Promise<{ canceled: boolean; filePath?: string }>
      listHelpbook: () => Promise<HelpEntryType[]>
      createHelpbook: (payload: { title: string; tags: string[]; steps: (string | { title?: string; text: string })[] }) => Promise<{ id: string }>
      updateHelpbook: (id: string, payload: { title: string; tags: string[]; steps: (string | { title?: string; text: string })[] }) => Promise<{ ok: true }>
      deleteHelpbook: (id: string) => Promise<{ ok: true }>
      listPrompts: () => Promise<PromptEntryType[]>
      createPrompt: (payload: { title: string; tags: string[]; steps: string[] }) => Promise<{ id: string }>
      updatePrompt: (id: string, payload: { title: string; tags: string[]; steps: string[] }) => Promise<{ ok: true }>
      deletePrompt: (id: string) => Promise<{ ok: true }>
      listRecycleBinCategories: () => Promise<RecycleBinCategoryType[]>
      listRecycleBinItems: (category: string) => Promise<RecycleBinItemType[]>
      restoreRecycleBinItems: (recycleItemIds: string[]) => Promise<{ processed: number }>
      permanentlyDeleteRecycleBinItems: (recycleItemIds: string[]) => Promise<{ processed: number }>
      getApplicationSettings: () => Promise<ApplicationSettingsType>
      saveApplicationSettings: (payload: { applicationName: string; featureThemes: Record<string, string> }) => Promise<ApplicationSettingsType>
      exportDatabase: () => Promise<{ canceled: boolean; filePath?: string }>
      importDatabase: () => Promise<{ canceled: boolean; restarting?: boolean; safetyBackupPath?: string }>
      createDatabaseBackup: () => Promise<{ canceled: boolean; filePath?: string }>
    }
  }
}
