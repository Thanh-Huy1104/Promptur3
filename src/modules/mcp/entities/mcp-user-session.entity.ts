import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/user.entity';

@Entity('mcp_user_sessions')
@Unique(['userId', 'serverName'])
export class MCPUserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  serverName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId: string | null;

  @CreateDateColumn()
  connectedAt: Date;

  @ManyToOne(() => User, (user) => user.mcpSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
