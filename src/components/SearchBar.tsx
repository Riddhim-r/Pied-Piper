import type { CSSProperties } from 'react'
import { Search, X } from 'lucide-react'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
  style?: CSSProperties
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search by title...',
  className = '',
  ariaLabel = 'Search titles',
  style = {},
}: SearchBarProps) => {
  return (
    <div
      className={`app-search-bar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#f7e7ef',
        border: '3px solid var(--ink, #2a1f2c)',
        borderRadius: '0px',
        padding: '10px 16px',
        boxShadow: '0 6px 0 rgba(42, 31, 44, 0.25)',
        marginBottom: '20px',
        width: '100%',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      <Search size={20} color="var(--ink, #2a1f2c)" style={{ flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('')
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          width: '100%',
          fontSize: '0.98rem',
          fontFamily: 'inherit',
          color: 'var(--ink, #2a1f2c)',
          fontWeight: 600,
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            border: '2px solid var(--ink, #2a1f2c)',
            background: 'var(--accent, #7eabce)',
            color: '#ffffff',
            padding: '2px 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0px',
            fontFamily: "'Press Start 2P', system-ui, sans-serif",
            fontSize: '0.65rem',
            lineHeight: 1,
          }}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  )
}
