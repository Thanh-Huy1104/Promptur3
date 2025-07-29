#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Testing MCP Weather Integration ==="

# 1. Create user
echo "1. Creating user..."
USER_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weather Test User 3",
    "email": "weather-test-3@example.com",
    "language": "en",
    "timezone": "America/New_York"
  }')

USER_ID=$(echo $USER_RESPONSE | jq -r '.id')
echo "Created user with ID: $USER_ID"

# 2. Check initial connection status
echo "2. Checking initial connection status..."
curl -s -X GET $BASE_URL/mcp/servers/status/$USER_ID | jq '.'

# 3. Connect to MCP servers using Claude desktop config
echo "3. Connecting to MCP servers from Claude desktop config..."
CONNECT_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/servers/connect/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "configPath": "/Users/th/Library/Application Support/Claude/claude_desktop_config.json",
    "autoDiscovery": false
  }')

echo "Connection result:"
echo $CONNECT_RESPONSE | jq '.'

# 3a. Check connection status after attempting to connect
echo "3a. Checking connection status after MCP connection attempt..."
curl -s -X GET $BASE_URL/mcp/servers/status/$USER_ID | jq '.'

# 4. List available tools
echo "4. Listing available tools..."
TOOLS_RESPONSE=$(curl -s -X GET $BASE_URL/mcp/tools/user/$USER_ID)
echo $TOOLS_RESPONSE | jq '.'

# 4a. Get connected servers
echo "4a. Getting connected servers..."
SERVERS_RESPONSE=$(curl -s -X GET $BASE_URL/mcp/servers/connected/$USER_ID)
echo $SERVERS_RESPONSE | jq '.'

# 4b. Enable weather tools if available
echo "4b. Checking for weather server tools..."
WEATHER_TOOLS=$(curl -s -X GET $BASE_URL/mcp/servers/$USER_ID/weather/tools 2>/dev/null)
if [ $? -eq 0 ] && [ "$WEATHER_TOOLS" != "null" ]; then
  echo "Weather server found! Available tools:"
  echo $WEATHER_TOOLS | jq '.'
  
  # Enable all weather tools
  echo "Enabling weather forecast tool..."
  curl -s -X POST $BASE_URL/mcp/servers/$USER_ID/weather/tools/mcp_weather_get_forecast/enable
  
  echo "Enabling weather alerts tool..."  
  curl -s -X POST $BASE_URL/mcp/servers/$USER_ID/weather/tools/mcp_weather_get_alerts/enable
else
  echo "Weather server not connected or no tools available"
fi

# 5. Create chat
echo "5. Creating chat session..."
CHAT_RESPONSE=$(curl -s -X POST $BASE_URL/chats \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Weather Forecast Chat\",
    \"userId\": \"$USER_ID\"
  }")

CHAT_ID=$(echo $CHAT_RESPONSE | jq -r '.id')
echo "Created chat with ID: $CHAT_ID"

# 6. Test streaming chat with weather query
echo "6. Testing weather forecast query for New York..."
curl -X POST $BASE_URL/chats/stream \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"chatId\": \"$CHAT_ID\",
    \"message\": \"What is the weather forecast for New York? Please provide current conditions and forecast.\",
    \"model\": \"qwen3:8b\"
  }"

echo -e "\n\n=== Test completed ==="
echo "User ID: $USER_ID"
echo "Chat ID: $CHAT_ID"
echo ""
echo "If weather tools didn't connect, check:"
echo "1. Weather server path: /Users/th/Documents/Github/quickstart-resources/weather-server-python"
echo "2. UV tool installation: /Users/th/.local/bin/uv"
echo "3. Server logs in the NestJS console"
echo ""
echo "Manual commands for testing:"
echo "curl -X GET $BASE_URL/mcp/servers/connected/$USER_ID"
echo "curl -X GET $BASE_URL/mcp/tools/user/$USER_ID"