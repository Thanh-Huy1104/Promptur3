// MCP User Session DTOs
export class CreateMCPUserSessionDto {
  userId: string;
  serverName: string;
  sessionId?: string;
}

export class UpdateMCPUserSessionDto {
  sessionId?: string;
}

// MCP User Tool DTOs
export class CreateMCPUserToolDto {
  userId: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  isEnabled?: boolean;
}

export class UpdateMCPUserToolDto {
  name?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  isEnabled?: boolean;
}
