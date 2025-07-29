import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MCPService } from './mcp.service';
import {
  MCPServerConnector,
  ConnectionResult,
  ConnectOptions,
} from './mcp-server-connector.service';
import {
  CreateMCPUserSessionDto,
  UpdateMCPUserSessionDto,
  CreateMCPUserToolDto,
  UpdateMCPUserToolDto,
} from './dto/mcp.dto';
import { MCPUserSession } from './entities/mcp-user-session.entity';
import { MCPUserTool } from './entities/mcp-user-tool.entity';

// Add DTOs for server connection - using imported interfaces
// ConnectOptions interface is imported from mcp-server-connector.service

@Controller('mcp')
export class MCPController {
  constructor(
    private readonly mcpService: MCPService,
    private readonly mcpServerConnector: MCPServerConnector,
  ) {}

  // Session endpoints
  @Post('sessions')
  createSession(
    @Body() createSessionDto: CreateMCPUserSessionDto,
  ): Promise<MCPUserSession> {
    return this.mcpService.createSession(createSessionDto);
  }

  @Get('sessions')
  findAllSessions(): Promise<MCPUserSession[]> {
    return this.mcpService.findAllSessions();
  }

  @Get('sessions/user/:userId')
  findSessionsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<MCPUserSession[]> {
    return this.mcpService.findSessionsByUser(userId);
  }

  @Get('sessions/user/:userId/server/:serverName')
  findSessionByUserAndServer(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serverName') serverName: string,
  ): Promise<MCPUserSession | null> {
    return this.mcpService.findSessionByUserAndServer(userId, serverName);
  }

  @Get('sessions/:id')
  findOneSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MCPUserSession | null> {
    return this.mcpService.findOneSession(id);
  }

  @Patch('sessions/:id')
  updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSessionDto: UpdateMCPUserSessionDto,
  ): Promise<MCPUserSession> {
    return this.mcpService.updateSession(id, updateSessionDto);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSession(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.mcpService.removeSession(id);
  }

  @Delete('sessions/user/:userId/server/:serverName')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSessionByUserAndServer(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serverName') serverName: string,
  ): Promise<void> {
    return this.mcpService.removeSessionByUserAndServer(userId, serverName);
  }

  // Tool endpoints
  @Post('tools')
  createTool(
    @Body() createToolDto: CreateMCPUserToolDto,
  ): Promise<MCPUserTool> {
    return this.mcpService.createTool(createToolDto);
  }

  @Get('tools')
  findAllTools(): Promise<MCPUserTool[]> {
    return this.mcpService.findAllTools();
  }

  @Get('tools/user/:userId')
  findToolsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<MCPUserTool[]> {
    return this.mcpService.findToolsByUser(userId);
  }

  @Get('tools/user/:userId/enabled')
  findEnabledToolsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<MCPUserTool[]> {
    return this.mcpService.findEnabledToolsByUser(userId);
  }

  @Get('tools/:id')
  findOneTool(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MCPUserTool | null> {
    return this.mcpService.findOneTool(id);
  }

  @Patch('tools/:id')
  updateTool(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateToolDto: UpdateMCPUserToolDto,
  ): Promise<MCPUserTool> {
    return this.mcpService.updateTool(id, updateToolDto);
  }

  @Patch('tools/:id/toggle')
  toggleToolEnabled(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MCPUserTool> {
    return this.mcpService.toggleToolEnabled(id);
  }

  @Delete('tools/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTool(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.mcpService.removeTool(id);
  }

  // Server Connection endpoints
  @Post('servers/connect/:userId')
  async connectServers(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() connectDto: ConnectOptions,
  ): Promise<ConnectionResult> {
    return this.mcpServerConnector.connectToServers(userId, connectDto);
  }

  @Get('servers/connected/:userId')
  async getConnectedServers(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.mcpServerConnector.getConnectedServers(userId);
  }

  @Delete('servers/:userId/:serverName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectServer(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serverName') serverName: string,
  ): Promise<void> {
    return this.mcpServerConnector.disconnectServer(userId, serverName);
  }

  @Delete('servers/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectAllServers(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.mcpServerConnector.disconnectAllServers(userId);
  }

  @Get('servers/:userId/:serverName/tools')
  getServerTools(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serverName') serverName: string,
  ) {
    return this.mcpServerConnector.getServerTools(userId, serverName);
  }

  @Post('servers/:userId/:serverName/tools/:toolName/enable')
  async enableServerTool(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serverName') serverName: string,
    @Param('toolName') toolName: string,
  ): Promise<void> {
    return this.mcpServerConnector.enableServerTool(
      userId,
      serverName,
      toolName,
    );
  }

  @Post('servers/:userId/:serverName/tools/:toolName/disable')
  async disableServerTool(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serverName') serverName: string,
    @Param('toolName') toolName: string,
  ): Promise<void> {
    return this.mcpServerConnector.disableServerTool(
      userId,
      serverName,
      toolName,
    );
  }

  @Post('servers/:userId/:serverName/tools/:toolName/call')
  async callTool(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serverName') serverName: string,
    @Param('toolName') toolName: string,
    @Body() args: any,
  ): Promise<any> {
    return this.mcpServerConnector.callTool(userId, serverName, toolName, args);
  }

  @Get('servers/status')
  getConnectionStatus() {
    return this.mcpServerConnector.getConnectionStatus();
  }

  @Get('servers/status/:userId')
  getUserConnectionStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.mcpServerConnector.getUserConnectionStatus(userId);
  }

  // Utility endpoints
  @Get('stats/user/:userId/sessions')
  getActiveSessionsCount(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ count: number }> {
    return this.mcpService
      .getActiveSessionsCount(userId)
      .then((count) => ({ count }));
  }

  @Get('stats/user/:userId/tools')
  getEnabledToolsCount(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ count: number }> {
    return this.mcpService
      .getEnabledToolsCount(userId)
      .then((count) => ({ count }));
  }
}
