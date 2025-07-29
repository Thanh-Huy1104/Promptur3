import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Chat } from './chat.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  toolCalls: Array<{
    name: string;
    arguments: Record<string, any>;
  }> | null;

  @Column({ type: 'jsonb', nullable: true })
  toolResults: Array<{
    name: string;
    arguments: Record<string, any>;
    result: any;
    error?: string;
  }> | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid' })
  chatId: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: Chat;
}
