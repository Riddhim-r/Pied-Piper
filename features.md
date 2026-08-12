# Pied Piper - Comprehensive Feature Showcase

**Pied Piper** is a private, offline-first desktop knowledge base and productivity workspace. Built specifically for lifelong education, career development, and note-taking, Pied Piper combines rich document editing, curated link libraries, AI prompt management, task lists, and custom themes into a single self-contained application.

---

## 1. Notes for Noobs (Rich Notebook Editor)

"Notes for Noobs" is the core writing and document workspace in Pied Piper. Designed to replace online notebook apps with a fast, offline desktop studio.

### Key Capabilities
- **Tiptap Rich-Text Engine**: WYSIWYG editor built on ProseMirror with full support for formatted text, custom headings (H1, H2, H3), blockquotes, code blocks, tables, task checkboxes, and ordered/unordered lists.
- **Smart Pasting (Intelligent Sentence Formatting)**: When text is copied from slides, PDFs, or line-wrapped websites, Pied Piper automatically detects soft line breaks (`\n`) mid-sentence and merges them into clean, continuous single-line sentences while preserving true paragraph breaks (`\n\n`) and list structures.
- **Dual Theme Support (Light & Dark Mode)**: Switch instantly between sleek retro Light Mode and eye-friendly Dark Mode with a single click. Themes persist across sessions.
- **1,000,000 Character Note Limit**: Support for extensive articles, course notes, research papers, and technical books.
- **PDF Export**: One-click export of any notebook into clean, print-ready PDF format (saved by default to your `Downloads` directory).
- **Tagging & Filtering**: Categorize notebooks with custom tags and instantly filter notes in the sidebar.
- **Outline Navigation Panel**: Automatically generates a dynamic table of contents heading outline for long documents with smooth click-to-jump navigation.
- **Focus Mode**: Hide sidebars with a single click (`Escape` or toggle) for distraction-free writing.
- **Image Uploads & Resizing**: Insert local image files directly into document pages with interactive size controls.
- **Slash Commands (`/`)**: Type `/` anywhere on a blank line to trigger the quick-insert menu for headings, lists, tables, code blocks, and images.

---

## 2. Helpbook (Wisdom & Troubleshooting Library)

Helpbook acts as your personal stack-overflow and solution repository for technical challenges, code snippets, and key discoveries made during your career or studies.

- **Solution Catalog**: Save problem descriptions along with verified solutions.
- **Category Filtering**: Organize entries by topics, frameworks, or languages.
- **Fast Search**: Instant text search across all saved wisdom entries.

---

## 3. AI Prompt Vault (Prompt Engineering Workspace)

A structured library to store, refine, and organize reusable prompts for LLMs (Gemini, Claude, GPT, etc.).

- **Reusable Prompt Templates**: Save structured system prompts and standard user prompts.
- **Variable Tokens**: Define input placeholders for rapid reuse.
- **One-Click Copy**: Fast copy-to-clipboard for quick insertion into AI chats.

---

## 4. Encyclopedia (Topic & Resource Directory)

An organized bookmarking system to map complex subjects into structured topic hierarchies.

- **Topic Collections**: Group related web links, documentation, and references under custom topic folders.
- **Direct Link Launching**: Open saved URLs directly in your system default browser via safe desktop IPC handlers.
- **Context & Notes**: Add notes and metadata to saved resource links.

---

## 5. Todo (Focused Task Manager)

A streamlined task manager designed for single-minded focus without unnecessary project management bloat.

- **Fast Task Composition**: Quick keyboard-driven task entry (`Ctrl + Shift + T`).
- **Interactive Checklists**: Check off tasks as you complete your study sessions or daily work goals.
- **Persistent Progress**: Automatically saves task states directly to the local SQLite database.

---

## 6. Offline SQLite Data Architecture & Backup System

- **Zero Cloud Dependence**: 100% offline data privacy. Your notes, prompts, and database stay strictly on your local computer.
- **One-Click Database Export**: Export a portable copy of your entire SQLite database (`.db` format) directly to your `Downloads` folder.
- **Automated Safety Backups**: Generate timestamped backups stored safely in local application storage.
- **Database Import & Restores**: Seamlessly import an existing Pied Piper database file with automatic pre-import safety backups and app state recovery.

---

## 7. Custom Feature Themes & UI Controls

- **Custom Color Palettes**: Personalize six-digit hex background colors for each section of the app (Dashboard, Notes, Helpbook, Encyclopedia, Todo, Settings).
- **Pixel-Art Aesthetic Accent**: Unique retro aesthetics with Space Grotesk typography, retro buttons, and custom design tokens.

---

## 8. Global Keyboard Shortcuts & Efficiency Controls

- `Ctrl + K`: Universal search bar to jump to any page or feature in the app.
- `Ctrl + N`: Instant item creation in the current active feature.
- `Ctrl + ,`: Open Settings page.
- `Ctrl + Shift + T`: Open Todo list.
- `Ctrl + 0`: Reset window zoom level to 100%.
- `Ctrl + Wheel` / `Ctrl + +/-`: Window zoom locking to prevent accidental UI scaling.
- `Alt + Left Arrow` / `Alt + Right Arrow`: Navigate backward or forward through page history.
- `Alt + Home`: Return to Dashboard instantly.
