import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { shouldCapitalizeSentence } from "../../../utils/textCase";

export const AutoCapitalizeExtension = Extension.create({
  name: "autoCapitalize",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("autoCapitalize"),
        props: {
          handleTextInput(view, from, to, text) {
            // Only process single lowercase alphabetic character inputs
            if (!text || text.length !== 1 || !/[a-z]/.test(text)) {
              return false;
            }

            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // Bypass auto-capitalization in code blocks or inline code marks
            const parentType = $from.parent.type.name;
            if (
              parentType === "codeBlock" ||
              Boolean(state.doc.type.schema.marks.code?.isInSet(state.storedMarks || $from.marks()))
            ) {
              return false;
            }

            const parentOffset = $from.parentOffset;
            const precedingText = $from.parent.textContent.slice(0, parentOffset);

            if (shouldCapitalizeSentence(precedingText, parentOffset)) {
              const capitalized = text.toUpperCase();
              const tr = state.tr.insertText(capitalized, from, to);
              view.dispatch(tr);
              return true;
            }

            return false;
          }
        }
      })
    ];
  }
});
