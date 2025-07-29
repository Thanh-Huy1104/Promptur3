import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../modules/user/user.entity';
import { Chat } from '../modules/chat/chat.entity';
import { Message } from '../modules/chat/message.entity';
import { MCPUserSession } from '../modules/mcp/entities/mcp-user-session.entity';
import { MCPUserTool } from '../modules/mcp/entities/mcp-user-tool.entity';
import { UserLLMPreference } from '../modules/llm/entities/user-llm-preference.entity';

// Load environment variables
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'prompture_db',
  entities: [
    User,
    Chat,
    Message,
    MCPUserSession,
    MCPUserTool,
    UserLLMPreference,
  ],
  migrations: ['dist/db/migrations/*.js'],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in development
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
