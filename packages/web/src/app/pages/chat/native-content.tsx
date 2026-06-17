/**
 * Renders an Anthropic native_content block array (text / tool_use /
 * tool_result) for the expandable view in the chat timeline.
 */

type Block = {
  type?: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
};

function stripClientPrefix(name: string): string {
  const m = /^(?:client|mcp)__\d+__(.+)$/.exec(name);
  return m ? m[1] : name;
}

function renderInput(input: unknown): string {
  if (input == null) return '';
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

function renderResultContent(content: unknown): string {
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

export function NativeContentView({ blocks }: { blocks: Block[] }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="chat-native">
      {blocks.map((block, i) => {
        if (block.type === 'tool_use') {
          return (
            <div key={i} className="chat-native-block">
              <div className="chat-native-label">
                Tool Use: {stripClientPrefix(block.name ?? '')}
              </div>
              <pre className="chat-native-code">{renderInput(block.input)}</pre>
            </div>
          );
        }
        if (block.type === 'tool_result') {
          return (
            <div key={i} className="chat-native-block">
              <div
                className={`chat-native-label ${
                  block.is_error ? 'chat-native-label-error' : ''
                }`}
              >
                Tool Result{block.is_error ? ' [Error]' : ''}
              </div>
              <pre
                className={`chat-native-code ${
                  block.is_error ? 'chat-native-code-error' : ''
                }`}
              >
                {renderResultContent(block.content)}
              </pre>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
