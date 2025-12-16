export interface NormalizedEmailInput {
  orgId: string;
  mailboxId: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  from: string;
  to: string[];
  messageId: string;
  threadId?: string;
}

export interface EmailThread {
  id: string;
  orgId: string;
  mailboxId: string;
  subject: string;
  createdAt: Date;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  orgId: string;
  mailboxId: string;
  from: string;
  to: string[];
  bodyText: string;
  bodyHtml?: string;
  messageId: string;
  createdAt: Date;
}

export interface DetectedTask {
  id: string;
  orgId: string;
  threadId: string;
  messageId: string;
  title: string;
  status: 'open' | 'in_progress' | 'done';
  confidence: number;
  createdAt: Date;
}

export interface WorkflowRun {
  id: string;
  orgId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detectedTaskId: string;
  createdAt: Date;
}
