import { useCallback, useEffect, useMemo, useState } from "react";
import { List, Maximize2, Minimize2, Trash2, X } from "lucide-react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { EditorPane } from "../components/EditorPane";
import { OutlinePanel } from "../components/OutlinePanel";
import { ShortcutsView } from "../components/ShortcutsView";
import { Sidebar } from "../components/Sidebar";
import {
  createNotebook,
  discardEmptyNotebook,
  exportNotebookPdf,
  getNotebook,
  listNotebooks,
  listTags,
  permanentlyDeleteNotebook,
  saveNotebook,
  storeImage
} from "../services/notesService";
import type { EditorDraft, NotebookRecord, NotebookSummary, OutlineHeading } from "../types";
import "../notes.css";

const EMPTY_DOC = JSON.stringify({
  type: "doc",
  content: [{ type: "paragraph" }]
});

function AppShell() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [notesTheme, setNotesTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("notes_theme") as "light" | "dark") || "light";
  });
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentNotebook, setCurrentNotebook] = useState<NotebookRecord | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTag, setDraftTag] = useState("");
  const [draftContentJson, setDraftContentJson] = useState(EMPTY_DOC);
  const [draftPlainTextLength, setDraftPlainTextLength] = useState(0);
  const [outline, setOutline] = useState<OutlineHeading[]>([]);
  const [jumpToHeading, setJumpToHeading] = useState<(pos: number, key: string) => void>(
    () => () => undefined
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [autoOpenNotebook, setAutoOpenNotebook] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const toggleTheme = () => {
    setNotesTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      localStorage.setItem("notes_theme", next);
      return next;
    });
  };

  const isShortcutsPage = showShortcuts;
  const canShowNavigation = !isShortcutsPage && !isFocusMode && currentNotebook != null;
  const titleError = draftTitle.trim() ? null : "Title is required.";
  const isCurrentDraftBlank =
    currentNotebook != null &&
    !draftTitle.trim() &&
    !draftTag.trim() &&
    draftPlainTextLength === 0 &&
    draftContentJson === EMPTY_DOC;

  const refreshSidebarData = useCallback(async (options?: { autoOpen?: boolean }) => {
    const shouldAutoOpen = options?.autoOpen ?? autoOpenNotebook;
    const [loadedNotebooks, loadedTags] = await Promise.all([
      listNotebooks({
        search,
        tag: activeTag,
        includeTrashed: false
      }),
      listTags()
    ]);

    setNotebooks(loadedNotebooks);
    setTags(loadedTags);

    setSelectedId((current) => {
      if (loadedNotebooks.length === 0) {
        return null;
      }

      if (current && loadedNotebooks.some((item) => item.id === current)) {
        return current;
      }

      if (!shouldAutoOpen) {
        return null;
      }

      return loadedNotebooks[0].id;
    });
  }, [activeTag, autoOpenNotebook, search]);

  useEffect(() => {
    void refreshSidebarData();
  }, [refreshSidebarData]);

  useEffect(() => {
    if (selectedId == null) {
      setCurrentNotebook(null);
      setOutline([]);
      setJumpToHeading(() => () => undefined);
      setLastSavedAt(null);
      return;
    }

    void (async () => {
      const notebook = await getNotebook(selectedId);
      if (!notebook) {
        return;
      }

      setCurrentNotebook(notebook);
      setDraftTitle(notebook.title);
      setDraftTag(notebook.tag ?? "");
      setDraftContentJson(notebook.contentJson || EMPTY_DOC);
      setDraftPlainTextLength(notebook.plainTextLength);
      setLastSavedAt(notebook.updatedAt);
      setSaveMessage(null);
    })();
  }, [selectedId]);

  const isDirty = useMemo(() => {
    if (!currentNotebook) {
      return false;
    }

    return (
      currentNotebook.title !== draftTitle ||
      (currentNotebook.tag ?? "") !== draftTag ||
      currentNotebook.contentJson !== draftContentJson ||
      currentNotebook.plainTextLength !== draftPlainTextLength
    );
  }, [currentNotebook, draftTitle, draftTag, draftContentJson, draftPlainTextLength]);

  const persist = useCallback(async () => {
    if (!currentNotebook) {
      return false;
    }

    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) {
      setSaveMessage("Give the notebook a title before saving.");
      return false;
    }

    setIsSaving(true);
    try {
      const saved = await saveNotebook({
        id: currentNotebook.id,
        title: trimmedTitle,
        tag: draftTag.trim() || null,
        contentJson: draftContentJson,
        plainTextLength: draftPlainTextLength
      });

      setCurrentNotebook(saved);
      setDraftTitle(saved.title);
      setDraftTag(saved.tag ?? "");
      setDraftContentJson(saved.contentJson);
      setDraftPlainTextLength(saved.plainTextLength);
      setLastSavedAt(saved.updatedAt);
      setSaveMessage("Saved.");
      await refreshSidebarData();
      return true;
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not save notebook.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    currentNotebook,
    draftContentJson,
    draftPlainTextLength,
    draftTag,
    draftTitle,
    refreshSidebarData
  ]);

  const confirmNotebookTransition = useCallback(
    async (options?: { allowCloseWithoutSavingOnFailure?: boolean }) => {
      if (
        currentNotebook &&
        !draftTitle.trim() &&
        !draftTag.trim() &&
        draftPlainTextLength === 0 &&
        draftContentJson === EMPTY_DOC
      ) {
        const result = await discardEmptyNotebook(currentNotebook.id);
        if (result.discarded) {
          setNotebooks((current) =>
            current.filter((notebook) => notebook.id !== currentNotebook.id)
          );
          setSelectedId(null);
          setCurrentNotebook(null);
          setOutline([]);
          setLastSavedAt(null);
          setSaveMessage("Blank notebook discarded.");
        }
        return true;
      }

      if (!currentNotebook || (!isDirty && !isSaving)) {
        return true;
      }

    const shouldSave = window.confirm(
      `Save changes to "${draftTitle.trim() || currentNotebook.title}" before leaving this notebook?\n\nChoose OK to save, or Cancel to close without saving.`
    );

      if (!shouldSave) {
        setSaveMessage("Changes discarded.");
        return true;
      }

      const saved = await persist();
      if (saved) {
        return true;
      }

      if (!options?.allowCloseWithoutSavingOnFailure) {
        return false;
      }

      const shouldCloseWithoutSaving = window.confirm(
        `Could not save "${draftTitle.trim() || currentNotebook.title}".\n\nChoose OK to close without saving, or Cancel to stay in the notebook.`
      );

      if (shouldCloseWithoutSaving) {
        setSaveMessage("Notebook closed without saving.");
      }

      return shouldCloseWithoutSaving;
    },
    [
      currentNotebook,
      draftContentJson,
      draftPlainTextLength,
      draftTag,
      draftTitle,
      isDirty,
      isSaving,
      persist
    ]
  );

  useEffect(() => {
    if (!isDirty || !currentNotebook) {
      return;
    }

    setSaveMessage((current) =>
      current == null || current === "Saved." ? "Unsaved changes." : current
    );

    const timer = window.setTimeout(() => {
      void persist();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [isDirty, currentNotebook, draftTitle, draftTag, draftContentJson, draftPlainTextLength]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!currentNotebook || !isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentNotebook, isDirty]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persist();
        return;
      }

      if (event.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isFocusMode, persist]);

  useEffect(() => {
    if (!currentNotebook && isFocusMode) {
      setIsFocusMode(false);
    }
  }, [currentNotebook, isFocusMode]);

  useEffect(() => {
    if (!canShowNavigation && showNavigation) {
      setShowNavigation(false);
    }
  }, [canShowNavigation, showNavigation]);

  const handleCreateNotebook = async () => {
    if (!(await confirmNotebookTransition())) {
      return;
    }

    const notebook = await createNotebook("");
    setAutoOpenNotebook(true);
    setNotebooks((current) => [
      notebook,
      ...current.filter((item) => item.id !== notebook.id)
    ]);
    setSelectedId(notebook.id);
    setCurrentNotebook(notebook);
    setDraftTitle("");
    setDraftTag("");
    setDraftContentJson(EMPTY_DOC);
    setDraftPlainTextLength(0);
    setOutline([]);
    setLastSavedAt(notebook.updatedAt);
    setSaveMessage("Created a fresh notebook.");
    setShowShortcuts(false);
    navigate("/notes");
  };

  const clearCurrentNotebook = () => {
    setSelectedId(null);
    setAutoOpenNotebook(false);
    setCurrentNotebook(null);
    setOutline([]);
    setJumpToHeading(() => () => undefined);
    setLastSavedAt(null);
    setShowShortcuts(false);
    navigate("/notes");
  };

  const handleCloseNotebook = async () => {
    if (isCurrentDraftBlank) {
      if (await confirmNotebookTransition({ allowCloseWithoutSavingOnFailure: true })) {
        clearCurrentNotebook();
      }
      return;
    }

    if (!draftTag.trim()) {
      setSaveMessage("Select or create a tag before closing this notebook.");
      return;
    }

    if (!(await confirmNotebookTransition({ allowCloseWithoutSavingOnFailure: true }))) {
      return;
    }

    clearCurrentNotebook();
    setSaveMessage((current) => current ?? "Notebook closed.");
  };

  const handleDraftChange = (draft: EditorDraft) => {
    setDraftContentJson(draft.contentJson);
    setDraftPlainTextLength(draft.plainTextLength);
    setOutline(draft.outline);
    if (saveMessage === "Saved.") {
      setSaveMessage("Unsaved changes.");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Images must be 5 MB or smaller.");
    }

    const base64 = await file.arrayBuffer().then((buffer) => {
      let binary = "";
      const bytes = new Uint8Array(buffer);
      bytes.forEach((value) => {
        binary += String.fromCharCode(value);
      });
      return window.btoa(binary);
    });

    return storeImage(file.name, base64);
  };

  const handleExportPdf = async (contentHtml: string) => {
    if (!currentNotebook) {
      return;
    }

    setIsExporting(true);
    setSaveMessage(null);
    try {
      const result = await exportNotebookPdf(
        draftTitle.trim() || "Notebook",
        contentHtml
      );
      setSaveMessage(result.canceled ? "PDF export canceled." : "PDF exported.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Could not export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteNotebook = async () => {
    if (!currentNotebook) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${currentNotebook.title}"? This notebook will be removed.`
    );

    if (!confirmed) {
      return;
    }

    await permanentlyDeleteNotebook(currentNotebook.id);
    clearCurrentNotebook();
    setSaveMessage("Notebook deleted.");
    await refreshSidebarData({ autoOpen: false });
  };

  return (
    <div
      className={`notes-feature app-shell ${notesTheme === "dark" ? "is-dark" : "is-light"}${
        isFocusMode ? " is-focus-mode" : ""
      }${canShowNavigation && showNavigation ? " has-outline-panel" : ""}`}
    >
      <Sidebar
        notebooks={notebooks}
        selectedId={selectedId}
        search={search}
        onSearchChange={setSearch}
        activeTag={activeTag}
        tags={tags}
        theme={notesTheme}
        onToggleTheme={toggleTheme}
        onSelectNote={(id) => {
          void (async () => {
            if (id === selectedId) {
              return;
            }

            if (!(await confirmNotebookTransition())) {
              return;
            }

            setAutoOpenNotebook(true);
            setSelectedId(id);
            setShowShortcuts(false);
            navigate("/notes");
          })();
        }}
        onCloseCurrentNote={() => void handleCloseNotebook()}
        onCreateNote={() => void handleCreateNotebook()}
        onSetActiveTag={(tag) => {
          setActiveTag(tag);
        }}
        onShowShortcuts={() => {
          void (async () => {
            if (!(await confirmNotebookTransition())) {
              return;
            }

            setShowShortcuts(true);
            navigate("/notes");
          })();
        }}
      />

      <main className="workspace">
        <Routes>
          <Route
            path="*"
            element={
              isShortcutsPage ? (
                <ShortcutsView onClose={() => setShowShortcuts(false)} />
              ) : currentNotebook ? (
                <>
                  <div className="workspace__topbar">
                    <div>
                      <strong>Editor</strong>
                    </div>
                    <div className="workspace__actions">
                      <button
                        type="button"
                        className="icon-button workspace__action-button"
                        onClick={() => void handleCloseNotebook()}
                        aria-label="Close notebook"
                        data-tooltip="Close notebook"
                      >
                        <X size={18} strokeWidth={2.1} />
                      </button>
                      <button
                        type="button"
                        className="icon-button workspace__action-button"
                        onClick={() => setIsFocusMode((value) => !value)}
                        aria-label={isFocusMode ? "Exit focus mode" : "Focus mode"}
                        data-tooltip={isFocusMode ? "Exit focus mode" : "Focus mode"}
                      >
                        {isFocusMode ? (
                          <Minimize2 size={18} strokeWidth={2.1} />
                        ) : (
                          <Maximize2 size={18} strokeWidth={2.1} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="icon-button workspace__action-button"
                        onClick={() => setShowNavigation((value) => !value)}
                        aria-label={showNavigation ? "Hide navigation" : "Navigate"}
                        data-tooltip={showNavigation ? "Hide navigation" : "Navigate"}
                      >
                        <List size={18} strokeWidth={2.1} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger workspace__action-button"
                        onClick={() => void handleDeleteNotebook()}
                        aria-label="Delete notebook"
                        data-tooltip="Delete notebook"
                      >
                        <Trash2 size={18} strokeWidth={2.1} />
                      </button>
                    </div>
                  </div>

                  <EditorPane
                    key={currentNotebook.id}
                    notebook={currentNotebook}
                    title={draftTitle}
                    tag={draftTag}
                    availableTags={tags}
                    onTitleChange={setDraftTitle}
                    onTagChange={setDraftTag}
                    onDraftChange={handleDraftChange}
                    onUploadImage={handleImageUpload}
                    onSave={() => void persist()}
                    onExportPdf={(contentHtml) => void handleExportPdf(contentHtml)}
                    isSaving={isSaving}
                    isExporting={isExporting}
                    lastSavedAt={lastSavedAt}
                    titleError={titleError}
                    saveMessage={saveMessage}
                    onOutlineChange={(nextOutline, jump) => {
                      setOutline(nextOutline);
                      setJumpToHeading(() => jump);
                    }}
                  />
                </>
              ) : (
                <section className="workspace-empty">
                  <div className="workspace-empty__visual" aria-hidden="true">
                    <div className="workspace-empty__glow" />
                    <div className="workspace-empty__sheet workspace-empty__sheet--back" />
                    <div className="workspace-empty__sheet workspace-empty__sheet--mid" />
                    <div className="workspace-empty__sheet workspace-empty__sheet--front">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </section>
              )
            }
          />
        </Routes>
      </main>

      {canShowNavigation && showNavigation ? (
        <OutlinePanel
          headings={outline}
          onJump={jumpToHeading}
          onClose={() => setShowNavigation(false)}
        />
      ) : null}
    </div>
  );
}

export default function NotesPage() {
  return <AppShell />;
}
