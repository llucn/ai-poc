-- Migration: Add native content support to t_message
-- This enables storing complete Anthropic MessageParam content blocks
-- for accurate conversation history reconstruction.

ALTER TABLE t_message
  ADD COLUMN native_content JSON NULL COMMENT 'Anthropic MessageParam content blocks (text/tool_use/tool_result)',
  ADD COLUMN message_role VARCHAR(16) NULL COMMENT 'user or assistant (for native messages)',
  ADD COLUMN turn_id INT NULL COMMENT 'Groups messages belonging to the same turn',
  ADD INDEX idx_message_session_turn (session_id, turn_id);

-- Migration notes:
-- 1. Existing rows have native_content = NULL → fallback to content (text-only)
-- 2. New messages store both:
--    - content: display text for UI (backward compatible)
--    - native_content: full ContentBlockParam[] for API reconstruction
-- 3. message_role distinguishes user/assistant for native reconstruction
--    (userName 'ASSISTANT' → role 'assistant', others → role 'user')
-- 4. turn_id groups multi-message turns (e.g. thought + tool_use + observation)
--    for better timeline rendering
-- 5. isThought continues to mark collapsible thought messages in the UI

-- Example native_content values:
-- User message: [{"type": "text", "text": "请帮我查天气"}]
-- Assistant with tool_use: [
--   {"type": "text", "text": "好的"},
--   {"type": "tool_use", "id": "toolu_x", "name": "mcp__1__getWeather", "input": {"city": "北京"}}
-- ]
-- Tool result (stored as user role): [
--   {"type": "tool_result", "tool_use_id": "toolu_x", "content": "{\"temp\": 25}"}
-- ]
