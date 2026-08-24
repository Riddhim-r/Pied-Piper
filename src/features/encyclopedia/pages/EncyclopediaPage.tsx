import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../../components/ConfirmDialog'
import PageHeader from '../../../components/PageHeader'
import TopNav from '../../../components/TopNav'
import { SearchBar } from '../../../components/SearchBar'
import {
  createEncyclopediaTopic,
  deleteEncyclopediaTopic,
  getEncyclopediaTopics,
  updateEncyclopediaTopic,
} from '../services/encyclopediaService'
import type { EncyclopediaTopic } from '../types/encyclopedia'

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback
}

const EncyclopediaPage = () => {
  const [topics, setTopics] = useState<EncyclopediaTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const searchedTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return topics
    return topics.filter((topic) =>
      topic.title.toLowerCase().includes(query)
    )
  }, [topics, searchQuery])

  const loadTopics = async () => {
    setIsLoading(true)

    try {
      const loadedTopics = await getEncyclopediaTopics()
      setTopics(loadedTopics)
    } catch (loadError) {
      console.error(loadError)
      setError(getErrorMessage(loadError, 'Unable to load encyclopedia topics.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTopics()
  }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setEditingId(null)
    setError('')
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (topic: EncyclopediaTopic) => {
    setTitle(topic.title)
    setDescription(topic.description)
    setEditingId(topic.id)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    resetForm()
    setShowForm(false)
  }

  const saveTopic = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Topic title is required.')
      return
    }

    setError('')
    setIsSaving(true)

    try {
      const topicInput = {
        title: trimmedTitle,
        description: description.trim(),
      }

      if (editingId) {
        await updateEncyclopediaTopic(editingId, topicInput)
      } else {
        await createEncyclopediaTopic(topicInput)
      }

      closeForm()
      await loadTopics()
    } catch (saveError) {
      console.error(saveError)
      const fallback = editingId ? 'Could not update topic.' : 'Could not create topic.'
      setError(getErrorMessage(saveError, fallback))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) {
      return
    }

    try {
      await deleteEncyclopediaTopic(pendingDeleteId)
      setPendingDeleteId(null)
      await loadTopics()
    } catch (deleteError) {
      console.error(deleteError)
      setError(getErrorMessage(deleteError, 'Could not delete topic.'))
    }
  }

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Encyclopedia"
        rightSlot={
          <Link className="btn ghost" to="/dashboard">
            Back
          </Link>
        }
      />

      <div className="content">
        <ConfirmDialog
          open={pendingDeleteId !== null}
          title="Delete Encyclopedia Topic?"
          message="The topic will move to the Recycle Bin and can be restored later."
          confirmText="Delete"
          cancelText="Cancel"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />

        <PageHeader
          title="Encyclopedia"
          description="Create topics and keep useful links & PDF documents organized inside them."
          actionSlot={
            <button
              className="btn primary"
              type="button"
              data-global-create
              onClick={openCreateForm}
            >
              New Topic
            </button>
          }
        />

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search topic titles..."
        />

        {showForm ? (
          <div className="card form-grid">
            <label className="field">
              <span>Topic title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Frontend Development"
                maxLength={120}
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short explanation of this topic."
                rows={4}
              />
            </label>

            {error ? <p className="error">{error}</p> : null}

            <div className="form-actions">
              <button className="btn ghost" type="button" data-global-close onClick={closeForm}>
                Cancel
              </button>
              <button className="btn primary" type="button" disabled={isSaving} onClick={saveTopic}>
                {isSaving ? 'Saving...' : editingId ? 'Update Topic' : 'Create Topic'}
              </button>
            </div>
          </div>
        ) : null}

        {!showForm && error ? <p className="error">{error}</p> : null}
        {isLoading ? <div className="card">Loading encyclopedia...</div> : null}

        {!isLoading && searchedTopics.length === 0 ? (
          <div className="card empty-state">
            <h3>
              {topics.length === 0
                ? 'No topics yet'
                : searchQuery.trim()
                ? `No topics found for "${searchQuery}"`
                : 'No topics found'}
            </h3>
            <p>
              {topics.length === 0
                ? 'Create the first topic for your link and PDF collection.'
                : searchQuery.trim()
                ? 'Try adjusting your search query.'
                : 'No topics match your query.'}
            </p>
          </div>
        ) : null}

        {!isLoading && searchedTopics.length > 0 ? (
          <div className="stack">
            {searchedTopics.map((topic) => (
              <div className="card" key={topic.id}>
                <div className="card-head">
                  <div>
                    <h3>{topic.title}</h3>
                    <p>{topic.description || 'No description yet.'}</p>
                  </div>
                  <div className="pill-row">
                    <span className="pill">
                      {topic.linkCount ?? 0} {(topic.linkCount ?? 0) === 1 ? 'link' : 'links'}
                    </span>
                    <span className="pill">
                      {topic.pdfCount ?? 0} {(topic.pdfCount ?? 0) === 1 ? 'PDF' : 'PDFs'}
                    </span>
                    <span className="pill">
                      Updated {new Date(topic.updatedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  <Link className="btn primary" to={`/encyclopedia/${topic.id}`}>
                    View Content
                  </Link>
                  <button className="btn ghost" type="button" onClick={() => openEditForm(topic)}>
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    type="button"
                    onClick={() => setPendingDeleteId(topic.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default EncyclopediaPage
