import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { desktopApi } from '../../../lib/desktopApi'
import ConfirmDialog from '../../../components/ConfirmDialog'
import TopNav from '../../../components/TopNav'

export type HelpStep = {
  title?: string
  text: string
}

export type HelpEntry = {
  id: string
  title: string
  tags: string[]
  steps: (string | HelpStep)[]
}

function parseStep(raw: string | HelpStep): HelpStep {
  if (typeof raw === 'string') {
    return { title: '', text: raw }
  }
  if (typeof raw === 'object' && raw !== null) {
    return {
      title: typeof raw.title === 'string' ? raw.title : '',
      text: typeof raw.text === 'string' ? raw.text : ''
    }
  }
  return { title: '', text: '' }
}

const HelpbookPage = () => {
  const [entries, setEntries] = useState<HelpEntry[]>([])
  const [activeTag, setActiveTag] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [stepTitleInput, setStepTitleInput] = useState('')
  const [stepTextInput, setStepTextInput] = useState('')
  const [steps, setSteps] = useState<HelpStep[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [editingStepTitleValue, setEditingStepTitleValue] = useState('')
  const [editingStepTextValue, setEditingStepTextValue] = useState('')

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const items = await desktopApi.listHelpbook()
        setEntries(items as HelpEntry[])
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load helpbook entries.')
      } finally {
        setIsLoading(false)
      }
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

  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null
    return entries.find((e) => e.id === selectedEntryId) ?? null
  }, [entries, selectedEntryId])

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
    if (!query) return allTags
    return allTags.filter((tag) => tag.toLowerCase().includes(query))
  }, [allTags, tagSearch])

  const visibleEntries = useMemo(() => {
    if (activeTag === 'all') return entries
    return entries.filter((entry) => entry.tags.includes(activeTag))
  }, [entries, activeTag])

  const resetForm = () => {
    setTitle('')
    setSelectedTag('')
    setStepTitleInput('')
    setStepTextInput('')
    setSteps([])
    setEditingId(null)
    setError('')
    setTagSearch('')
    setTagDropdownOpen(false)
    setEditingStepIndex(null)
    setEditingStepTitleValue('')
    setEditingStepTextValue('')
  }

  const handleAddTag = () => {
    const trimmed = tagSearch.trim()
    if (!trimmed) return
    setSelectedTag(trimmed)
    setTagDropdownOpen(false)
    setTagSearch('')
  }

  const handleAddStep = () => {
    const trimmedText = stepTextInput.trim()
    if (!trimmedText) return
    setSteps((prev) => [...prev, { title: stepTitleInput.trim(), text: trimmedText }])
    setStepTitleInput('')
    setStepTextInput('')
  }

  const handleRemoveStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleEditStep = (index: number) => {
    setEditingStepIndex(index)
    setEditingStepTitleValue(steps[index]?.title ?? '')
    setEditingStepTextValue(steps[index]?.text ?? '')
  }

  const handleSaveStepEdit = () => {
    if (editingStepIndex === null) return
    const trimmedText = editingStepTextValue.trim()
    if (!trimmedText) return
    setSteps((prev) =>
      prev.map((step, idx) =>
        idx === editingStepIndex
          ? { title: editingStepTitleValue.trim(), text: trimmedText }
          : step
      )
    )
    setEditingStepIndex(null)
    setEditingStepTitleValue('')
    setEditingStepTextValue('')
  }

  const handleCancelStepEdit = () => {
    setEditingStepIndex(null)
    setEditingStepTitleValue('')
    setEditingStepTextValue('')
  }

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) {
      setError('Give the topic a title.')
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

    const payloadSteps = steps.map((s) => (s.title ? { title: s.title, text: s.text } : s.text))

    if (editingId) {
      try {
        await desktopApi.updateHelpbook(editingId, {
          title: title.trim(),
          tags: [selectedTag.trim()],
          steps: payloadSteps,
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
                steps: payloadSteps as any,
              }
            : entry
        )
      )
    } else {
      try {
        const created = await desktopApi.createHelpbook({
          title: title.trim(),
          tags: [selectedTag.trim()],
          steps: payloadSteps,
        })

        setEntries((prev) => [
          {
            id: String(created.id),
            title: title.trim(),
            tags: [selectedTag.trim()],
            steps: payloadSteps as any,
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
    setSteps(entry.steps.map(parseStep))
    setStepTitleInput('')
    setStepTextInput('')
    setError('')
  }

  const handleDelete = (entryId: string) => {
    setPendingDeleteId(entryId)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return

    try {
      await desktopApi.deleteHelpbook(pendingDeleteId)
    } catch (deleteError) {
      console.error(deleteError)
      setError('Could not delete entry.')
      return
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== pendingDeleteId))
    if (selectedEntryId === pendingDeleteId) {
      setSelectedEntryId(null)
    }
    if (editingId === pendingDeleteId) {
      resetForm()
      setShowForm(false)
    }
    setPendingDeleteId(null)
  }

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!selectedEntryId) return

      const key = event.key.toLowerCase()
      const isAltBack = event.altKey && !event.ctrlKey && !event.metaKey && (
        key === 'arrowleft' || key === '<' || key === ','
      )

      if (isAltBack || key === 'escape') {
        event.preventDefault()
        event.stopPropagation()
        setSelectedEntryId(null)
      }
    }

    window.addEventListener('keydown', handleKeydown, true)
    return () => window.removeEventListener('keydown', handleKeydown, true)
  }, [selectedEntryId])

  return (
    <div className="page">
      <TopNav
        title="Pied Piper"
        subtitle="Helpbook"
        rightSlot={
          selectedEntry ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSelectedEntryId(null)}
            >
              Back
            </button>
          ) : (
            <Link className="btn ghost" to="/dashboard">
              Back
            </Link>
          )
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

        {selectedEntry ? (
          /* DEDICATED HOW-TO DETAIL PAGE VIEW */
          <div className="stack" style={{ gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setSelectedEntryId(null)}
                style={{ fontWeight: 600 }}
              >
                ← Back to Topics
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn ghost" onClick={() => handleEdit(selectedEntry)}>
                  Edit
                </button>
                <button type="button" className="btn danger" onClick={() => handleDelete(selectedEntry.id)}>
                  Delete
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div className="card-head" style={{ marginBottom: '16px' }}>
                <h1 style={{ fontSize: '1.75rem', margin: 0 }}>{selectedEntry.title}</h1>
                <div className="pill-row">
                  {selectedEntry.tags.map((tag) => (
                    <span className="pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h3 style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '10px', marginTop: '24px' }}>
                Step-by-Step How-To Guide
              </h3>

              <div className="steps" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                {selectedEntry.steps.map((rawStep, index) => {
                  const step = parseStep(rawStep)
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.65)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: step.title ? '8px' : '6px' }}>
                        <span
                          style={{
                            background: '#8da4bf',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '3px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                        >
                          Step {index + 1}
                        </span>
                        {step.title ? (
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #18181c)' }}>
                            {step.title}
                          </h4>
                        ) : null}
                      </div>
                      <div
                        style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          fontSize: '0.98rem',
                          color: '#2a2a32',
                          marginTop: '6px'
                        }}
                      >
                        {step.text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* MAIN TOPICS LIST VIEW */
          <>
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
                  <span>What's bugging you? (Topic Title)</span>
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

                <div className="field">
                  <span>Add a Step</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Step Title (optional)"
                      value={stepTitleInput}
                      onChange={(event) => setStepTitleInput(event.target.value)}
                    />
                    <textarea
                      rows={3}
                      placeholder="Step Details (supports multiline text & spacing)..."
                      value={stepTextInput}
                      onChange={(event) => setStepTextInput(event.target.value)}
                    />
                    <button type="button" className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={handleAddStep}>
                      + Add Step
                    </button>
                  </div>
                </div>

                <div className="stack">
                  {steps.length === 0 ? <p className="muted">No steps added yet.</p> : null}
                  {steps.map((step, index) => (
                    <div className="assigned-item" key={index} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      {editingStepIndex === index ? (
                        <div className="field" style={{ gap: '8px' }}>
                          <span>
                            <strong>Step {index + 1}:</strong>
                          </span>
                          <input
                            type="text"
                            placeholder="Step Title (optional)"
                            value={editingStepTitleValue}
                            onChange={(event) => setEditingStepTitleValue(event.target.value)}
                          />
                          <textarea
                            rows={3}
                            placeholder="Step details..."
                            value={editingStepTextValue}
                            onChange={(event) => setEditingStepTextValue(event.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="muted" style={{ margin: 0 }}>
                            <strong>Step {index + 1}: </strong>
                            {step.title ? <strong style={{ color: 'var(--text)' }}>[{step.title}] </strong> : null}
                            <span style={{ whiteSpace: 'pre-wrap' }}>{step.text}</span>
                          </p>
                        </div>
                      )}
                      <div className="card-actions" style={{ marginTop: '8px' }}>
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

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {visibleEntries.map((entry) => (
                <div
                  className="card link-card"
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div className="card-head" style={{ marginBottom: '12px' }}>
                      <h3
                        style={{
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.35
                        }}
                      >
                        {entry.title}
                      </h3>
                    </div>
                    <div className="pill-row" style={{ marginBottom: '12px' }}>
                      {entry.tags.map((tag) => (
                        <span className="pill" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                      {entry.steps.length} {entry.steps.length === 1 ? 'step' : 'steps'}
                    </p>
                  </div>
                  <div className="card-actions" style={{ marginTop: '14px', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn ghost"
                      type="button"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', height: 'auto', minHeight: 'unset' }}
                      onClick={() => handleEdit(entry)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn danger"
                      type="button"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', height: 'auto', minHeight: 'unset' }}
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default HelpbookPage
