import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class ToolFunction {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  parameters?: any;
}

export class Tool {
  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => ToolFunction)
  function: ToolFunction;
}

export class ChatMessage {
  @IsString()
  role: 'user' | 'assistant' | 'system' | 'tool';

  @IsString()
  content: string;

  @IsOptional()
  tool_calls?: any[];

  @IsOptional()
  tool_call_id?: string;
}

export class ChatCompletionDto {
  @IsString()
  model: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessage)
  messages: ChatMessage[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Tool)
  tools?: Tool[];

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  max_tokens?: number;

  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @IsOptional()
  @IsString()
  tool_choice?: string;
}

export class SetActiveModelDto {
  @IsString()
  userId: string;

  @IsString()
  model: string;
}

export class GetActiveModelDto {
  @IsString()
  userId: string;
}

export class ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: any[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class StreamChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: any[];
    };
    finish_reason?: string;
  }[];
}

export class StreamChatWithToolsDto {
  @IsString()
  userId: string;

  @IsString()
  message: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledTools?: string[];

  @IsOptional()
  @IsNumber()
  temperature?: number;
}
