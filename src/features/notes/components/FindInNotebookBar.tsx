import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import type { Editor } from '@tiptap/react'

type FindInNotebookBarProps = {
  editor: Editor | null
  onClose: () => void
}

export function FindInNotebookBar({ editor, onClose }: FindInNotebookBarProps) {
  const [query, setQuery] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const matchRangesRef = useRef<Range[]>([])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    return () => {
      clearHighlights()
    }
  }, [])

  const clearHighlights = () => {
    if (typeof CSS !== 'undefined' && (CSS as unknown as { highlights?: Map<string, unknown> }).highlights) {
      const highlights = (CSS as unknown as { highlights: Map<string, unknown> }).highlights
      highlights.delete('find-matches')
      highlights.delete('find-current-match')
    }
    matchRangesRef.current = []
  }

  useEffect(() => {
    if (!editor || !query.trim()) {
      clearHighlights()
      setMatchCount(0)
      setCurrentIndex(0)
      return
    }

    clearHighlights()

    const dom = editor.view.dom
    const searchTerm = query.trim().toLowerCase()
    const walker = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT, null)
    const textNodes: Text[] = []
    let currentNode = walker.nextNode()

    while (currentNode) {
      if (currentNode instanceof Text && currentNode.nodeValue?.trim()) {
        textNodes.push(currentNode)
      }
      currentNode = walker.nextNode()
    }

    const ranges: Range[] = []
    textNodes.forEach((node) => {
      const text = node.nodeValue || ''
      const lowerText = text.toLowerCase()
      let index = lowerText.indexOf(searchTerm)

      while (index !== -1) {
        try {
          const range = new Range()
          range.setStart(node, index)
          range.setEnd(node, index + searchTerm.length)
          ranges.push(range)
        } catch {
          // ignore invalid ranges
        }
        index = lowerText.indexOf(searchTerm, index + searchTerm.length)
      }
    })

    matchRangesRef.current = ranges
    setMatchCount(ranges.length)

    if (ranges.length > 0 && typeof CSS !== 'undefined' && (CSS as unknown as { highlights?: Map<string, unknown> }).highlights) {
      try {
        const HighlightClass = (window as unknown as { Highlight: new (...ranges: Range[]) => unknown }).Highlight
        const highlights = (CSS as unknown as { highlights: Map<string, unknown> }).highlights
        if (HighlightClass && highlights) {
          const searchHighlight = new HighlightClass(...ranges)
          highlights.set('find-matches', searchHighlight)
        }
      } catch (err) {
        console.error('Highlight error:', err)
      }
      setCurrentIndex(1)
      highlightActive(0, ranges)
    } else {
      setCurrentIndex(0)
    }
  }, [query, editor])

  const highlightActive = (idx: number, ranges = matchRangesRef.current) => {
    if (ranges.length === 0 || !ranges[idx]) return
    const activeRange = ranges[idx]

    if (typeof CSS !== 'undefined' && (CSS as unknown as { highlights?: Map<string, unknown> }).highlights) {
      try {
        const HighlightClass = (window as unknown as { Highlight: new (...ranges: Range[]) => unknown }).Highlight
        const highlights = (CSS as unknown as { highlights: Map<string, unknown> }).highlights
        if (HighlightClass && highlights) {
          const currentHighlight = new HighlightClass(activeRange)
          highlights.set('find-current-match', currentHighlight)
        }
      } catch (err) {
        console.error('Active highlight error:', err)
      }
    }

    const container = activeRange.startContainer.parentElement
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const goToNext = () => {
    if (matchCount === 0) return
    const next = currentIndex >= matchCount ? 1 : currentIndex + 1
    setCurrentIndex(next)
    highlightActive(next - 1)
  }

  const goToPrev = () => {
    if (matchCount === 0) return
    const prev = currentIndex <= 1 ? matchCount : currentIndex - 1
    setCurrentIndex(prev)
    highlightActive(prev - 1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        goToPrev()
      } else {
        goToNext()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      clearHighlights()
      onClose()
    }
  }

  const handleClose = () => {
    clearHighlights()
    onClose()
  }

  return (
    <div className="notebook-find-bar">
      <Search size={16} className="notebook-find-icon" />
      <input
        ref={inputRef}
        type="text"
        className="notebook-find-input"
        placeholder="Find in notebook... (Enter for next, Shift+Enter for prev)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <span className="notebook-find-counter">
        {query.trim() ? (matchCount > 0 ? `${currentIndex} of ${matchCount}` : 'No matches') : ''}
      </span>
      <div className="notebook-find-actions">
        <button
          type="button"
          className="icon-button"
          onClick={goToPrev}
          disabled={matchCount === 0}
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={goToNext}
          disabled={matchCount === 0}
          title="Next match (Enter)"
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={handleClose}
          title="Close find bar (Escape)"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
