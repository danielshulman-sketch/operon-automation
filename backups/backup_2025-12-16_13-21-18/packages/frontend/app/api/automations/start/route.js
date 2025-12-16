import { NextResponse } from 'next/server';
import { initScheduler } from '../../../lib/automation/scheduler';

let initialized = false;

export async function GET() {
    if (!initialized) {
        initScheduler();
        initialized = true;
        return NextResponse.json({ message: 'Scheduler started' });
    }
    return NextResponse.json({ message: 'Scheduler already running' });
}
