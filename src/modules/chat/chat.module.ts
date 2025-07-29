import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { MCPModule } from '../mcp/mcp.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Message]), MCPModule, LLMModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
