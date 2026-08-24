import { useMemo, useState } from "react";
import type { EditorDraft, NotebookRecord } from "../types";

const EMPTY_DOC = JSON.stringify({
  type: "doc",
  content: [{ type: "paragraph" }]
});

export function useNoteDraft(currentNotebook: NotebookRecord | null) {
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTag, setDraftTag] = useState("");
  const [draftContentJson, setDraftContentJson] = useState(EMPTY_DOC);
  const [draftPlainTextLength, setDraftPlainTextLength] = useState(0);

  const resetDraft = (notebook: NotebookRecord | null) => {
    if (!notebook) {
      setDraftTitle("");
      setDraftTag("");
      setDraftContentJson(EMPTY_DOC);
      setDraftPlainTextLength(0);
      return;
    }
    setDraftTitle(notebook.title);
    setDraftTag(notebook.tag ?? "");
    setDraftContentJson(notebook.contentJson || EMPTY_DOC);
    setDraftPlainTextLength(notebook.plainTextLength);
  };

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

  const isCurrentDraftBlank =
    currentNotebook != null &&
    !draftTitle.trim() &&
    !draftTag.trim() &&
    draftPlainTextLength === 0 &&
    draftContentJson === EMPTY_DOC;

  const handleDraftChange = (draft: EditorDraft) => {
    setDraftContentJson(draft.contentJson);
    setDraftPlainTextLength(draft.plainTextLength);
  };

  return {
    draftTitle,
    setDraftTitle,
    draftTag,
    setDraftTag,
    draftContentJson,
    setDraftContentJson,
    draftPlainTextLength,
    setDraftPlainTextLength,
    resetDraft,
    isDirty,
    isCurrentDraftBlank,
    handleDraftChange,
    EMPTY_DOC,
  };
}
