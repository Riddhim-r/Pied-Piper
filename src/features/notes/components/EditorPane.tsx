import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
import { openNotebookLink } from "../services/notesService";

type SlashCommand = {
  id: string;
  label: string;
  keywords: string[];
  run: (editor: Editor, pickImage: () => void) => void;
};

type EditorPaneProps = {
  notebook: NotebookRecord;
  title: string;
  tag: string;
  availableTags: string[];
  onTitleChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onDraftChange: (draft: EditorDraft) => void;
  onUploadImage: (file: File) => Promise<string>;
  onSave: () => void;
  onExportPdf: (contentHtml: string) => void;
  isSaving: boolean;
  isExporting: boolean;
  lastSavedAt: string | null;
  titleError: string | null;
  saveMessage: string | null;
  onOutlineChange: (outline: OutlineHeading[], jumpToHeading: (pos: number, key: string) => void) => void;
};

function getInitialContent(contentJson: string): JSONContent {
  if (!contentJson) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }]
    };
  }

  try {
    return JSON.parse(contentJson) as JSONContent;
  } catch {
    return {
      type: "doc",
      content: [{ type: "paragraph" }]
    };
  }
}

function buildOutlineTree(headings: Array<Omit<OutlineHeading, "children">>): OutlineHeading[] {
  const root: OutlineHeading[] = [];
  const stack: OutlineHeading[] = [];

  headings.forEach((heading) => {
    const item: OutlineHeading = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  });

  return root;
}

function extractOutline(editor: Editor): OutlineHeading[] {
  const flat: Array<Omit<OutlineHeading, "children">> = [];
  let index = 0;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading" && typeof node.attrs.level === "number" && node.attrs.level <= 3) {
      flat.push({
        key: `heading-${index}`,
        text: node.textContent || `Heading ${index + 1}`,
        level: node.attrs.level,
        pos
      });
      index += 1;
    }

    return true;
  });

  return buildOutlineTree(flat);
}

function annotateHeadingNodes(editor: Editor) {
  const headings = Array.from(editor.view.dom.querySelectorAll("h1, h2, h3"));
  headings.forEach((heading, index) => {
    heading.setAttribute("data-outline-key", `heading-${index}`);
  });
}

function jumpToOutlineHeading(editor: Editor, key: string, pos: number) {
  const headingFromPos = editor.view.nodeDOM(pos);
  const heading =
    (headingFromPos instanceof HTMLElement ? headingFromPos : null) ??
    editor.view.dom.querySelector<HTMLElement>(`[data-outline-key="${key}"]`);

  if (!heading) {
    return;
  }

  heading.classList.remove("is-outline-target");
  heading.scrollIntoView({ behavior: "smooth", block: "center" });
  heading.classList.add("is-outline-target");
  window.setTimeout(() => {
    heading.classList.remove("is-outline-target");
  }, 1400);
}

function sanitizeStyle(styleValue: string) {
  const allowedProperties = new Set([
    "background-color",
    "color",
    "font-size",
    "list-style-type",
    "text-decoration",
    "width"
  ]);

  return styleValue
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((rule) => {
      const [property, ...rest] = rule.split(":");
      return {
        property: property.trim().toLowerCase(),
        value: rest.join(":").trim()
      };
    })
    .filter((rule) => allowedProperties.has(rule.property) && rule.value)
    .map((rule) => `${rule.property}: ${rule.value}`)
    .join("; ");
}

function sanitizePastedHtml(html: string) {
  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(html, "text/html");
  const allowedTags = new Set([
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "em",
    "h1",
    "h2",
    "h3",
    "hr",
    "i",
    "li",
    "mark",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul"
  ]);

  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (["script", "style", "meta", "link"].includes(tag)) {
      element.remove();
      return;
    }

    if (tag === "div") {
      const paragraph = documentFragment.createElement("p");
      paragraph.innerHTML = element.innerHTML;
      element.replaceWith(paragraph);
      walk(paragraph);
      return;
    }

    if (!allowedTags.has(tag)) {
      const fragment = documentFragment.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "style") {
        const style = sanitizeStyle(attribute.value);
        if (style) {
          element.setAttribute("style", style);
        } else {
          element.removeAttribute("style");
        }
        return;
      }

      const allowedAttributes = new Set([
        "alt",
        "colspan",
        "href",
        "rowspan",
        "src",
        "target",
        "rel"
      ]);

      if (!allowedAttributes.has(name)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tag === "a") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }

    Array.from(element.childNodes).forEach(walk);
  };

  Array.from(documentFragment.body.childNodes).forEach(walk);
  return documentFragment.body.innerHTML;
}

function unwrapSinglePastedParagraph(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  if (container.children.length === 1 && container.firstElementChild?.tagName === "P") {
    return container.firstElementChild.innerHTML;
  }
  return html;
}

