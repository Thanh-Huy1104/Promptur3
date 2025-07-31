import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { MCPService } from './mcp.service';

// Interfaces for server connection management
export interface ServerConfig {
  type: 'script' | 'sse' | 'streamable_http' | 'config';
  name: string;
  path?: string;
  url?: string;
  config?: {
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    [key: string]: any;
  };
  headers?: Record<string, string>;
}

interface ConnectedServer {
  client: Client; // Real MCP client instance
  transport:
    | StdioClientTransport
    | SSEClientTransport
    | StreamableHTTPClientTransport; // Transport instance
  tools: Array<{
    name: string;
    description: string;
    isEnabled: boolean;
    inputSchema: any;
  }>;
  sessionId?: string;
  connectedAt: Date;
  userId: string; // Track which user owns this connection
}

export interface ConnectionResult {
  success: boolean;
  connectedServers: string[];
  errors: string[];
}

export interface ConnectOptions {
  serverPaths?: string[];
  serverUrls?: string[];
  configPath?: string;
  autoDiscovery?: boolean;
}

@Injectable()
export class MCPServerConnector {
  private connectedServers: Map<string, ConnectedServer> = new Map();
  private userClients: Map<string, Map<string, ConnectedServer>> = new Map(); // userId -> serverName -> ConnectedServer

  constructor(private readonly mcpService: MCPService) {}

