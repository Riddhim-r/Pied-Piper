export type RecycleBinCategoryId =
  | 'helpbook'
  | 'ai-prompts'
  | 'notes'
  | 'encyclopedia'

export type RecycleBinCategory = {
  id: RecycleBinCategoryId
  label: string
  itemCount: number
}

export type RecycleBinItem = {
  id: string
  category: RecycleBinCategoryId
  itemType: string
  originalId: string
  title: string
  deletedAt: string
}
