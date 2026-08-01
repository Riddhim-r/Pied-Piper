import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { OutlineHeading } from "../types";

type OutlinePanelProps = {
  headings: OutlineHeading[];
  onJump: (pos: number, key: string) => void;
  onClose?: () => void;
};

function OutlineBranch({
  heading,
  collapsedKeys,
  onToggle,
  onJump
}: {
  heading: OutlineHeading;
  collapsedKeys: Set<string>;
  onToggle: (key: string) => void;
  onJump: (pos: number, key: string) => void;
}) {
  const hasChildren = heading.children.length > 0;
  const isCollapsed = collapsedKeys.has(heading.key);

  return (
    <div className={`outline-node outline-node--level-${heading.level}`}>
      <div className="outline-node__row">
        {hasChildren ? (
          <button type="button" className="outline-node__toggle" onClick={() => onToggle(heading.key)}>
            {isCollapsed ? "+" : "-"}
          </button>
        ) : (
          <span className="outline-node__spacer" />
        )}
        <button
          type="button"
          className="outline-node__link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onJump(heading.pos, heading.key)}
        >
          <span className="outline-node__level">H{heading.level}</span>
          <span className="outline-node__text">{heading.text}</span>
        </button>
      </div>

      {hasChildren && !isCollapsed
        ? heading.children.map((child) => (
            <OutlineBranch
              key={child.key}
              heading={child}
              collapsedKeys={collapsedKeys}
              onToggle={onToggle}
              onJump={onJump}
            />
          ))
        : null}
    </div>
  );
}

export function OutlinePanel({ headings, onJump, onClose }: OutlinePanelProps) {
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  const hasHeadings = useMemo(() => headings.length > 0, [headings]);

  const toggle = (key: string) => {
    setCollapsedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <aside className="outline-panel">
      <div className="outline-panel__header">
        <div className="panel-title">Navigate</div>
        {onClose ? (
          <button
            type="button"
            className="icon-button workspace__action-button outline-panel__close"
            data-global-close
            onClick={onClose}
            aria-label="Close navigation"
            data-tooltip="Close navigation"
          >
            <X size={18} strokeWidth={2.1} />
          </button>
        ) : null}
      </div>
      {hasHeadings ? (
        headings.map((heading) => (
          <OutlineBranch
            key={heading.key}
            heading={heading}
            collapsedKeys={collapsedKeys}
            onToggle={toggle}
            onJump={onJump}
          />
        ))
      ) : (
        <p className="panel-empty">No headings yet.</p>
      )}
    </aside>
  );
}
