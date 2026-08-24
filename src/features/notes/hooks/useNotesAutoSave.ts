import { useEffect } from "react";
import type { NotebookRecord } from "../types";

export function useNotesAutoSave(
  isDirty: boolean,
  currentNotebook: NotebookRecord | null,
  persist: () => Promise<boolean>,
  setSaveMessage: React.Dispatch<React.SetStateAction<string | null>>
) {
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
  }, [isDirty, currentNotebook, persist, setSaveMessage]);
}
