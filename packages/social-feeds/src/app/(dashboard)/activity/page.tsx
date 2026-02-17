'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react';

const activities = [
    { id: 1, type: 'success', message: 'Workflow "Tech News Digest" executed successfully.', time: '2 hours ago' },
    { id: 2, type: 'info', message: 'User updated "Daily Content Blast" schedule.', time: '4 hours ago' },
    { id: 3, type: 'error', message: 'Workflow "Viral Thread Generator" failed: API Rate Limit exceeded.', time: '1 day ago' },
    { id: 4, type: 'success', message: 'Connected new Google Sheet "Content Calendar".', time: '1 day ago' },
    { id: 5, type: 'success', message: 'Workflow "Morning Motivation" executed successfully.', time: '2 days ago' },
];

export default function ActivityPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
                    <p className="text-muted-foreground mt-1">Audit trail of all system actions and workflow executions.</p>
                </div>
            </div>

            <Card className="h-[600px] flex flex-col">
                <CardHeader>
                    <CardTitle>System Events</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full px-6 pb-6">
                        <div className="space-y-6">
                            {activities.map((activity) => (
                                <div key={activity.id} className="flex gap-4 items-start pb-6 border-b last:border-0 last:pb-0">
                                    <div className="mt-1">
                                        {activity.type === 'success' && <CheckCircle2 className="text-green-500 h-5 w-5" />}
                                        {activity.type === 'error' && <AlertCircle className="text-red-500 h-5 w-5" />}
                                        {activity.type === 'info' && <Info className="text-blue-500 h-5 w-5" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{activity.message}</p>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Clock className="mr-1 h-3 w-3" />
                                            {activity.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
