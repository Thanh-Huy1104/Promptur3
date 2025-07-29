import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRequest, Tool, ToolCall } from 'ollama';
import { Repository } from 'typeorm';
import { DEFAULT_TOOL_SCHEMA } from '../llm/constants';
import { LLMService } from '../llm/llm.service';
import { MCPUserTool } from '../mcp';
import { MCPServerConnector } from '../mcp/mcp-server-connector.service';
import { MCPService } from '../mcp/mcp.service';
import { Chat } from './chat.entity';
import {
  ChatContext,
  CreateChatDto,
  CreateMessageDto,
  StreamChatChunk,
  StreamChatDto,
  UpdateChatDto,
  UpdateMessageDto,
} from './dto/chat.dto';
import { Message } from './message.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly mcpServerConnector: MCPServerConnector,
    private readonly mcpService: MCPService,
    private readonly llmService: LLMService,
  ) {}

  // Chat methods
  async createChat(createChatDto: CreateChatDto): Promise<Chat> {
    const chat = this.chatRepository.create(createChatDto);
    return this.chatRepository.save(chat);
  }

  async findAllChats(): Promise<Chat[]> {
    return this.chatRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findChatsByUser(userId: string): Promise<Chat[]> {
    return this.chatRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneChat(id: string): Promise<Chat | null> {
    return this.chatRepository.findOne({
      where: { id },
      relations: ['user', 'messages'],
    });
  }

  async updateChat(
    id: string,
    updateChatDto: UpdateChatDto,
  ): Promise<Chat | null> {
    await this.chatRepository.update(id, updateChatDto);
    return this.findOneChat(id);
  }

  async removeChat(id: string): Promise<void> {
    await this.chatRepository.delete(id);
  }

  // Message methods
  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = this.messageRepository.create(createMessageDto);
    return this.messageRepository.save(message);
  }

  async findMessagesByChat(chatId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { chatId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOneMessage(id: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id },
      relations: ['chat'],
    });
  }

  async updateMessage(
    id: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<Message | null> {
    await this.messageRepository.update(id, updateMessageDto);
    return this.findOneMessage(id);
  }

  async removeMessage(id: string): Promise<void> {
    await this.messageRepository.delete(id);
  }

  async *streamChat(
    streamChatDto: StreamChatDto,
  ): AsyncGenerator<StreamChatChunk> {
    // Implementation for streaming query results
    const { userId, chatId, message, model } = streamChatDto;
    let response = '';
    const messages: Message[] = [];

    let chat = await this.findOneChat(chatId);
    if (!chat || chat.userId !== userId) {
      chat = await this.createChat({
        title: 'Basic title' + chatId,
        userId,
      });
    }

    messages.push(...chat.messages);
    const userMessage = this.messageRepository.create({
      role: 'user',
      content: message,
      chatId: chat.id,
    });
    messages.push(userMessage);

    // Save the user message to the database
    await this.createMessage({
      role: 'user',
      content: message,
      chatId: chat.id,
    });

    const modelOptions = {};
    const enabledTools: MCPUserTool[] =
      await this.mcpService.findToolsByUser(userId);
    console.log('Enabled tools:', enabledTools);
    const toolDefs: Tool[] = enabledTools.map((tool: MCPUserTool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.inputSchema
          ? (JSON.parse(
              JSON.stringify(tool.inputSchema),
            ) as Tool['function']['parameters'])
          : (JSON.parse(
              JSON.stringify(DEFAULT_TOOL_SCHEMA),
            ) as Tool['function']['parameters']),
      },
    }));

    while (true) {
      const chatParams: ChatRequest = {
        model: model || 'qwen3:8b',
        messages: messages,
        stream: true,
        options: modelOptions,
      };
      const supportsThinking = true;
      if (supportsThinking) {
        chatParams.think = true;
      }
      if (toolDefs) {
        chatParams.tools = toolDefs;
      }

      const stream = await this.llmService.chat(chatParams);
      const toolCalls: ToolCall[] = [];
      let step_response = '';

      for await (const chunk of stream) {
        const message = chunk.message || {};
        if (message.content) {
          step_response += message.content;
          response += message.content;
          yield {
            type: 'message',
            content: step_response,
            timestamp: new Date(),
          };
        }
        if (message.tool_calls) {
          toolCalls.push(...message.tool_calls);
        }
      }

      if (!toolCalls || toolCalls.length === 0) {
        break;
      }

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = toolCall.function.arguments;

        yield {
          type: 'tool_call',
          toolCall: {
            name: toolName,
            arguments: toolArgs,
          },
          timestamp: new Date(),
        };

        let server: string | null = null;
        let name: string = toolName;
        if (toolName.includes('.')) {
          const parts = toolName.split('.', 2);
          server = parts[0];
          name = parts[1];
        }

        if (
          server &&
          !(await this.mcpServerConnector.getConnectedServers(userId))?.some(
            (s) => s.name === server,
          )
        ) {
          const error = `[ERROR] Unknown server for tool: ${toolName}`;
          yield {
            type: 'error',
            content: error,
            timestamp: new Date(),
          };
          this.logger.error(error);
          continue;
        }

        let toolResponse = '';
        try {
          const [, result] = await this.mcpServerConnector.callTool(
            userId,
            server || '',
            name,
            toolArgs,
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          toolResponse = String(result?.content?.[0]?.text || '');
        } catch (error) {
          toolResponse = `[ERROR] Failed to call tool '${toolName}': ${error instanceof Error ? error.message : String(error)}`;
          this.logger.error(toolResponse);
        }

        messages.push(
          this.messageRepository.create({
            role: 'tool',
            content: toolResponse,
            chatId: chat.id,
          }),
        );

        yield {
          type: 'tool_result',
          toolCall: {
            name: toolName,
            arguments: toolArgs,
          },
          content: toolResponse,
          timestamp: new Date(),
        };
      }

      // Add the assistant message with tool calls to the conversation
      messages.push(
        this.messageRepository.create({
          role: 'assistant',
          content: step_response,
          chatId: chat.id,
        }),
      );
    }

    // Save the final AI response message
    await this.createMessage({
      role: 'assistant',
      content: response,
      chatId: chatId,
    });

    // Indicate the conversation is complete
    yield {
      type: 'done',
      timestamp: new Date(),
    };
  }

  private async buildChatContext(
    chatId: string,
    userId: string,
    enabledTools: string[],
  ): Promise<ChatContext> {
    // Get chat history
    const messages = await this.findMessagesByChat(chatId);

    // Get available tools for the user
    const userSessions = await this.mcpService.findSessionsByUser(userId);
    const availableTools: ChatContext['availableTools'] = [];

    for (const session of userSessions) {
      // Check if the session still has an active connection
      const connectedServers =
        this.mcpServerConnector.getUserConnectedServers(userId);
      const serverConnection = connectedServers.get(session.serverName);

      if (serverConnection) {
        for (const tool of serverConnection.tools) {
          if (
            tool.enabled &&
            (enabledTools.length === 0 || enabledTools.includes(tool.name))
          ) {
            availableTools.push({
              name: tool.name,
              description: tool.description || '',
              serverName: session.serverName,
              enabled: true,
            });
          }
        }
      }
    }

    return {
      messages: messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'tool',
        content: msg.content,
      })),
      toolCallHistory: [],
      availableTools,
    };
  }
}
