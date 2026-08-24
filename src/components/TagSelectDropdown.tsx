import React, { useState } from 'react'

type TagSelectDropdownProps = {
  selectedTag: string
  allTags: string[]
  onSelectTag: (tag: string) => void
  label?: string
}

export const TagSelectDropdown: React.FC<TagSelectDropdownProps> = ({
  selectedTag,
  allTags,
  onSelectTag,
  label = 'Pick a tag',
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  const query = tagSearch.trim().toLowerCase()
  const filteredTags = query
    ? allTags.filter((tag) => tag.toLowerCase().includes(query))
    : allTags

  const handleAddTag = () => {
    const trimmed = tagSearch.trim()
    if (!trimmed) return
    onSelectTag(trimmed)
    setDropdownOpen(false)
    setTagSearch('')
  }

  return (
    <div className="tag-dropdown">
      <button
        type="button"
        className="btn ghost"
        onClick={() => setDropdownOpen((prev) => !prev)}
      >
        {selectedTag ? `Tag: ${selectedTag}` : label}
      </button>

      {dropdownOpen ? (
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
                  onSelectTag(tag)
                  setDropdownOpen(false)
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
  )
}
