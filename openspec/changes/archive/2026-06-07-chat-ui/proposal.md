## Why

Chat is a core capability for AI assistants. This change creates the foundational chat UI and session management without LLM integration, enabling users to create conversations, send messages, and view chat history in a traditional messaging interface.

## What Changes

- Add a new Chat menu item in the main navigation (between Dashboard and Settings)
- Create session list page with bulk delete
- Create chat interface with text input, message bubbles, and markdown rendering
- Add backend API for session CRUD and message management
- Add database tables `t_session` and `t_message` for persistence
- Implement mock echo response (user input returned as assistant reply) without actual LLM integration

## Capabilities

### New Capabilities
- `session-management`: Session CRUD operations (create, list, delete), user-scoped access control
- `message-management`: Message creation and retrieval for chat conversations
- `chat-ui`: Chat interface with session list, conversation view, text input, markdown rendering

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

- **Frontend**: New Chat page with session list and conversation UI; new routes `/chat`, `/chat/:sessionId`
- **Backend**: New `session` module with session/message entities, DTOs, service, controller
- **Database**: New tables `t_session`, `t_message`
- **Navigation**: Main menu updated to include Chat entry point
- **Dependencies**: Markdown rendering library for message content display
