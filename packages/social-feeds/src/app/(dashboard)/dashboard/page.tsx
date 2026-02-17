'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Activity, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your social automation activity.</p>
                </div>
                <Link href="/editor/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Workflow
                    </Button>
                </Link>
            </div>

            {/* STATS CARDS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 created this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">145</div>
                        <p className="text-xs text-muted-foreground">98% success rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Runs</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Scheduled</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14:00</div>
                        <p className="text-xs text-muted-foreground">Tech News Digest</p>
                    </CardContent>
                </Card>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Latest Executions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${i === 3 ? 'bg-red-500' : 'bg-green-500'}`} />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {i === 3 ? 'Tech News Digest - Automated' : 'Daily Content Blast'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Triggered via Schedule • 10 mins ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-right">
                                            <p className="font-medium">$0.02</p>
                                            <p className="text-xs text-muted-foreground">AI Cost</p>
                                        </div>
                                        <Button variant="ghost" size="sm">View Log</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
