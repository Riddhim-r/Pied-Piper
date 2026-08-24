import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import mammoth from "mammoth";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/react";
import { CodeBlockWithTools } from "../editor/CodeBlockWithTools";
import { FontSize } from "../editor/FontSize";
import {
  applyOrderedListStyle,
  OrderedListStyleExtension
} from "../editor/OrderedListStyle";
import { ResizableImage } from "../editor/ResizableImage";
import type { EditorDraft, NotebookRecord, OutlineHeading } from "../types";
import { Toolbar } from "./Toolbar";
import { FindInNotebookBar } from "./FindInNotebookBar";
import { openNotebookLink } from "../services/notesService";

type SlashCommand = {
  id: string;
  label: string;
  keywords: string[];
  run: (editor: Editor, pickImage: () => void) => void;
};

type EditorPaneProps = {
  notebook: NotebookRecord;
  onDraftChange: (draft: EditorDraft) => void;
  onUploadImage: (file: File) => Promise<string>;
  onSave: () => void;
  onExportPdf: (contentHtml: string) => void;
  isExporting: boolean;
  onOutlineChange: (outline: OutlineHeading[], jumpToHeading: (pos: number, key: string) => void) => void;
  onSetDraftTitle?: (title: string) => void;
  isDraftBlank?: boolean;
};

function cleanSearchHighlightMarks(node: JSONContent): JSONContent {
  if (!node || typeof node !== "object") return node;

  const copy = { ...node };

  if (Array.isArray(copy.marks)) {
    copy.marks = copy.marks.filter((mark) => {
      if (mark.type === "highlight") {
        const color = mark.attrs?.color;
        if (!color || color === "#fef08a" || color === "#f97316" || color === "#ea580c") {
          return false;
        }
      }
      return true;
    });
  }

  if (Array.isArray(copy.content)) {
    copy.content = copy.content.map(cleanSearchHighlightMarks);
  }

  return copy;
}

function getInitialContent(contentJson: string): JSONContent {
  if (!contentJson) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }]
    };
  }

  try {
    const parsed = JSON.parse(contentJson) as JSONContent;
    return cleanSearchHighlightMarks(parsed);
  } catch {
    return {
      type: "doc",
      content: [{ type: "paragraph" }]
    };
  }
}

import {
  annotateHeadingNodes,
  extractOutline,
  jumpToOutlineHeading,
} from "../editor/outlineUtils";
import {
  plainTextToHtml,
  sanitizePastedHtml,
  unwrapSinglePastedParagraph,
} from "../editor/sanitizeHtml";

function computeSlashCommandState(editor: Editor | null) {
  if (!editor) {
    return null;
  }

  const { state } = editor;
  const { selection } = state;

  if (!selection.empty) {
    return null;
  }

  const { $from } = selection;
  const line = $from.parent.textContent.slice(0, $from.parentOffset);
  const match = /^\s*\/([\w-]*)$/.exec(line);

  if (!match) {
    return null;
  }

  const slashIndex = line.indexOf("/");
  return {
    query: match[1].toLowerCase(),
    from: $from.start() + slashIndex,
    to: selection.from
  };
}

function isSelectionInCodeBlock(editor: Editor | null) {
  return editor?.isActive("codeBlock") ?? false;
}

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

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "h1",
    label: "Heading 1",
    keywords: ["title", "main", "heading"],
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    id: "h2",
    label: "Heading 2",
    keywords: ["subtitle", "section"],
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    id: "h3",
    label: "Heading 3",
    keywords: ["subsection"],
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    id: "bullets",
    label: "Bullet list",
    keywords: ["list", "unordered"],
    run: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    id: "numbers",
    label: "Numbered list",
    keywords: ["ordered", "list"],
    run: (editor) => applyOrderedListStyle(editor, "decimal")
  },
  {
    id: "alpha-list",
    label: "Lettered list",
    keywords: ["ordered", "alpha", "A"],
    run: (editor) => applyOrderedListStyle(editor, "upper-alpha")
  },
  {
    id: "roman-list",
    label: "Roman list",
    keywords: ["ordered", "roman", "i"],
    run: (editor) => applyOrderedListStyle(editor, "lower-roman")
  },
  {
    id: "tasks",
    label: "Task list",
    keywords: ["checkbox", "todo"],
    run: (editor) => editor.chain().focus().toggleTaskList().run()
  },
  {
    id: "table",
    label: "Insert table",
    keywords: ["grid", "cells"],
    run: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  },
  {
    id: "code",
    label: "Code block",
    keywords: ["snippet", "programming"],
    run: (editor) => openCodeBlock(editor)
  },
  {
    id: "image",
    label: "Insert image",
    keywords: ["photo", "upload"],
    run: (_editor, pickImage) => pickImage()
  }
];

