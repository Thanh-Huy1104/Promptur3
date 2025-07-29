export class CreateChatDto {
  title: string;
  userId: string;
}

export class UpdateChatDto {
  title?: string;
}

export class CreateMessageDto {
  role: string;
  content: string;
  chatId: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  toolResults?: Array<{
    name: string;
    arguments: Record<string, any>;
    result: any;
    error?: string;
  }>;
}

export class UpdateMessageDto {
  role?: string;
  content?: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  toolResults?: Array<{
    name: string;
    arguments: Record<string, any>;
    result: any;
    error?: string;
  }>;
}

// Streaming chat DTOs
export class StreamChatDto {
  chatId: string;
  message: string;
  userId: string;
  enabledTools?: string[]; // List of enabled tool names
  maxToolCalls?: number; // Maximum number of tool calls in chain
  temperature?: number;
  model?: string;
}

export interface ToolCallRequest {
  name: string;
  arguments: Record<string, any>;
  serverName?: string;
}

export interface ToolCallResult {
  name: string;
  result: any;
  error?: string;
  serverName?: string;
}

export interface StreamChatChunk {
  type: 'message' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCallRequest;
  toolResult?: ToolCallResult;
  error?: string;
  messageId?: string;
  timestamp: Date;
}

export interface ChatContext {
  messages: Array<{
    role: 'user' | 'assistant' | 'tool';
    content: string;
    toolCalls?: ToolCallRequest[];
    toolResults?: ToolCallResult[];
  }>;
  toolCallHistory: ToolCallResult[];
  availableTools: Array<{
    name: string;
    description: string;
    serverName: string;
    enabled: boolean;
  }>;
}
