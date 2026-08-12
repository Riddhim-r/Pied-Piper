import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const destinations = [
  { label: 'Dashboard', path: '/dashboard', keywords: 'home overview' },
  { label: 'Helpbook', path: '/helpbook', keywords: 'solutions wisdom fixes' },
  {
    label: 'AI Prompt Vault',
    path: '/ai-prompts',
    keywords: 'ai prompts prompt craft artificial intelligence',
  },
  { label: 'Notes for Noobs', path: '/notes', keywords: 'notebooks writing editor' },
  { label: 'Encyclopedia', path: '/encyclopedia', keywords: 'topics links collection' },
  { label: 'Todo', path: '/todo', keywords: 'tasks list productivity' },
  { label: 'Recycle Bin', path: '/recycle-bin', keywords: 'trash deleted restore' },
  { label: 'Settings', path: '/settings', keywords: 'preferences theme database shortcuts' },
]

const GlobalKeyboardShortcuts = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return destinations
    return destinations.filter(({ label, keywords }) =>
      `${label} ${keywords}`.toLowerCase().includes(normalizedQuery),
    )
  }, [query])

  useEffect(() => {
    setSearchOpen(false)
    setQuery('')
  }, [location.pathname])

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
        if (key === '0') {
          event.preventDefault()
          document.body.style.zoom = '100%'
          return
        }
        if (key === 'k') {
          event.preventDefault()
          setSearchOpen(true)
          return
        }
        if (event.key === ',') {
          event.preventDefault()
          navigate('/settings')
          return
        }
        if (key === 'n') {
          event.preventDefault()
          const createControl = document.querySelector<HTMLElement>('[data-global-create]')
          if (createControl instanceof HTMLInputElement || createControl instanceof HTMLTextAreaElement) {
            createControl.focus()
          } else {
            createControl?.click()
          }
          return
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey) {
        if (key === 't') {
          event.preventDefault()
          navigate('/todo')
          return
        }
        if (event.key === 'Delete') {
          event.preventDefault()
          navigate('/recycle-bin')
          return
        }
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          navigate(-1)
          return
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          navigate(1)
          return
        }
        if (event.key === 'Home') {
          event.preventDefault()
          navigate('/dashboard')
          return
        }
      }

      if (event.key === 'Escape') {
        if (searchOpen) {
          event.preventDefault()
          setSearchOpen(false)
          setQuery('')
          return
        }

        if (document.querySelector('.modal-backdrop')) {
          return
        }

        const closeControls = Array.from(
          document.querySelectorAll<HTMLElement>('[data-global-close]'),
        ).filter((element) => element.getClientRects().length > 0)
        closeControls.at(-1)?.click()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, searchOpen])

  const openDestination = (path: string) => {
    setSearchOpen(false)
    setQuery('')
    navigate(path)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (results[0]) {
      openDestination(results[0].path)
    }
  }

  if (!searchOpen) return null

  return (
    <div
      className="global-search-backdrop"
      role="presentation"
      onMouseDown={() => {
        setSearchOpen(false)
        setQuery('')
      }}
    >
      <section
        className="global-search"
        role="dialog"
        aria-modal="true"
        aria-label="Search application"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages..."
            aria-label="Search application pages"
          />
        </form>

        <div className="global-search-results">
          {results.map((destination) => (
            <button
              type="button"
              key={destination.path}
              className="global-search-result"
              onClick={() => openDestination(destination.path)}
            >
              <strong>{destination.label}</strong>
              <span>{destination.path}</span>
            </button>
          ))}
          {results.length === 0 ? <p className="muted">No matching page.</p> : null}
        </div>

        <p className="global-search-help">Enter opens the first result. Escape closes search.</p>
      </section>
    </div>
  )
}

export default GlobalKeyboardShortcuts
