import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../../components/ConfirmDialog'
import TopNav from '../../../components/TopNav'
import { TagBar } from '../../../components/TagBar'
import { TagSelectDropdown } from '../../../components/TagSelectDropdown'
import { SearchBar } from '../../../components/SearchBar'
import AutoResizingTextarea from '../../../components/AutoResizingTextarea'
import { useTagFilter } from '../../../hooks/useTagFilter'
import {
  createHelpbookEntry,
  deleteHelpbookEntry,
  listHelpbookEntries,
  updateHelpbookEntry,
} from '../services/helpbookService'

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
      text: typeof raw.text === 'string' ? raw.text : '',
    }
  }
  return { title: '', text: '' }
}

const HelpbookPage = () => {
  const [entries, setEntries] = useState<HelpEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [title, setTitle] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [stepTitleInput, setStepTitleInput] = useState('')
  const [stepTextInput, setStepTextInput] = useState('')
  const [steps, setSteps] = useState<HelpStep[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [editingStepTitleValue, setEditingStepTitleValue] = useState('')
  const [editingStepTextValue, setEditingStepTextValue] = useState('')

  const { activeTag, setActiveTag, allTags, visibleEntries } = useTagFilter(
    entries,
    selectedTag,
  )

  const searchedEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return visibleEntries
    return visibleEntries.filter((entry) =>
      entry.title.toLowerCase().includes(query)
    )
  }, [visibleEntries, searchQuery])

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const items = await listHelpbookEntries()
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

  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null
    return entries.find((e) => e.id === selectedEntryId) ?? null
  }, [entries, selectedEntryId])

  const resetForm = () => {
    setTitle('')
    setSelectedTag('')
    setStepTitleInput('')
    setStepTextInput('')
    setSteps([])
    setEditingId(null)
    setError('')
    setEditingStepIndex(null)
    setEditingStepTitleValue('')
    setEditingStepTextValue('')
  }

  useEffect(() => {
    if (!showForm) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (pendingDeleteId !== null) return

      event.preventDefault()
      event.stopPropagation()

      const isFormEmpty =
        !title.trim() &&
        !selectedTag.trim() &&
        !stepTitleInput.trim() &&
        !stepTextInput.trim() &&
        steps.length === 0

      if (isFormEmpty) {
        resetForm()
        setShowForm(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [
    showForm,
    title,
    selectedTag,
    stepTitleInput,
    stepTextInput,
    steps,
    pendingDeleteId,
  ])

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

  const handleStartStepEdit = (index: number) => {
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
          : step,
      ),
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
        await updateHelpbookEntry(editingId, {
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
            : entry,
        ),
      )
    } else {
      try {
        const created = await createHelpbookEntry({
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
      await deleteHelpbookEntry(pendingDeleteId)
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (pendingDeleteId !== null) return

      // 1. If editing a topic on its detail page -> exit edit mode back to read-only view
      if (selectedEntryId && editingId === selectedEntryId) {
        event.preventDefault()
        event.stopPropagation()
        setEditingId(null)
        resetForm()
        return
      }

      // 2. If creating a topic on main Helpbook page -> close create modal/form
      if (showForm && !selectedEntryId) {
        event.preventDefault()
        event.stopPropagation()
        setShowForm(false)
        resetForm()
        return
      }

      // 3. If viewing a topic detail page in read-only mode -> go back to main list
      if (selectedEntryId) {
        event.preventDefault()
        event.stopPropagation()
        setSelectedEntryId(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [selectedEntryId, editingId, showForm, pendingDeleteId])

  const renderForm = () => (
    <div className="card form-grid">
      <label className="field">
        <span>What's bugging you? (Topic Title)</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <div className="field">
        <span>What domain does it fall into?</span>
        <TagSelectDropdown
          selectedTag={selectedTag}
          allTags={allTags}
          onSelectTag={setSelectedTag}
        />
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
          <AutoResizingTextarea
            rows={3}
            placeholder="Explain what to do..."
            value={stepTextInput}
            onChange={(event) => setStepTextInput(event.target.value)}
          />
          <button className="btn ghost" type="button" onClick={handleAddStep}>
            + Add Step
          </button>
        </div>
      </div>

      {steps.length > 0 ? (
        <div className="steps-preview" style={{ marginTop: '16px' }}>
          <h4 style={{ marginBottom: '8px' }}>Steps Added ({steps.length})</h4>
          {steps.map((step, idx) => {
            const isEditingThisStep = editingStepIndex === idx
            return (
              <div
                key={idx}
                className="card"
                style={{ padding: '12px', marginBottom: '8px', background: '#f8fafc' }}
              >
                {isEditingThisStep ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={editingStepTitleValue}
                      onChange={(e) => setEditingStepTitleValue(e.target.value)}
                      placeholder="Step Title (optional)"
                    />
                    <AutoResizingTextarea
                      rows={2}
                      value={editingStepTextValue}
                      onChange={(e) => setEditingStepTextValue(e.target.value)}
                      placeholder="Step explanation..."
                    />
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn ghost" type="button" onClick={handleCancelStepEdit}>
                        Cancel
                      </button>
                      <button className="btn primary" type="button" onClick={handleSaveStepEdit}>
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      {step.title ? (
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{step.title}</h5>
                      ) : null}
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{step.text}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn ghost"
                        type="button"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        onClick={() => handleStartStepEdit(idx)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        onClick={() => handleRemoveStep(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <div className="form-actions">
        <button
          type="button"
          className="btn ghost"
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
  )

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
              onClick={() => {
                setSelectedEntryId(null)
                setEditingId(null)
                resetForm()
              }}
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
                onClick={() => {
                  setSelectedEntryId(null)
                  setEditingId(null)
                  resetForm()
                }}
                style={{ fontWeight: 600 }}
              >
                ← Back to Topics
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    if (editingId === selectedEntry.id) {
                      setEditingId(null)
                      resetForm()
                    } else {
                      handleEdit(selectedEntry)
                    }
                  }}
                >
                  {editingId === selectedEntry.id ? 'Cancel Edit' : 'Edit'}
                </button>
                <button type="button" className="btn danger" onClick={() => handleDelete(selectedEntry.id)}>
                  Delete
                </button>
              </div>
            </div>

            {editingId === selectedEntry.id ? (
              renderForm()
            ) : (
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
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
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
                              fontWeight: 700,
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
                            marginTop: '6px',
                          }}
                        >
                          {step.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search help titles..."
            />

            <TagBar activeTag={activeTag} tags={allTags} onSelectTag={setActiveTag} />

            {showForm && !selectedEntryId ? renderForm() : null}

            {isLoading ? <div className="card">Loading helpbook...</div> : null}

            {!isLoading && searchedEntries.length === 0 ? (
              <div className="card empty-state">
                <h3>
                  {entries.length === 0
                    ? 'No Helpbook entries yet'
                    : searchQuery.trim()
                    ? `No entries found for "${searchQuery}"`
                    : 'No entries for this tag'}
                </h3>
                <p>
                  {entries.length === 0
                    ? 'Add your first solution using the button above.'
                    : searchQuery.trim()
                    ? 'Try adjusting your search query or tag filter.'
                    : 'Choose another tag or select all to see your saved entries.'}
                </p>
              </div>
            ) : null}

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {searchedEntries.map((entry) => (
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
                          lineHeight: 1.35,
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
