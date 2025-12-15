import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkflowServiceService } from './workflow-service.service';

@Controller('workflow')
export class WorkflowServiceController {
  constructor(private readonly workflowService: WorkflowServiceService) {}

  @Post('run')
  async runWorkflow(@Body() body: { workflowId: string }) {
    return this.workflowService.run(body.workflowId);
  }

  @Get('runs')
  async listRuns() {
    return this.workflowService.listRuns();
  }
}
