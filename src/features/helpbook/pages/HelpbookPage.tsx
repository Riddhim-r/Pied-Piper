import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { desktopApi } from '../../../lib/desktopApi'
import ConfirmDialog from '../../../components/ConfirmDialog'
import TopNav from '../../../components/TopNav'

type HelpEntry = {
  id: string
  title: string
  tags: string[]
  steps: string[]
}

const HelpbookPage = () => {
  const [entries, setEntries] = useState<HelpEntry[]>([])
  const [activeTag, setActiveTag] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [stepInput, setStepInput] = useState('')
  const [steps, setSteps] = useState<string[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [editingStepValue, setEditingStepValue] = useState('')

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const items = await desktopApi.listHelpbook()
        setEntries(items)
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load helpbook entries.')
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
    setStepInput('')
    setSteps([])
    setEditingId(null)
    setError('')
    setTagSearch('')
    setTagDropdownOpen(false)
    setEditingStepIndex(null)
    setEditingStepValue('')
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

  const handleAddStep = () => {
    const trimmed = stepInput.trim()
    if (!trimmed) {
      return
    }
    setSteps((prev) => [...prev, trimmed])
    setStepInput('')
  }

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleEditStep = (index: number) => {
    setEditingStepIndex(index)
    setEditingStepValue(steps[index] ?? '')
  }

  const handleSaveStepEdit = () => {
    if (editingStepIndex === null) {
      return
    }
    const trimmed = editingStepValue.trim()
    if (!trimmed) {
      return
    }
    setSteps((prev) => prev.map((step, idx) => (idx === editingStepIndex ? trimmed : step)))
    setEditingStepIndex(null)
    setEditingStepValue('')
  }

  const handleCancelStepEdit = () => {
    setEditingStepIndex(null)
    setEditingStepValue('')
  }

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) {
      setError('Give the entry a name.')
      return
    }
    if (!selectedTag.trim()) {
      setError('Pick a tag before saving.')
      return
    }

    if (steps.length === 0) {
      setError('Add at least one step.')
      return
    }

    if (editingId) {
      try {
        await desktopApi.updateHelpbook(editingId, {
          title: title.trim(),
          tags: [selectedTag.trim()],
          steps,
        })
      } catch (updateError) {
        console.error(updateError)
        setError('Could not update entry.')
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
        const created = await desktopApi.createHelpbook({
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
        setError('Could not save entry.')
        return
      }
    }

    resetForm()
    setShowForm(false)
  }

  const handleEdit = (entry: HelpEntry) => {
    setShowForm(true)
    setEditingId(entry.id)
    setTitle(entry.title)
    setSelectedTag(entry.tags[0] ?? '')
    setSteps(entry.steps)
    setStepInput('')
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
      await desktopApi.deleteHelpbook(pendingDeleteId)
    } catch (deleteError) {
      console.error(deleteError)
      setError('Could not delete entry.')
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
        subtitle="Helpbook"
        rightSlot={
          <Link className="btn ghost" to="/dashboard">
            Back
          </Link>
        }
      />

      <div className="content">
        <ConfirmDialog
          open={pendingDeleteId !== null}
          title="Delete Helpbook Entry?"
          message="This entry will move to the Recycle Bin and can be restored later."
          confirmText="Delete"
          cancelText="Cancel"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />

        <div className="page-header">
          <div>
            <h1>Helpbook</h1>
            <p>Searchable fixes and step-by-step solutions.</p>
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
            Add some wisdom m'lord!
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
              <span>What's bugging you?</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <div className="field">
              <span>What domain does it fall into?</span>
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
              <span>And how will you solve it?</span>
              <div className="quick-assign">
                <input
                  type="text"
                  placeholder="Write one step"
                  value={stepInput}
                  onChange={(event) => setStepInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddStep()
                    }
                  }}
                />
                <button type="button" className="btn ghost" onClick={handleAddStep}>
                  Add Step
                </button>
              </div>
            </label>

            <div className="stack">
              {steps.length === 0 ? <p className="muted">No steps added yet.</p> : null}
              {steps.map((step, index) => (
                <div className="assigned-item" key={`${step}-${index}`}>
                  {editingStepIndex === index ? (
                    <div className="field">
                      <span>
                        <strong>{`Step-${index + 1}:`}</strong>
                      </span>
                      <input
                        type="text"
                        value={editingStepValue}
                        onChange={(event) => setEditingStepValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            handleSaveStepEdit()
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="muted">
                        <strong>{`Step-${index + 1}: `}</strong>
                        {step}
                      </p>
                    </div>
                  )}
                  <div className="card-actions">
                    {editingStepIndex === index ? (
                      <>
                        <button className="btn ghost" type="button" onClick={handleSaveStepEdit}>
                          Save
                        </button>
                        <button className="btn ghost" type="button" onClick={handleCancelStepEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="btn ghost" type="button" onClick={() => handleEditStep(index)}>
                        Edit
                      </button>
                    )}
                    <button className="btn ghost" type="button" onClick={() => handleRemoveStep(index)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

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
                {editingId ? 'Save Changes' : 'Save Entry'}
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? <div className="card">Loading helpbook...</div> : null}

        {!isLoading && visibleEntries.length === 0 ? (
          <div className="card empty-state">
            <h3>{entries.length === 0 ? 'No Helpbook entries yet' : 'No entries for this tag'}</h3>
            <p>
              {entries.length === 0
                ? 'Add your first solution using the button above.'
                : 'Choose another tag or select all to see your saved entries.'}
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
                    <strong>{`Step-${index + 1}: `}</strong>
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

export default HelpbookPage

