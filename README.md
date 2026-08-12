# Pied Piper

[![Features & Keyboard Shortcuts](https://img.shields.io/badge/Documentation-Feature_Guide_%26_Shortcuts-blue?style=for-the-badge)](features.md)

Pied Piper is a private, single-user desktop workspace built to serve as a **lifelong personal knowledge vault and educational storage companion**. It organizes your study notes, solutions, AI prompt engineering workflows, subject topic collections, and task lists into one permanent, self-contained desktop system.

Whether you are capturing lecture notes, building technical wisdom during your career, storing academic research, or organizing AI prompts, Pied Piper stays locally on your computer—growing with you through school, college, career, and beyond.

The application combines six primary workspace modules:

- Notes for Noobs (Rich document editor with Smart Pasting, Light/Dark themes, and 1M character limit)
- Helpbook (Technical solution & wisdom library)
- AI Prompt Vault (Prompt engineering template library)
- Encyclopedia (Topic hierarchy & reference link directory)
- Todo (Focused task list)
- Settings (Custom themes, local database exports & backups)

Pied Piper is built with Electron, React, TypeScript, Vite, and SQLite. All application data is stored 100% locally. It requires no cloud accounts, no subscription fees, and no internet connection—ensuring your lifetime knowledge remains private, secure, and accessible forever.

## Table of Contents

1. [Purpose and design](#purpose-and-design)
2. [Feature guide](features.md)
3. [Login and application flow](#login-and-application-flow)
4. [Keyboard shortcuts](features.md#9-keyboard-shortcuts-reference)
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

Pied Piper is designed as your personal lifelong desktop workspace rather than a multi-user cloud service.

Its main goals are:

- **Lifelong Knowledge Preservation**: Keep all your educational, academic, and professional knowledge safely in one local SQLite database that travels with you throughout your lifetime.
- **Smart Pasting & Rich Editing**: Effortlessly paste text from slides, PDFs, and web pages without mid-sentence line breaks getting corrupted.
- **Complete Privacy & Offline Access**: Keep your personal information 100% offline without cloud telemetry or account lock-ins.
- **Focused Feature Modules**: Separate different kinds of knowledge (notes, solutions, prompt engineering, reference links, tasks) into clear, dedicated spaces.
- **Flexible UI Customization**: Enjoy built-in Light and Dark themes alongside custom hex color palettes for every module.
- **Seamless Database Control**: Make full-database exports, timestamped backups, and offline restores available directly from the Settings UI.

Each module owns its own UI and business rules. The React pages do not contain SQL. Database operations stay inside the Electron database layer and are exposed to the renderer through a limited preload bridge.

## Feature Guide

For detailed documentation, workflows, and module capabilities, see **[features.md](features.md)**.

### Summary of Modules

- **Notes for Noobs**: Rich document editor (TipTap engine) with Smart Pasting, light/dark themes, slash commands, outline navigation, focus mode, and PDF export.
- **Helpbook**: Technical solution and wisdom repository organized by ordered steps and tags.
- **AI Prompt Vault**: Structured template library for LLM system/user prompts.
- **Encyclopedia**: Topic hierarchy and reference link directory.
- **Todo**: Focused single-list task manager with strict completion rules.
- **Recycle Bin**: Centralized recovery index for soft-deleted items across features.
- **Settings**: Per-feature theme customization, application renaming, and local database backup/restore controls.

👉 For the full feature showcase, see **[features.md](features.md)**.

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

Pied Piper supports global application shortcuts and editor-specific shortcuts.

👉 For the full interactive table of shortcuts, see **[features.md#9-keyboard-shortcuts-reference](features.md#9-keyboard-shortcuts-reference)**.

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
├── features.md
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
