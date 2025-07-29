import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { MCPUserSession } from './entities/mcp-user-session.entity';
import { MCPUserTool } from './entities/mcp-user-tool.entity';
import {
  CreateMCPUserSessionDto,
  UpdateMCPUserSessionDto,
  CreateMCPUserToolDto,
  UpdateMCPUserToolDto,
} from './dto/mcp.dto';
@Injectable()
export class MCPService {
  constructor(
    @InjectRepository(MCPUserSession)
    private readonly mcpUserSessionRepository: Repository<MCPUserSession>,
    @InjectRepository(MCPUserTool)
    private readonly mcpUserToolRepository: Repository<MCPUserTool>,
  ) {}

  // MCP User Session methods
  async createSession(
    createSessionDto: CreateMCPUserSessionDto,
  ): Promise<MCPUserSession> {
    const session = this.mcpUserSessionRepository.create(createSessionDto);
    return this.mcpUserSessionRepository.save(session);
  }

  async findAllSessions(): Promise<MCPUserSession[]> {
    return this.mcpUserSessionRepository.find({
      relations: ['user'],
      order: { connectedAt: 'DESC' },
    });
  }

  async findSessionsByUser(userId: string): Promise<MCPUserSession[]> {
    return this.mcpUserSessionRepository.find({
      where: { userId },
      relations: ['user'],
      order: { connectedAt: 'DESC' },
    });
  }

  async findSessionByUserAndServer(
    userId: string,
    serverName: string,
  ): Promise<MCPUserSession | null> {
    return this.mcpUserSessionRepository.findOne({
      where: { userId, serverName },
      relations: ['user'],
    });
  }

  async findOneSession(id: string): Promise<MCPUserSession | null> {
    return this.mcpUserSessionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async updateSession(
    id: string,
    updateSessionDto: UpdateMCPUserSessionDto,
  ): Promise<MCPUserSession> {
    const session = await this.findOneSession(id);
    if (!session) {
      throw new NotFoundException(`MCP session with ID ${id} not found`);
    }

    await this.mcpUserSessionRepository.update(id, updateSessionDto);
    const updatedSession = await this.findOneSession(id);
    if (!updatedSession) {
      throw new NotFoundException(
        `MCP session with ID ${id} not found after update`,
      );
    }
    return updatedSession;
  }

  async removeSession(id: string): Promise<void> {
    const result = await this.mcpUserSessionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MCP session with ID ${id} not found`);
    }
  }

  async removeSessionByUserAndServer(
    userId: string,
    serverName: string,
  ): Promise<void> {
    await this.mcpUserSessionRepository.delete({ userId, serverName });
  }

  // MCP User Tool methods
  async createTool(createToolDto: CreateMCPUserToolDto): Promise<MCPUserTool> {
    const tool = this.mcpUserToolRepository.create(createToolDto);
    return this.mcpUserToolRepository.save(tool);
  }

  async findAllTools(): Promise<MCPUserTool[]> {
    return this.mcpUserToolRepository.find({
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findToolsByUser(userId: string): Promise<MCPUserTool[]> {
    return this.mcpUserToolRepository.find({
      where: { userId },
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findEnabledToolsByUser(userId: string): Promise<MCPUserTool[]> {
    return this.mcpUserToolRepository.find({
      where: { userId, isEnabled: true },
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findOneTool(id: string): Promise<MCPUserTool | null> {
    return this.mcpUserToolRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async updateTool(
    id: string,
    updateToolDto: UpdateMCPUserToolDto,
  ): Promise<MCPUserTool> {
    const tool = await this.findOneTool(id);
    if (!tool) {
      throw new NotFoundException(`MCP tool with ID ${id} not found`);
    }
    await this.mcpUserToolRepository.update(
      id,
      updateToolDto as QueryDeepPartialEntity<MCPUserTool>,
    );

    const updatedTool = await this.findOneTool(id);
    if (!updatedTool) {
      throw new NotFoundException(
        `MCP tool with ID ${id} not found after update`,
      );
    }
    return updatedTool;
  }

  async removeTool(id: string): Promise<void> {
    const result = await this.mcpUserToolRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MCP tool with ID ${id} not found`);
    }
  }

  async toggleToolEnabled(id: string): Promise<MCPUserTool> {
    const tool = await this.findOneTool(id);
    if (!tool) {
      throw new NotFoundException(`MCP tool with ID ${id} not found`);
    }

    return this.updateTool(id, { isEnabled: !tool.isEnabled });
  }

  // Utility methods
  async getActiveSessionsCount(userId: string): Promise<number> {
    return this.mcpUserSessionRepository.count({
      where: { userId },
    });
  }

  async getEnabledToolsCount(userId: string): Promise<number> {
    return this.mcpUserToolRepository.count({
      where: { userId, isEnabled: true },
    });
  }
}
