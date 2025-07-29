import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { GetActiveModelDto, SetActiveModelDto } from './dto/llm.dto';
import { LLMService } from './llm.service';

@Controller('llm')
export class LLMController {
  private readonly logger = new Logger(LLMController.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * List all available models
   */
  @Get('models')
  async listModels() {
    try {
      return await this.llmService.listModels();
    } catch (error) {
      this.logger.error('Failed to list models:', error);
      throw new HttpException(
        'Failed to retrieve models',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get the active model for a user
   */
  @Get('models/active')
  async getActiveModel(@Query() query: GetActiveModelDto) {
    try {
      const activeModel = await this.llmService.getActiveModel(query);
      return { activeModel };
    } catch (error) {
      this.logger.error('Failed to get active model:', error);
      throw new HttpException(
        'Failed to get active model',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Set the active model for a user
   */
  @Post('models/active')
  async setActiveModel(@Body() setActiveModelDto: SetActiveModelDto) {
    try {
      await this.llmService.setActiveModel(setActiveModelDto);
      return { message: 'Active model updated successfully' };
    } catch (error) {
      this.logger.error('Failed to set active model:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not available')) {
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Failed to set active model',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Pull/download a model
   */
  @Post('models/:modelName/pull')
  async pullModel(@Param('modelName') modelName: string) {
    try {
      await this.llmService.pullModel(modelName);
      return { message: `Model ${modelName} pulled successfully` };
    } catch (error) {
      this.logger.error(`Failed to pull model ${modelName}:`, error);
      throw new HttpException(
        `Failed to pull model ${modelName}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a model
   */
  @Delete('models/:modelName')
  async deleteModel(@Param('modelName') modelName: string) {
    try {
      await this.llmService.deleteModel(modelName);
      return { message: `Model ${modelName} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelName}:`, error);
      throw new HttpException(
        `Failed to delete model ${modelName}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint to verify Ollama connection
   */
  @Get('health')
  async healthCheck() {
    try {
      await this.llmService.listModels();
      return {
        status: 'healthy',
        service: 'ollama',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException(
        {
          status: 'unhealthy',
          service: 'ollama',
          error: 'Unable to connect to Ollama service',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
