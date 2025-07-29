import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';
import { UserLLMPreference } from './entities/user-llm-preference.entity';
import { MCPModule } from '../mcp/mcp.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserLLMPreference]), MCPModule],
  controllers: [LLMController],
  providers: [LLMService],
  exports: [LLMService],
})
export class LLMModule {}
