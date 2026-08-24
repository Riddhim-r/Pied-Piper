import { desktopApi } from '../../../lib/desktopApi'

export type PromptPayload = {
  title: string
  tags: string[]
  steps: string[]
}

export const listPromptEntries = async () => {
  return desktopApi.listPrompts()
}

export const createPromptEntry = async (payload: PromptPayload) => {
  return desktopApi.createPrompt(payload)
}

export const updatePromptEntry = async (id: string, payload: PromptPayload) => {
  return desktopApi.updatePrompt(id, payload)
}

export const deletePromptEntry = async (id: string) => {
  return desktopApi.deletePrompt(id)
}
