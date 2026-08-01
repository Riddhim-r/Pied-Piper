import { Copy } from "lucide-react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

function CodeBlockNodeView({ node, selected }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "plaintext";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(node.textContent);
  };

  return (
    <NodeViewWrapper className={`code-block-shell${selected ? " is-selected" : ""}`}>
      <div className="code-block-shell__bar" contentEditable={false}>
        <button
          type="button"
          className="code-block-shell__copy"
          onClick={handleCopy}
          title="Copy code"
          aria-label="Copy code"
        >
          <Copy size={16} strokeWidth={2.1} />
        </button>
      </div>
      <pre>
        <NodeViewContent as="code" className={`language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
}

export const CodeBlockWithTools = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  }
}).configure({
  lowlight,
  defaultLanguage: "plaintext"
});

