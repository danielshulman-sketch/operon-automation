import { Injectable } from '@nestjs/common';
import { DetectedTask, EmailMessage, EmailThread, WorkflowRun } from '../domain/types';
import { randomUUID } from 'crypto';

@Injectable()
export class InMemoryDbService {
  private threads: EmailThread[] = [];
  private messages: EmailMessage[] = [];
  private tasks: DetectedTask[] = [];
  private workflowRuns: WorkflowRun[] = [];

  createThread(orgId: string, mailboxId: string, subject: string): EmailThread {
    const thread: EmailThread = {
      id: randomUUID(),
      orgId,
      mailboxId,
      subject,
      createdAt: new Date(),
    };
    this.threads.push(thread);
    return thread;
  }

  findThreadById(threadId: string) {
    return this.threads.find((t) => t.id === threadId);
  }

  saveMessage(input: Omit<EmailMessage, 'id' | 'createdAt'>): EmailMessage {
    const message: EmailMessage = { ...input, id: randomUUID(), createdAt: new Date() };
    this.messages.push(message);
    return message;
  }

  saveTask(task: Omit<DetectedTask, 'id' | 'createdAt' | 'status'> & { status?: DetectedTask['status'] }): DetectedTask {
    const record: DetectedTask = {
      ...task,
      id: randomUUID(),
      status: task.status || 'open',
      createdAt: new Date(),
    };
    this.tasks.push(record);
    return record;
  }

  listTasks() {
    return this.tasks;
  }

  saveWorkflowRun(input: Omit<WorkflowRun, 'id' | 'createdAt' | 'status'> & { status?: WorkflowRun['status'] }): WorkflowRun {
    const run: WorkflowRun = {
      ...input,
      id: randomUUID(),
      status: input.status || 'running',
      createdAt: new Date(),
    };
    this.workflowRuns.push(run);
    return run;
  }

  listWorkflowRuns() {
    return this.workflowRuns;
  }
}