function plainTextToHtml(text: string) {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const preserveLineWhitespace = (value: string) => {
    const expandedTabs = escapeHtml(value).replace(/\t/g, "    ");
    const leadingSpaces = expandedTabs.match(/^ +/)?.[0].length ?? 0;
    const trailingSpaces = expandedTabs.match(/ +$/)?.[0].length ?? 0;
    const middle = expandedTabs.slice(leadingSpaces, expandedTabs.length - trailingSpaces);

    return [
      "&nbsp;".repeat(leadingSpaces),
      middle.replace(/ {2,}/g, (match) => ` ${"&nbsp;".repeat(match.length - 1)}`),
      "&nbsp;".repeat(trailingSpaces)
    ].join("");
  };

  const preserveWhitespace = (value: string) =>
    value
      .split("\n")
      .map(preserveLineWhitespace)
      .join("\n");

  return text
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${preserveWhitespace(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

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
  title,
  tag,
  availableTags,
  onTitleChange,
  onTagChange,
  onDraftChange,
  onUploadImage,
  onSave,
  onExportPdf,
  isSaving,
  isExporting,
  lastSavedAt,
  titleError,
  saveMessage,
  onOutlineChange
}: EditorPaneProps) {
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [slashIndex, setSlashIndex] = useState(0);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const currentNotebookId = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const tagComboboxRef = useRef<HTMLDivElement | null>(null);

  const normalizedTag = tag.trim();
  const tagQuery = normalizedTag.toLowerCase();
  const hasExactTagMatch = useMemo(
    () => availableTags.some((value) => value.toLowerCase() === tagQuery),
    [availableTags, tagQuery]
  );
  const filteredTags = useMemo(() => {
    if (!normalizedTag) {
      return availableTags;
    }

    return availableTags.filter((value) => value.toLowerCase().includes(tagQuery));
  }, [availableTags, normalizedTag, tagQuery]);

  const openImagePicker = () => {
    imageInputRef.current?.click();
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
        limit: 10000
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

        if (html) {
          event.preventDefault();
          const pastedHtml = unwrapSinglePastedParagraph(sanitizePastedHtml(html));
          editor
            ?.chain()
            .focus()
            .insertContent(pastedHtml, {
              parseOptions: { preserveWhitespace: "full" }
            })
            .run();
          return true;
        }

        if (text.includes("\n")) {
          event.preventDefault();
          editor
            ?.chain()
            .focus()
            .insertContent(plainTextToHtml(text), {
              parseOptions: { preserveWhitespace: "full" }
            })
            .run();
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
    if (!editor) {
      return;
    }

    if (currentNotebookId.current === notebook.id) {
      return;
    }

    currentNotebookId.current = notebook.id;
    editor.commands.setContent(getInitialContent(notebook.contentJson));
    requestAnimationFrame(() => editor.commands.focus("end"));
  }, [editor, notebook.id, notebook.contentJson]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (tagComboboxRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsTagMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

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
      <header className="editor-pane__header">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageSelected}
        />
        <div className="editor-meta">
          <label>
            <span>Notebook title</span>
            <input
              className={`title-input${titleError ? " is-invalid" : ""}`}
              value={title}
              maxLength={100}
              onChange={(event) => onTitleChange(event.target.value.slice(0, 100))}
            />
            {titleError ? <small className="field-error">{titleError}</small> : null}
          </label>
          <label>
            <span>Tag</span>
            <div className="tag-combobox" ref={tagComboboxRef}>
              <input
                className="tag-input"
                value={tag}
                maxLength={40}
                onFocus={() => setIsTagMenuOpen(true)}
                onClick={() => setIsTagMenuOpen(true)}
                onChange={(event) => {
                  onTagChange(event.target.value.slice(0, 40));
                  setIsTagMenuOpen(true);
                }}
                placeholder="Search or create a tag"
              />
              {isTagMenuOpen ? (
                <div className="tag-combobox__menu">
                  {filteredTags.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`tag-combobox__option${normalizedTag.toLowerCase() === value.toLowerCase() ? " is-active" : ""}`}
                      onClick={() => {
                        onTagChange(value);
                        setIsTagMenuOpen(false);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                  {normalizedTag && !hasExactTagMatch ? (
                    <button
                      type="button"
                      className="tag-combobox__option tag-combobox__option--create"
                      onClick={() => {
                        onTagChange(normalizedTag.slice(0, 40));
                        setIsTagMenuOpen(false);
                      }}
                    >
                      Create tag
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </label>
        </div>
        <div className="editor-pane__status">
          <span className="editor-pane__metric">
            {editor?.storage.characterCount.characters() ?? notebook.plainTextLength} / 10000
          </span>
          <button type="button" className="primary-button" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => onExportPdf(editor?.getHTML() ?? "")}
            disabled={isExporting}
          >
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>
          {saveMessage ? <span className="editor-pane__message">{saveMessage}</span> : null}
          <span className="editor-pane__metric">
            {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Unsaved"}
          </span>
        </div>
      </header>

      <Toolbar
        editor={editor}
        visible={toolbarVisible}
        onToggleVisible={() => setToolbarVisible((value) => !value)}
        onPickImage={openImagePicker}
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
