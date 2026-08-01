import { desktopApi } from '../../../lib/desktopApi'
import type {
  EncyclopediaLink,
  EncyclopediaLinkInput,
  EncyclopediaTopic,
  EncyclopediaTopicInput,
} from '../types/encyclopedia'

export const getEncyclopediaTopics = async () => {
  return desktopApi.listEncyclopediaTopics() as Promise<EncyclopediaTopic[]>
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
  return desktopApi.getEncyclopediaTopic(topicId) as Promise<EncyclopediaTopic | null>
}

export const getEncyclopediaLinks = async (topicId: string) => {
  return desktopApi.listEncyclopediaLinks(topicId) as Promise<EncyclopediaLink[]>
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
