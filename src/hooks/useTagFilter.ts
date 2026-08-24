import { useEffect, useMemo, useState } from 'react'

export interface TaggableEntry {
  tags: string[]
}

export function useTagFilter<T extends TaggableEntry>(
  entries: T[],
  selectedTagInForm = '',
) {
  const [activeTag, setActiveTag] = useState('all')

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
    if (selectedTagInForm.trim()) {
      tagSet.add(selectedTagInForm.trim())
    }
    return Array.from(tagSet).sort()
  }, [entries, selectedTagInForm])

  const visibleEntries = useMemo(() => {
    if (activeTag === 'all') return entries
    return entries.filter((entry) => entry.tags.includes(activeTag))
  }, [entries, activeTag])

  return {
    activeTag,
    setActiveTag,
    allTags,
    visibleEntries,
  }
}
