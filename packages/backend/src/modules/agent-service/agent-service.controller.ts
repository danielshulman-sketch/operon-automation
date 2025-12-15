import { Controller, Post, Body } from '@nestjs/common';
import { AgentServiceService } from './agent-service.service';

@Controller('agent')
export class AgentServiceController {
  constructor(private readonly agentService: AgentServiceService) {}

  @Post('execute')
  async executeAgent(@Body() body: { task: string }) {
    return this.agentService.execute(body.task);
  }
}