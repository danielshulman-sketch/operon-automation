'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function ActivityPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
                    <p className="text-muted-foreground mt-1">Audit trail of all system actions and workflow executions.</p>
                </div>
            </div>

            <Card className="h-[400px] flex flex-col">
                <CardHeader>
                    <CardTitle>System Events</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <Info className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                            No activity recorded yet. Activity will appear here once you start running workflows.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
