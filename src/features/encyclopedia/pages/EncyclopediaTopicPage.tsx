import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../../components/ConfirmDialog'
import PageHeader from '../../../components/PageHeader'
import TopNav from '../../../components/TopNav'
import {
  createEncyclopediaLink,
  deleteEncyclopediaLink,
  getEncyclopediaLinks,
  getEncyclopediaTopic,
  openEncyclopediaLink,
  updateEncyclopediaLink,
} from '../services/encyclopediaService'
import type { EncyclopediaLink, EncyclopediaTopic } from '../types/encyclopedia'

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback
}

const EncyclopediaTopicPage = () => {
  const { topicId = '' } = useParams()
  const [topic, setTopic] = useState<EncyclopediaTopic | null>(null)
  const [links, setLinks] = useState<EncyclopediaLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const loadTopic = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [loadedTopic, loadedLinks] = await Promise.all([
        getEncyclopediaTopic(topicId),
        getEncyclopediaLinks(topicId),
      ])
      setTopic(loadedTopic)
      setLinks(loadedLinks)
    } catch (loadError) {
      console.error(loadError)
      setError(getErrorMessage(loadError, 'Unable to load this topic.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTopic()
  }, [topicId])

  const resetForm = () => {
    setLabel('')
    setUrl('')
    setEditingId(null)
    setError('')
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (link: EncyclopediaLink) => {
    setLabel(link.label)
    setUrl(link.url)
    setEditingId(link.id)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    resetForm()
    setShowForm(false)
  }

  const saveLink = async () => {
    const trimmedLabel = label.trim()
    const trimmedUrl = url.trim()

    if (!trimmedLabel || !trimmedUrl) {
      setError('Link name and URL are required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const input = { label: trimmedLabel, url: trimmedUrl }
      if (editingId) {
        await updateEncyclopediaLink(editingId, input)
      } else {
        await createEncyclopediaLink(topicId, input)
      }

      closeForm()
      await loadTopic()
    } catch (saveError) {
      console.error(saveError)
      setError(getErrorMessage(saveError, 'Could not save link.'))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) {
      return
    }

    try {
      await deleteEncyclopediaLink(pendingDeleteId)
      setPendingDeleteId(null)
      await loadTopic()
    } catch (deleteError) {
      console.error(deleteError)
      setError(getErrorMessage(deleteError, 'Could not remove link.'))
    }
  }

  const openLink = async (linkUrl: string) => {
    try {
      setError('')
      await openEncyclopediaLink(linkUrl)
    } catch (openError) {
      console.error(openError)
      setError(getErrorMessage(openError, 'Could not open link.'))
    }
  }

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Encyclopedia"
        rightSlot={
          <Link className="btn ghost" to="/encyclopedia">
            Back to Topics
          </Link>
        }
      />

      <div className="content">
        <ConfirmDialog
          open={pendingDeleteId !== null}
          title="Remove Link?"
          message="This link will be removed permanently from the topic."
          confirmText="Remove"
          cancelText="Cancel"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />

        {isLoading ? <div className="card">Loading topic...</div> : null}

        {!isLoading && !topic ? (
          <div className="card empty-state">
            <h3>Topic not found</h3>
            <p>This topic may have been deleted or moved to the Recycle Bin.</p>
          </div>
        ) : null}

        {!isLoading && topic ? (
          <>
            <PageHeader
              title={topic.title}
              description={topic.description || 'Store useful links for this topic.'}
              actionSlot={
                <button
                  className="btn primary"
                  type="button"
                  data-global-create
                  onClick={openCreateForm}
                >
                  Add Link
                </button>
              }
            />

            {showForm ? (
              <div className="card form-grid">
                <label className="field">
                  <span>Link name</span>
                  <input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="React documentation"
                    maxLength={160}
                  />
                </label>

                <label className="field">
                  <span>URL</span>
                  <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://react.dev"
                    maxLength={2000}
                  />
                </label>

                {error ? <p className="error">{error}</p> : null}

                <div className="form-actions">
                  <button className="btn ghost" type="button" data-global-close onClick={closeForm}>
                    Cancel
                  </button>
                  <button className="btn primary" type="button" disabled={isSaving} onClick={saveLink}>
                    {isSaving ? 'Saving...' : editingId ? 'Update Link' : 'Add Link'}
                  </button>
                </div>
              </div>
            ) : null}

            {!showForm && error ? <p className="error">{error}</p> : null}

            {links.length === 0 ? (
              <div className="card empty-state">
                <h3>No links yet</h3>
                <p>Add the first useful link to this topic.</p>
              </div>
            ) : (
              <div className="stack">
                {links.map((link) => (
                  <div className="card" key={link.id}>
                    <div className="card-head">
                      <div>
                        <h3>{link.label}</h3>
                        <p className="saved-url">{link.url}</p>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button className="btn primary" type="button" onClick={() => openLink(link.url)}>
                        Open
                      </button>
                      <button className="btn ghost" type="button" onClick={() => openEditForm(link)}>
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => setPendingDeleteId(link.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

export default EncyclopediaTopicPage
