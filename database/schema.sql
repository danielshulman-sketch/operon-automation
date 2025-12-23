-- AI Operations Platform Database Schema
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Organizations table
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  max_users INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authentication accounts (stores hashed passwords)
CREATE TABLE auth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'email',
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- OAuth connections for Gmail
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mailboxes (Gmail or IMAP connections)
CREATE TABLE mailboxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_type VARCHAR(50) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  imap_host VARCHAR(255),
  imap_port INTEGER,
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  username VARCHAR(255),
  password_encrypted TEXT,
  use_ssl BOOLEAN DEFAULT true,
  sync_cursor TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email threads
CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
  subject VARCHAR(500),
  participants TEXT[],
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email messages
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  mailbox_id UUID NOT NULL REFERENCES mailboxes(id) ON DELETE CASCADE,
  message_id VARCHAR(500) UNIQUE NOT NULL,
  from_address VARCHAR(255) NOT NULL,
  to_addresses TEXT[],
  cc_addresses TEXT[],
  subject VARCHAR(500),
  body_text TEXT,
  body_html TEXT,
  classification VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice profiles
CREATE TABLE voice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sample_emails TEXT[],
  questionnaire_responses JSONB DEFAULT '{}'::jsonb,
  tone VARCHAR(100),
  formality_level INTEGER,
  writing_style JSONB DEFAULT '{}'::jsonb,
  quality_score DECIMAL(3,2),
  is_trained BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Auto draft settings per user
CREATE TABLE user_auto_draft_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Auto email sync settings per user
CREATE TABLE user_email_sync_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  interval_minutes INTEGER DEFAULT 15,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Email drafts
CREATE TABLE email_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reply_to_message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sent email replies
CREATE TABLE email_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reply_to_message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  sent_via VARCHAR(50),
  external_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bulk draft jobs
CREATE TABLE bulk_draft_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  total_emails INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- AI provider settings per organization
CREATE TABLE org_ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  provider VARCHAR(50) DEFAULT 'openai',
  model VARCHAR(100),
  openai_api_key TEXT,
  anthropic_api_key TEXT,
  google_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id)
);

-- Detected tasks
CREATE TABLE detected_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email_message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50),
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow definitions
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow runs
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running',
  trigger_data JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Workflow run steps
CREATE TABLE workflow_run_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type VARCHAR(100) NOT NULL,
  step_config JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'pending',
  result JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Agent runs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event logs
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embedding records for vector search
CREATE TABLE embedding_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALL INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_org_members_org_user ON org_members(org_id, user_id);
CREATE INDEX idx_org_members_admin ON org_members(org_id, is_admin);
CREATE INDEX idx_oauth_connections_org_user ON oauth_connections(org_id, user_id);
CREATE INDEX idx_mailboxes_org ON mailboxes(org_id);
CREATE INDEX idx_email_threads_org ON email_threads(org_id);
CREATE INDEX idx_email_messages_org ON email_messages(org_id);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX idx_email_messages_received ON email_messages(received_at DESC);
CREATE INDEX idx_voice_profiles_user ON voice_profiles(user_id);
CREATE INDEX idx_user_auto_draft_settings_user ON user_auto_draft_settings(user_id);
CREATE INDEX idx_user_email_sync_settings_user ON user_email_sync_settings(user_id);
CREATE INDEX idx_email_drafts_user ON email_drafts(user_id);
CREATE INDEX idx_email_drafts_reply_to ON email_drafts(reply_to_message_id);
CREATE INDEX idx_email_replies_user ON email_replies(user_id);
CREATE INDEX idx_email_replies_reply_to ON email_replies(reply_to_message_id);
CREATE INDEX idx_org_ai_settings_org ON org_ai_settings(org_id);
CREATE INDEX idx_bulk_draft_jobs_user ON bulk_draft_jobs(user_id);
CREATE INDEX idx_bulk_draft_jobs_status ON bulk_draft_jobs(org_id, status);
CREATE INDEX idx_detected_tasks_org ON detected_tasks(org_id);
CREATE INDEX idx_detected_tasks_status ON detected_tasks(org_id, status);
CREATE INDEX idx_detected_tasks_due ON detected_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_workflow_definitions_org ON workflow_definitions(org_id);
CREATE INDEX idx_workflow_runs_org ON workflow_runs(org_id);
CREATE INDEX idx_workflow_runs_started ON workflow_runs(started_at DESC);
CREATE INDEX idx_workflow_run_steps_run ON workflow_run_steps(workflow_run_id);
CREATE INDEX idx_agent_runs_org ON agent_runs(org_id);
CREATE INDEX idx_chat_conversations_org_user ON chat_conversations(org_id, user_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_user_activity_org_user ON user_activity(org_id, user_id);
CREATE INDEX idx_user_activity_created ON user_activity(created_at DESC);
CREATE INDEX idx_event_logs_org_type ON event_logs(org_id, event_type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_embedding_records_org_type ON embedding_records(org_id, entity_type);
CREATE INDEX idx_embedding_records_vector ON embedding_records USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
