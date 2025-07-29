# LLM Service with Ollama Integration

This module provides LLM (Large Language Model) functionality using Ollama as the backend service. It includes support for tool calling, model management, and user preferences.

## Features

- **Chat Completion**: Generate responses using local Ollama models
- **Tool Calling**: Support for function calling and tool integration
- **Model Management**: List, pull, and delete models from Ollama
- **User Preferences**: Store user's active model preferences in the database
- **Streaming Support**: Real-time streaming responses
- **Health Checks**: Monitor Ollama service connectivity

## Setup

### 1. Install Ollama

First, install Ollama on your system:
- Visit [Ollama's website](https://ollama.com/) and download the appropriate version
- Or use package managers:
  ```bash
  # macOS
  brew install ollama
  
  # Linux
  curl -fsSL https://ollama.com/install.sh | sh
  ```

### 2. Start Ollama Service

```bash
ollama serve
```

The service will run on `http://localhost:11434` by default.

### 3. Pull Models

Download models you want to use:

```bash
# Pull popular models
ollama pull llama3.2:latest
ollama pull codellama
ollama pull mistral
```

### 4. Environment Configuration

Set the Ollama host in your `.env` file:

```env
OLLAMA_HOST=http://localhost:11434
```

## API Endpoints

### Model Management

- `GET /llm/models` - List all available models
- `GET /llm/models/active?userId=<userId>` - Get user's active model
- `POST /llm/models/active` - Set user's active model
- `POST /llm/models/:modelName/pull` - Pull/download a model
- `DELETE /llm/models/:modelName` - Delete a model

### Chat Completions

- `POST /llm/chat/completions` - Generate chat completion
- `POST /llm/chat/completions/stream` - Generate streaming chat completion

### Health Check

- `GET /llm/health` - Check Ollama service health

## Usage Examples

### Set Active Model

```bash
curl -X POST http://localhost:3000/llm/models/active \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "model": "llama3.2:latest"}'
```

### Chat Completion

```bash
curl -X POST http://localhost:3000/llm/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:latest",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "temperature": 0.7
  }'
```

### Chat Completion with Tools

```bash
curl -X POST http://localhost:3000/llm/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:latest",
    "messages": [
      {"role": "user", "content": "What is the weather like today?"}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get current weather",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {"type": "string"}
            }
          }
        }
      }
    ],
    "tool_choice": "auto",
    "temperature": 0.7
  }'
```

### List Models

```bash
curl http://localhost:3000/llm/models
```

### Pull New Model

```bash
curl -X POST http://localhost:3000/llm/models/phi3:latest/pull
```

## Integration with Chat Service

The LLM service is automatically integrated with the existing chat service. When users send messages through the chat endpoints, the system will:

1. Retrieve the user's active model preference
2. Use available MCP tools as function definitions
3. Generate responses using the Ollama model
4. Execute tool calls if requested by the model
5. Stream responses back to the user

## Troubleshooting

### Ollama Not Running

If you see connection errors, ensure Ollama is running:

```bash
ollama serve
```

### Model Not Found

Pull the required model:

```bash
ollama pull llama3.2:latest
```

### Performance Issues

- Use smaller models for faster responses (e.g., `llama3.2:1b`)
- Adjust temperature and max_tokens for better performance
- Consider using GPU acceleration if available

## Supported Models

The service works with any model available in Ollama, including:

- **Llama 3.2**: General purpose, good for conversations
- **Code Llama**: Optimized for code generation
- **Mistral**: Efficient and fast
- **Phi-3**: Microsoft's small but capable model
- **Gemma**: Google's lightweight model

Check [Ollama's model library](https://ollama.com/library) for the full list.
