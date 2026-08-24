import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import ConfirmDialog from '../../../components/ConfirmDialog'
import TopNav from '../../../components/TopNav'
import { TagBar } from '../../../components/TagBar'
import { TagSelectDropdown } from '../../../components/TagSelectDropdown'
import { SearchBar } from '../../../components/SearchBar'
import { useTagFilter } from '../../../hooks/useTagFilter'
import {
  createPromptEntry,
  deletePromptEntry,
  listPromptEntries,
  updatePromptEntry,
} from '../services/promptsService'

type PromptEntry = {
  id: string
  title: string
  tags: string[]
  steps: string[]
}

const AiPromptsPage = () => {
  const [entries, setEntries] = useState<PromptEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [title, setTitle] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [stepsText, setStepsText] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

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
        const items = await listPromptEntries()
        setEntries(items as PromptEntry[])
      } catch (loadError) {
        console.error(loadError)
        setError('Unable to load the AI Prompt Vault.')
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [])

  const decodeHtmlEntities = (text: string): string => {
    if (!text || !text.includes('&')) return text
    try {
      const doc = new DOMParser().parseFromString(text, 'text/html')
      return doc.body.textContent || text
    } catch {
      return text
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyPrompt = async (entry: PromptEntry) => {
    const fullText = entry.steps.map(decodeHtmlEntities).join('\n')
    let success = false

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(fullText)
        success = true
      } catch {
        success = false
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = fullText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        success = document.execCommand('copy')
        document.body.removeChild(textArea)
      } catch {
        success = false
      }
    }

    if (success) {
      setCopiedId(entry.id)
      setTimeout(() => {
        setCopiedId((prev) => (prev === entry.id ? null : prev))
      }, 2000)
    }
  }

  const resetForm = () => {
    setTitle('')
    setSelectedTag('')
    setStepsText('')
    setEditingId(null)
    setError('')
  }

  useEffect(() => {
    if (!showForm) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (pendingDeleteId !== null) return

      event.preventDefault()
      event.stopPropagation()

      const isFormEmpty = !title.trim() && !selectedTag.trim() && !stepsText.trim()

      if (isFormEmpty) {
        resetForm()
        setShowForm(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [showForm, title, selectedTag, stepsText, pendingDeleteId])

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
    const cleanTitle = decodeHtmlEntities(title.trim())
    const steps = stepsText
      .split('\n')
      .map((step) => decodeHtmlEntities(step.trim()))
      .filter(Boolean)

    if (steps.length === 0) {
      setError('Add at least one line.')
      return
    }

    if (editingId) {
      try {
        await updatePromptEntry(editingId, {
          title: cleanTitle,
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
              title: cleanTitle,
              tags: [selectedTag.trim()],
              steps,
            }
            : entry,
        ),
      )
    } else {
      try {
        const created = await createPromptEntry({
          title: cleanTitle,
          tags: [selectedTag.trim()],
          steps,
        })

        setEntries((prev) => [
          {
            id: String(created.id),
            title: cleanTitle,
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
      await deletePromptEntry(pendingDeleteId)
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
          title="Delete Prompt?"
          message="This prompt will move to the Recycle Bin and can be restored later."
          confirmText="Delete"
          cancelText="Cancel"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDelete}
        />

        <div className="page-header">
          <div>
            <h1>AI Prompt Vault</h1>
            <p>Save structured prompts for all types of AI assistants</p>
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
            Add Prompt
          </button>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search prompt titles..."
        />

        <TagBar activeTag={activeTag} tags={allTags} onSelectTag={setActiveTag} />

        {showForm ? (
          <div className="card form-grid">
            <label className="field">
              <span>Prompt title</span>
              <input
                type="text"
                placeholder="e.g. Code Refactor Assistant"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <div className="field">
              <span>Tag</span>
              <TagSelectDropdown
                selectedTag={selectedTag}
                allTags={allTags}
                onSelectTag={setSelectedTag}
              />
            </div>

            <label className="field">
              <span>Prompt content (supports multiline text & spacing)</span>
              <textarea
                rows={7}
                placeholder="Write your prompt content here... (supports paragraphs & line breaks)"
                value={stepsText}
                onChange={(event) => setStepsText(event.target.value)}
              />
            </label>

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
                {editingId ? 'Save Changes' : 'Save Prompt'}
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? <div className="card">Loading AI Prompt Vault...</div> : null}

        {!isLoading && searchedEntries.length === 0 ? (
          <div className="card empty-state">
            <h3>
              {entries.length === 0
                ? 'No AI Prompt Vault entries yet'
                : searchQuery.trim()
                ? `No prompts found for "${searchQuery}"`
                : 'No prompts for this tag'}
            </h3>
            <p>
              {entries.length === 0
                ? 'Add your first reusable prompt using the button above.'
                : searchQuery.trim()
                ? 'Try adjusting your search query or tag filter.'
                : 'Choose another tag or select all to see your saved prompts.'}
            </p>
          </div>
        ) : null}

        <div className="stack" style={{ gap: '20px' }}>
          {searchedEntries.map((entry) => {
            const isExpanded = Boolean(expandedIds[entry.id])
            const totalLines = entry.steps.length
            const isLong = totalLines > 5
            const displayedSteps = isLong && !isExpanded ? entry.steps.slice(0, 5) : entry.steps

            return (
              <div className="card" key={entry.id} style={{ padding: '20px 24px' }}>
                <div className="card-head" style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{entry.title}</h3>
                  <div className="pill-row">
                    {entry.tags.map((tag) => (
                      <span className="pill" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className="steps"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    color: '#2a2a32',
                    fontSize: '0.96rem',
                    marginBottom: '16px',
                  }}
                >
                  {displayedSteps.map((step, index) => {
                    const isLastTruncatedLine = isLong && !isExpanded && index === 4
                    return (
                      <p className="step-line" key={`${entry.id}-${index}`} style={{ margin: 0 }}>
                        {decodeHtmlEntities(step)}
                        {isLastTruncatedLine ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                            <span>....</span>
                            <button
                              type="button"
                              className="btn ghost"
                              style={{
                                fontSize: '0.70rem',
                                padding: '2px 8px',
                                height: 'auto',
                                minHeight: 'unset',
                                lineHeight: 1.2,
                              }}
                              onClick={() => toggleExpand(entry.id)}
                            >
                              Show more ▼
                            </button>
                          </span>
                        ) : null}
                      </p>
                    )
                  })}
                </div>

                {isLong && isExpanded ? (
                  <button
                    type="button"
                    className="btn ghost"
                    style={{
                      marginBottom: '12px',
                      fontSize: '0.70rem',
                      padding: '2px 8px',
                      height: 'auto',
                      minHeight: 'unset',
                      lineHeight: 1.2,
                      alignSelf: 'flex-start',
                    }}
                    onClick={() => toggleExpand(entry.id)}
                  >
                    Show less ▲
                  </button>
                ) : null}

                <div className="card-actions" style={{ gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn primary"
                    type="button"
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      height: 'auto',
                      minHeight: 'unset',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    onClick={() => handleCopyPrompt(entry)}
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
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
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AiPromptsPage
