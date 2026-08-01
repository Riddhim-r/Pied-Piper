import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { desktopApi } from '../../../lib/desktopApi'
import ConfirmDialog from '../../../components/ConfirmDialog'
import TopNav from '../../../components/TopNav'

type PromptEntry = {
  id: string
  title: string
  tags: string[]
  steps: string[]
}

const AiPromptsPage = () => {
  const [entries, setEntries] = useState<PromptEntry[]>([])
  const [activeTag, setActiveTag] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [stepsText, setStepsText] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const items = await desktopApi.listPrompts()
        setEntries(items)
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load the AI Prompt Vault.')
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }

    loadEntries()
  }, [])

  useEffect(() => {
    if (activeTag !== 'all') {
      const stillExists = entries.some((entry) => entry.tags.includes(activeTag))
      if (!stillExists) {
        setActiveTag('all')
      }
    }
  }, [entries, activeTag])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    entries.forEach((entry) => entry.tags.forEach((tag) => tagSet.add(tag)))
    if (selectedTag.trim()) {
      tagSet.add(selectedTag.trim())
    }
    return Array.from(tagSet).sort()
  }, [entries, selectedTag])

  const filteredTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase()
    if (!query) {
      return allTags
    }
    return allTags.filter((tag) => tag.toLowerCase().includes(query))
  }, [allTags, tagSearch])

  const visibleEntries = useMemo(() => {
    if (activeTag === 'all') {
      return entries
    }
    return entries.filter((entry) => entry.tags.includes(activeTag))
  }, [entries, activeTag])

  const resetForm = () => {
    setTitle('')
    setSelectedTag('')
    setStepsText('')
    setEditingId(null)
    setError('')
    setTagSearch('')
    setTagDropdownOpen(false)
  }

  const handleAddTag = () => {
    const trimmed = tagSearch.trim()
    if (!trimmed) {
      return
    }
    setSelectedTag(trimmed)
    setTagDropdownOpen(false)
    setTagSearch('')
  }

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) {
      setError('Give the prompt a name.')
      return
    }
    if (!selectedTag.trim()) {
      setError('Pick a tag before saving.')
      return
    }
    const steps = stepsText
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean)

    if (steps.length === 0) {
      setError('Add at least one line.')
      return
    }

    if (editingId) {
      try {
        await desktopApi.updatePrompt(editingId, {
          title: title.trim(),
          tags: [selectedTag.trim()],
          steps,
        })
      } catch (updateError) {
        console.error(updateError)
        setError('Could not update prompt.')
        return
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                title: title.trim(),
                tags: [selectedTag.trim()],
                steps,
              }
            : entry,
        ),
      )
    } else {
      try {
        const created = await desktopApi.createPrompt({
          title: title.trim(),
          tags: [selectedTag.trim()],
          steps,
        })

        setEntries((prev) => [
          {
            id: String(created.id),
            title: title.trim(),
            tags: [selectedTag.trim()],
            steps,
          },
          ...prev,
        ])
      } catch (createError) {
        console.error(createError)
        setError('Could not save prompt.')
        return
      }
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (entry: PromptEntry) => {
    setShowForm(true)
    setEditingId(entry.id)
    setTitle(entry.title)
    setSelectedTag(entry.tags[0] ?? '')
    setStepsText(entry.steps.join('\n'))
    setError('')
  }

  const handleDelete = (entryId: string) => {
    setPendingDeleteId(entryId)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) {
      return
    }

    try {
      await desktopApi.deletePrompt(pendingDeleteId)
    } catch (deleteError) {
      console.error(deleteError)
      setError('Could not delete prompt.')
      return
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== pendingDeleteId))
    if (editingId === pendingDeleteId) {
      resetForm()
      setShowForm(false)
    }
    setPendingDeleteId(null)
  }

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="AI Prompt Vault"
        rightSlot={
          <Link className="btn ghost" to="/dashboard">
            Back
          </Link>
        }
      />

      <div className="content">
        <ConfirmDialog
          open={pendingDeleteId !== null}
          title="Delete AI Prompt Vault Entry?"
          message="This prompt will move to the Recycle Bin and can be restored later."
          confirmText="Delete"
          cancelText="Cancel"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />

        <div className="page-header">
          <div>
            <h1>AI Prompt Vault</h1>
            <p>Reusable prompts with tags and line-wise structure.</p>
          </div>
          <button
            className="btn primary"
            type="button"
            data-global-create={showForm ? undefined : ''}
            onClick={() => {
              setShowForm((prev) => !prev)
              if (showForm) {
                resetForm()
              }
            }}
          >
            Add prompt
          </button>
        </div>

        <div className="tag-bar">
          <button
            type="button"
            className={activeTag === 'all' ? 'tag-chip active' : 'tag-chip'}
            onClick={() => setActiveTag('all')}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              type="button"
              className={activeTag === tag ? 'tag-chip active' : 'tag-chip'}
              key={tag}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        {showForm ? (
          <div className="card form-grid">
            <label className="field">
              <span>Prompt title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <div className="field">
              <span>Tag</span>
              <div className="tag-dropdown">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setTagDropdownOpen((prev) => !prev)}
                >
                  {selectedTag ? `Tag: ${selectedTag}` : 'Pick a tag'}
                </button>

                {tagDropdownOpen ? (
                  <div className="dropdown-panel">
                    <input
                      type="text"
                      placeholder="Search tags"
                      value={tagSearch}
                      onChange={(event) => setTagSearch(event.target.value)}
                    />
                    <div className="dropdown-list">
                      {filteredTags.length === 0 ? <p className="muted">No tags found.</p> : null}
                      {filteredTags.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedTag(tag)
                            setTagDropdownOpen(false)
                            setTagSearch('')
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="btn primary" onClick={handleAddTag}>
                      Add new tag
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <label className="field">
              <span>Prompt lines</span>
              <textarea
                rows={5}
                placeholder="Write each line on a new line"
                value={stepsText}
                onChange={(event) => setStepsText(event.target.value)}
              />
            </label>

            {error ? <p className="error">{error}</p> : null}

            <div className="form-actions">
              <button
                type="button"
                className="btn ghost"
                data-global-close
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={handleSubmit}>
                {editingId ? 'Save Changes' : 'Save Prompt'}
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? <div className="card">Loading AI Prompt Vault...</div> : null}

        {!isLoading && visibleEntries.length === 0 ? (
          <div className="card empty-state">
            <h3>
              {entries.length === 0
                ? 'No AI Prompt Vault entries yet'
                : 'No prompts for this tag'}
            </h3>
            <p>
              {entries.length === 0
                ? 'Add your first reusable prompt using the button above.'
                : 'Choose another tag or select all to see your saved prompts.'}
            </p>
          </div>
        ) : null}

        <div className="stack">
          {visibleEntries.map((entry) => (
            <div className="card" key={entry.id}>
              <div className="card-head">
                <h3>{entry.title}</h3>
                <div className="pill-row">
                  {entry.tags.map((tag) => (
                    <span className="pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="steps">
                {entry.steps.map((step, index) => (
                  <p className="step-line" key={`${entry.id}-${index}`}>
                    {step}
                  </p>
                ))}
              </div>
              <div className="card-actions">
                <button className="btn ghost" type="button" onClick={() => handleEdit(entry)}>
                  Edit
                </button>
                <button className="btn danger" type="button" onClick={() => handleDelete(entry.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AiPromptsPage

