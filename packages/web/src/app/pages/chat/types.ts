export interface Session {
  id: number;
  name: string;
  userName: string;
  lastActivityTime: string;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}

export interface Message {
  id: number;
  sessionId: number;
  userName: string;
  messageType: number;
  // 1 = thought (collapsible note), 0 = regular message
  isThought: number;
  content: string | null;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}

export interface CreateSessionDto {
  content: string;
}

export interface CreateMessageDto {
  content: string;
}
