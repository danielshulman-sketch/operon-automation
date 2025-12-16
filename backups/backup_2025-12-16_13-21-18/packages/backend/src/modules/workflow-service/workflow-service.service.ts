import { Injectable } from '@nestjs/common';
import { InMemoryDbService } from '../../shared/in-memory-db.service';

interface StartForDetectedTaskInput {
  orgId: string;
  detectedTaskId: string;
  source: 'email';
}

@Injectable()
export class WorkflowServiceService {
  constructor(private readonly db: InMemoryDbService) {}

  async run(workflowId: string) {
    // placeholder passthrough for manual trigger
    return { status: 'run', workflowId };
  }

  async startForDetectedTask(input: StartForDetectedTaskInput) {
    // In real implementation, pick workflow by org and rules; here just create run record.
    const run = this.db.saveWorkflowRun({
      orgId: input.orgId,
      detectedTaskId: input.detectedTaskId,
    });
    return run;
  }

  listRuns() {
    return this.db.listWorkflowRuns();
  }
}
