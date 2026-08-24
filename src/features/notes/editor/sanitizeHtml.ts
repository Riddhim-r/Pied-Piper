function sanitizeStyle(styleValue: string) {
  const allowedProperties = new Set([
    "background-color",
    "color",
    "font-size",
    "list-style-type",
    "text-decoration",
    "width"
  ]);

  return styleValue
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((rule) => {
      const [property, ...rest] = rule.split(":");
      return {
        property: property.trim().toLowerCase(),
        value: rest.join(":").trim()
      };
    })
    .filter((rule) => allowedProperties.has(rule.property) && rule.value)
    .map((rule) => `${rule.property}: ${rule.value}`)
    .join("; ");
}

export function sanitizePastedHtml(html: string) {
  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(html, "text/html");
  const allowedTags = new Set([
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "em",
    "h1",
    "h2",
    "h3",
    "hr",
    "i",
    "img",
    "li",
    "mark",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
    "div"
  ]);

  const blockTags = new Set([
    "p",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "pre",
    "hr",
    "div"
  ]);

  const cleanNode = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (["script", "style", "meta", "link", "title", "head", "iframe", "object"].includes(tag)) {
      element.remove();
      return;
    }

    Array.from(element.childNodes).forEach(cleanNode);

    if (tag === "div") {
      const hasBlockChildren = Array.from(element.children).some((child) =>
        blockTags.has(child.tagName.toLowerCase())
      );
      if (hasBlockChildren) {
        const fragment = documentFragment.createDocumentFragment();
        while (element.firstChild) {
          fragment.appendChild(element.firstChild);
        }
        element.replaceWith(fragment);
        return;
      }

      const paragraph = documentFragment.createElement("p");
      paragraph.innerHTML = element.innerHTML;
      element.replaceWith(paragraph);
      return;
    }

    if (!allowedTags.has(tag)) {
      const fragment = documentFragment.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "style") {
        const style = sanitizeStyle(attribute.value);
        if (style) {
          element.setAttribute("style", style);
        } else {
          element.removeAttribute("style");
        }
        return;
      }

      const allowedAttributes = new Set([
        "alt",
        "colspan",
        "href",
        "rowspan",
        "src",
        "target",
        "rel",
        "width",
        "height"
      ]);

      if (!allowedAttributes.has(name)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tag === "a") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  };

  Array.from(documentFragment.body.childNodes).forEach(cleanNode);
  return documentFragment.body.innerHTML;
}

export function unwrapSinglePastedParagraph(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  if (container.children.length === 1 && container.firstElementChild?.tagName === "P") {
    return container.firstElementChild.innerHTML;
  }
  return html;
}

export function plainTextToHtml(text: string) {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const cleanBlock = (block: string) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return "";
    }

    const isListBlock = lines.every((line) => /^([*+-\u2022]|\d+[.)])\s+/.test(line));

    if (isListBlock) {
      return lines.map(escapeHtml).join("<br />");
    }

    const joinedText = lines.join(" ").replace(/\s+/g, " ");
    return escapeHtml(joinedText);
  };

  return text
    .split(/(?:\r?\n){2,}/)
    .map(cleanBlock)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}
