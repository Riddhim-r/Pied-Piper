type HelpPromptPayload = {
  title: string
  tags: string[]
  steps: (string | { title?: string; text: string })[]
}

type EncyclopediaTopicPayload = {
  title: string
  description: string
}

type EncyclopediaLinkPayload = {
  label: string
  url: string
}

type TodoListPayload = {
  name: string
}

type TodoTaskPayload = {
  title: string
}

type NotebookListParams = {
  search: string
  tag: string | null
  includeTrashed: boolean
}

type NotebookSavePayload = {
  id: number
  title: string
  tag: string | null
  contentJson: string
  plainTextLength: number
}

type ApplicationSettingsPayload = {
  applicationName: string
  featureThemes: Record<string, string>
}

const ensureDesktopApi = () => {
  if (!window.piedPiper) {
    throw new Error('Desktop API unavailable. Launch this app through Electron.')
  }
  return window.piedPiper
}

const ensureApiMethods = (methodNames: (keyof NonNullable<typeof window.piedPiper>)[], featureName: string) => {
  const api = ensureDesktopApi()
  const missing = methodNames.find((method) => typeof api[method] !== 'function')
  if (missing) {
    throw new Error(`${featureName} API is out of date. Close and restart the desktop application.`)
  }
  return api
}

export const desktopApi = {
  // Encyclopedia
  listEncyclopediaTopics: () =>
    ensureApiMethods(
      ['listEncyclopediaTopics', 'createEncyclopediaTopic', 'updateEncyclopediaTopic', 'deleteEncyclopediaTopic', 'getEncyclopediaTopic', 'listEncyclopediaLinks', 'createEncyclopediaLink', 'updateEncyclopediaLink', 'deleteEncyclopediaLink', 'openEncyclopediaLink'],
      'Encyclopedia'
    ).listEncyclopediaTopics(),
  createEncyclopediaTopic: (payload: EncyclopediaTopicPayload) =>
    ensureDesktopApi().createEncyclopediaTopic(payload),
  updateEncyclopediaTopic: (id: string, payload: EncyclopediaTopicPayload) =>
    ensureDesktopApi().updateEncyclopediaTopic(id, payload),
  deleteEncyclopediaTopic: (id: string) => ensureDesktopApi().deleteEncyclopediaTopic(id),
  getEncyclopediaTopic: (id: string) => ensureDesktopApi().getEncyclopediaTopic(id),
  listEncyclopediaLinks: (topicId: string) =>
    ensureDesktopApi().listEncyclopediaLinks(topicId),
  createEncyclopediaLink: (topicId: string, payload: EncyclopediaLinkPayload) =>
    ensureDesktopApi().createEncyclopediaLink(topicId, payload),
  updateEncyclopediaLink: (id: string, payload: EncyclopediaLinkPayload) =>
    ensureDesktopApi().updateEncyclopediaLink(id, payload),
  deleteEncyclopediaLink: (id: string) => ensureDesktopApi().deleteEncyclopediaLink(id),
  openEncyclopediaLink: (url: string) => ensureDesktopApi().openEncyclopediaLink(url),
  uploadEncyclopediaPdf: (topicId: string) => ensureDesktopApi().uploadEncyclopediaPdf(topicId),
  listEncyclopediaPdfs: (topicId: string) => ensureDesktopApi().listEncyclopediaPdfs(topicId),
  deleteEncyclopediaPdf: (id: string) => ensureDesktopApi().deleteEncyclopediaPdf(id),
  readEncyclopediaPdfData: (filePath: string) => ensureDesktopApi().readEncyclopediaPdfData(filePath),
  openEncyclopediaPdfExternal: (filePath: string) => ensureDesktopApi().openEncyclopediaPdfExternal(filePath),

  // Todo
  getTodoState: () =>
    ensureApiMethods(
      ['getTodoState', 'createTodoList', 'addTodoTask', 'setTodoTaskCompleted', 'deleteTodoList'],
      'Todo'
    ).getTodoState(),
  createTodoList: (payload: TodoListPayload) => ensureDesktopApi().createTodoList(payload),
  addTodoTask: (payload: TodoTaskPayload) => ensureDesktopApi().addTodoTask(payload),
  setTodoTaskCompleted: (id: string, isCompleted: boolean) =>
    ensureDesktopApi().setTodoTaskCompleted(id, isCompleted),
  deleteTodoList: () => ensureDesktopApi().deleteTodoList(),

  // Notes
  listNotebooks: (params: NotebookListParams) =>
    ensureApiMethods(
      ['listNotebooks', 'getNotebook', 'createNotebook', 'discardEmptyNotebook', 'saveNotebook', 'softDeleteNotebook', 'restoreNotebook', 'permanentlyDeleteNotebook', 'listNotebookTags', 'renameNotebookTag', 'storeNotebookImage', 'openNotebookLink', 'exportNotebookPdf'],
      'Notes'
    ).listNotebooks(params),
  getNotebook: (id: number) => ensureDesktopApi().getNotebook(id),
  createNotebook: (title: string) => ensureDesktopApi().createNotebook(title),
  discardEmptyNotebook: (id: number) => ensureDesktopApi().discardEmptyNotebook(id),
  saveNotebook: (payload: NotebookSavePayload) => ensureDesktopApi().saveNotebook(payload),
  softDeleteNotebook: (id: number) => ensureDesktopApi().softDeleteNotebook(id),
  restoreNotebook: (id: number) => ensureDesktopApi().restoreNotebook(id),
  permanentlyDeleteNotebook: (id: number) => ensureDesktopApi().permanentlyDeleteNotebook(id),
  listNotebookTags: () => ensureDesktopApi().listNotebookTags(),
  renameNotebookTag: (oldTag: string, newTag: string) =>
    ensureDesktopApi().renameNotebookTag(oldTag, newTag),
  storeNotebookImage: (filename: string, dataBase64: string) =>
    ensureDesktopApi().storeNotebookImage(filename, dataBase64),
  openNotebookLink: (url: string) => ensureDesktopApi().openNotebookLink(url),
  exportNotebookPdf: (payload: { title: string; contentHtml: string }) =>
    ensureDesktopApi().exportNotebookPdf(payload),

  // Knowledge Entries (Helpbook & Prompts)
  listHelpbook: () => ensureDesktopApi().listHelpbook(),
  createHelpbook: (payload: HelpPromptPayload) => ensureDesktopApi().createHelpbook(payload),
  updateHelpbook: (id: string, payload: HelpPromptPayload) =>
    ensureDesktopApi().updateHelpbook(id, payload),
  deleteHelpbook: (id: string) => ensureDesktopApi().deleteHelpbook(id),
  listPrompts: () => ensureDesktopApi().listPrompts(),
  createPrompt: (payload: { title: string; tags: string[]; steps: string[] }) =>
    ensureDesktopApi().createPrompt(payload),
  updatePrompt: (id: string, payload: { title: string; tags: string[]; steps: string[] }) =>
    ensureDesktopApi().updatePrompt(id, payload),
  deletePrompt: (id: string) => ensureDesktopApi().deletePrompt(id),

  // Recycle Bin
  listRecycleBinCategories: () =>
    ensureApiMethods(
      ['listRecycleBinCategories', 'listRecycleBinItems', 'restoreRecycleBinItems', 'permanentlyDeleteRecycleBinItems'],
      'Recycle Bin'
    ).listRecycleBinCategories(),
  listRecycleBinItems: (category: string) =>
    ensureDesktopApi().listRecycleBinItems(category),
  restoreRecycleBinItems: (recycleItemIds: string[]) =>
    ensureDesktopApi().restoreRecycleBinItems(recycleItemIds),
  permanentlyDeleteRecycleBinItems: (recycleItemIds: string[]) =>
    ensureDesktopApi().permanentlyDeleteRecycleBinItems(recycleItemIds),

  // Settings
  getApplicationSettings: () =>
    ensureApiMethods(
      ['getApplicationSettings', 'saveApplicationSettings', 'exportDatabase', 'importDatabase', 'createDatabaseBackup'],
      'Settings'
    ).getApplicationSettings(),
  saveApplicationSettings: (payload: ApplicationSettingsPayload) =>
    ensureDesktopApi().saveApplicationSettings(payload),
  exportDatabase: () => ensureDesktopApi().exportDatabase(),
  importDatabase: () => ensureDesktopApi().importDatabase(),
  createDatabaseBackup: () => ensureDesktopApi().createDatabaseBackup(),
}
