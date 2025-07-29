import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/user.entity';

@Entity('mcp_user_tools')
@Unique('UQ_user_tool_name', ['userId', 'name'])
export class MCPUserTool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  inputSchema: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @ManyToOne(() => User, (user) => user.mcpTools, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
