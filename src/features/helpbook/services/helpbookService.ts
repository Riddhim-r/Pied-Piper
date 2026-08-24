import { desktopApi } from '../../../lib/desktopApi'

export type HelpStepPayload = string | { title?: string; text: string }

export type HelpbookPayload = {
  title: string
  tags: string[]
  steps: HelpStepPayload[]
}

export const listHelpbookEntries = async () => {
  return desktopApi.listHelpbook()
}

export const createHelpbookEntry = async (payload: HelpbookPayload) => {
  return desktopApi.createHelpbook(payload)
}

export const updateHelpbookEntry = async (id: string, payload: HelpbookPayload) => {
  return desktopApi.updateHelpbook(id, payload)
}

export const deleteHelpbookEntry = async (id: string) => {
  return desktopApi.deleteHelpbook(id)
}
