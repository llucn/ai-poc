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
