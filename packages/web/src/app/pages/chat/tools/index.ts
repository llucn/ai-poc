// Bootstrap barrel for client tool definitions.
//
// Import this module once at app startup (before getAllClientTools() is called)
// to register all client tools via their defineClientTool side effects. Keep
// this separate from client-tool-executor.ts to avoid a circular import:
// each tool file imports defineClientTool from the executor, so the executor
// must be fully evaluated before any tool file runs.
import './console-log-echo';
import './prompt-input';
