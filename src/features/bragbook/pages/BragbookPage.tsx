import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Lock,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import TopNav from '../../../components/TopNav'
import { desktopApi } from '../../../lib/desktopApi'
import type { BragBookEntryType } from '../../../types/electron'

export const BragbookPage = () => {
  const [entries, setEntries] = useState<BragBookEntryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  // Hype Me Up Spotlight State
  const [hypeEntry, setHypeEntry] = useState<BragBookEntryType | null>(null)
  const [showHypeModal, setShowHypeModal] = useState(false)

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const data = await desktopApi.listBragBook()
      setEntries(data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load brag book entries:', err)
      setError('Could not load accomplishments. Please restart the app.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setSubmitting(true)
      await desktopApi.createBragBookEntry({
        date,
        title: title.trim(),
        description: description.trim(),
      })
      setTitle('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setShowAddForm(false)
      await fetchEntries()
    } catch (err) {
      console.error('Failed to add brag book entry:', err)
      alert('Failed to save accomplishment entry.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.date.includes(q)
    )
  }, [entries, searchQuery])

  const handleTriggerHype = () => {
    if (entries.length === 0) {
      alert('Log your first win to unlock Hype Me Up!')
      return
    }
    const randomIndex = Math.floor(Math.random() * entries.length)
    setHypeEntry(entries[randomIndex])
    setShowHypeModal(true)
  }

  return (
    <div className="page bragbook-page-container">
      <TopNav title="Pied Piper" subtitle="The Bread-winner's workspace" />

      <div className="content">
        {/* Top Aesthetic Cover Banner */}
        <div className="bragbook-cover-banner">
          <div className="bragbook-cover-image-frame">
            <img
              src="/brag-book-cover.jpg"
              alt="Brag Book Cover Aesthetic"
              className="bragbook-cover-image"
            />
          </div>
          <div className="bragbook-cover-text">
            <div className="bragbook-tag-badge">Good Things Happen Here</div>
            <h1 className="bragbook-title">Brag Book</h1>
            <p className="bragbook-subtitle">
              Proof that you’re doing pretty damn well.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="bragbook-toolbar">
          <div className="bragbook-toolbar-actions">
            <button
              type="button"
              className="btn btn-primary bragbook-add-btn"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              {showAddForm ? (
                <>
                  <X size={16} />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Log ur win</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="btn bragbook-hype-btn"
              onClick={handleTriggerHype}
              title="Resurface a random past win for motivation!"
            >
              <Sparkles size={16} />
              <span>Hype Me Up!</span>
            </button>
          </div>

          <div className="bragbook-search-box">
            <input
              type="text"
              placeholder="Search wins or dates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bragbook-search-input"
            />
          </div>
        </div>

        {/* Inline Add Form */}
        {showAddForm && (
          <form className="bragbook-form-card" onSubmit={handleSubmit}>
            <div className="bragbook-form-header">
              <h3>Log New Career Win</h3>
              <p className="subtle">Record what actually happened. Once saved, it is locked into your ledger.</p>
            </div>
            <div className="bragbook-form-grid">
              <div className="form-group">
                <label htmlFor="brag-date">Date of Accomplishment</label>
                <input
                  id="brag-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bragbook-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="brag-title">What Actually Happened</label>
                <input
                  id="brag-title"
                  type="text"
                  placeholder="e.g. Promoted to Senior Lead, Closed key enterprise client, Refactored core API..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bragbook-input"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="brag-desc">Impact / Extra Details (Optional)</label>
              <textarea
                id="brag-desc"
                placeholder="e.g. Reduced query latency by 45% and received praise from CTO..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bragbook-textarea"
              />
            </div>
            <div className="bragbook-form-actions">
              <button type="submit" disabled={submitting} className="btn btn-primary">
                <Lock size={15} />
                <span>{submitting ? 'Saving...' : 'Lock into Brag Book'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Ledger Entries List */}
        {loading ? (
          <div className="bragbook-loading">Loading accomplishments ledger...</div>
        ) : error ? (
          <div className="bragbook-error">{error}</div>
        ) : filteredEntries.length === 0 ? (
          <div className="bragbook-empty-state">
            <div className="bragbook-empty-icon-wrap">
              <Sparkles size={36} />
            </div>
            <h3>No Wins Logged Yet</h3>
            <p>
              {searchQuery
                ? 'No brag entries match your search query.'
                : 'Click "Log ur win" to start recording your career accomplishments!'}
            </p>
          </div>
        ) : (
          <div className="bragbook-timeline">
            <div className="bragbook-timeline-header">
              <span className="bragbook-ledger-badge">
                <Lock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Not to Brag, But…
              </span>
              <span className="bragbook-count-badge">{filteredEntries.length} Total Wins</span>
            </div>

            <div className="bragbook-cards-grid">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="bragbook-entry-card">
                  <div className="bragbook-card-tape" />
                  <div className="bragbook-card-header">
                    <span className="bragbook-card-date">
                      <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {entry.date}
                    </span>
                  </div>
                  <h3 className="bragbook-card-title">{entry.title}</h3>
                  {entry.description && (
                    <p className="bragbook-card-desc">{entry.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hype Me Up Modal */}
        {showHypeModal && hypeEntry && (
          <div className="bragbook-modal-backdrop" onClick={() => setShowHypeModal(false)}>
            <div className="bragbook-modal-content hype-modal" onClick={(e) => e.stopPropagation()}>
              <div className="hype-stars-icon-row">
                <Sparkles size={28} />
              </div>
              <h2 className="hype-heading">You Did That!</h2>
              <div className="hype-date">Recorded on {hypeEntry.date}</div>
              <blockquote className="hype-quote">
                "{hypeEntry.title}"
              </blockquote>
              {hypeEntry.description && (
                <p className="hype-desc">{hypeEntry.description}</p>
              )}
              <div className="hype-footer-tag">Same Girl, Bigger Dreams</div>
              <div className="hype-actions">
                <button
                  type="button"
                  className="btn bragbook-hype-btn"
                  onClick={handleTriggerHype}
                >
                  <Sparkles size={16} />
                  <span>Another Win</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowHypeModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BragbookPage
