import { desktopApi } from '../../../lib/desktopApi'
import type {
  EncyclopediaLinkInput,
  EncyclopediaTopicInput,
} from '../types/encyclopedia'

export const getEncyclopediaTopics = async () => {
  return desktopApi.listEncyclopediaTopics()
}

export const createEncyclopediaTopic = async (topic: EncyclopediaTopicInput) => {
  return desktopApi.createEncyclopediaTopic(topic)
}

export const updateEncyclopediaTopic = async (
  topicId: string,
  topic: EncyclopediaTopicInput,
) => {
  return desktopApi.updateEncyclopediaTopic(topicId, topic)
}

export const deleteEncyclopediaTopic = async (topicId: string) => {
  return desktopApi.deleteEncyclopediaTopic(topicId)
}

export const getEncyclopediaTopic = async (topicId: string) => {
  return desktopApi.getEncyclopediaTopic(topicId)
}

export const getEncyclopediaLinks = async (topicId: string) => {
  return desktopApi.listEncyclopediaLinks(topicId)
}

export const createEncyclopediaLink = async (
  topicId: string,
  link: EncyclopediaLinkInput,
) => {
  return desktopApi.createEncyclopediaLink(topicId, link)
}

export const updateEncyclopediaLink = async (
  linkId: string,
  link: EncyclopediaLinkInput,
) => {
  return desktopApi.updateEncyclopediaLink(linkId, link)
}

export const deleteEncyclopediaLink = async (linkId: string) => {
  return desktopApi.deleteEncyclopediaLink(linkId)
}

export const openEncyclopediaLink = async (url: string) => {
  return desktopApi.openEncyclopediaLink(url)
}

export const getEncyclopediaPdfs = async (topicId: string) => {
  return desktopApi.listEncyclopediaPdfs(topicId)
}

export const uploadEncyclopediaPdf = async (topicId: string) => {
  return desktopApi.uploadEncyclopediaPdf(topicId)
}

export const deleteEncyclopediaPdf = async (pdfId: string) => {
  return desktopApi.deleteEncyclopediaPdf(pdfId)
}

export const readEncyclopediaPdfData = async (filePath: string) => {
  return desktopApi.readEncyclopediaPdfData(filePath)
}

export const openEncyclopediaPdfExternal = async (filePath: string) => {
  return desktopApi.openEncyclopediaPdfExternal(filePath)
}
