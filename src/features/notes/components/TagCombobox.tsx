import { useEffect, useMemo, useRef, useState } from "react";

type TagComboboxProps = {
  draftTag: string;
  tags: string[];
  onChangeTag: (tag: string) => void;
};

export function TagCombobox({ draftTag, tags, onChangeTag }: TagComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedDraftTag = draftTag.trim();
  const draftTagQuery = normalizedDraftTag.toLowerCase();

  const hasExactMatch = useMemo(
    () => tags.some((value) => value.toLowerCase() === draftTagQuery),
    [tags, draftTagQuery]
  );

  const filteredTags = useMemo(() => {
    if (!normalizedDraftTag) {
      return tags;
    }
    return tags.filter((value) => value.toLowerCase().includes(draftTagQuery));
  }, [tags, normalizedDraftTag, draftTagQuery]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="tag-combobox" ref={containerRef}>
      <input
        className="tag-input"
        value={draftTag}
        maxLength={40}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onChange={(event) => {
          onChangeTag(event.target.value.slice(0, 40));
          setIsOpen(true);
        }}
        placeholder="Tag..."
      />
      {isOpen ? (
        <div className="tag-combobox__menu">
          {filteredTags.map((value) => (
            <button
              key={value}
              type="button"
              className={`tag-combobox__option${
                normalizedDraftTag.toLowerCase() === value.toLowerCase() ? " is-active" : ""
              }`}
              onClick={() => {
                onChangeTag(value);
                setIsOpen(false);
              }}
            >
              {value}
            </button>
          ))}
          {normalizedDraftTag && !hasExactMatch ? (
            <button
              type="button"
              className="tag-combobox__option tag-combobox__option--create"
              onClick={() => {
                onChangeTag(normalizedDraftTag.slice(0, 40));
                setIsOpen(false);
              }}
            >
              Create tag
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
