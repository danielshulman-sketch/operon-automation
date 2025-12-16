import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InMemoryDbService } from '../../shared/in-memory-db.service';
import { NormalizedEmailInput } from '../../domain/types';
import { WorkflowServiceService } from '../workflow-service/workflow-service.service';

@Injectable()
export class EmailIntelServiceService {
  constructor(
    private readonly db: InMemoryDbService,
    private readonly workflowService: WorkflowServiceService,
  ) {}

  async handleIncomingEmail(email: NormalizedEmailInput) {
    const thread =
      (email.threadId && this.db.findThreadById(email.threadId)) ||
      this.db.createThread(email.orgId, email.mailboxId, email.subject);

    const message = this.db.saveMessage({
      orgId: email.orgId,
      mailboxId: email.mailboxId,
      threadId: thread.id,
      from: email.from,
      to: email.to,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml,
      messageId: email.messageId,
    });

    const classification = await this.classifyEmail(email);
    const tasks = await this.extractTasksFromEmail(email);

    const createdTasks = tasks.map((task) =>
      this.db.saveTask({
        orgId: email.orgId,
        threadId: thread.id,
        messageId: message.id,
        title: task.title,
        confidence: task.confidence,
      }),
    );

    await Promise.all(
      createdTasks.map((task) =>
        this.workflowService.startForDetectedTask({
          orgId: task.orgId,
          detectedTaskId: task.id,
          source: 'email',
        }),
      ),
    );

    return { classification, tasks: createdTasks };
  }

  async classifyEmail(email: NormalizedEmailInput) {
    // Mock LLM classification; replace with real OpenAI call
    const mentionsNoAction = /no action required/i.test(email.bodyText);
    const isActionable = !mentionsNoAction && /action|please|due|follow up/i.test(email.bodyText);
    return { category: isActionable ? 'task' : 'fyi', confidence: isActionable ? 0.82 : 0.4 };
  }

  async extractTasksFromEmail(email: NormalizedEmailInput) {
    // Mock task extraction; in production call LLM with schema
    const mentionsNoAction = /no action required/i.test(email.bodyText);
    if (!mentionsNoAction && /action/i.test(email.bodyText)) {
      return [
        { tempId: randomUUID(), title: `Action: ${email.subject}`, confidence: 0.8 },
      ];
    }
    return [];
  }
}
