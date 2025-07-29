/**
 * Constants used throughout the LLM service for Ollama integration
 */

import * as path from 'path';
import * as os from 'os';

// Default Ollama configuration
export const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
export const DEFAULT_MODEL = 'llama3.2:latest';

// Alternative models that can be used as fallbacks
export const FALLBACK_MODELS = [
  'llama3.2:1b',
  'llama3.1:8b',
  'qwen2.5:7b',
  'phi3:latest',
  'gemma2:2b',
];

// Model categories for different use cases
export const MODEL_CATEGORIES = {
  GENERAL: ['llama3.2:latest', 'llama3.1:8b', 'qwen2.5:7b'],
  CODE: ['codellama:7b', 'codellama:13b', 'deepseek-coder:6.7b'],
  SMALL: ['llama3.2:1b', 'phi3:latest', 'gemma2:2b'],
  REASONING: ['deepseek-r1:latest', 'qwen2.5:14b'],
} as const;

// Models that support thinking/reasoning mode
export const THINKING_MODELS = [
  'deepseek-r1',
  'deepseek-r1:latest',
  'qwen2.5:14b',
  'qwen2.5:32b',
] as const;

// Default generation parameters
export const DEFAULT_GENERATION_PARAMS = {
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 0.9,
  frequency_penalty: 0,
  presence_penalty: 0,
} as const;

// Token estimation (approximate)
export const TOKEN_COUNT_PER_CHAR = 0.25;
export const AVERAGE_CHARS_PER_TOKEN = 4;

// Rate limiting and performance
export const MAX_CONCURRENT_REQUESTS = 5;
export const REQUEST_TIMEOUT_MS = 120000; // 2 minutes
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 1000;

// Model context limits (approximate)
export const MODEL_CONTEXT_LIMITS = {
  'llama3.2:1b': 128000,
  'llama3.2:3b': 128000,
  'llama3.2:latest': 128000,
  'llama3.1:8b': 128000,
  'codellama:7b': 16000,
  'codellama:13b': 16000,
  'qwen2.5:7b': 32000,
  'qwen2.5:14b': 32000,
  'phi3:latest': 4000,
  'gemma2:2b': 8000,
  'mistral:7b': 8000,
  'deepseek-r1:latest': 64000,
} as const;

// Configuration file paths
export const CONFIG_PATHS = {
  HOME_DIR: os.homedir(),
  CONFIG_DIR: path.join(os.homedir(), '.config', 'prompture'),
  LLM_CONFIG_FILE: 'llm_config.json',
  USER_PREFERENCES_FILE: 'user_preferences.json',
} as const;

// Tool calling configuration
export const TOOL_CALLING_CONFIG = {
  MAX_TOOLS_PER_REQUEST: 10,
  MAX_TOOL_CALLS_PER_CONVERSATION: 20,
  TOOL_TIMEOUT_MS: 30000, // 30 seconds
  MAX_TOOL_RESULT_LENGTH: 10000, // characters
} as const;

// Streaming configuration
export const STREAMING_CONFIG = {
  CHUNK_DELIMITER: '\n\n',
  DATA_PREFIX: 'data: ',
  DONE_MESSAGE: '[DONE]',
  PING_INTERVAL_MS: 30000, // Keep-alive ping
} as const;

// Error messages
export const ERROR_MESSAGES = {
  OLLAMA_NOT_AVAILABLE:
    'Ollama service is not available. Please ensure it is running.',
  MODEL_NOT_FOUND: 'The requested model is not available.',
  INVALID_REQUEST: 'Invalid request parameters.',
  TOOL_EXECUTION_FAILED: 'Tool execution failed.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  CONTEXT_LIMIT_EXCEEDED: 'Context length limit exceeded.',
} as const;

// Health check configuration
export const HEALTH_CHECK = {
  INTERVAL_MS: 60000, // 1 minute
  TIMEOUT_MS: 5000, // 5 seconds
  MAX_FAILURES: 3,
} as const;

// Model size categories (in GB, approximate)
export const MODEL_SIZES = {
  SMALL: { min: 0, max: 2 }, // < 2GB
  MEDIUM: { min: 2, max: 8 }, // 2-8GB
  LARGE: { min: 8, max: 20 }, // 8-20GB
  EXTRA_LARGE: { min: 20, max: Infinity }, // > 20GB
} as const;

// Performance recommendations based on system resources
export const PERFORMANCE_RECOMMENDATIONS = {
  LOW_MEMORY: ['llama3.2:1b', 'phi3:latest', 'gemma2:2b'],
  MEDIUM_MEMORY: ['llama3.2:3b', 'qwen2.5:7b', 'codellama:7b'],
  HIGH_MEMORY: ['llama3.2:latest', 'llama3.1:8b', 'qwen2.5:14b'],
  GPU_OPTIMIZED: ['llama3.2:latest', 'codellama:13b', 'qwen2.5:32b'],
} as const;

// Default tool parameter schema for unknown tools
export const DEFAULT_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'The query or input for the tool',
    },
    parameters: {
      type: 'object',
      description: 'Additional parameters for the tool',
    },
  },
  required: ['query'],
} as const;

// Environment variable names
export const ENV_VARS = {
  OLLAMA_HOST: 'OLLAMA_HOST',
  DEFAULT_MODEL: 'DEFAULT_LLM_MODEL',
  MAX_CONCURRENT_REQUESTS: 'LLM_MAX_CONCURRENT_REQUESTS',
  REQUEST_TIMEOUT: 'LLM_REQUEST_TIMEOUT_MS',
  ENABLE_THINKING_MODE: 'LLM_ENABLE_THINKING_MODE',
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  MODEL_NAME: /^[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
  USER_ID: /^[a-zA-Z0-9_-]+$/,
  TEMPERATURE: { min: 0, max: 2 },
  MAX_TOKENS: { min: 1, max: 32000 },
  TOP_P: { min: 0, max: 1 },
} as const;

// Logging configuration
export const LOG_CONFIG = {
  LEVELS: ['error', 'warn', 'info', 'debug'] as const,
  MAX_LOG_LENGTH: 1000,
  SENSITIVE_FIELDS: ['password', 'token', 'key', 'secret'],
} as const;

export type ModelName = keyof typeof MODEL_CONTEXT_LIMITS;
export type ThinkingModel = (typeof THINKING_MODELS)[number];
export type ModelCategory = keyof typeof MODEL_CATEGORIES;
export type LogLevel = (typeof LOG_CONFIG.LEVELS)[number];
