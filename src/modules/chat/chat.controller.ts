import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Response,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  CreateChatDto,
  UpdateChatDto,
  CreateMessageDto,
  UpdateMessageDto,
  StreamChatDto,
} from './dto/chat.dto';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { Response as ExpressResponse } from 'express';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Chat endpoints
  @Post()
  createChat(@Body() createChatDto: CreateChatDto): Promise<Chat> {
    return this.chatService.createChat(createChatDto);
  }

  @Get()
  findAllChats(): Promise<Chat[]> {
    return this.chatService.findAllChats();
  }

  @Get('user/:userId')
  findChatsByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Chat[]> {
    return this.chatService.findChatsByUser(userId);
  }

  @Get(':id')
  findOneChat(@Param('id', ParseUUIDPipe) id: string): Promise<Chat | null> {
    return this.chatService.findOneChat(id);
  }

  @Patch(':id')
  updateChat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChatDto: UpdateChatDto,
  ): Promise<Chat | null> {
    return this.chatService.updateChat(id, updateChatDto);
  }

  @Delete(':id')
  removeChat(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.chatService.removeChat(id);
  }

  // Message endpoints
  @Post(':chatId/messages')
  createMessage(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    createMessageDto.chatId = chatId;
    return this.chatService.createMessage(createMessageDto);
  }

  @Get(':chatId/messages')
  findMessagesByChat(
    @Param('chatId', ParseUUIDPipe) chatId: string,
  ): Promise<Message[]> {
    return this.chatService.findMessagesByChat(chatId);
  }

  @Get('messages/:messageId')
  findOneMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<Message | null> {
    return this.chatService.findOneMessage(messageId);
  }

  @Patch('messages/:messageId')
  updateMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<Message | null> {
    return this.chatService.updateMessage(messageId, updateMessageDto);
  }

  @Delete('messages/:messageId')
  removeMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<void> {
    return this.chatService.removeMessage(messageId);
  }

  // Streaming chat endpoint
  @Post('stream')
  async streamChat(
    @Body() streamChatDto: StreamChatDto,
    @Response() res: ExpressResponse,
  ): Promise<void> {
    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Write initial status
    res.status(HttpStatus.OK);

    try {
      for await (const chunk of this.chatService.streamChat(streamChatDto)) {
        // Check if client disconnected
        if (res.destroyed) {
          break;
        }

        const data = JSON.stringify(chunk) + '\n';
        res.write(data);
      }
    } catch (error) {
      // Only send error if connection is still active
      if (!res.destroyed) {
        const errorChunk =
          JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          }) + '\n';
        res.write(errorChunk);
      }
    } finally {
      // Only end if connection is still active
      if (!res.destroyed) {
        res.end();
      }
    }
  }
}
