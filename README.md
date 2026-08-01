# Pied Piper

Pied Piper is a private, single-user desktop workspace for personal knowledge, reusable solutions, AI prompts, notes, useful links, and focused task management.

The application combines seven independent tools:

- Helpbook
- AI Prompt Vault
- Notes for Noobs
- Encyclopedia
- Todo
- Recycle Bin
- Settings

Pied Piper is built with Electron, React, TypeScript, Vite, and SQLite. All application data is stored locally. It does not require Supabase, a cloud account, or an internet connection for normal data management.

## Table of Contents

1. [Purpose and design](#purpose-and-design)
2. [Feature guide](#feature-guide)
3. [Login and application flow](#login-and-application-flow)
4. [Keyboard shortcuts](#keyboard-shortcuts)
5. [Database and local storage](#database-and-local-storage)
6. [Export, backup, and import](#export-backup-and-import)
7. [Installation and development](#installation-and-development)
8. [Testing](#testing)
9. [Windows packaging](#windows-packaging)
10. [Project architecture](#project-architecture)
11. [Database structure](#database-structure)
12. [Troubleshooting](#troubleshooting)
13. [Frequently asked questions](#frequently-asked-questions)
14. [Current limitations](#current-limitations)

## Purpose and Design

Pied Piper is designed as one personal desktop application rather than a multi-user platform.

Its main goals are:

- Keep personal information in one local SQLite database.
- Separate different kinds of information into focused modules.
- Make commonly used knowledge easy to find and reuse.
- Avoid unnecessary accounts, roles, permissions, and cloud dependencies.
- Use simple workflows with clear rules.
- Protect deleted knowledge through a shared Recycle Bin.
- Make database export, backup, and recovery available from the UI.

Each module owns its own UI and business rules. The React pages do not contain SQL. Database operations stay inside the Electron database layer and are exposed to the renderer through a limited preload bridge.

## Feature Guide

### Dashboard

The Dashboard is the main application home. It provides direct access to every module.

The cards open:

- Helpbook
- AI Prompt Vault
- Notes for Noobs
- Encyclopedia
- Todo
- Recycle Bin
- Settings

The application name shown in the header is configurable in Settings. Clicking the heart mark or application name from a standard feature returns to the Dashboard.

### Helpbook

Helpbook stores reusable, step-by-step solutions.

Each entry contains:

- A title describing the problem.
- One tag or domain.
- One or more ordered solution steps.

Available operations:

- Create an entry.
- Select an existing tag or create a new tag.
- Filter entries by tag.
- Edit the title, tag, and individual steps.
- Delete an entry.

Deleted Helpbook entries move to the Recycle Bin. They are not immediately removed from SQLite.

If there are no entries, Helpbook displays an empty-state card explaining how to add the first solution. If a tag filter has no matches, it displays a separate filtered-empty message.

### AI Prompt Vault

AI Prompt Vault stores reusable prompts.

Each prompt contains:

- A title.
- One tag.
- One or more prompt lines.

Available operations:

- Create a prompt.
- Select or create a tag.
- Filter prompts by tag.
- Edit a prompt.
- Delete a prompt.

Deleted prompts move to the Recycle Bin. Empty and filtered-empty states are displayed when appropriate.

The internal route remains `/ai-prompts`, but all user-facing labels use **AI Prompt Vault**.

### Notes for Noobs

Notes for Noobs is the rich notebook editor inside Pied Piper.

#### Notebook management

You can:

- Create notebooks.
- Search notebooks by title.
- assign one tag to a notebook.
- Filter notebooks by tag.
- Rename tags.
- Close the current notebook.
- Soft-delete notebooks.
- Restore or permanently delete them from the shared Recycle Bin.

A newly created notebook starts with a completely blank title and canvas. If it remains unnamed, untagged, and empty when you switch away, it is discarded permanently instead of creating an empty Recycle Bin item.

Tags are case-insensitive. The tag picker:

- Shows existing matching tags.
- Allows a new tag when no case-insensitive duplicate exists.
- Prevents duplicate forms such as `Work`, `work`, and `WORK`.

#### Rich editor

The editor supports:

- Paragraphs
- Heading 1, Heading 2, and Heading 3
- Bold
- Italic
- Underline
- Strikethrough
- Subscript
- Superscript
- Text color
- Highlight color
- Selectable text sizes
- Bullet lists
- Numbered lists
- Lettered lists
- Roman-numbered lists
- Task lists
- Code blocks
- Tables
- Links
- Images
- Undo and redo
- Slash commands
- Document outline navigation
- Focus mode
- Character counting

Numbering formats are:

- Numbered lists: `1, 2, 3`
- Lettered lists: `A, B, C`
- Roman lists: `i, ii, iii`

Task-list checkboxes and their text are kept on the same line.

#### Saving

Notebook changes autosave after a short delay. `Ctrl + S` can save immediately.

The database limits notebook plain text to 10,000 characters. Content is stored as structured TipTap JSON.

#### Images

Images are supported only in Notes for Noobs.

Accepted formats:

- PNG
- JPEG
- GIF
- WebP

The maximum image size is 5 MB. Images are stored as data URLs with the notebook content, so they remain included in database exports and backups.

#### PDF export

The currently open notebook can be exported as a PDF:

1. Open the notebook.
2. Choose **Export PDF**.
3. Select a destination.
4. Save the generated A4 PDF.

The exported PDF includes the notebook title, formatted content, images, tables, code blocks, and task lists.

#### Clear formatting

Clear formatting removes inline styling from selected text, including:

- Bold
- Italic
- Underline
- Colors
- Highlights
- Links
- Text sizing

It does not delete text or remove structural blocks such as headings and lists.

### Encyclopedia

Encyclopedia is a topic-based collection of useful links. It replaces all former course-creation concepts.

Each topic contains:

- A title.
- An optional description.
- Any number of links.

Each link contains:

- A label.
- A URL.

You can:

- Create topics.
- Edit topics.
- Delete topics.
- Open a topic.
- Add links.
- Edit links.
- Remove links.
- Open HTTP and HTTPS links in the default browser.

Deleting a topic moves the topic and its links to the Recycle Bin. Restoring the topic restores its link collection.

Removing an individual link deletes that link permanently from its topic.

### Todo

Todo intentionally supports exactly one active list.

Workflow:

1. Enter a list name.
2. Create the list.
3. Add tasks.
4. Check tasks as they are completed.
5. Completed tasks automatically move below unfinished tasks.
6. Complete every task.
7. Delete the completed list.
8. Create a new list.

Rules:

- A second list cannot be created while the current list exists.
- The list cannot be deleted until it contains at least one task and every task is complete.
- A completed task can be unchecked.
- Deleting the finished list permanently removes the list and its tasks.

Todo is intentionally not part of the shared Recycle Bin.

### Recycle Bin

The Recycle Bin contains four categories:

- Helpbook
- AI Prompt Vault
- Notes for Noobs
- Encyclopedia

The category screen displays the number of deleted items in each category.

Inside a category, you can:

- Select one item.
- Select multiple items.
- Select all items.
- Restore selected items.
- Permanently delete selected items.

Permanent deletion requires confirmation and cannot be undone.

The Recycle Bin is an index of soft-deleted records. The original content remains in its feature table until it is permanently deleted.

### Settings

Settings contains only application-wide preferences and database controls.

#### Application

- **Application Name:** Changes the name rendered in the application and window title.
- **Database Location:** Displays the active SQLite file.
- **Storage Used:** Displays the current SQLite file size.

#### Feature themes

Each feature can have its own six-digit hex background color:

- Dashboard
- Helpbook
- AI Prompt Vault
- Notes for Noobs
- Encyclopedia
- Todo
- Recycle Bin
- Settings

Use either the color picker or a value such as `#efc8d5`. Changes apply after **Save Settings**.

#### Database actions

- Export Database
- Import Database
- Create Backup

See [Export, backup, and import](#export-backup-and-import) before using Import.

#### Keyboard shortcuts

Settings contains the application-wide shortcut reference. Notes-specific commands stay inside the Notes for Noobs shortcut panel.

## Login and Application Flow

Pied Piper keeps one local Bread-winner login.

Default password:

```text
admin123
```

The login is a local convenience barrier, not production-grade authentication. The authenticated state is stored in browser local storage.

There is no:

- Bread-eater account
- Role selection
- Admin/user split
- Permission system
- Cloud authentication

The desktop window opens maximized by default.

## Keyboard Shortcuts

### Application-wide shortcuts

| Shortcut | Action |
|---|---|
| `Alt + Left Arrow` | Move to the previous page |
| `Alt + Right Arrow` | Move to the next page |
| `Alt + Home` | Open Dashboard |
| `Ctrl + K` | Open the page search |
| `Ctrl + ,` | Open Settings |
| `Ctrl + N` | Create or focus a new item in the current feature |
| `Ctrl + Shift + T` | Open Todo |
| `Ctrl + Shift + Delete` | Open Recycle Bin |
| `Escape` | Close the active search, form, menu, panel, or dialog |

`Ctrl + N` uses the current feature’s existing creation flow. It creates a notebook in Notes, opens entry creation in Helpbook and AI Prompt Vault, opens topic/link creation in Encyclopedia, and focuses the appropriate Todo input.

`Ctrl + K` searches application pages rather than the contents of every saved record.

### Notes for Noobs shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + S` | Save immediately |
| `Ctrl + Alt + 1` | Heading 1 |
| `Ctrl + Alt + 2` | Heading 2 |
| `Ctrl + Alt + 3` | Heading 3 |
| `Ctrl + Click` | Open a link |
| `/` | Open slash commands at the start of a line |
| `/ roman` | Insert a Roman-numbered list |
| `Tab` | Nest a list item |
| `Shift + Tab` | Move a list item one level out |
| `Enter` | Continue a list |
| `Backspace` | Exit an empty list item |

## Database and Local Storage

Pied Piper uses one SQLite database through `better-sqlite3`.

Default Windows path:

```text
%APPDATA%\Pied Piper\pied-piper.db
```

For example:

```text
C:\Users\USERNAME\AppData\Roaming\Pied Piper\pied-piper.db
```

The exact active path is always visible in Settings.

### Legacy data migration

On first launch, if the Pied Piper database does not exist, the application looks for:

```text
%APPDATA%\coursebook\coursebook.db
```

If found, it copies that database to the new Pied Piper location and applies the current schema migrations.

The legacy file is not deleted. This protects existing data during the identity transition.

The default stored application name `Coursebook` is migrated to `Pied Piper`. Any genuinely customized application name is preserved.

### Data ownership

- All saved knowledge is local.
- No application data is sent to an external server.
- Opening saved web links uses the operating system’s default browser.
- Google Fonts may be requested by the UI when an internet connection is available.

## Export, Backup, and Import

### Export Database

Export creates a consistent SQLite copy at a user-selected destination.

Use it when:

- Moving data to another computer.
- Creating a named archive.
- Preparing a database for later import.

The default filename follows:

```text
pied-piper-database-YYYY-MM-DD.db
```

Export cannot overwrite the active database file.

### Create Backup

Create Backup automatically writes a timestamped copy to:

```text
%APPDATA%\Pied Piper\backups
```

Backup names follow:

```text
pied-piper-backup-YYYY-MM-DD_HH-mm-ss.db
```

If two backups receive the same timestamp, a numeric suffix is added rather than overwriting the earlier file.

### Import Database

Import replaces the current application database.

Safety sequence:

1. Select a `.db`, `.sqlite`, or `.sqlite3` file.
2. Pied Piper confirms that it is readable SQLite.
3. Pied Piper checks that it contains a recognized application table.
4. The selected file receives current schema migrations in a staged copy.
5. The current database is backed up automatically.
6. The staged database replaces the active file with rollback protection.
7. Pied Piper restarts.

Corrupt and unrelated SQLite files are rejected.

Import can change:

- Helpbook entries
- AI Prompt Vault entries
- Notebooks
- Encyclopedia topics and links
- Todo state
- Recycle Bin contents
- Application name
- Theme preferences

Always close unfinished forms and allow Notes to finish saving before importing.

## Installation and Development

### Prerequisites

- Windows 10 or Windows 11
- Node.js 20 or newer
- npm

The project is currently configured specifically for Windows desktop development.

### Install dependencies

Open PowerShell in the final application folder:

```powershell
cd "C:\path\to\Pied Piper"
npm install
```

### Start the complete desktop application

```powershell
npm run dev:desktop
```

This starts:

- Vite renderer at `http://127.0.0.1:5180`
- Electron after port `5180` is ready

Use this command for feature testing. Running only `npm run dev` starts the renderer without Electron, so SQLite and desktop dialogs are unavailable.

### Start only the renderer

```powershell
npm run dev
```

This is useful for visual work that does not require SQLite.

### Production web bundle

```powershell
npm run build
```

This performs TypeScript checking and creates the renderer bundle in `dist`.

### Preview the production renderer

```powershell
npm run preview
```

Desktop database APIs are unavailable in a normal browser preview.

### Rebuild SQLite for Electron

If a native-module version mismatch occurs:

```powershell
npm run rebuild:sqlite
```

## Testing

### Complete recommended verification

```powershell
npm run build
npm run test:encyclopedia
npm run test:todo
npm run test:notes
npm run test:recycle-bin
npm run test:settings
npm run test:database-files
npm run verify:data
```

### Test scripts

| Command | Coverage |
|---|---|
| `npm run build` | TypeScript and production renderer build |
| `npm run test:encyclopedia` | Topic/link creation, validation, deletion, and restoration |
| `npm run test:todo` | Single-list rules, ordering, completion, and deletion |
| `npm run test:notes` | Notebook creation, tags, saving, soft deletion, and restoration |
| `npm run test:recycle-bin` | Cross-category counts, restore, and permanent deletion |
| `npm run test:settings` | Defaults, persistence, name migration, and hex validation |
| `npm run test:database-files` | Export, backup, import validation, rollback, and legacy copying |
| `npm run verify:data` | Read-only summary of the local database |

Database tests use temporary SQLite files. They do not replace the active user database.

`verify:data` is read-only. You can inspect a different file with:

```powershell
npm run verify:data -- --db-path "C:\path\to\database.db"
```

## Windows Packaging

Build the NSIS installer with:

```powershell
npm run build:desktop
```

Expected output includes:

```text
dist\win-unpacked\Pied Piper.exe
dist\Pied Piper Setup 0.0.0.exe
```

The app identity is:

- Product name: `Pied Piper`
- App ID: `com.piedpiper.desktop`
- Windows icon: `build\icon.ico`
- Browser icon: `public\heart.svg`

Regenerate the Windows heart icon with:

```powershell
.\scripts\create-heart-icon.ps1
```

### Windows symlink requirement

Electron Builder may fail while extracting `winCodeSign` with:

```text
A required privilege is not held by the client
Cannot create symbolic link
```

This is a Windows environment restriction. Enable Windows Developer Mode or run the packaging terminal with Administrator privileges, clear the failed Electron Builder cache if necessary, and run `npm run build:desktop` again.

If `dist` is locked, close all Pied Piper/Electron processes before rebuilding.

## Project Architecture

```text
Pied Piper/
├── build/
│   └── icon.ico
├── electron/
│   ├── database/
│   │   ├── database-files.cjs
│   │   ├── encyclopedia.cjs
│   │   ├── knowledge-entries.cjs
│   │   ├── notes.cjs
│   │   ├── recycle-bin.cjs
│   │   ├── settings.cjs
│   │   └── todo.cjs
│   ├── db.cjs
│   ├── ipc.cjs
│   ├── main.cjs
│   └── preload.cjs
├── public/
│   ├── heart.svg
│   └── login-hero.jpg
├── scripts/
│   ├── create-heart-icon.ps1
│   ├── test-database-files.cjs
│   ├── test-encyclopedia.cjs
│   ├── test-notes.cjs
│   ├── test-recycle-bin.cjs
│   ├── test-settings.cjs
│   ├── test-todo.cjs
│   └── verify-local-db.cjs
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── ai-prompts/
│   │   ├── dashboard/
│   │   ├── encyclopedia/
│   │   ├── helpbook/
│   │   ├── notes/
│   │   ├── recycle-bin/
│   │   ├── settings/
│   │   └── todo/
│   ├── lib/
│   ├── pages/
│   ├── styles/
│   └── types/
├── index.html
├── package.json
└── README.md
```

### Electron main process

`electron/main.cjs`:

- Starts Electron.
- Creates a maximized window.
- Loads Vite during development.
- Loads `dist/index.html` in production.

### Preload bridge

`electron/preload.cjs` exposes a limited `window.piedPiper` API through Electron context isolation.

### IPC layer

`electron/ipc.cjs`:

- Receives renderer requests.
- Calls database functions.
- Opens native dialogs.
- Opens external links.
- Generates PDFs.
- Coordinates database import and restart.

### Renderer

The React application:

- Displays feature pages.
- Manages UI state.
- Calls the typed desktop API.
- Does not execute SQL.

## Database Structure

### `helpbook_entries`

Stores Helpbook titles, tags, ordered steps, timestamps, and soft-deletion state.

### `ai_prompt_entries`

Stores AI Prompt Vault titles, tags, lines, timestamps, and soft-deletion state.

### `notebooks`

Stores:

- Title
- Tag
- TipTap content JSON
- Plain-text length
- Creation/update timestamps
- Soft-deletion timestamp

### `encyclopedia_topics`

Stores topic titles, descriptions, timestamps, and soft-deletion state.

### `encyclopedia_topic_links`

Stores link labels, URLs, ordering, and the parent topic relationship.

### `todo_lists`

Uses the fixed primary key `1` to enforce one active list.

### `todo_tasks`

Stores task titles, completion state, ordering, and completion timestamp.

### `recycle_bin_items`

Indexes soft-deleted Helpbook entries, AI Prompt Vault entries, notebooks, and Encyclopedia topics.

### `app_settings`

Stores application-wide key/value settings:

- Application name
- Per-feature theme colors

Database location and storage size are calculated from the active SQLite file rather than stored as stale values.

## Troubleshooting

### `npm ERR! ENOENT ... package.json`

Cause: npm was run from the parent folder.

Fix:

```powershell
cd "Pied Piper"
npm run dev:desktop
```

### `listen EACCES: permission denied ::1:5173`

Pied Piper is configured for:

```text
127.0.0.1:5180
```

Use the current scripts and `vite.config.ts`. Do not use an older Coursebook command or configuration.

### `EPERM ... node_modules\.vite\deps`

Cause: a previous Vite/Electron process still holds the dependency cache.

Fix:

1. Close Pied Piper, Electron, and Vite processes.
2. Remove the generated `node_modules\.vite` cache.
3. Run `npm run dev:desktop`.

Do not delete the entire source folder or database.

### Desktop API unavailable

Cause: the renderer was opened in a browser with `npm run dev`.

Fix:

```powershell
npm run dev:desktop
```

### API is out of date

Cause: Electron or its preload script was not restarted after source changes.

Fix: completely close the desktop process and run `npm run dev:desktop` again.

### Native module version mismatch

Symptoms may mention `better-sqlite3`, `NODE_MODULE_VERSION`, or an ABI mismatch.

Fix:

```powershell
npm run rebuild:sqlite
```

### Database import is rejected

The selected file must:

- Be readable SQLite.
- Contain a recognized Pied Piper table.
- Pass SQLite integrity checking.
- Be different from the active database path.

### PDF export does nothing

Check whether the native Save dialog is behind the main window. Confirm that the notebook is open and restart Electron if the preload API was recently changed.

### Existing data appears missing after rename

Check Settings for the database path. The expected path is:

```text
%APPDATA%\Pied Piper\pied-piper.db
```

The legacy database should still exist at:

```text
%APPDATA%\coursebook\coursebook.db
```

If necessary, use Settings → Import Database and select a valid export or backup.

## Frequently Asked Questions

### Is Pied Piper a web application?

The UI uses React, but the complete product is an Electron desktop application. Browser-only mode cannot access SQLite or native dialogs.

### Does Pied Piper require internet access?

No for normal local data management. Internet access is needed when opening external links and may be used to load Google Fonts.

### Where is my data?

Open Settings and read **Database Location**. The Windows default is `%APPDATA%\Pied Piper\pied-piper.db`.

### Is my data encrypted?

No. SQLite and exported databases are not encrypted. Protect your Windows account, backups, and exported files.

### Does the login encrypt or protect the database?

No. The local Bread-winner password controls UI entry only. It is not file encryption or secure multi-user authentication.

### Can I create multiple Todo lists?

No. Todo intentionally allows one list. Complete every task and delete the completed list before creating another.

### Why can’t I delete my Todo list?

The list must contain at least one task, and every task must be checked.

### Where did my completed task go?

Completed tasks automatically move beneath unfinished tasks. They remain in the same list.

### Can Todo items be restored from Recycle Bin?

No. The shared Recycle Bin covers Helpbook, AI Prompt Vault, Notes for Noobs, and Encyclopedia.

### What happens when I delete an Encyclopedia topic?

The topic and its links move together into the Recycle Bin. Restoring the topic restores the links.

### What happens when I remove one Encyclopedia link?

The individual link is permanently removed. It does not receive its own Recycle Bin entry.

### Why did a blank notebook disappear?

Pied Piper permanently discards a new notebook when it has no name, no tag, and no content and you switch away. This prevents meaningless empty records.

### Are notebook tags case-sensitive?

No. Tags are normalized case-insensitively to prevent duplicates.

### Can Notes export to PDF?

Yes. Open a notebook and use **Export PDF**.

### Are notebook images included in database backups?

Yes. Images are stored inside notebook content as data URLs.

### What does Clear Formatting remove?

It removes inline styles such as bold, italic, underline, colors, highlights, links, and text size. It keeps the text and block structure.

### What does `Ctrl + K` search?

It searches and opens application pages. It does not currently search all saved content.

### What is the difference between Export and Backup?

Export asks you where to save a portable copy. Backup automatically creates a timestamped file in Pied Piper’s AppData backup directory.

### Does Import merge databases?

No. Import replaces the active database after creating a safety backup.

### Can I change the application name?

Yes. Change **Application Name** in Settings. Pied Piper remains the installed product and folder name, while the rendered workspace name can be personalized.

### Can I change each page color?

Yes. Enter a valid six-digit hex color for each feature in Settings.

### Why does the app reopen at the login page after database import?

Import restarts Electron to safely reopen the replaced SQLite file. The local login session may need to be entered again.

### How do I recover from a bad import?

Open `%APPDATA%\Pied Piper\backups`, locate the safety backup created immediately before the import, and import that file.

### Can I safely copy the SQLite file while Pied Piper is open?

Use Export or Create Backup instead. They use SQLite’s live backup mechanism and produce a consistent file.

### How do I report the database contents without changing them?

Run:

```powershell
npm run verify:data
```

## Current Limitations

- Windows is the configured desktop target.
- The login is local and not production-grade security.
- Database files are not encrypted.
- There is no cloud synchronization.
- Global search currently searches pages, not all saved records.
- Todo does not use the shared Recycle Bin.
- Individual Encyclopedia links are permanently deleted.
- The renderer bundle is currently large because the rich editor and its extensions are included together.
- Windows installer packaging may require Developer Mode or Administrator symlink privileges.

## License

No license file is currently included. Add an appropriate license before public distribution.
