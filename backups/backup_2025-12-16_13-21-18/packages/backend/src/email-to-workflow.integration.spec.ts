import { EmailIntelServiceService } from './modules/email-intel-service/email-intel-service.service';
import { IntegrationServiceService } from './modules/integration-service/integration-service.service';
import { WorkflowServiceService } from './modules/workflow-service/workflow-service.service';
import { InMemoryDbService } from './shared/in-memory-db.service';
import { NormalizedEmailInput } from './domain/types';

const buildServices = () => {
  const db = new InMemoryDbService();
  const workflowService = new WorkflowServiceService(db);
  const emailIntel = new EmailIntelServiceService(db, workflowService);
  const integration = new IntegrationServiceService(emailIntel);
  return { db, integration };
};

const actionableEmail: NormalizedEmailInput = {
  orgId: 'org-1',
  mailboxId: 'mb-1',
  subject: 'Action needed: Send proposal',
  bodyText: 'Please action this request and send the proposal by Friday.',
  from: 'client@example.com',
  to: ['me@example.com'],
  messageId: 'msg-1',
};

describe('Email → DetectedTask → WorkflowRun (vertical slice)', () => {
  it('creates a detected task and workflow run from an actionable email', async () => {
    const { db, integration } = buildServices();
    const res = await integration.handleGmailWebhook(actionableEmail);
    const tasks = db.listTasks();
    const runs = db.listWorkflowRuns();

    expect(res.tasks).toHaveLength(1);
    expect(tasks).toHaveLength(1);
    expect(runs).toHaveLength(1);
    expect(runs[0].detectedTaskId).toBe(tasks[0].id);
  });

  it('skips workflow when no actionable task is found', async () => {
    const { db, integration } = buildServices();
    const nonActionEmail: NormalizedEmailInput = {
      ...actionableEmail,
      messageId: 'msg-2',
      subject: 'FYI: Update',
      bodyText: 'Just an update, no action required.',
    };
    const res = await integration.handleGmailWebhook(nonActionEmail);

    expect(res.tasks).toHaveLength(0);
    expect(db.listTasks()).toHaveLength(0);
    expect(db.listWorkflowRuns()).toHaveLength(0);
  });
});
