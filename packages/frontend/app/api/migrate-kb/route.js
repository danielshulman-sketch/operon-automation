import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireSuperAdmin } from '@/utils/auth';

export async function POST(request) {
    try {
        await requireSuperAdmin(request);

        // Drop existing tables if they exist (to fix schema issues)
        await query(`DROP TABLE IF EXISTS chat_messages CASCADE`);
        await query(`DROP TABLE IF EXISTS chat_conversations CASCADE`);
        await query(`DROP TABLE IF EXISTS knowledge_base CASCADE`);
        await query(`DROP TABLE IF EXISTS org_api_keys CASCADE`);

        // Create knowledge base table for PostgreSQL with UUID support
        await query(`
            CREATE TABLE knowledge_base (
                id SERIAL PRIMARY KEY,
                org_id UUID NOT NULL,
                title VARCHAR(500) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(100),
                tags TEXT,
                created_by UUID,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                is_active BOOLEAN DEFAULT true
            )
        `);

        // Create org API keys table with UUID
        await query(`
            CREATE TABLE org_api_keys (
                id SERIAL PRIMARY KEY,
                org_id UUID UNIQUE,
                openai_api_key TEXT NOT NULL,
                created_by UUID,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create chat conversations table
        await query(`
            CREATE TABLE chat_conversations (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL,
                org_id UUID NOT NULL,
                chat_type VARCHAR(50) NOT NULL,
                title VARCHAR(500),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create chat messages table
        await query(`
            CREATE TABLE chat_messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER NOT NULL,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create indexes
        await query(`CREATE INDEX idx_knowledge_base_org ON knowledge_base(org_id)`);
        await query(`CREATE INDEX idx_knowledge_base_active ON knowledge_base(is_active)`);
        await query(`CREATE INDEX idx_org_api_keys_org ON org_api_keys(org_id)`);
        await query(`CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id)`);
        await query(`CREATE INDEX idx_chat_conversations_org ON chat_conversations(org_id)`);
        await query(`CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id)`);

        return NextResponse.json({
            success: true,
            message: 'All tables created successfully (knowledge base, API keys, and chat)'
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: error.message || 'Migration failed' },
            { status: 500 }
        );
    }
}
