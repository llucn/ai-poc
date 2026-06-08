import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';

type Props = {
  content: string | null;
  /** Whether this thought should be expanded. Controlled externally. */
  defaultExpanded?: boolean;
};

/**
 * Collapsible "Thought" entry in the chat timeline.
 *
 * Starts expanded by default (when new), then auto-collapses when a subsequent
 * message arrives. User can manually toggle expansion at any time.
 */
export function ThoughtMessage({ content, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggle = () => setExpanded((prev) => !prev);

  // Sync with external expansion state when it changes
  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div className="chat-thought">
      <button
        type="button"
        className="chat-thought-header"
        aria-expanded={expanded}
        onClick={toggle}
      >
        <FontAwesomeIcon icon={faLightbulb} />
        <span>Thought</span>
      </button>
      {expanded && (
        <pre className="chat-thought-content">{content ?? ''}</pre>
      )}
    </div>
  );
}
