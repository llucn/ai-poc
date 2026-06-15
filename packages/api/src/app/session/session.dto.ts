// Create a new session with the first message. The session name is derived
// from the message content (truncated to 200 chars) on the backend.
export interface CreateSessionDto {
  content: string;
}

export interface CreateMessageDto {
  content: string;
}

export interface DeleteSessionsDto {
  ids: number[];
}

// Browser-side Client Tool result, POSTed to /sessions/:id/client-result to
// resume a suspended turn. Exactly one of result / error is set.
export interface ClientResultDto {
  callId: string;
  toolUseId: string;
  result?: unknown;
  error?: string;
}
