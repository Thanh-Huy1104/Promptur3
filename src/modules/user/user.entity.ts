import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MCPUserSession } from '../mcp/entities/mcp-user-session.entity';
import { MCPUserTool } from '../mcp/entities/mcp-user-tool.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Settings fields
  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'boolean', default: true })
  emailNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  darkMode: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  // MCP relationships
  @OneToMany(() => MCPUserSession, (session) => session.user)
  mcpSessions: MCPUserSession[];

  @OneToMany(() => MCPUserTool, (tool) => tool.user)
  mcpTools: MCPUserTool[];
}