  // MCP Client Creation and Connection Utilities
  private createClient(name: string, version: string = '1.0.0'): Client {
    return new Client(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {
            call: true,
            list: true,
          },
        },
      },
    );
  }

  private async connectClient(
    client: Client,
    transport:
      | StdioClientTransport
      | SSEClientTransport
      | StreamableHTTPClientTransport,
    serverName: string,
  ): Promise<void> {
    console.log(`Connecting to ${serverName} server...`);
    await client.connect(transport);
    console.log(`Successfully connected to ${serverName}`);
  }

  private createStdioTransport(
    serverConfig: ServerConfig,
  ): Promise<StdioClientTransport> {
    if (!serverConfig.path) {
      throw new Error('Command is required for STDIO transport');
    }

    const command = serverConfig.path;
    const args: string[] = [];

    // Add any additional arguments from config
    if (
      serverConfig.config &&
      typeof serverConfig.config === 'object' &&
      'args' in serverConfig.config
    ) {
      const configArgs = serverConfig.config.args;
      if (Array.isArray(configArgs)) {
        args.push(...configArgs);
      }
    }

    // Get environment variables
    let env: Record<string, string> | undefined;
    if (
      serverConfig.config &&
      typeof serverConfig.config === 'object' &&
      'env' in serverConfig.config
    ) {
      env = serverConfig.config.env as Record<string, string>;
    }

    console.log(
      `Creating STDIO transport - Command: ${command}, Args: ${JSON.stringify(args)}`,
    );

    return Promise.resolve(
      new StdioClientTransport({
        command,
        args,
        env,
      }),
    );
  }

  private createSSETransport(
    serverConfig: ServerConfig,
  ): Promise<SSEClientTransport> {
    if (!serverConfig.url) {
      throw new Error('URL is required for SSE transport');
    }

    return Promise.resolve(new SSEClientTransport(new URL(serverConfig.url)));
  }

  private createStreamableHTTPTransport(
    serverConfig: ServerConfig,
  ): Promise<StreamableHTTPClientTransport> {
    if (!serverConfig.url) {
      throw new Error('URL is required for Streamable HTTP transport');
    }

    return Promise.resolve(
      new StreamableHTTPClientTransport(
        new URL(serverConfig.url),
        serverConfig.headers,
      ),
    );
  }

  // Get user-specific server key
  private getUserServerKey(userId: string, serverName: string): string {
    return `${userId}:${serverName}`;
  }

  // Get user's connected servers
  getUserConnectedServers(userId: string): Map<string, ConnectedServer> {
    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Map());
    }
    return this.userClients.get(userId)!;
  }

  // Server Connection Management
  async connectToServers(
    userId: string,
    options: ConnectOptions,
  ): Promise<ConnectionResult> {
    const { serverPaths, serverUrls, configPath, autoDiscovery } = options;
    const connectedServers: string[] = [];
    const errors: string[] = [];

    try {
      const allServers: ServerConfig[] = [];

      // Process server paths
      if (serverPaths?.length) {
        const scriptServers = this.processServerPaths(serverPaths);
        allServers.push(...scriptServers);
      }

      // Process server URLs
      if (serverUrls?.length) {
        const urlServers = this.processServerUrls(serverUrls);
        allServers.push(...urlServers);
      }

      // Process config file
      if (configPath) {
        try {
          const configServers = await this.parseServerConfigs(configPath);
          allServers.push(...configServers);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error loading config from ${configPath}: ${message}`);
        }
      }

      // Auto-discover servers
      if (autoDiscovery) {
        const discoveredServers = await this.autoDiscoverServers();
        allServers.push(...discoveredServers);
      }

      // Connect to each server
      for (const server of allServers) {
        try {
          const connected = await this.connectToServer(userId, server);
          if (connected) {
            connectedServers.push(server.name);
          } else {
            errors.push(`Failed to connect to server: ${server.name}`);
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error connecting to ${server.name}: ${message}`);
        }
      }

      return {
        success: connectedServers.length > 0,
        connectedServers,
        errors,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        connectedServers,
        errors: [`General connection error: ${message}`],
      };
    }
  }

  private processServerPaths(serverPaths: string[]): ServerConfig[] {
    const servers: ServerConfig[] = [];

    for (const path of serverPaths) {
      // Basic validation - in a real implementation, you'd check file existence
      if (path.endsWith('.py') || path.endsWith('.js')) {
        const name = path.split('/').pop()?.split('.')[0] || path;
        servers.push({
          type: 'script',
          name,
          path,
        });
      }
    }

    return servers;
  }

  private processServerUrls(serverUrls: string[]): ServerConfig[] {
    const servers: ServerConfig[] = [];

    for (const url of serverUrls) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        const name = urlObj.hostname.replace(/[:.]/g, '_');

        // Determine server type based on URL patterns or default to streamable_http
        let type: 'sse' | 'streamable_http' = 'streamable_http';
        if (
          url.toLowerCase().includes('sse') ||
          url.toLowerCase().includes('/sse')
        ) {
          type = 'sse';
        }

        servers.push({
          type,
          name,
          url,
          headers: {
            'MCP-Protocol-Version': '2025-06-18',
          },
        });
      }
    }

    return servers;
  }

  private parseServerConfigs(configPath: string): Promise<ServerConfig[]> {
    try {
      if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found: ${configPath}`);
      }

      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent) as {
        mcpServers?: Record<
          string,
          {
            command?: string;
            args?: string[];
            env?: Record<string, string>;
          }
        >;
      };

      if (!config.mcpServers) {
        throw new Error('Config file must contain "mcpServers" object');
      }

      const servers: ServerConfig[] = [];

      for (const [serverName, serverConfig] of Object.entries(
        config.mcpServers,
      )) {
        if (!serverConfig.command) {
          console.warn(`Server ${serverName} missing command, skipping`);
          continue;
        }

        servers.push({
          type: 'script',
          name: serverName,
          path: serverConfig.command, // Use command as the executable path
          config: {
            args: serverConfig.args || [],
            env: serverConfig.env || {},
          },
        });
      }

      console.log(
        `Parsed ${servers.length} servers from config: ${servers.map((s) => s.name).join(', ')}`,
      );
      return Promise.resolve(servers);
    } catch (error) {
      console.error(`Failed to parse server config: ${error}`);
      throw error;
    }
  }

  private autoDiscoverServers(): Promise<ServerConfig[]> {
    // In a real implementation, you'd discover servers from known locations
    // For now, return empty array
    // TODO: Implement auto-discovery similar to Python version
    return Promise.resolve([]);
  }

  private async connectToServer(
    userId: string,
    server: ServerConfig,
  ): Promise<boolean> {
    try {
      // Create MCP client
      const client = this.createClient(`mcp-client-${server.name}`, '1.0.0');

      // Create transport based on server type
      let transport:
        | StdioClientTransport
        | SSEClientTransport
        | StreamableHTTPClientTransport;

      switch (server.type) {
        case 'script':
          transport = await this.createStdioTransport(server);
          break;
        case 'sse':
          transport = await this.createSSETransport(server);
          break;
        case 'streamable_http':
          transport = await this.createStreamableHTTPTransport(server);
          break;
        case 'config':
          // Determine transport type from config
          if (server.config?.url) {
            transport = await this.createStreamableHTTPTransport(server);
          } else {
            transport = await this.createStdioTransport(server);
          }
          break;
        default:
          throw new Error(`Unsupported server type: ${server.type as string}`);
      }

      // Connect the client
      await this.connectClient(client, transport, server.name);

      // Create or update session record
      const existingSession = await this.mcpService.findSessionByUserAndServer(
        userId,
        server.name,
      );

      const sessionId = this.generateSessionId();
      if (existingSession) {
        await this.mcpService.updateSession(existingSession.id, {
          sessionId,
        });
      } else {
        await this.mcpService.createSession({
          userId,
          serverName: server.name,
          sessionId,
        });
      }

      // Discover real tools from the connected server
      const tools = await this.discoverServerTools(client, server);

      // Store connected server info with real client
      const userServerKey = this.getUserServerKey(userId, server.name);
      const connectedServer: ConnectedServer = {
        client,
        transport,
        tools,
        sessionId,
        connectedAt: new Date(),
        userId,
      };

      // Store in both maps for different access patterns
      this.connectedServers.set(userServerKey, connectedServer);
      const userServers = this.getUserConnectedServers(userId);
      userServers.set(server.name, connectedServer);

      // Save discovered tools to database
      for (const tool of tools) {
        await this.createOrUpdateTool(userId, tool);
      }

      return true;
    } catch (error) {
      console.error(`Failed to connect to server ${server.name}:`, error);
      return false;
    }
  }

  private async discoverServerTools(
    client: Client,
    server: ServerConfig,
  ): Promise<
    Array<{
      name: string;
      description: string;
      isEnabled: boolean;
      inputSchema: any;
    }>
  > {
    try {
      // Use real MCP client to list tools
      const toolsResponse = await client.listTools();
      const tools: Array<{
        name: string;
        description: string;
        isEnabled: boolean;
        inputSchema: any;
      }> = [];

      for (const tool of toolsResponse.tools) {
        tools.push({
          name: `${server.name}.${tool.name}`,
          description: tool.description || `Tool from ${server.name}`,
          isEnabled: true,
          inputSchema: tool.inputSchema,
        });
      }
      return tools;
    } catch (error) {
      console.error(`Failed to discover tools from ${server.name}:`, error);
      // Fallback to mock tools on error
      return [
        {
          name: 'example_tool',
          description: `Example tool from ${server.name}`,
          isEnabled: true,
          inputSchema: {},
        },
      ];
    }
  }

  private async createOrUpdateTool(
    userId: string,
    tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      isEnabled: boolean;
    },
  ): Promise<void> {
    try {
      // First, try to find existing tool
      const existingTool = await this.mcpService
        .findToolsByUser(userId)
        .then((tools) => tools.find((t) => t.name === tool.name));

      if (existingTool) {
        // Update existing tool
        await this.mcpService.updateTool(existingTool.id, {
          description: tool.description,
          inputSchema: tool.inputSchema || {},
          isEnabled: tool.isEnabled,
        });
      } else {
        // Create new tool
        await this.mcpService.createTool({
          userId,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema || {},
          isEnabled: tool.isEnabled,
        });
      }
    } catch (error) {
      console.error(`Failed to create/update tool ${tool.name}:`, error);
      throw error;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Server Management Methods
  async getConnectedServers(userId: string): Promise<
    Array<{
      name: string;
      connectedAt: Date;
      toolCount: number;
      sessionId?: string | null;
    }>
  > {
    const userSessions = await this.mcpService.findSessionsByUser(userId);
    const result: Array<{
      name: string;
      connectedAt: Date;
      toolCount: number;
      sessionId?: string | null;
    }> = [];

    const userServers = this.getUserConnectedServers(userId);

    for (const session of userSessions) {
      const connectedServer = userServers.get(session.serverName);
      result.push({
        name: session.serverName,
        connectedAt: session.connectedAt,
        toolCount: connectedServer?.tools.length || 0,
        sessionId: session.sessionId,
      });
    }

    return result;
  }

  async disconnectServer(userId: string, serverName: string): Promise<void> {
    // Get user's connected server
    const userServers = this.getUserConnectedServers(userId);
    const connectedServer = userServers.get(serverName);

    if (connectedServer) {
      try {
        // Disconnect the MCP client
        await connectedServer.client.close();
      } catch (error) {
        console.error(`Error closing client for ${serverName}:`, error);
      }

      // Remove from user's servers
      userServers.delete(serverName);

      // Remove from global map
      const userServerKey = this.getUserServerKey(userId, serverName);
      this.connectedServers.delete(userServerKey);
    }

    // Remove session record from database
    await this.mcpService.removeSessionByUserAndServer(userId, serverName);
  }

  async disconnectAllServers(userId: string): Promise<void> {
    const userSessions = await this.mcpService.findSessionsByUser(userId);
    const userServers = this.getUserConnectedServers(userId);

    for (const session of userSessions) {
      const connectedServer = userServers.get(session.serverName);

      if (connectedServer) {
        try {
          // Disconnect the MCP client
          await connectedServer.client.close();
        } catch (error) {
          console.error(
            `Error closing client for ${session.serverName}:`,
            error,
          );
        }
      }

      // Remove from global map
      const userServerKey = this.getUserServerKey(userId, session.serverName);
      this.connectedServers.delete(userServerKey);

      // Remove session from database
      await this.mcpService.removeSession(session.id);
    }

    // Clear user's server map
    userServers.clear();
  }

  getServerTools(
    userId: string,
    serverName: string,
  ): Array<{
    name: string;
    description: string;
    isEnabled: boolean;
    inputSchema: any;
  }> {
    const userServers = this.getUserConnectedServers(userId);
    const connectedServer = userServers.get(serverName);

    if (!connectedServer) {
      throw new NotFoundException(
        `Server ${serverName} is not connected for user ${userId}`,
      );
    }

    return connectedServer.tools;
  }

  async toggleServerTool(
    userId: string,
    serverName: string,
    toolName: string,
    isEnabled: boolean,
  ): Promise<void> {
    const userServers = this.getUserConnectedServers(userId);
    const connectedServer = userServers.get(serverName);

    if (!connectedServer) {
      throw new NotFoundException(
        `Server ${serverName} is not connected for user ${userId}`,
      );
    }

    const tool = connectedServer.tools.find((t) => t.name === toolName);
    if (!tool) {
      throw new NotFoundException(
        `Tool ${toolName} not found on server ${serverName}`,
      );
    }

    tool.isEnabled = isEnabled;

    // Update in database
    const dbTools = await this.mcpService
      .findToolsByUser(userId)
      .then((tools) => tools.filter((t) => t.name === tool.name));

    for (const dbTool of dbTools) {
      await this.mcpService.updateTool(dbTool.id, { isEnabled });
    }
  }

  // Server Discovery Methods (placeholders for future implementation)
  discoverClaudeServers(): Promise<ServerConfig[]> {
    // TODO: Implement Claude config file discovery
    return Promise.resolve([]);
  }

  discoverLocalServers(): Promise<ServerConfig[]> {
    // TODO: Implement local server discovery
    return Promise.resolve([]);
  }

  // Connection Status Methods
  isServerConnected(userId: string, serverName: string): boolean {
    const userServers = this.getUserConnectedServers(userId);
    return userServers.has(serverName);
  }

  getUserConnectionStatus(userId: string): {
    totalConnected: number;
    servers: string[];
    totalTools: number;
  } {
    const userServers = this.getUserConnectedServers(userId);
    const servers = Array.from(userServers.keys());
    const totalTools = Array.from(userServers.values()).reduce(
      (total, server) => total + server.tools.length,
      0,
    );

    return {
      totalConnected: servers.length,
      servers,
      totalTools,
    };
  }

  getConnectionStatus(): {
    totalConnected: number;
    servers: string[];
    totalTools: number;
  } {
    const servers = Array.from(this.connectedServers.keys());
    const totalTools = Array.from(this.connectedServers.values()).reduce(
      (total, server) => total + server.tools.length,
      0,
    );

    return {
      totalConnected: servers.length,
      servers,
      totalTools,
    };
  }

  // Add method to call tools
  async callTool(
    userId: string,
    serverName: string,
    toolName: string,
    args: any,
  ): Promise<[err: null, result: any] | [err: string, result: null]> {
    const userServers = this.getUserConnectedServers(userId);
    const connectedServer = userServers.get(serverName);

    // to call a specific tool we need the tool name without the server prefix
    // also need to check if server is connected for the tools each time
    if (!connectedServer) {
      throw new NotFoundException(
        `Server ${serverName} is not connected for user ${userId}`,
      );
    }
    // Look for tool by name - handle both full name and suffix
    const tool = connectedServer.tools.find(
      (t) =>
        t.name === toolName ||
        t.name === `${serverName}.${toolName}` ||
        t.name.endsWith(`.${toolName}`),
    );
    if (!tool || !tool.isEnabled) {
      throw new NotFoundException(
        `Tool ${toolName} not found or not enabled on server ${serverName}`,
      );
    }

    try {
      // Call the tool using the MCP client - use the tool name without server prefix
      const actualToolName = tool.name.includes('.')
        ? tool.name.split('.').slice(1).join('.')
        : tool.name;

      const result = await connectedServer.client.callTool({
        name: actualToolName,
        arguments: args as Record<string, any>,
      });

      return [null, result];
    } catch (error) {
      console.error(`Error calling tool ${tool.name}:`, error);
      return [error instanceof Error ? error.message : String(error), null];
    }
  }
}
