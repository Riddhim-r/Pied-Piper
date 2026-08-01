import OrderedList from "@tiptap/extension-ordered-list";
import type { Editor } from "@tiptap/core";

export type OrderedListStyle = "decimal" | "upper-alpha" | "lower-roman";

export const OrderedListStyleExtension = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: "decimal",
        parseHTML: (element) =>
          element.getAttribute("data-list-style-type") ||
          (element as HTMLElement).style.listStyleType ||
          "decimal",
        renderHTML: (attributes) => ({
          "data-list-style-type": attributes.listStyleType,
          style: `list-style-type: ${attributes.listStyleType};`
        })
      }
    };
  }
});

export function applyOrderedListStyle(editor: Editor, listStyleType: OrderedListStyle) {
  editor.commands.focus();

  if (editor.isActive("orderedList", { listStyleType })) {
    return editor.commands.toggleOrderedList();
  }

  if (!editor.isActive("orderedList") && !editor.commands.toggleOrderedList()) {
    return false;
  }

  return editor.commands.updateAttributes("orderedList", { listStyleType });
}
