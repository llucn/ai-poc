import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

type Props = {
  content: string | null;
};

/**
 * Collapsible "Thought" entry in the chat timeline. Default collapsed,
 * shows only a lightbulb + "Thought" header. Clicking the header toggles
 * the expanded body, which renders content as plain text (no Markdown).
 */
export function ThoughtMessage({ content }: Props) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((prev) => !prev);

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
