export {}

declare global {
  interface Window {
    piedPiper?: {
      listEncyclopediaTopics: () => Promise<any[]>
      createEncyclopediaTopic: (payload: any) => Promise<{ id: string }>
      updateEncyclopediaTopic: (id: string, payload: any) => Promise<{ ok: true }>
      deleteEncyclopediaTopic: (id: string) => Promise<{ ok: true }>
      getEncyclopediaTopic: (id: string) => Promise<any | null>
      listEncyclopediaLinks: (topicId: string) => Promise<any[]>
      createEncyclopediaLink: (topicId: string, payload: any) => Promise<{ id: string }>
      updateEncyclopediaLink: (id: string, payload: any) => Promise<{ ok: true }>
      deleteEncyclopediaLink: (id: string) => Promise<{ ok: true }>
      openEncyclopediaLink: (url: string) => Promise<{ ok: true }>
      getTodoState: () => Promise<any>
      createTodoList: (payload: any) => Promise<{ ok: true }>
      addTodoTask: (payload: any) => Promise<{ id: string }>
      setTodoTaskCompleted: (id: string, isCompleted: boolean) => Promise<{ ok: true }>
      deleteTodoList: () => Promise<{ ok: true }>
      listNotebooks: (params: any) => Promise<any[]>
      getNotebook: (id: number) => Promise<any | null>
      createNotebook: (title: string) => Promise<any>
      discardEmptyNotebook: (id: number) => Promise<{ discarded: boolean }>
      saveNotebook: (payload: any) => Promise<any>
      softDeleteNotebook: (id: number) => Promise<{ ok: true }>
      restoreNotebook: (id: number) => Promise<{ ok: true }>
      permanentlyDeleteNotebook: (id: number) => Promise<{ ok: true }>
      listNotebookTags: () => Promise<string[]>
      renameNotebookTag: (oldTag: string, newTag: string) => Promise<{ ok: true }>
      storeNotebookImage: (filename: string, dataBase64: string) => Promise<string>
      openNotebookLink: (url: string) => Promise<{ ok: true }>
      exportNotebookPdf: (payload: {
        title: string
        contentHtml: string
      }) => Promise<{ canceled: boolean; filePath?: string }>
      listHelpbook: () => Promise<any[]>
      createHelpbook: (payload: any) => Promise<{ id: string }>
      updateHelpbook: (id: string, payload: any) => Promise<{ ok: true }>
      deleteHelpbook: (id: string) => Promise<{ ok: true }>
      listPrompts: () => Promise<any[]>
      createPrompt: (payload: any) => Promise<{ id: string }>
      updatePrompt: (id: string, payload: any) => Promise<{ ok: true }>
      deletePrompt: (id: string) => Promise<{ ok: true }>
      listRecycleBinCategories: () => Promise<any[]>
      listRecycleBinItems: (category: string) => Promise<any[]>
      restoreRecycleBinItems: (recycleItemIds: string[]) => Promise<{ processed: number }>
      permanentlyDeleteRecycleBinItems: (
        recycleItemIds: string[],
      ) => Promise<{ processed: number }>
      getApplicationSettings: () => Promise<any>
      saveApplicationSettings: (payload: any) => Promise<any>
      exportDatabase: () => Promise<{ canceled: boolean; filePath?: string }>
      importDatabase: () => Promise<{
        canceled: boolean
        restarting?: boolean
        safetyBackupPath?: string
      }>
      createDatabaseBackup: () => Promise<{ canceled: boolean; filePath?: string }>
    }
  }
}
