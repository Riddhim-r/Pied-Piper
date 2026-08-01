import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../../components/ConfirmDialog'
import PageHeader from '../../../components/PageHeader'
import TopNav from '../../../components/TopNav'
import {
  getRecycleBinCategories,
  getRecycleBinItems,
  permanentlyDeleteRecycleBinItems,
  restoreRecycleBinItems,
} from '../services/recycleBinService'
import type {
  RecycleBinCategory,
  RecycleBinCategoryId,
  RecycleBinItem,
} from '../types/recycleBin'

const categoryIds: RecycleBinCategoryId[] = [
  'helpbook',
  'ai-prompts',
  'notes',
  'encyclopedia',
]

const isCategoryId = (value: string): value is RecycleBinCategoryId => {
  return categoryIds.includes(value as RecycleBinCategoryId)
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback
}

const RecycleBinCategoryPage = () => {
  const { categoryId = '' } = useParams()
  const validCategoryId = isCategoryId(categoryId) ? categoryId : null
  const [category, setCategory] = useState<RecycleBinCategory | null>(null)
  const [items, setItems] = useState<RecycleBinItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isWorking, setIsWorking] = useState(false)
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadCategory = async () => {
    if (!validCategoryId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const [categories, deletedItems] = await Promise.all([
        getRecycleBinCategories(),
        getRecycleBinItems(validCategoryId),
      ])
      setCategory(categories.find((item) => item.id === validCategoryId) ?? null)
      setItems(deletedItems)
      setSelectedIds(new Set())
    } catch (loadError) {
      console.error(loadError)
      setError(getErrorMessage(loadError, 'Unable to load deleted items.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategory()
  }, [validCategoryId])

  const allSelected = items.length > 0 && selectedIds.size === items.length

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
    setMessage('')
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(items.map((item) => item.id)))
  }

  const restoreSelected = async () => {
    if (selectedIds.size === 0) {
      return
    }

    setIsWorking(true)
    setError('')
    setMessage('')

    try {
      const result = await restoreRecycleBinItems([...selectedIds])
      setMessage(`${result.processed} ${result.processed === 1 ? 'item' : 'items'} restored.`)
      await loadCategory()
    } catch (restoreError) {
      console.error(restoreError)
      setError(getErrorMessage(restoreError, 'Could not restore the selected items.'))
    } finally {
      setIsWorking(false)
    }
  }

  const permanentlyDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      return
    }

    setIsWorking(true)
    setError('')
    setMessage('')

    try {
      const result = await permanentlyDeleteRecycleBinItems([...selectedIds])
      setShowPermanentDeleteConfirm(false)
      setMessage(
        `${result.processed} ${result.processed === 1 ? 'item' : 'items'} permanently deleted.`,
      )
      await loadCategory()
    } catch (deleteError) {
      console.error(deleteError)
      setShowPermanentDeleteConfirm(false)
      setError(getErrorMessage(deleteError, 'Could not permanently delete the selected items.'))
    } finally {
      setIsWorking(false)
    }
  }

  if (!validCategoryId) {
    return (
      <div className="page">
        <TopNav
          title="Pied Piper"
          subtitle="Recycle Bin"
          rightSlot={
            <Link className="btn ghost" to="/recycle-bin">
              Back
            </Link>
          }
        />
        <div className="content">
          <div className="card empty-state">
            <h3>Category not found</h3>
            <p>This Recycle Bin category does not exist.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Recycle Bin"
        rightSlot={
          <Link className="btn ghost" to="/recycle-bin">
            Back to Categories
          </Link>
        }
      />

      <div className="content">
        <ConfirmDialog
          open={showPermanentDeleteConfirm}
          title="Delete Permanently?"
          message={`${selectedIds.size} selected ${
            selectedIds.size === 1 ? 'item' : 'items'
          } will be removed permanently. This cannot be undone.`}
          confirmText="Delete Permanently"
          cancelText="Cancel"
          onCancel={() => setShowPermanentDeleteConfirm(false)}
          onConfirm={() => void permanentlyDeleteSelected()}
        />

        <PageHeader
          title={category?.label ?? 'Recycle Bin'}
          description={`${items.length} deleted ${items.length === 1 ? 'item' : 'items'} in this category.`}
        />

        {items.length > 0 ? (
          <div className="card recycle-selection-bar">
            <div>
              <strong>{selectedIds.size} selected</strong>
              <p className="muted">Select individual items or use Select All.</p>
            </div>
            <div className="form-actions">
              <button className="btn ghost" type="button" onClick={toggleSelectAll}>
                {allSelected ? 'Clear Selection' : 'Select All'}
              </button>
              <button
                className="btn primary"
                type="button"
                disabled={selectedIds.size === 0 || isWorking}
                onClick={() => void restoreSelected()}
              >
                Restore
              </button>
              <button
                className="btn danger"
                type="button"
                disabled={selectedIds.size === 0 || isWorking}
                onClick={() => setShowPermanentDeleteConfirm(true)}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success-message">{message}</p> : null}
        {isLoading ? <div className="card">Loading deleted items...</div> : null}

        {!isLoading && items.length === 0 ? (
          <div className="card empty-state">
            <h3>Nothing deleted</h3>
            <p>This category is currently empty.</p>
          </div>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <div className="stack">
            {items.map((item) => (
              <label
                className={`card recycle-item${selectedIds.has(item.id) ? ' selected' : ''}`}
                key={item.id}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  disabled={isWorking}
                  onChange={() => toggleItem(item.id)}
                />
                <div>
                  <h3>{item.title}</h3>
                  <p className="muted">Deleted {new Date(item.deletedAt).toLocaleString()}</p>
                </div>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default RecycleBinCategoryPage
