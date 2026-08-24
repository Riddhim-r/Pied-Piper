import type { Editor } from "@tiptap/react";
import type { OutlineHeading } from "../types";

export function buildOutlineTree(headings: Array<Omit<OutlineHeading, "children">>): OutlineHeading[] {
  const root: OutlineHeading[] = [];
  const stack: OutlineHeading[] = [];

  headings.forEach((heading) => {
    const item: OutlineHeading = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  });

  return root;
}

export function extractOutline(editor: Editor): OutlineHeading[] {
  const flat: Array<Omit<OutlineHeading, "children">> = [];
  let index = 0;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading" && typeof node.attrs.level === "number" && node.attrs.level <= 3) {
      flat.push({
        key: `heading-${index}`,
        text: node.textContent || `Heading ${index + 1}`,
        level: node.attrs.level,
        pos
      });
      index += 1;
    }

    return true;
  });

  return buildOutlineTree(flat);
}

export function annotateHeadingNodes(editor: Editor) {
  const headings = Array.from(editor.view.dom.querySelectorAll("h1, h2, h3"));
  headings.forEach((heading, index) => {
    heading.setAttribute("data-outline-key", `heading-${index}`);
  });
}

export function jumpToOutlineHeading(editor: Editor, key: string, pos: number) {
  const headingFromPos = editor.view.nodeDOM(pos);
  const heading =
    (headingFromPos instanceof HTMLElement ? headingFromPos : null) ??
    editor.view.dom.querySelector<HTMLElement>(`[data-outline-key="${key}"]`);

  if (!heading) {
    return;
  }

  heading.classList.remove("is-outline-target");
  heading.scrollIntoView({ behavior: "smooth", block: "center" });
  heading.classList.add("is-outline-target");
  window.setTimeout(() => {
    heading.classList.remove("is-outline-target");
  }, 1400);
}
