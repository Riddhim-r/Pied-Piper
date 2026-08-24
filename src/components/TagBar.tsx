import React from 'react'

type TagBarProps = {
  activeTag: string
  tags: string[]
  onSelectTag: (tag: string) => void
}

export const TagBar: React.FC<TagBarProps> = ({ activeTag, tags, onSelectTag }) => {
  return (
    <div className="tag-bar">
      <button
        type="button"
        className={activeTag === 'all' ? 'tag-chip active' : 'tag-chip'}
        onClick={() => onSelectTag('all')}
      >
        all
      </button>
      {tags.map((tag) => (
        <button
          type="button"
          className={activeTag === tag ? 'tag-chip active' : 'tag-chip'}
          key={tag}
          onClick={() => onSelectTag(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
