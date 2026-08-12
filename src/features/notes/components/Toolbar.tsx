import {
  Bold,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Code2,
  Columns3,
  Eraser,
  FileDown,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image,
  Italic,
  List,
  ListOrdered,
  Minus,
  Palette,
  Plus,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  Trash2,
  Type,
  Underline
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { applyOrderedListStyle } from "../editor/OrderedListStyle";

type ToolbarProps = {
  editor: Editor | null;
  visible: boolean;
  onToggleVisible: () => void;
  onPickImage: () => void;
  onExportPdf?: () => void;
  isExporting?: boolean;
};

type ToolbarSection = {
  id: string;
  label: string;
  icon: ReactNode;
  items: ReactNode[];
};

const TEXT_SIZES = [
  { label: "Normal", value: null },
  { label: "12 px", value: "12px" },
  { label: "14 px", value: "14px" },
  { label: "16 px", value: "16px" },
  { label: "18 px", value: "18px" },
  { label: "24 px", value: "24px" },
  { label: "32 px", value: "32px" }
];

const isActive = (editor: Editor | null, name: string, attrs?: Record<string, unknown>) =>
  editor?.isActive(name, attrs) ? "is-active" : "";

function openCodeBlock(editor: Editor) {
  if (editor.isActive("codeBlock")) {
    return editor.chain().focus().toggleCodeBlock().run();
  }

  const currentText = editor.state.selection.$from.parent.textContent.trim();

  if (editor.isActive("listItem")) {
    if (currentText) {
      return editor.chain().focus().splitListItem("listItem").liftListItem("listItem").setCodeBlock().run();
    }

    return editor.chain().focus().liftListItem("listItem").setCodeBlock().run();
  }

  if (currentText) {
    return editor.chain().focus().splitBlock().setCodeBlock().run();
  }

  return editor.chain().focus().setCodeBlock().run();
}

function ToolbarAction({
  active = false,
  onClick,
  label,
  children
}: {
  active?: boolean;
  onClick?: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`toolbar-action workspace__action-button${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-label={label}
      data-tooltip={label}
    >
      {children}
    </button>
  );
}

export function Toolbar({
  editor,
  visible,
  onToggleVisible,
  onPickImage,
  onExportPdf,
  isExporting
}: ToolbarProps) {
  const [activeSection, setActiveSection] = useState("text");
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);

  useEffect(() => {
    if (!showTextSizeMenu) return;
    const closeTextSizeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowTextSizeMenu(false);
    };
    window.addEventListener("keydown", closeTextSizeMenu);
    return () => window.removeEventListener("keydown", closeTextSizeMenu);
  }, [showTextSizeMenu]);

  if (!editor) {
    return null;
  }

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const setHighlightColor = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const toolbarSections: ToolbarSection[] = [
    {
      id: "text",
      label: "Text",
      icon: <Type size={17} strokeWidth={2.1} />,
      items: [
        <ToolbarAction
          key="bold"
          active={Boolean(isActive(editor, "bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="italic"
          active={Boolean(isActive(editor, "italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="underline"
          active={Boolean(isActive(editor, "underline"))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="Underline"
        >
          <Underline size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="strike"
          active={Boolean(isActive(editor, "strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="Strikethrough"
        >
          <Strikethrough size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="subscript"
          active={Boolean(isActive(editor, "subscript"))}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          label="Subscript"
        >
          <Subscript size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="superscript"
          active={Boolean(isActive(editor, "superscript"))}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          label="Superscript"
        >
          <Superscript size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <div className="toolbar-text-size" key="text-size">
          <ToolbarAction
            active={showTextSizeMenu}
            onClick={() => setShowTextSizeMenu((current) => !current)}
            label="Text size"
          >
            <span className="toolbar-action__stack">
              <Type size={16} strokeWidth={2.1} />
              <span className="toolbar-action__badge">PX</span>
            </span>
          </ToolbarAction>
          {showTextSizeMenu ? (
            <div className="toolbar-text-size__menu">
              {TEXT_SIZES.map((size) => (
                <button
                  type="button"
                  key={size.label}
                  className={
                    (editor.getAttributes("textStyle").fontSize ?? null) === size.value
                      ? "is-active"
                      : ""
                  }
                  onClick={() => {
                    if (size.value) {
                      editor.chain().focus().setFontSize(size.value).run();
                    } else {
                      editor.chain().focus().unsetFontSize().run();
                    }
                    setShowTextSizeMenu(false);
                  }}
                >
                  {size.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ]
    },
    {
      id: "structure",
      label: "Structure",
      icon: <Heading1 size={17} strokeWidth={2.1} />,
      items: [
        <ToolbarAction
          key="h1"
          active={Boolean(isActive(editor, "heading", { level: 1 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="Heading 1"
        >
          <Heading1 size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="h2"
          active={Boolean(isActive(editor, "heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Heading 2"
        >
          <Heading2 size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="h3"
          active={Boolean(isActive(editor, "heading", { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="Heading 3"
        >
          <Heading3 size={16} strokeWidth={2.1} />
        </ToolbarAction>
      ]
    },
    {
      id: "lists",
      label: "Lists",
      icon: <List size={17} strokeWidth={2.1} />,
      items: [
        <ToolbarAction
          key="bullets"
          active={Boolean(isActive(editor, "bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="decimal"
          active={Boolean(isActive(editor, "orderedList", { listStyleType: "decimal" }))}
          onClick={() => applyOrderedListStyle(editor, "decimal")}
          label="Numbered list"
        >
          <ListOrdered size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="alpha"
          active={Boolean(isActive(editor, "orderedList", { listStyleType: "upper-alpha" }))}
          onClick={() => applyOrderedListStyle(editor, "upper-alpha")}
          label="Lettered list"
        >
          <span className="toolbar-action__badge">A</span>
        </ToolbarAction>,
        <ToolbarAction
          key="roman"
          active={Boolean(isActive(editor, "orderedList", { listStyleType: "lower-roman" }))}
          onClick={() => applyOrderedListStyle(editor, "lower-roman")}
          label="Roman list"
        >
          <span className="toolbar-action__badge">i</span>
        </ToolbarAction>,
        <ToolbarAction
          key="tasks"
          active={Boolean(isActive(editor, "taskList"))}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          label="Task list"
        >
          <CheckSquare size={16} strokeWidth={2.1} />
        </ToolbarAction>
      ]
    },
    {
      id: "insert",
      label: "Insert",
      icon: <Plus size={17} strokeWidth={2.1} />,
      items: [
        <ToolbarAction
          key="code"
          active={Boolean(isActive(editor, "codeBlock"))}
          onClick={() => openCodeBlock(editor)}
          label="Code block"
        >
          <Code2 size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction key="image" onClick={onPickImage} label="Insert image">
          <Image size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <ToolbarAction
          key="table"
          active={Boolean(isActive(editor, "table"))}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          label="Insert table"
        >
          <Table2 size={16} strokeWidth={2.1} />
        </ToolbarAction>
      ]
    },
    {
      id: "color",
      label: "Color",
      icon: <Palette size={17} strokeWidth={2.1} />,
      items: [
        <ToolbarAction
          key="highlight"
          active={Boolean(isActive(editor, "highlight"))}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          label="Highlight"
        >
          <Highlighter size={16} strokeWidth={2.1} />
        </ToolbarAction>,
        <label key="text-color" className="toolbar__color-picker" title="Text color">
          <input aria-label="Text color" type="color" onChange={(event) => setTextColor(event.target.value)} />
        </label>,
        <label key="mark-color" className="toolbar__color-picker" title="Highlight color">
          <input
            aria-label="Highlight color"
            type="color"
            defaultValue="#f8e38a"
            onChange={(event) => setHighlightColor(event.target.value)}
          />
        </label>
      ]
    },
    {
      id: "table-tools",
      label: "Table tools",
      icon: <Table2 size={17} strokeWidth={2.1} />,
      items: [
        <ToolbarAction key="add-row" onClick={() => editor.chain().focus().addRowAfter().run()} label="Add row">
          <span className="toolbar-action__stack">
            <Table2 size={16} strokeWidth={2.1} />
            <Plus size={11} strokeWidth={2.3} />
          </span>
        </ToolbarAction>,
        <ToolbarAction
          key="delete-row"
          onClick={() => editor.chain().focus().deleteRow().run()}
          label="Delete row"
        >
          <span className="toolbar-action__stack">
            <Table2 size={16} strokeWidth={2.1} />
            <Minus size={11} strokeWidth={2.3} />
          </span>
        </ToolbarAction>,
        <ToolbarAction
          key="add-col"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          label="Add column"
        >
          <span className="toolbar-action__stack">
            <Columns3 size={16} strokeWidth={2.1} />
            <Plus size={11} strokeWidth={2.3} />
          </span>
        </ToolbarAction>,
        <ToolbarAction
          key="delete-col"
          onClick={() => editor.chain().focus().deleteColumn().run()}
          label="Delete column"
        >
          <span className="toolbar-action__stack">
            <Columns3 size={16} strokeWidth={2.1} />
            <Minus size={11} strokeWidth={2.3} />
          </span>
        </ToolbarAction>,
        <ToolbarAction key="drop-table" onClick={() => editor.chain().focus().deleteTable().run()} label="Delete table">
          <Trash2 size={16} strokeWidth={2.1} />
        </ToolbarAction>
      ]
    },
    {
      id: "cleanup",
      label: "Clear formatting",
      icon: <Eraser size={17} strokeWidth={2.1} />,
      items: [
        <ToolbarAction
          key="clear-marks"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          label="Clear inline formatting"
        >
          <Eraser size={16} strokeWidth={2.1} />
        </ToolbarAction>
      ]
    }
  ];

  const currentSection = toolbarSections.find((section) => section.id === activeSection) ?? toolbarSections[0];

  return (
    <div className="toolbar-shell">
      <div className="toolbar-shell__top">
        <span className="toolbar-shell__metric">
          {(editor?.storage.characterCount.characters() ?? 0).toLocaleString()} characters
        </span>
        <button
          type="button"
          className="icon-button workspace__action-button toolbar-shell__toggle"
          onClick={onToggleVisible}
          aria-label={visible ? "Hide toolbar" : "Show toolbar"}
          data-tooltip={visible ? "Hide toolbar" : "Show toolbar"}
        >
          {visible ? <ChevronUp size={18} strokeWidth={2.1} /> : <ChevronDown size={18} strokeWidth={2.1} />}
        </button>
      </div>

      {visible ? (
        <div className="toolbar-ribbon">
          <div className="toolbar-ribbon__tabs" role="tablist" aria-label="Toolbar sections">
            {toolbarSections.map((section) => (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={currentSection.id === section.id}
                className={`toolbar-ribbon__tab workspace__action-button${
                  currentSection.id === section.id ? " is-active" : ""
                }`}
                onClick={() => setActiveSection(section.id)}
                aria-label={section.label}
                data-tooltip={section.label}
              >
                {section.icon}
              </button>
            ))}
            {onExportPdf ? (
              <button
                type="button"
                className="toolbar-ribbon__tab workspace__action-button"
                onClick={() => onExportPdf()}
                disabled={isExporting}
                aria-label={isExporting ? "Exporting..." : "Export PDF"}
                data-tooltip={isExporting ? "Exporting..." : "Export PDF"}
              >
                <FileDown size={18} strokeWidth={2.1} />
              </button>
            ) : null}
          </div>

          <div className="toolbar-ribbon__tray" role="tabpanel" aria-label={currentSection.label}>
            {currentSection.items}
          </div>
        </div>
      ) : null}
    </div>
  );
}
