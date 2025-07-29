/**
 * Utility functions for LLM model management and recommendations
 */

import {
  FALLBACK_MODELS,
  MODEL_CATEGORIES,
  MODEL_CONTEXT_LIMITS,
  MODEL_SIZES,
  PERFORMANCE_RECOMMENDATIONS,
  THINKING_MODELS,
  DEFAULT_MODEL,
} from './constants';
import type { ModelName, ModelCategory } from './constants';

/**
 * Get recommended models based on system capabilities
 */
export function getRecommendedModels(
  memoryLevel: 'low' | 'medium' | 'high' | 'gpu' = 'medium',
): readonly string[] {
  switch (memoryLevel) {
    case 'low':
      return PERFORMANCE_RECOMMENDATIONS.LOW_MEMORY;
    case 'medium':
      return PERFORMANCE_RECOMMENDATIONS.MEDIUM_MEMORY;
    case 'high':
      return PERFORMANCE_RECOMMENDATIONS.HIGH_MEMORY;
    case 'gpu':
      return PERFORMANCE_RECOMMENDATIONS.GPU_OPTIMIZED;
    default:
      return PERFORMANCE_RECOMMENDATIONS.MEDIUM_MEMORY;
  }
}

/**
 * Get models by category
 */
export function getModelsByCategory(
  category: ModelCategory,
): readonly string[] {
  return MODEL_CATEGORIES[category] || [];
}

/**
 * Check if a model supports thinking mode
 */
export function isThinkingModel(modelName: string): boolean {
  return THINKING_MODELS.some((thinkingModel) =>
    modelName.startsWith(thinkingModel),
  );
}

/**
 * Get context limit for a model
 */
export function getModelContextLimit(modelName: string): number {
  // Try exact match first
  if (modelName in MODEL_CONTEXT_LIMITS) {
    return MODEL_CONTEXT_LIMITS[modelName as ModelName];
  }

  // Try partial match (e.g., "llama3.2:3b" matches "llama3.2")
  for (const [model, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (modelName.startsWith(model.split(':')[0])) {
      return limit;
    }
  }

  // Default fallback
  return 8000;
}

/**
 * Estimate token count from text
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length * 0.25); // Rough estimation
}

/**
 * Check if text exceeds model's context limit
 */
export function exceedsContextLimit(text: string, modelName: string): boolean {
  const tokenCount = estimateTokenCount(text);
  const contextLimit = getModelContextLimit(modelName);
  return tokenCount > contextLimit;
}

/**
 * Get best fallback model if the requested model is not available
 */
export function getBestFallbackModel(
  requestedModel: string,
  availableModels: string[],
): string {
  // First, try to find a similar model (same family)
  const modelFamily = requestedModel.split(':')[0];
  const similarModel = availableModels.find(
    (model) => model.startsWith(modelFamily) && model !== requestedModel,
  );

  if (similarModel) {
    return similarModel;
  }

  // Then try fallback models in order of preference
  for (const fallback of FALLBACK_MODELS) {
    if (availableModels.includes(fallback)) {
      return fallback;
    }
  }

  // Finally, use any available model or default
  return availableModels.length > 0 ? availableModels[0] : DEFAULT_MODEL;
}

/**
 * Parse model name and extract components
 */
export function parseModelName(modelName: string): {
  name: string;
  version?: string;
  size?: string;
} {
  const parts = modelName.split(':');
  const name = parts[0];
  const versionPart = parts[1];

  if (!versionPart) {
    return { name };
  }

  // Check if version part contains size information
  const sizeMatch = versionPart.match(/(\d+(?:\.\d+)?[bB])/);
  if (sizeMatch) {
    const size = sizeMatch[1];
    const version =
      versionPart.replace(size, '').replace(/^-+|_+/, '') || 'latest';
    return { name, version, size };
  }

  return { name, version: versionPart };
}

/**
 * Get model size category
 */
export function getModelSizeCategory(
  modelName: string,
): keyof typeof MODEL_SIZES {
  const parsed = parseModelName(modelName);

  if (!parsed.size) {
    return 'MEDIUM'; // Default assumption
  }

  const sizeValue = parseFloat(parsed.size);
  const unit = parsed.size.toLowerCase().slice(-1);

  // Convert to GB if necessary
  const sizeInGB = unit === 'b' ? sizeValue : sizeValue * 1000;

  if (sizeInGB <= MODEL_SIZES.SMALL.max) {
    return 'SMALL';
  } else if (sizeInGB <= MODEL_SIZES.MEDIUM.max) {
    return 'MEDIUM';
  } else if (sizeInGB <= MODEL_SIZES.LARGE.max) {
    return 'LARGE';
  } else {
    return 'EXTRA_LARGE';
  }
}

/**
 * Validate model name format
 */
export function isValidModelName(modelName: string): boolean {
  return /^[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/.test(modelName);
}

/**
 * Format model display name for UI
 */
export function formatModelDisplayName(modelName: string): string {
  const parsed = parseModelName(modelName);
  let displayName = parsed.name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  if (parsed.size) {
    displayName += ` (${parsed.size.toUpperCase()})`;
  }

  if (parsed.version && parsed.version !== 'latest') {
    displayName += ` v${parsed.version}`;
  }

  return displayName;
}

/**
 * Sort models by preference (smaller, faster models first)
 */
export function sortModelsByPreference(models: string[]): string[] {
  return models.sort((a, b) => {
    const aSize = getModelSizeCategory(a);
    const bSize = getModelSizeCategory(b);

    const sizeOrder = { SMALL: 0, MEDIUM: 1, LARGE: 2, EXTRA_LARGE: 3 };

    const aSizeScore = sizeOrder[aSize];
    const bSizeScore = sizeOrder[bSize];

    if (aSizeScore !== bSizeScore) {
      return aSizeScore - bSizeScore;
    }

    // If same size category, sort alphabetically
    return a.localeCompare(b);
  });
}

/**
 * Get model recommendations based on use case
 */
export function getModelsForUseCase(
  useCase: 'general' | 'code' | 'reasoning' | 'fast',
): readonly string[] {
  switch (useCase) {
    case 'general':
      return MODEL_CATEGORIES.GENERAL;
    case 'code':
      return MODEL_CATEGORIES.CODE;
    case 'reasoning':
      return [...THINKING_MODELS];
    case 'fast':
      return MODEL_CATEGORIES.SMALL;
    default:
      return MODEL_CATEGORIES.GENERAL;
  }
}
