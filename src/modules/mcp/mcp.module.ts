import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MCPController } from './mcp.controller';
import { MCPService } from './mcp.service';
import { MCPServerConnector } from './mcp-server-connector.service';
import { MCPUserSession } from './entities/mcp-user-session.entity';
import { MCPUserTool } from './entities/mcp-user-tool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MCPUserSession, MCPUserTool])],
  controllers: [MCPController],
  providers: [MCPService, MCPServerConnector],
  exports: [MCPService, MCPServerConnector],
})
export class MCPModule {}