export function EditorPane({
  notebook,
  onDraftChange,
  onUploadImage,
  onSave,
  onExportPdf,
  isExporting,
  onOutlineChange,
  onSetDraftTitle,
  isDraftBlank = false
}: EditorPaneProps) {
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [slashIndex, setSlashIndex] = useState(0);
  const [showFindBar, setShowFindBar] = useState(false);
  const currentNotebookId = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docxInputRef = useRef<HTMLInputElement | null>(null);

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const openDocxPicker = () => {
    docxInputRef.current?.click();
  };

  const handleDocxSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !editor) {
      return;
    }

    const isCurrentEmpty = editor.isEmpty || editor.getText().trim() === "" || isDraftBlank;
    if (!isCurrentEmpty) {
      window.alert("Word documents can only be imported into an empty notebook. Create a new notebook to import.");
      return;
    }

    try {
      const fileNameWithoutExt = file.name.replace(/\.docx$/i, "").trim();
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (result.value) {
        editor.commands.setContent(result.value);
        if (fileNameWithoutExt) {
          onSetDraftTitle?.(fileNameWithoutExt);
        }
      }
    } catch (error) {
      console.error("Failed to import docx document:", error);
    }
  };

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !editor) {
      return;
    }

    try {
      const src = await onUploadImage(file);
      editor.chain().focus().setImage({ src, alt: file.name }).run();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload image.";
      window.alert(message);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        history: { depth: 10 },
        heading: { levels: [1, 2, 3] },
        orderedList: false
      }),
      OrderedListStyleExtension,
      CodeBlockWithTools,
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      ResizableImage,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer"
        }
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: { class: "notebook-task-list" }
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: "notebook-task-item" }
      }),
      Placeholder.configure({
        placeholder: "Type like a Word document, or start a line with / for commands."
      }),
      CharacterCount.configure({
        limit: 1000000
      })
    ],
    content: getInitialContent(notebook.contentJson),
    editorProps: {
      attributes: {
        class: "editor-surface"
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement | null;
        const link = target?.closest("a");

        if (!link) {
          return false;
        }

        if (event.ctrlKey || event.metaKey) {
          void openNotebookLink((link as HTMLAnchorElement).href);
          return true;
        }

        return false;
      },
      handlePaste: (_view, event) => {
        if (isSelectionInCodeBlock(editor)) {
          return false;
        }

        const html = event.clipboardData?.getData("text/html");
        const text = event.clipboardData?.getData("text/plain") ?? "";

        if (html && html.trim()) {
          const sanitized = sanitizePastedHtml(html);
          if (sanitized && sanitized.trim()) {
            event.preventDefault();
            const pastedHtml = unwrapSinglePastedParagraph(sanitized);
            editor
              ?.chain()
              .focus()
              .insertContent(pastedHtml, {
                parseOptions: { preserveWhitespace: "full" }
              })
              .run();
            return true;
          }
        }

        if (text && text.trim()) {
          event.preventDefault();
          if (text.includes("\n")) {
            editor
              ?.chain()
              .focus()
              .insertContent(plainTextToHtml(text), {
                parseOptions: { preserveWhitespace: "full" }
              })
              .run();
          } else {
            editor?.chain().focus().insertContent(text).run();
          }
          return true;
        }

        return false;
      },
      handleKeyDown: (_view, event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.altKey &&
          ["1", "2", "3"].includes(event.key)
        ) {
          event.preventDefault();
          editor
            ?.chain()
            .focus()
            .toggleHeading({ level: Number(event.key) as 1 | 2 | 3 })
            .run();
          return true;
        }

        const slashState = computeSlashCommandState(editor);

        if (event.key === "Enter" && event.shiftKey && editor?.isActive("listItem")) {
          event.preventDefault();
          editor.chain().focus().setHardBreak().run();
          return true;
        }

        if (slashState) {
          const filtered = filteredSlashCommands;

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashIndex((current) => (current + 1) % Math.max(filtered.length, 1));
            return true;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashIndex((current) =>
              current === 0 ? Math.max(filtered.length - 1, 0) : current - 1
            );
            return true;
          }

          if (event.key === "Enter" && filtered.length > 0) {
            event.preventDefault();
            const command = filtered[Math.min(slashIndex, filtered.length - 1)];
            editor
              ?.chain()
              .focus()
              .deleteRange({ from: slashState.from, to: slashState.to })
              .run();
            command.run(editor!, openImagePicker);
            setSlashIndex(0);
            return true;
          }

          if (event.key === "Escape") {
            setSlashIndex(0);
            return true;
          }
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
          event.preventDefault();
          setShowFindBar(true);
          return true;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          onSave();
          return true;
        }

        return false;
      }
    },
    onCreate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON();
      const outline = extractOutline(currentEditor);
      onDraftChange({
        contentJson: JSON.stringify(json),
        plainTextLength: currentEditor.storage.characterCount.characters(),
        outline
      });
      requestAnimationFrame(() => {
        annotateHeadingNodes(currentEditor);
        onOutlineChange(outline, (pos, key) => jumpToOutlineHeading(currentEditor, key, pos));
      });
    },
    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON();
      const outline = extractOutline(currentEditor);

      onDraftChange({
        contentJson: JSON.stringify(json),
        plainTextLength: currentEditor.storage.characterCount.characters(),
        outline
      });

      requestAnimationFrame(() => {
        annotateHeadingNodes(currentEditor);
        onOutlineChange(outline, (pos, key) => jumpToOutlineHeading(currentEditor, key, pos));
      });
    }
  });

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setShowFindBar((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (currentNotebookId.current === notebook.id) {
      return;
    }

    currentNotebookId.current = notebook.id;
    const initialContent = getInitialContent(notebook.contentJson);
    editor.commands.setContent(initialContent);

    requestAnimationFrame(() => {
      annotateHeadingNodes(editor);
      const outline = extractOutline(editor);
      onOutlineChange(outline, (pos, key) => jumpToOutlineHeading(editor, key, pos));
    });
  }, [editor, notebook.id, notebook.contentJson, onOutlineChange]);

  const slashState = computeSlashCommandState(editor);

  const filteredSlashCommands = useMemo(() => {
    if (!slashState) {
      return [];
    }

    return SLASH_COMMANDS.filter((command) => {
      const haystack = `${command.label} ${command.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(slashState.query);
    });
  }, [slashState]);

  useEffect(() => {
    setSlashIndex(0);
  }, [slashState?.query]);

  return (
    <section className="editor-pane">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageSelected}
      />
      <input
        ref={docxInputRef}
        type="file"
        accept=".docx"
        hidden
        onChange={handleDocxSelected}
      />

      {showFindBar ? (
        <FindInNotebookBar editor={editor} onClose={() => setShowFindBar(false)} />
      ) : null}

      <Toolbar
        editor={editor}
        visible={toolbarVisible}
        onToggleVisible={() => setToolbarVisible((value) => !value)}
        onPickImage={openImagePicker}
        onImportDocx={openDocxPicker}
        onToggleFind={() => setShowFindBar((prev) => !prev)}
        onExportPdf={() => onExportPdf(editor?.getHTML() ?? "")}
        isExporting={isExporting}
      />

      <div className="document-stage">
        <div
          className="document-paper"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault();
              editor?.commands.focus("end");
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {slashState && filteredSlashCommands.length > 0 ? (
        <div className="slash-menu">
          {filteredSlashCommands.map((command, index) => (
            <button
              type="button"
              key={command.id}
              className={index === slashIndex ? "is-active" : ""}
              onClick={() => {
                editor
                  ?.chain()
                  .focus()
                  .deleteRange({ from: slashState.from, to: slashState.to })
                  .run();
                command.run(editor!, openImagePicker);
                setSlashIndex(0);
              }}
            >
              <strong>{command.label}</strong>
              <span>{command.keywords.join(" / ")}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
