export type EncyclopediaTopic = {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  linkCount?: number
  pdfCount?: number
}

export type EncyclopediaTopicInput = {
  title: string
  description: string
}

export type EncyclopediaLink = {
  id: string
  topicId: string
  label: string
  url: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type EncyclopediaLinkInput = {
  label: string
  url: string
}

export type EncyclopediaPdf = {
  id: string
  topicId: string
  fileName: string
  filePath: string
  fileSize: number
  createdAt: string
}
