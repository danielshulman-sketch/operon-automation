import React from 'react';
import { useWorkflowStore } from '@/lib/store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';

export const NodeConfigPanel = () => {
    const { selectedNode, isConfigPanelOpen, toggleConfigPanel, nodes, setNodes } = useWorkflowStore();

    if (!selectedNode) return null;

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLabel = e.target.value;
        setNodes(nodes.map(n =>
            n.id === selectedNode.id
                ? { ...n, data: { ...n.data, label: newLabel } }
                : n
        ));
    };

    const renderSpecificConfig = () => {
        switch (selectedNode.type) {
            case 'manual-trigger':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Test Content</Label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter text to simulate a trigger..."
                                value={(selectedNode.data.testContent as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, testContent: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Test Image URL</Label>
                            <Input
                                placeholder="https://example.com/image.jpg"
                                value={(selectedNode.data.testImageUrl as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, testImageUrl: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                        </div>
                    </div>
                );

            case 'schedule-trigger':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Add Schedule Time</Label>
                            <div className="flex gap-2">
                                <Select>
                                    <SelectTrigger className="w-[110px]"><SelectValue placeholder="Day" /></SelectTrigger>
                                    <SelectContent>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                            <SelectItem key={day} value={day}>{day}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input type="time" className="flex-1" />
                                <Button size="icon" variant="secondary"><Plus className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Active Schedules</Label>
                            <div className="rounded-md border p-2 space-y-2">
                                <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                    <span>Mon, 09:00 AM</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="w-3 h-3 text-red-500" /></Button>
                                </div>
                                <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                    <span>Wed, 02:30 PM</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="w-3 h-3 text-red-500" /></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'rss-source':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>RSS Feed URL</Label>
                            <Input placeholder="https://example.com/feed.xml" />
                        </div>
                    </div>
                );

            case 'google-sheets-source':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Spreadsheet ID / URL</Label>
                            <Input placeholder="https://docs.google.com/spreadsheets/d/..." />
                        </div>
                        <div className="grid gap-2">
                            <Label>Worksheet Name</Label>
                            <Input placeholder="Sheet1" />
                        </div>
                        <Separator />
                        <h4 className="font-medium text-sm">Column Mapping</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Content Column</Label>
                                <Input placeholder="A" />
                            </div>
                            <div className="space-y-2">
                                <Label>Image Column</Label>
                                <Input placeholder="C" />
                            </div>
                        </div>
                    </div>
                );

            case 'ai-generation':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Provider</Label>
                            <Select defaultValue="openai" onValueChange={(val) => {
                                setNodes(nodes.map(n =>
                                    n.id === selectedNode.id
                                        ? { ...n, data: { ...n.data, provider: val } }
                                        : n
                                ));
                            }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                                    <SelectItem value="anthropic">Anthropic (Claude 3)</SelectItem>
                                    <SelectItem value="gemini">Google Gemini 1.5</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Master Prompt / Persona</Label>
                            <div className="text-xs text-muted-foreground mb-1">Set the tone, style, and identity for the AI.</div>

                            <Select onValueChange={(val) => {
                                const persona = useWorkflowStore.getState().personas.find(p => p.id === val);
                                if (persona) {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, masterPrompt: persona.prompt } }
                                            : n
                                    ));
                                }
                            }}>
                                <SelectTrigger><SelectValue placeholder="Load a Persona..." /></SelectTrigger>
                                <SelectContent>
                                    {useWorkflowStore.getState().personas.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                                placeholder="You are a professional social media manager. Tone: Witty and engaging."
                                value={(selectedNode.data.masterPrompt as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, masterPrompt: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Task Prompt</Label>
                            <div className="text-xs text-muted-foreground mb-1">Use {"{{content}}"} to insert source text.</div>
                            <textarea className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Summarize this article for LinkedIn: {{content}}"
                                value={(selectedNode.data.taskPrompt as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, taskPrompt: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                        </div>
                    </div>
                );

            case 'image-generation':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Image Provider</Label>
                            <Select defaultValue="dalle-3">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dalle-3">DALL-E 3</SelectItem>
                                    <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Image Prompt</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Describe the image you want to generate..."
                                value={(selectedNode.data.prompt as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, prompt: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                        </div>
                    </div>
                );

            case 'facebook-publisher':
            case 'linkedin-publisher':
            case 'instagram-publisher':
                const platformMap: Record<string, string> = {
                    'facebook-publisher': 'facebook',
                    'linkedin-publisher': 'linkedin',
                    'instagram-publisher': 'instagram'
                };
                const platform = platformMap[selectedNode.type || ''] || 'facebook';
                const availableAccounts = useWorkflowStore.getState().accounts.filter(a => a.platform === platform);

                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Select Account / Page</Label>
                            <Select onValueChange={(val) => {
                                setNodes(nodes.map(n =>
                                    n.id === selectedNode.id
                                        ? { ...n, data: { ...n.data, accountId: val } }
                                        : n
                                ));
                            }} defaultValue={(selectedNode.data.accountId as string) || ''}>
                                <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
                                <SelectContent>
                                    {availableAccounts.map(account => (
                                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {availableAccounts.length === 0 && <p className="text-[10px] text-red-500">No connected accounts found. Go to Connections to add one.</p>}
                        </div>

                        {selectedNode.type === 'instagram-publisher' && (
                            <div className="grid gap-2">
                                <Label>Post Type</Label>
                                <Select onValueChange={(val) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, postType: val } }
                                            : n
                                    ));
                                }} defaultValue={(selectedNode.data.postType as string) || 'image'}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="image">Image / Video (Normal)</SelectItem>
                                        <SelectItem value="reel">Reel</SelectItem>
                                        <SelectItem value="carousel">Carousel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Text Source</Label>
                            <Select onValueChange={(val) => {
                                setNodes(nodes.map(n =>
                                    n.id === selectedNode.id
                                        ? { ...n, data: { ...n.data, textSource: val } }
                                        : n
                                ));
                            }} defaultValue={(selectedNode.data.textSource as string) || 'trigger'}>
                                <SelectTrigger><SelectValue placeholder="Select text source" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trigger">Trigger Text</SelectItem>
                                    <SelectItem value="ai-generated">AI Generated Text</SelectItem>
                                    <SelectItem value="none">None (Image Only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Image Source</Label>
                            <Select onValueChange={(val) => {
                                setNodes(nodes.map(n =>
                                    n.id === selectedNode.id
                                        ? { ...n, data: { ...n.data, imageSource: val } }
                                        : n
                                ));
                            }} defaultValue={(selectedNode.data.imageSource as string) || 'none'}>
                                <SelectTrigger><SelectValue placeholder="Select image source" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (Text Only)</SelectItem>
                                    <SelectItem value="trigger-image">Trigger Image URL</SelectItem>
                                    <SelectItem value="image-generated">AI Generated Image</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Schedule Delay</Label>
                            <Input
                                placeholder="e.g. 2 hours, 1 day"
                                value={(selectedNode.data.scheduleTime as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, scheduleTime: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">Leave empty to post immediately.</p>
                        </div>
                    </div>
                );

            default:
                return <div className="text-sm text-muted-foreground">Configuration not yet implemented for this node type.</div>;
        }
    };

    return (
        <Sheet open={isConfigPanelOpen} onOpenChange={toggleConfigPanel}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Configure {selectedNode.data.label as string}</SheetTitle>
                    <SheetDescription>
                        ID: {selectedNode.id} • Type: {selectedNode.type}
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full">
                        <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                        <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 mt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="node-label">Label</Label>
                            <Input
                                id="node-label"
                                value={selectedNode.data.label as string}
                                onChange={handleLabelChange}
                            />
                        </div>

                        <Separator />

                        {renderSpecificConfig()}

                        <div className="pt-4">
                            <Button className="w-full" variant="secondary" size="sm">Test Node Execution</Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-4">
                        <div className="text-sm text-muted-foreground">
                            Retry policy and error handling settings will go here.
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
};
