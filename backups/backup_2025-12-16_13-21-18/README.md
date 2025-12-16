# AI-Powered Email Operations Platform

Complete AI-powered email operations platform with Gmail integration, voice profile training, bulk draft generation, and admin dashboard.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cd packages/frontend
cp .env.example .env
# Edit .env with your credentials

# Run database schema
psql -U postgres -d your_db -f database/schema.sql

# Start development server
pnpm dev
```

## Prerequisites

- PostgreSQL with pgvector extension
- OpenAI API key
- Google OAuth credentials
- Node.js 18+ and pnpm

## Features

✅ **Authentication** - Email/password with auto-admin for first user  
✅ **Email Management** - Gmail OAuth, sync, AI classification  
✅ **Email Stream** - Multi-select interface with bulk operations  
✅ **Voice Training** - 5-step flow with AI analysis  
✅ **Draft Generation** - Single and bulk draft generation  
✅ **Admin Dashboard** - User management, stats, activity feed  
✅ **Tasks** - Auto-extraction from emails, status management  
✅ **Dashboard** - Stats overview and quick actions  
✅ **Onboarding** - Email connection and voice training flow  

🚧 **Coming Soon** - Workflows, AI Chat, IMAP/SMTP

## Documentation

See full setup guide and API documentation in the project files.

## Structure

- `database/` - PostgreSQL schema
- `packages/frontend/` - Next.js application
- `packages/backend/` - Backend services (legacy)
