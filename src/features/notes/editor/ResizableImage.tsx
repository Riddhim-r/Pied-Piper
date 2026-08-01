import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import { resolveImageSource } from "../services/notesService";

function clampWidth(value: number) {
  return Math.min(100, Math.max(20, value));
}

function fileLabel(src: string, alt?: string | null) {
  if (alt?.trim()) {
    return alt.trim();
  }

  const parts = src.split(/[\\/]/);
  return parts[parts.length - 1] || "Embedded image";
}

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const [isMissing, setIsMissing] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState("");
  const src = String(node.attrs.src ?? "");
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const widthPercent = clampWidth(Number(node.attrs.widthPercent ?? 100));
  const label = useMemo(() => fileLabel(src, alt), [alt, src]);

  useEffect(() => {
    let isActive = true;
    setIsMissing(false);
    setResolvedSrc(src);

    void resolveImageSource(src)
      .then((nextSrc) => {
        if (isActive) {
          setResolvedSrc(nextSrc);
        }
      })
      .catch(() => {
        if (isActive) {
          setResolvedSrc(src);
        }
      });

    return () => {
      isActive = false;
    };
  }, [src]);

  return (
    <NodeViewWrapper
      as="figure"
      className={`embedded-image-shell${selected ? " is-selected" : ""}`}
      contentEditable={false}
    >
      {isMissing ? (
        <div className="embedded-image__placeholder">
          <strong>Image unavailable</strong>
          <span>{label}</span>
        </div>
      ) : (
        <img
          className="embedded-image"
          src={resolvedSrc || src}
          alt={alt}
          style={{ width: `${widthPercent}%` }}
          onLoad={() => setIsMissing(false)}
          onError={() => setIsMissing(true)}
        />
      )}

      {selected ? (
        <div className="embedded-image__controls">
          <span>Size</span>
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={widthPercent}
            onChange={(event) =>
              updateAttributes({ widthPercent: clampWidth(Number(event.target.value)) })
            }
          />
          <button type="button" onClick={() => updateAttributes({ widthPercent: 100 })}>
            Reset
          </button>
          <span>{widthPercent}%</span>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      widthPercent: {
        default: 100,
        parseHTML: (element) => Number(element.getAttribute("data-width-percent") ?? 100),
        renderHTML: (attributes) => ({
          "data-width-percent": clampWidth(Number(attributes.widthPercent ?? 100)),
          style: `width: ${clampWidth(Number(attributes.widthPercent ?? 100))}%;`
        })
      }
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  }
}).configure({
  inline: false,
  allowBase64: true,
  HTMLAttributes: {
    class: "embedded-image"
  }
});
