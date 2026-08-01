import { desktopApi } from '../../../lib/desktopApi'
import type {
  RecycleBinCategory,
  RecycleBinCategoryId,
  RecycleBinItem,
} from '../types/recycleBin'

export const getRecycleBinCategories = async () => {
  return desktopApi.listRecycleBinCategories() as Promise<RecycleBinCategory[]>
}

export const getRecycleBinItems = async (category: RecycleBinCategoryId) => {
  return desktopApi.listRecycleBinItems(category) as Promise<RecycleBinItem[]>
}

export const restoreRecycleBinItems = async (recycleItemIds: string[]) => {
  return desktopApi.restoreRecycleBinItems(recycleItemIds)
}

export const permanentlyDeleteRecycleBinItems = async (recycleItemIds: string[]) => {
  return desktopApi.permanentlyDeleteRecycleBinItems(recycleItemIds)
}
