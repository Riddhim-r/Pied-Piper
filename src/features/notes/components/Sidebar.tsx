import { ArrowLeft, Keyboard, Moon, Plus, Sun, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { NotebookSummary } from "../types";

type SidebarProps = {
  notebooks: NotebookSummary[];
  selectedId: number | null;
  search: string;
  onSearchChange: (value: string) => void;
  activeTag: string | null;
  tags: string[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onSelectNote: (id: number) => void;
  onCloseCurrentNote: () => void;
  onCreateNote: () => void;
  onSetActiveTag: (tag: string | null) => void;
  onShowShortcuts: () => void;
};

export function Sidebar({
  notebooks,
  selectedId,
  search,
  onSearchChange,
  activeTag,
  tags,
  theme,
  onToggleTheme,
  onSelectNote,
  onCloseCurrentNote,
  onCreateNote,
  onSetActiveTag,
  onShowShortcuts
}: SidebarProps) {
  const [showTagList, setShowTagList] = useState(false);

  useEffect(() => {
    if (!showTagList) return;
    const closeTagList = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowTagList(false);
    };
    window.addEventListener("keydown", closeTagList);
    return () => window.removeEventListener("keydown", closeTagList);
  }, [showTagList]);

  return (
    <aside className="sidebar">
      <Link className="btn ghost notes-back-link" to="/dashboard">
        <ArrowLeft size={16} strokeWidth={2.2} />
        Back to Dashboard
      </Link>
      <div className="sidebar__header">
        <div className="sidebar__hero">
          <h1>Notes for Noobs</h1>
          <div className="sidebar__quick-actions">
            <button
              type="button"
              className="icon-button workspace__action-button sidebar__icon-action"
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              data-tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun size={17} strokeWidth={2.1} /> : <Moon size={17} strokeWidth={2.1} />}
            </button>
            <button
              type="button"
              className="icon-button workspace__action-button sidebar__icon-action"
              onClick={onShowShortcuts}
              aria-label="Keyboard shortcuts"
              data-tooltip="Keyboard shortcuts"
            >
              <Keyboard size={17} strokeWidth={2.1} />
            </button>
            <button
              type="button"
              className="icon-button workspace__action-button sidebar__icon-action"
              onClick={() => setShowTagList((value) => !value)}
              aria-label={activeTag ? `Tags: ${activeTag}` : "Tags"}
              data-tooltip={activeTag ? `Tags: ${activeTag}` : "Tags"}
            >
              <Tag size={17} strokeWidth={2.1} />
            </button>
            {selectedId != null ? (
              <button
                type="button"
                className="icon-button workspace__action-button sidebar__icon-action"
                onClick={onCloseCurrentNote}
                aria-label="Close notebook"
                data-tooltip="Close notebook"
              >
                <X size={17} strokeWidth={2.1} />
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="icon-button workspace__action-button sidebar__new-note-button"
          data-global-create
          onClick={onCreateNote}
          aria-label="Create notebook"
          data-tooltip="Create notebook"
        >
          <Plus size={18} strokeWidth={2.15} />
        </button>
      </div>

      <label className="search-shell">
        <input
          aria-label="Search notebooks"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Find a notebook..."
        />
      </label>

      {showTagList ? (
        <section className="tag-panel">
          <div className="tag-panel__header">
            <span>Tag filters</span>
            {activeTag ? (
              <button
                type="button"
                className="ghost-button ghost-button--small"
                onClick={() => onSetActiveTag(null)}
              >
                Clear filter
              </button>
            ) : null}
          </div>

          {tags.length > 0 ? (
            <div className="tag-list tag-list--plain">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-list__item${activeTag === tag ? " is-active" : ""}`}
                  onClick={() => {
                    onSetActiveTag(tag);
                    setShowTagList(false);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : (
            <p className="panel-empty">No tags yet.</p>
          )}
        </section>
      ) : null}

      <section className="note-list">
        {notebooks.length === 0 ? (
          <div className="empty-message">
            <strong>{search ? "No search results" : "Create"}</strong>
            <span>
              {search
                ? "Nothing matches the title search right now."
                : "Create your first notebook and start writing."}
            </span>
          </div>
        ) : (
          notebooks.map((notebook) => (
            <button
              type="button"
              key={notebook.id}
              className={`note-list__item${selectedId === notebook.id ? " is-selected" : ""}`}
              onClick={() => onSelectNote(notebook.id)}
            >
              <div className="note-list__title-row">
                <strong className="note-list__title">
                  {notebook.title || "New notebook"}
                </strong>
                {notebook.tag ? <span className="note-list__tag">{notebook.tag}</span> : null}
              </div>
              <span className="note-list__meta">{new Date(notebook.updatedAt).toLocaleString()}</span>
            </button>
          ))
        )}
      </section>
    </aside>
  );
}
