import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { invertCase } from "../../../utils/textCase";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggleCase: {
      toggleCase: () => ReturnType;
    };
  }
}

export const ToggleCaseExtension = Extension.create({
  name: "toggleCase",

  addCommands() {
    return {
      toggleCase:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          if (selection.empty) return false;

          const { from, to } = selection;
          const ranges: Array<{ from: number; to: number; text: string }> = [];

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText && node.text) {
              const nodeFrom = Math.max(from, pos);
              const nodeTo = Math.min(to, pos + node.nodeSize);
              const relativeFrom = nodeFrom - pos;
              const relativeTo = nodeTo - pos;

              const originalSlice = node.text.slice(relativeFrom, relativeTo);
              const inverted = invertCase(originalSlice);

              if (inverted !== originalSlice) {
                ranges.push({ from: nodeFrom, to: nodeTo, text: inverted });
              }
            }
          });

          if (ranges.length > 0) {
            // Apply replacements in reverse order so character positions remain accurate
            ranges.reverse().forEach(({ from: rFrom, to: rTo, text: rText }) => {
              tr.insertText(rText, rFrom, rTo);
            });

            if (dispatch) {
              const $from = tr.doc.resolve(from);
              const $to = tr.doc.resolve(to);
              tr.setSelection(TextSelection.between($from, $to));
              dispatch(tr);
            }
            return true;
          }

          return false;
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      "Alt-Shift-u": () => this.editor.commands.toggleCase(),
      "Alt-Shift-U": () => this.editor.commands.toggleCase(),
      "Shift-F3": () => this.editor.commands.toggleCase()
    };
  }
});
