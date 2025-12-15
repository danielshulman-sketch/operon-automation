import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowEngineService {
  runWorkflow(workflowId: string) {
    // skeleton
    return { status: 'completed' };
  }
}