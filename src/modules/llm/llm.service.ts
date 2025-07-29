import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AbortableAsyncIterator,
  ChatRequest,
  ChatResponse,
  Ollama,
} from 'ollama';
import { Repository } from 'typeorm';
import {
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_HOST,
  ERROR_MESSAGES,
} from './constants';
import {
  GetActiveModelDto,
  OllamaModel,
  SetActiveModelDto,
} from './dto/llm.dto';
import { UserLLMPreference } from './entities/user-llm-preference.entity';

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private ollama: Ollama;
  private readonly defaultModel = DEFAULT_MODEL;

  constructor(
    @InjectRepository(UserLLMPreference)
    private readonly userPreferenceRepository: Repository<UserLLMPreference>,
  ) {
    // Initialize Ollama client
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST,
    });
  }

  async onModuleInit() {
    try {
      // Test connection to Ollama
      await this.listModels();
      this.logger.log('Successfully connected to Ollama');
    } catch (error) {
      this.logger.warn(
        'Failed to connect to Ollama:',
        error instanceof Error ? error.message : String(error),
      );
      this.logger.warn(ERROR_MESSAGES.OLLAMA_NOT_AVAILABLE);
    }
  }

  async chat(
    chatCompletionDto: ChatRequest = {
      model: this.defaultModel,
      stream: true,
    },
  ): Promise<AbortableAsyncIterator<ChatResponse>> {
    try {
      const dtoWithDefaults = { stream: true, ...chatCompletionDto };
      const stream = await this.ollama.chat(
        dtoWithDefaults as ChatRequest & { stream: true },
      );

      return stream;
    } catch (error) {
      this.logger.error('Chat completion failed:', error);
      throw new Error('Chat completion failed');
    }
  }

  /**
   * List all available models from Ollama
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map((model) => ({
        name: model.name,
        model: model.model,
        size: model.size,
        digest: model.digest,
        modified_at:
          typeof model.modified_at === 'string'
            ? model.modified_at
            : new Date(model.modified_at).toISOString(),
        details: model.details,
      }));
    } catch (error) {
      this.logger.error('Failed to list models:', error);
      throw new Error('Failed to retrieve models from Ollama');
    }
  }

  /**
   * Get the active model for a specific user
   */
  async getActiveModel(
    getUserActiveModelDto: GetActiveModelDto,
  ): Promise<string> {
    try {
      const preference = await this.userPreferenceRepository.findOne({
        where: { userId: getUserActiveModelDto.userId },
      });

      return preference?.activeModel || this.defaultModel;
    } catch (error) {
      this.logger.error('Failed to get active model:', error);
      return this.defaultModel;
    }
  }

  /**
   * Set the active model for a specific user
   */
  async setActiveModel(setActiveModelDto: SetActiveModelDto): Promise<void> {
    try {
      // Validate that the model exists
      const availableModels = await this.listModels();
      const modelExists = availableModels.some(
        (model) => model.name === setActiveModelDto.model,
      );

      if (!modelExists) {
        throw new Error(ERROR_MESSAGES.MODEL_NOT_FOUND);
      }

      // Find existing preference or create new one
      let preference = await this.userPreferenceRepository.findOne({
        where: { userId: setActiveModelDto.userId },
      });

      if (preference) {
        preference.activeModel = setActiveModelDto.model;
        await this.userPreferenceRepository.save(preference);
      } else {
        preference = this.userPreferenceRepository.create({
          userId: setActiveModelDto.userId,
          activeModel: setActiveModelDto.model,
          modelSettings: {},
        });
        await this.userPreferenceRepository.save(preference);
      }

      this.logger.log(
        `Set active model for user ${setActiveModelDto.userId}: ${setActiveModelDto.model}`,
      );
    } catch (error) {
      this.logger.error('Failed to set active model:', error);
      throw error;
    }
  }

  /**
   * Pull/download a model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      this.logger.log(`Starting to pull model: ${modelName}`);
      const stream = await this.ollama.pull({ model: modelName, stream: true });

      for await (const chunk of stream) {
        if ('status' in chunk && chunk.status) {
          this.logger.log(`Pull progress: ${chunk.status}`);
        }
      }

      this.logger.log(`Successfully pulled model: ${modelName}`);
    } catch (error) {
      this.logger.error(`Failed to pull model ${modelName}:`, error);
      throw new Error(`Failed to pull model ${modelName}`);
    }
  }

  /**
   * Delete a model from local Ollama instance
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      await this.ollama.delete({ model: modelName });
      this.logger.log(`Successfully deleted model: ${modelName}`);
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelName}:`, error);
      throw new Error(`Failed to delete model ${modelName}`);
    }
  }
}
