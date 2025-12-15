import { Module } from '@nestjs/common';
import { AgentServiceController } from './agent-service.controller';
import { AgentServiceService } from './agent-service.service';

@Module({
  controllers: [AgentServiceController],
  providers: [AgentServiceService],
})
export class AgentServiceModule {}