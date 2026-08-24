import { X } from "lucide-react";

const SHORTCUTS = [
  ["Ctrl + F", "Find text in current notebook"],
  ["Ctrl + S", "Save notebook instantly"],
  ["Ctrl + B", "Bold text"],
  ["Ctrl + I", "Italic text"],
  ["Ctrl + Z", "Undo"],
  ["Ctrl + Y", "Redo"],
  ["Ctrl + Alt + 1", "Heading 1"],
  ["Ctrl + Alt + 2", "Heading 2"],
  ["Ctrl + Alt + 3", "Heading 3"],
  ["Ctrl + K", "Global search & jump across sections"],
  ["Ctrl + Shift + T", "Quick navigate to Todo"],
  ["Escape", "Close Find bar / Exit focus mode / Cancel modal"],
  ["Enter / Shift + Enter", "Next / Previous match in text find"],
  ["Ctrl + Click", "Open a link"],
  ["/", "Open slash commands at the start of a line"],
  ["/ roman", "Insert a roman-numbered list"],
  ["Tab / Shift + Tab", "Nest or un-nest list items"],
  ["Enter", "Continue lists with auto numbering"],
  ["Backspace", "Break out of empty lists"]
];

const NOTES = [
  "Notebooks are saved locally in the app database.",
  "Links open with Ctrl + Click.",
  "Paste keeps formatting."
];

type ShortcutsViewProps = {
  onClose?: () => void;
};

export function ShortcutsView({ onClose }: ShortcutsViewProps) {
  return (
    <section className="shortcuts-view" style={{ flex: 1, height: "100%", overflowY: "auto", padding: "24px 28px 40px" }}>
      <div className="shortcuts-view__header">
        <div className="shortcuts-view__intro">
          <h2>Keyboard shortcuts</h2>
          <p>Key commands and editor behaviors.</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="icon-button workspace__action-button"
            data-global-close
            onClick={onClose}
            aria-label="Close shortcuts"
            data-tooltip="Close shortcuts"
          >
            <X size={18} strokeWidth={2.1} />
          </button>
        ) : null}
      </div>

      <div className="editor-pane__meta-strip">
        {NOTES.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>

      <div className="shortcuts-grid">
        {SHORTCUTS.map(([shortcut, action]) => (
          <article key={shortcut} className="shortcut-card">
            <kbd>{shortcut}</kbd>
            <span>{action}</span>
          </article>
        ))}
        <article className="shortcut-card shortcut-card--wide">
          <strong>Clear formatting</strong>
          <span>
            Clear formatting removes inline styling from selected text, including bold,
            italic, underline, colors, highlights, links, and caption sizing. It does not
            delete text or remove structural blocks such as headings and lists.
          </span>
        </article>
      </div>
    </section>
  );
}
