import { desktopApi } from '../../../lib/desktopApi'
import type { NotebookRecord, NotebookSummary, SaveNotebookPayload } from '../types'

export const listNotebooks = async (params: {
  search: string
  tag: string | null
  includeTrashed: boolean
}) => {
  return desktopApi.listNotebooks(params) as Promise<NotebookSummary[]>
}

export const getNotebook = async (id: number) => {
  return desktopApi.getNotebook(id) as Promise<NotebookRecord | null>
}

export const createNotebook = async (title: string) => {
  return desktopApi.createNotebook(title) as Promise<NotebookRecord>
}

export const discardEmptyNotebook = async (id: number) => {
  return desktopApi.discardEmptyNotebook(id)
}

export const saveNotebook = async (payload: SaveNotebookPayload) => {
  return desktopApi.saveNotebook(payload) as Promise<NotebookRecord>
}

export const softDeleteNotebook = async (id: number) => {
  return desktopApi.softDeleteNotebook(id)
}

export const restoreNotebook = async (id: number) => {
  return desktopApi.restoreNotebook(id)
}

export const permanentlyDeleteNotebook = async (id: number) => {
  return desktopApi.permanentlyDeleteNotebook(id)
}

export const listTags = async () => {
  return desktopApi.listNotebookTags()
}

export const renameTag = async (oldTag: string, newTag: string) => {
  return desktopApi.renameNotebookTag(oldTag, newTag)
}

export const storeImage = async (filename: string, dataBase64: string) => {
  return desktopApi.storeNotebookImage(filename, dataBase64)
}

export const resolveImageSource = async (src: string) => src

export const openNotebookLink = async (url: string) => {
  return desktopApi.openNotebookLink(url)
}

export const exportNotebookPdf = async (title: string, contentHtml: string) => {
  return desktopApi.exportNotebookPdf({ title, contentHtml })
}
