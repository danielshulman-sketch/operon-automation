-- SQLite version of the schema (simplified for quick testing)
-- This will work without PostgreSQL or Supabase

-- Organizations
CREATE TABLE IF NOT EXISTS organisations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auth Accounts
CREATE TABLE IF NOT EXISTS auth_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Organization Members
CREATE TABLE IF NOT EXISTS org_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    is_admin BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mailboxes
CREATE TABLE IF NOT EXISTS mailboxes (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    email_address TEXT NOT NULL,
    provider TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email Messages
CREATE TABLE IF NOT EXISTS email_messages (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    mailbox_id TEXT NOT NULL,
    message_id TEXT,
    thread_id TEXT,
    from_address TEXT,
    to_addresses TEXT,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    received_at DATETIME,
    is_read BOOLEAN DEFAULT 0,
    classification TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id)
);

-- Email Drafts
CREATE TABLE IF NOT EXISTS email_drafts (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reply_to_message_id TEXT,
    subject TEXT,
    body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email Replies
CREATE TABLE IF NOT EXISTS email_replies (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reply_to_message_id TEXT,
    subject TEXT,
    body TEXT,
    sent_via TEXT,
    external_message_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Voice Profiles
CREATE TABLE IF NOT EXISTS voice_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    sample_emails TEXT,
    questionnaire_responses TEXT,
    tone TEXT,
    formality_level INTEGER,
    writing_style TEXT,
    quality_score REAL,
    is_trained BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Auto Draft Settings
CREATE TABLE IF NOT EXISTS user_auto_draft_settings (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT 0,
    categories TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Auto Email Sync Settings
CREATE TABLE IF NOT EXISTS user_email_sync_settings (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT 0,
    interval_minutes INTEGER DEFAULT 15,
    last_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Detected Tasks
CREATE TABLE IF NOT EXISTS detected_tasks (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT,
    email_message_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (email_message_id) REFERENCES email_messages(id)
);

-- User Activity
CREATE TABLE IF NOT EXISTS user_activity (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- OAuth Connections
CREATE TABLE IF NOT EXISTS oauth_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bulk Draft Jobs
CREATE TABLE IF NOT EXISTS bulk_draft_jobs (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_emails INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    results TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (org_id) REFERENCES organisations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI Provider Settings
CREATE TABLE IF NOT EXISTS org_ai_settings (
    id TEXT PRIMARY KEY,
    org_id TEXT UNIQUE NOT NULL,
    provider TEXT DEFAULT 'openai',
    model TEXT,
    openai_api_key TEXT,
    anthropic_api_key TEXT,
    google_api_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organisations(id)
);
