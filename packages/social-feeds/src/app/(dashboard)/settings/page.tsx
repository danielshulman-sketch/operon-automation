'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/lib/store';

export default function SettingsPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account and application preferences.</p>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" defaultValue="Daniel Shulman" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" defaultValue="daniel@example.com" disabled />
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Personas</CardTitle>
                        <CardDescription>Manage master prompts for your AI workflows.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {useWorkflowStore.getState().personas.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 border rounded bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center ${useWorkflowStore.getState().defaultPersonaId === p.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                                            onClick={() => useWorkflowStore.getState().setDefaultPersonaId(p.id)}
                                            title="Set as Default"
                                        >
                                            {useWorkflowStore.getState().defaultPersonaId === p.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                {p.name}
                                                {useWorkflowStore.getState().defaultPersonaId === p.id && <Badge variant="secondary" className="text-[10px] h-5">Default</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">{p.prompt}</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => useWorkflowStore.getState().removePersona(p.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label>New Persona Name</Label>
                            <Input placeholder="e.g. Friendly Helper" id="new-persona-name" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Master Prompt</Label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="You are a helper..."
                                id="new-persona-prompt"
                            />
                        </div>
                        <Button onClick={() => {
                            const nameInput = document.getElementById('new-persona-name') as HTMLInputElement;
                            const promptInput = document.getElementById('new-persona-prompt') as HTMLTextAreaElement;
                            if (nameInput.value && promptInput.value) {
                                useWorkflowStore.getState().addPersona({
                                    id: Date.now().toString(),
                                    name: nameInput.value,
                                    prompt: promptInput.value
                                });
                                nameInput.value = '';
                                promptInput.value = '';
                                // Force re-render not handled here without state, but store updates.
                                // In real app, create a sub-component with local state.
                            }
                        }}>Add Persona</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Configure how you receive alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="email-notif" className="flex flex-col space-y-1">
                                <span>Email Notifications</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive emails about workflow failures.</span>
                            </Label>
                            <Switch id="email-notif" defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="slack-notif" className="flex flex-col space-y-1">
                                <span>Slack Notifications</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive alerts in a dedicated Slack channel.</span>
                            </Label>
                            <Switch id="slack-notif" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive">Delete Account</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
