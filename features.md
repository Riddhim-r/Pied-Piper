# Pied Piper - Comprehensive Feature Showcase & Guide

**Pied Piper** is a private, offline-first desktop knowledge base and productivity workspace built to serve as a lifelong personal knowledge vault and educational storage companion. It combines rich document editing, wisdom libraries, AI prompt management, topic collections, task lists, custom themes, and robust database management into one self-contained desktop system.

---

## Table of Contents

1. [Dashboard](#1-dashboard)
2. [Notes for Noobs (Rich Notebook Editor)](#2-notes-for-noobs-rich-notebook-editor)
3. [Helpbook (Wisdom & Solution Library)](#3-helpbook-wisdom--solution-library)
4. [AI Prompt Vault (Prompt Engineering Workspace)](#4-ai-prompt-vault-prompt-engineering-workspace)
5. [Encyclopedia (Topic & Resource Directory)](#5-encyclopedia-topic--resource-directory)
6. [Todo (Focused Task Manager)](#6-todo-focused-task-manager)
7. [Recycle Bin (Shared Recovery Index)](#7-recycle-bin-shared-recovery-index)
8. [Settings & Custom Feature Themes](#8-settings--custom-feature-themes)
9. [Keyboard Shortcuts Reference](#9-keyboard-shortcuts-reference)
10. [Offline SQLite Data Architecture & Safety](#10-offline-sqlite-data-architecture--safety)

---

## 1. Dashboard

The Dashboard is the main application home providing direct visual access to every module.

- **Navigation Hub**: Access Helpbook, AI Prompt Vault, Notes for Noobs, Encyclopedia, Todo, Recycle Bin, and Settings.
- **Custom Header & Identity**: Displays the configurable application name set in Settings. Clicking the heart mark or application title from any feature returns to the Dashboard.

---

## 2. Notes for Noobs (Rich Notebook Editor)

"Notes for Noobs" is the core document workspace in Pied Piper, built on the TipTap / ProseMirror rich-text engine for distraction-free, long-form writing.

### Key Capabilities

#### Notebook Management
- **Creation & Search**: Create notebooks instantly and search through titles.
- **Tagging & Filtering**: Assign tags to notebooks with case-insensitive duplicate protection (e.g. prevents duplicate forms like `Work`, `work`, and `WORK`). Filter notes in the sidebar by tag.
- **Auto-Discard Cleanliness**: If a newly created notebook remains unnamed, untagged, and empty when you navigate away, it is automatically discarded rather than cluttering your notebook list or Recycle Bin.
- **Soft Deletion & Recovery**: Soft-delete notebooks to move them to the Recycle Bin, where they can be restored or permanently removed.

#### Rich Editor & Formatting
- **Typography & Blocks**: Paragraphs, Headings (H1, H2, H3), Blockquotes, Code Blocks, Tables, Task lists with checkboxes, and Bullet / Numbered lists.
- **Advanced Lists**: Supports standard Numbered (`1, 2, 3`), Lettered (`A, B, C`), and Roman-numbered (`i, ii, iii`) lists. Task checkboxes stay cleanly aligned with text.
- **Styling**: Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Custom Text Colors, Highlight Colors, and Text Sizing.
- **Smart Pasting (Intelligent Sentence Formatting)**: When pasting text from slides, PDFs, or web pages, soft line breaks (`\n`) mid-sentence are automatically merged into clean, continuous single-line sentences while preserving true paragraph breaks (`\n\n`) and list structures.
- **Slash Commands (`/`)**: Type `/` at the start of any line to open a quick-insert menu for headings, lists, tables, code blocks, and images.
- **Outline Navigation Panel**: Automatically generates a dynamic table of contents heading outline for long documents with smooth click-to-jump navigation.
- **Focus Mode**: Hide sidebars (`Escape` or toggle button) for a clean, distraction-free writing layout.
- **Character Counter**: Live tracking of document character length (up to 1,000,000 characters).

#### Images
- Insert local image files (PNG, JPEG, GIF, WebP; up to 5 MB) with interactive size controls.
- Images are embedded as base64 data URLs inside the notebook structure so they remain safely included in exports and database backups.

#### PDF Export
- Export any open notebook into a clean, print-ready A4 PDF (saved by default to your `Downloads` folder). Includes formatted text, images, tables, code blocks, and task lists.

#### Clear Formatting
- Removes inline styling (bold, italic, colors, highlights, sizing, links) from selected text while preserving true text content and structural elements (headings, list items).

#### Autosave
- Changes save automatically after a short typing delay or immediately with `Ctrl + S`.

---

## 3. Helpbook (Wisdom & Solution Library)

Helpbook acts as a personal knowledge repository for technical solutions, troubleshooting procedures, and key code snippets.

- **Ordered Solution Steps**: Save problem descriptions alongside structured, step-by-step resolution actions.
- **Tag Organization**: Categorize entries by topic, language, or framework.
- **Filtering & Search**: Filter entries by tag with dedicated empty states when no matches exist.
- **Recycle Bin Protection**: Deleted entries move to the Recycle Bin instead of immediate database deletion.

---

## 4. AI Prompt Vault (Prompt Engineering Workspace)

A structured library to store, refine, and organize reusable prompts for LLMs (Gemini, Claude, GPT, etc.).

- **Reusable System & User Prompts**: Store prompt templates with titles, tags, and multi-line prompt text.
- **Tag Filtering & Editing**: Filter prompts by domain or task type. Edit and update prompts seamlessly.
- **Recycle Bin Integration**: Soft-deleted prompts are stored safely in the Recycle Bin for recovery.

---

## 5. Encyclopedia (Topic & Resource Directory)

An organized bookmarking system to map complex subjects into structured topic hierarchies.

- **Topic Collections**: Group web links, references, and documentation under custom topic folders with optional descriptions.
- **Link Management**: Add, edit, or remove links (label + URL) within any topic.
- **Default Browser Launching**: Open saved HTTP/HTTPS URLs directly in your operating system's default browser via safe desktop IPC handlers.
- **Recycle Bin Integration**: Deleting a topic moves the topic and all its associated links to the Recycle Bin. Restoring the topic restores its link collection. (Removing an individual link from a topic permanently deletes that link).

---

## 6. Todo (Focused Task Manager)

A streamlined task manager designed for single-minded focus without project management overhead.

- **Single Active List Constraint**: Enforces focus by supporting exactly one active task list at a time.
- **Completion Rules**: A new list cannot be created while an existing list exists. The current list cannot be deleted until it contains at least one task and every task is checked off as completed.
- **Automatic Reordering**: Checked tasks automatically move beneath unfinished tasks.
- **Keyboard Workflow**: Fast composition and checking (`Ctrl + Shift + T`).

---

## 7. Recycle Bin (Shared Recovery Index)

A centralized index for soft-deleted records across four categories:
- **Helpbook**
- **AI Prompt Vault**
- **Notes for Noobs**
- **Encyclopedia**

- **Category Item Counters**: Displays deleted item totals for each module.
- **Multi-Select & Bulk Actions**: Select individual items, multiple items, or all items to restore or permanently delete them.
- **Permanent Deletion Protection**: Permanent removal requires explicit confirmation and cleans up SQLite records permanently.

---

## 8. Settings & Custom Feature Themes

Settings controls application-wide preferences, visual themes, and local database management.

- **Custom Feature Themes**: Set personalized six-digit hex background colors for each section (Dashboard, Notes for Noobs, Helpbook, AI Prompt Vault, Encyclopedia, Todo, Recycle Bin, Settings).
- **Application Renaming**: Change the active header/title application name (defaults to "Pied Piper").
- **Database Location & Storage Stats**: View active SQLite file path (`%APPDATA%\Pied Piper\pied-piper.db`) and live file size.

---

## 9. Keyboard Shortcuts Reference

### Application-Wide Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + Left Arrow` | Move to the previous page in history |
| `Alt + Right Arrow` | Move to the next page in history |
| `Alt + Home` | Open Dashboard |
| `Ctrl + K` | Open universal page search |
| `Ctrl + ,` | Open Settings page |
| `Ctrl + N` | Create or focus a new item in the active feature |
| `Ctrl + Shift + T` | Open Todo |
| `Ctrl + Shift + Delete` | Open Recycle Bin |
| `Ctrl + 0` | Reset window zoom level to 100% |
| `Ctrl + Wheel` / `Ctrl + +/-` | Adjust window zoom |
| `Escape` | Close active search, form, menu, panel, or modal |

> `Ctrl + N` uses the active feature's creation flow: creates a notebook in Notes, opens entry creation in Helpbook / AI Prompt Vault, opens topic creation in Encyclopedia, and focuses task input in Todo.

### Notes for Noobs Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + B` | Toggle Bold text |
| `Ctrl + I` | Toggle Italic text |
| `Ctrl + Z` | Undo last edit |
| `Ctrl + Y` | Redo last edit |
| `Ctrl + S` | Save notebook immediately |
| `Ctrl + Alt + 1` | Apply Heading 1 |
| `Ctrl + Alt + 2` | Apply Heading 2 |
| `Ctrl + Alt + 3` | Apply Heading 3 |
| `Ctrl + Click` | Open hyperlink |
| `/` | Trigger slash command menu at line start |
| `/ roman` | Quick-insert Roman-numbered list |
| `Tab` | Indent list item (nest level) |
| `Shift + Tab` | Outdent list item |
| `Enter` | Continue list item |
| `Backspace` | Exit empty list item |

---

## 10. Offline SQLite Data Architecture & Safety

- **100% Local & Offline**: All application data is stored in a single local SQLite database via `better-sqlite3`. No cloud sync, telemetry, or external database calls.
- **Export Database**: Create a portable, consistent copy of your SQLite database (`.db` format) at any location.
- **Automated Safety Backups**: Automatically write timestamped copies to `%APPDATA%\Pied Piper\backups`.
- **Database Import & Recovery**: Import existing `.db` files with automatic pre-import safety backups, schema validation, rollback protection, and application auto-restart.
