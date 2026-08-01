type HelpPromptPayload = {
  title: string
  tags: string[]
  steps: string[]
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

const ensureEncyclopediaApi = () => {
  const api = ensureDesktopApi()
  if (
    typeof api.listEncyclopediaTopics !== 'function' ||
    typeof api.createEncyclopediaTopic !== 'function' ||
    typeof api.updateEncyclopediaTopic !== 'function' ||
    typeof api.deleteEncyclopediaTopic !== 'function' ||
    typeof api.getEncyclopediaTopic !== 'function' ||
    typeof api.listEncyclopediaLinks !== 'function' ||
    typeof api.createEncyclopediaLink !== 'function' ||
    typeof api.updateEncyclopediaLink !== 'function' ||
    typeof api.deleteEncyclopediaLink !== 'function' ||
    typeof api.openEncyclopediaLink !== 'function'
  ) {
    throw new Error('Encyclopedia API is out of date. Close and restart the desktop application.')
  }
  return api
}

const ensureTodoApi = () => {
  const api = ensureDesktopApi()
  if (
    typeof api.getTodoState !== 'function' ||
    typeof api.createTodoList !== 'function' ||
    typeof api.addTodoTask !== 'function' ||
    typeof api.setTodoTaskCompleted !== 'function' ||
    typeof api.deleteTodoList !== 'function'
  ) {
    throw new Error('Todo API is out of date. Close and restart the desktop application.')
  }
  return api
}

const ensureNotesApi = () => {
  const api = ensureDesktopApi()
  if (
    typeof api.listNotebooks !== 'function' ||
    typeof api.getNotebook !== 'function' ||
    typeof api.createNotebook !== 'function' ||
    typeof api.discardEmptyNotebook !== 'function' ||
    typeof api.saveNotebook !== 'function' ||
    typeof api.softDeleteNotebook !== 'function' ||
    typeof api.restoreNotebook !== 'function' ||
    typeof api.permanentlyDeleteNotebook !== 'function' ||
    typeof api.listNotebookTags !== 'function' ||
    typeof api.renameNotebookTag !== 'function' ||
    typeof api.storeNotebookImage !== 'function' ||
    typeof api.openNotebookLink !== 'function' ||
    typeof api.exportNotebookPdf !== 'function'
  ) {
    throw new Error('Notes API is out of date. Close and restart the desktop application.')
  }
  return api
}

const ensureRecycleBinApi = () => {
  const api = ensureDesktopApi()
  if (
    typeof api.listRecycleBinCategories !== 'function' ||
    typeof api.listRecycleBinItems !== 'function' ||
    typeof api.restoreRecycleBinItems !== 'function' ||
    typeof api.permanentlyDeleteRecycleBinItems !== 'function'
  ) {
    throw new Error('Recycle Bin API is out of date. Close and restart the desktop application.')
  }
  return api
}

const ensureSettingsApi = () => {
  const api = ensureDesktopApi()
  if (
    typeof api.getApplicationSettings !== 'function' ||
    typeof api.saveApplicationSettings !== 'function' ||
    typeof api.exportDatabase !== 'function' ||
    typeof api.importDatabase !== 'function' ||
    typeof api.createDatabaseBackup !== 'function'
  ) {
    throw new Error('Settings API is out of date. Close and restart the desktop application.')
  }
  return api
}

export const desktopApi = {
  listEncyclopediaTopics: () => ensureEncyclopediaApi().listEncyclopediaTopics(),
  createEncyclopediaTopic: (payload: EncyclopediaTopicPayload) =>
    ensureEncyclopediaApi().createEncyclopediaTopic(payload),
  updateEncyclopediaTopic: (id: string, payload: EncyclopediaTopicPayload) =>
    ensureEncyclopediaApi().updateEncyclopediaTopic(id, payload),
  deleteEncyclopediaTopic: (id: string) => ensureEncyclopediaApi().deleteEncyclopediaTopic(id),
  getEncyclopediaTopic: (id: string) => ensureEncyclopediaApi().getEncyclopediaTopic(id),
  listEncyclopediaLinks: (topicId: string) =>
    ensureEncyclopediaApi().listEncyclopediaLinks(topicId),
  createEncyclopediaLink: (topicId: string, payload: EncyclopediaLinkPayload) =>
    ensureEncyclopediaApi().createEncyclopediaLink(topicId, payload),
  updateEncyclopediaLink: (id: string, payload: EncyclopediaLinkPayload) =>
    ensureEncyclopediaApi().updateEncyclopediaLink(id, payload),
  deleteEncyclopediaLink: (id: string) => ensureEncyclopediaApi().deleteEncyclopediaLink(id),
  openEncyclopediaLink: (url: string) => ensureEncyclopediaApi().openEncyclopediaLink(url),
  getTodoState: () => ensureTodoApi().getTodoState(),
  createTodoList: (payload: TodoListPayload) => ensureTodoApi().createTodoList(payload),
  addTodoTask: (payload: TodoTaskPayload) => ensureTodoApi().addTodoTask(payload),
  setTodoTaskCompleted: (id: string, isCompleted: boolean) =>
    ensureTodoApi().setTodoTaskCompleted(id, isCompleted),
  deleteTodoList: () => ensureTodoApi().deleteTodoList(),
  listNotebooks: (params: NotebookListParams) => ensureNotesApi().listNotebooks(params),
  getNotebook: (id: number) => ensureNotesApi().getNotebook(id),
  createNotebook: (title: string) => ensureNotesApi().createNotebook(title),
  discardEmptyNotebook: (id: number) => ensureNotesApi().discardEmptyNotebook(id),
  saveNotebook: (payload: NotebookSavePayload) => ensureNotesApi().saveNotebook(payload),
  softDeleteNotebook: (id: number) => ensureNotesApi().softDeleteNotebook(id),
  restoreNotebook: (id: number) => ensureNotesApi().restoreNotebook(id),
  permanentlyDeleteNotebook: (id: number) => ensureNotesApi().permanentlyDeleteNotebook(id),
  listNotebookTags: () => ensureNotesApi().listNotebookTags(),
  renameNotebookTag: (oldTag: string, newTag: string) =>
    ensureNotesApi().renameNotebookTag(oldTag, newTag),
  storeNotebookImage: (filename: string, dataBase64: string) =>
    ensureNotesApi().storeNotebookImage(filename, dataBase64),
  openNotebookLink: (url: string) => ensureNotesApi().openNotebookLink(url),
  exportNotebookPdf: (payload: { title: string; contentHtml: string }) =>
    ensureNotesApi().exportNotebookPdf(payload),
  listHelpbook: () => ensureDesktopApi().listHelpbook(),
  createHelpbook: (payload: HelpPromptPayload) => ensureDesktopApi().createHelpbook(payload),
  updateHelpbook: (id: string, payload: HelpPromptPayload) => ensureDesktopApi().updateHelpbook(id, payload),
  deleteHelpbook: (id: string) => ensureDesktopApi().deleteHelpbook(id),
  listPrompts: () => ensureDesktopApi().listPrompts(),
  createPrompt: (payload: HelpPromptPayload) => ensureDesktopApi().createPrompt(payload),
  updatePrompt: (id: string, payload: HelpPromptPayload) => ensureDesktopApi().updatePrompt(id, payload),
  deletePrompt: (id: string) => ensureDesktopApi().deletePrompt(id),
  listRecycleBinCategories: () => ensureRecycleBinApi().listRecycleBinCategories(),
  listRecycleBinItems: (category: string) =>
    ensureRecycleBinApi().listRecycleBinItems(category),
  restoreRecycleBinItems: (recycleItemIds: string[]) =>
    ensureRecycleBinApi().restoreRecycleBinItems(recycleItemIds),
  permanentlyDeleteRecycleBinItems: (recycleItemIds: string[]) =>
    ensureRecycleBinApi().permanentlyDeleteRecycleBinItems(recycleItemIds),
  getApplicationSettings: () => ensureSettingsApi().getApplicationSettings(),
  saveApplicationSettings: (payload: ApplicationSettingsPayload) =>
    ensureSettingsApi().saveApplicationSettings(payload),
  exportDatabase: () => ensureSettingsApi().exportDatabase(),
  importDatabase: () => ensureSettingsApi().importDatabase(),
  createDatabaseBackup: () => ensureSettingsApi().createDatabaseBackup(),
}
