import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
    const { selectedNode: storedSelectedNode, isConfigPanelOpen, toggleConfigPanel, nodes, setNodes, edges, setEdges } = useWorkflowStore();
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [isFetchingSheets, setIsFetchingSheets] = useState(false);
    const [availableSheets, setAvailableSheets] = useState<string[]>([]);

    const fetchSheets = async (spreadsheetId: string) => {
        if (!spreadsheetId) {
            toast.error("Please enter a Spreadsheet ID first");
            return;
        }
        setIsFetchingSheets(true);
        try {
            const res = await fetch(`/api/google/sheets/meta?spreadsheetId=${spreadsheetId}`);
            const data = await res.json();
            if (res.ok) {
                setAvailableSheets(data.sheets || []);
                toast.success(`Found ${data.sheets?.length || 0} sheets`);
            } else {
                toast.error(`Failed to fetch sheets: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch sheets");
        } finally {
            setIsFetchingSheets(false);
        }
    };

    // Always get the latest version of the node from the nodes array to ensure reactivity
    const selectedNode = nodes.find(n => n.id === storedSelectedNode?.id);

    if (!selectedNode) return null;

    const findPreviousNode = () => {
        const incomingEdge = edges.find(e => e.target === selectedNode.id);
        if (!incomingEdge) return null;
        return nodes.find(n => n.id === incomingEdge.source) || null;
    };

    const applyGoogleSheetDetailsFromPreviousNode = (mode: 'source' | 'publisher') => {
        const previousNode = findPreviousNode();
        if (!previousNode) {
            toast.error('No previous node connected.');
            return;
        }

        const sourceData = (previousNode.data || {}) as Record<string, any>;
        const inferredSheetId = (sourceData.sheetId as string) || '';
        const inferredSheetTab = (sourceData.sheetTab as string) || (sourceData.sheetName as string) || '';
        const inferredContentCol = (sourceData.sheetColumn as string) || (sourceData.contentColumn as string) || '';
        const inferredImageCol = (sourceData.imageColumn as string) || '';

        if (!inferredSheetId && !inferredSheetTab && !inferredContentCol && !inferredImageCol) {
            toast.error('Previous node has no Google Sheets details to copy.');
            return;
        }

        setNodes(nodes.map(n => {
            if (n.id !== selectedNode.id) return n;
            if (mode === 'publisher') {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        ...(inferredSheetId ? { sheetId: inferredSheetId } : {}),
                        ...(inferredSheetTab ? { sheetTab: inferredSheetTab } : {}),
                        ...(inferredContentCol ? { contentColumn: inferredContentCol } : {}),
                        ...(inferredImageCol ? { imageColumn: inferredImageCol } : {}),
                    },
                };
            }
            return {
                ...n,
                data: {
                    ...n.data,
                    ...(inferredSheetId ? { sheetId: inferredSheetId } : {}),
                    ...(inferredSheetTab ? { sheetTab: inferredSheetTab } : {}),
                    ...(inferredContentCol ? { sheetColumn: inferredContentCol } : {}),
                },
            };
        }));

        toast.success('Google Sheets details copied from previous node.');
    };

    useEffect(() => {
        const previousNode = findPreviousNode();
        if (!previousNode) return;

        const sourceData = (previousNode.data || {}) as Record<string, any>;
        const inferredSheetId = (sourceData.sheetId as string) || '';
        const inferredSheetTab = (sourceData.sheetTab as string) || (sourceData.sheetName as string) || '';
        const inferredContentCol = (sourceData.sheetColumn as string) || (sourceData.contentColumn as string) || '';
        const inferredImageCol = (sourceData.imageColumn as string) || '';

        const isSourceGoogleSheets =
            (selectedNode.type === 'ai-generation' || selectedNode.type === 'blog-creation') &&
            (selectedNode.data.contentSource as string) === 'google-sheets';
        const isPublisherGoogleSheets = selectedNode.type === 'google-sheets-publisher';

        if (!isSourceGoogleSheets && !isPublisherGoogleSheets) return;

        if (isSourceGoogleSheets) {
            const hasAny = !!(selectedNode.data.sheetId || selectedNode.data.sheetTab || selectedNode.data.sheetColumn);
            if (hasAny) return;
            if (!inferredSheetId && !inferredSheetTab && !inferredContentCol) return;
            setNodes(nodes.map(n => n.id === selectedNode.id
                ? {
                    ...n,
                    data: {
                        ...n.data,
                        ...(inferredSheetId ? { sheetId: inferredSheetId } : {}),
                        ...(inferredSheetTab ? { sheetTab: inferredSheetTab } : {}),
                        ...(inferredContentCol ? { sheetColumn: inferredContentCol } : {}),
                    },
                }
                : n));
            return;
        }

        const hasAnyPublisher = !!(selectedNode.data.sheetId || selectedNode.data.sheetTab || selectedNode.data.contentColumn || selectedNode.data.imageColumn);
        if (hasAnyPublisher) return;
        if (!inferredSheetId && !inferredSheetTab && !inferredContentCol && !inferredImageCol) return;
        setNodes(nodes.map(n => n.id === selectedNode.id
            ? {
                ...n,
                data: {
                    ...n.data,
                    ...(inferredSheetId ? { sheetId: inferredSheetId } : {}),
                    ...(inferredSheetTab ? { sheetTab: inferredSheetTab } : {}),
                    ...(inferredContentCol ? { contentColumn: inferredContentCol } : {}),
                    ...(inferredImageCol ? { imageColumn: inferredImageCol } : {}),
                },
            }
            : n));
    }, [selectedNode.id, selectedNode.type, selectedNode.data.contentSource, selectedNode.data.sheetId, selectedNode.data.sheetTab, selectedNode.data.sheetColumn, selectedNode.data.contentColumn, selectedNode.data.imageColumn, edges, nodes, setNodes]);

    const handleTestExecution = async () => {
        setTestLoading(true);
        setTestResult(null);
        setTestError(null);
        try {
            // Check if we need to substitute variables
            let finalTaskPrompt = (selectedNode.data.taskPrompt as string) || '';
            if (selectedNode.type === 'ai-generation' && selectedNode.data.testInput) {
                finalTaskPrompt = finalTaskPrompt.replace('{{content}}', selectedNode.data.testInput as string);
            }

            // Determine default provider based on node type
            const defaultProvider = selectedNode.type === 'image-generation' ? 'dalle-3' : 'openai';

            const res = await fetch('/api/test-node', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nodeType: selectedNode.type,
                    masterPrompt: selectedNode.data.masterPrompt || '',
                    taskPrompt: finalTaskPrompt,
                    provider: selectedNode.data.provider || defaultProvider,
                    prompt: selectedNode.data.prompt || '',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setTestResult(data.result);
            } else {
                setTestError(data.error || 'Test failed');
            }
        } catch (err: any) {
            setTestError(err.message || 'Network error');
        } finally {
            setTestLoading(false);
        }
    };

    const handleDeleteNode = () => {
        if (!selectedNode) return;
        // Remove edges connected to this node
        const newEdges = edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
        setEdges(newEdges);
        // Remove the node itself
        const newNodes = nodes.filter(n => n.id !== selectedNode.id);
        setNodes(newNodes);
        // Close the panel
        toggleConfigPanel(false);
    };

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
                            <Label>News URL or Search Query</Label>
                            <Input
                                placeholder="AI news  or  https://www.bbc.com/news/..."
                                value={(selectedNode?.data.url as string) || ''}
                                onChange={(e) => {
                                    if (!selectedNode) return;
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, url: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Enter a search term (e.g. &quot;AI news&quot;) or paste a single article URL.
                            </p>
                        </div>
                    </div>
                );

            case 'google-sheets-source':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Spreadsheet ID / URL</Label>
                            <Input
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                value={(selectedNode.data.sheetId as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetId: e.target.value } } : n));
                                }}
                                onBlur={() => {
                                    // Auto-fetch sheets when user leaves the URL field
                                    let id = selectedNode.data.sheetId as string || '';
                                    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
                                    if (match) id = match[1];
                                    if (id) fetchSheets(id);
                                }}
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                disabled={isFetchingSheets || !(selectedNode.data.sheetId as string)}
                                onClick={() => {
                                    let id = selectedNode.data.sheetId as string || '';
                                    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
                                    if (match) id = match[1];
                                    fetchSheets(id);
                                }}
                            >
                                {isFetchingSheets ? 'Fetching...' : 'Fetch Sheets'}
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <Label>Worksheet Name</Label>
                            {availableSheets.length > 0 ? (
                                <Select
                                    value={(selectedNode.data.sheetName as string) || ''}
                                    onValueChange={(val) => {
                                        setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetName: val } } : n));
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select a sheet tab..." /></SelectTrigger>
                                    <SelectContent>
                                        {availableSheets.map(sheet => (
                                            <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    placeholder="Sheet1"
                                    value={(selectedNode.data.sheetName as string) || ''}
                                    onChange={(e) => {
                                        setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetName: e.target.value } } : n));
                                    }}
                                />
                            )}
                            {availableSheets.length === 0 && (
                                <p className="text-[10px] text-muted-foreground">
                                    Enter a Spreadsheet URL above and click &quot;Fetch Sheets&quot; to load available tabs.
                                </p>
                            )}
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
                            <Label>Content Source</Label>
                            <Select
                                value={(selectedNode.data.contentSource as string) || 'upstream'}
                                onValueChange={(val) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, contentSource: val } }
                                            : n
                                    ));
                                }}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upstream">Upstream (Previous Node)</SelectItem>
                                    <SelectItem value="rss">RSS Feed</SelectItem>
                                    <SelectItem value="google-sheets">Google Sheets</SelectItem>
                                </SelectContent>
                            </Select>

                            {(selectedNode.data.contentSource === 'rss') && (
                                <Select
                                    value={(selectedNode.data.rssFeedId as string) || ''}
                                    onValueChange={(val) => {
                                        const feed = useWorkflowStore.getState().rssFeeds.find(f => f.id === val);
                                        setNodes(nodes.map(n =>
                                            n.id === selectedNode.id
                                                ? { ...n, data: { ...n.data, rssFeedId: val, rssUrl: feed?.url } }
                                                : n
                                        ));
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select RSS Feed" /></SelectTrigger>
                                    <SelectContent>
                                        {useWorkflowStore.getState().rssFeeds.map(feed => (
                                            <SelectItem key={feed.id} value={feed.id}>{feed.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {(selectedNode.data.contentSource === 'google-sheets') && (
                                <div className="space-y-2 border-l-2 border-muted pl-2 mt-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full h-8 text-xs"
                                        onClick={() => applyGoogleSheetDetailsFromPreviousNode('source')}
                                    >
                                        Use Previous Node Sheet Details
                                    </Button>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Spreadsheet ID</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={(selectedNode.data.sheetId as string) || ''}
                                            onChange={(e) => {
                                                setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetId: e.target.value } } : n));
                                            }}
                                            placeholder={useWorkflowStore.getState().googleSheetsConfig.spreadsheetId || "ID..."}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Tab Name</Label>
                                            <div className="flex gap-1">
                                                {availableSheets.length > 0 ? (
                                                    <Select
                                                        value={(selectedNode.data.sheetTab as string) || ''}
                                                        onValueChange={(val) => {
                                                            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetTab: val } } : n));
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Tab" /></SelectTrigger>
                                                        <SelectContent>
                                                            {availableSheets.map(sheet => (
                                                                <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        className="h-8 text-xs"
                                                        value={(selectedNode.data.sheetTab as string) || ''}
                                                        onChange={(e) => {
                                                            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetTab: e.target.value } } : n));
                                                        }}
                                                        placeholder="Sheet1"
                                                    />
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    disabled={isFetchingSheets}
                                                    onClick={() => fetchSheets(selectedNode.data.sheetId as string || useWorkflowStore.getState().googleSheetsConfig.spreadsheetId || '')}
                                                >
                                                    <Plus className={`h-3 w-3 ${isFetchingSheets ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Content Col</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                value={(selectedNode.data.sheetColumn as string) || ''}
                                                onChange={(e) => {
                                                    setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetColumn: e.target.value } } : n));
                                                }}
                                                placeholder="A"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        Leave blank to use Global Settings.
                                    </div>
                                </div>
                            )}
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

                        <div className="grid gap-2">
                            <Label>Test Input Content</Label>
                            <div className="text-xs text-muted-foreground mb-1">Content to substitute for {"{{content}}"} during testing.</div>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Paste article text or simulation content here..."
                                value={(selectedNode.data.testInput as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, testInput: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                        </div>
                    </div>
                );

            case 'blog-creation':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Content Source</Label>
                            <Select
                                value={(selectedNode.data.contentSource as string) || 'upstream'}
                                onValueChange={(val) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, contentSource: val } }
                                            : n
                                    ));
                                }}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upstream">Upstream (Previous Node)</SelectItem>
                                    <SelectItem value="rss">RSS Feed</SelectItem>
                                    <SelectItem value="google-sheets">Google Sheets</SelectItem>
                                </SelectContent>
                            </Select>

                            {(selectedNode.data.contentSource === 'rss') && (
                                <Select
                                    value={(selectedNode.data.rssFeedId as string) || ''}
                                    onValueChange={(val) => {
                                        const feed = useWorkflowStore.getState().rssFeeds.find(f => f.id === val);
                                        setNodes(nodes.map(n =>
                                            n.id === selectedNode.id
                                                ? { ...n, data: { ...n.data, rssFeedId: val, rssUrl: feed?.url } }
                                                : n
                                        ));
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select RSS Feed" /></SelectTrigger>
                                    <SelectContent>
                                        {useWorkflowStore.getState().rssFeeds.map(feed => (
                                            <SelectItem key={feed.id} value={feed.id}>{feed.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {(selectedNode.data.contentSource === 'google-sheets') && (
                                <div className="space-y-2 border-l-2 border-muted pl-2 mt-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full h-8 text-xs"
                                        onClick={() => applyGoogleSheetDetailsFromPreviousNode('source')}
                                    >
                                        Use Previous Node Sheet Details
                                    </Button>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Spreadsheet ID</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={(selectedNode.data.sheetId as string) || ''}
                                            onChange={(e) => {
                                                setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetId: e.target.value } } : n));
                                            }}
                                            placeholder={useWorkflowStore.getState().googleSheetsConfig.spreadsheetId || "ID..."}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Tab Name</Label>
                                            <div className="flex gap-1">
                                                {availableSheets.length > 0 ? (
                                                    <Select
                                                        value={(selectedNode.data.sheetTab as string) || ''}
                                                        onValueChange={(val) => {
                                                            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetTab: val } } : n));
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Tab" /></SelectTrigger>
                                                        <SelectContent>
                                                            {availableSheets.map(sheet => (
                                                                <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        className="h-8 text-xs"
                                                        value={(selectedNode.data.sheetTab as string) || ''}
                                                        onChange={(e) => {
                                                            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetTab: e.target.value } } : n));
                                                        }}
                                                        placeholder="Sheet1"
                                                    />
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    disabled={isFetchingSheets}
                                                    onClick={() => fetchSheets(selectedNode.data.sheetId as string || useWorkflowStore.getState().googleSheetsConfig.spreadsheetId || '')}
                                                >
                                                    <Plus className={`h-3 w-3 ${isFetchingSheets ? 'animate-spin' : ''}`} />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label className="text-xs">Content Col</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                value={(selectedNode.data.sheetColumn as string) || ''}
                                                onChange={(e) => {
                                                    setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetColumn: e.target.value } } : n));
                                                }}
                                                placeholder="A"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Blog Style Prompt</Label>
                            <textarea
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Write a detailed blog post with intro, key points, and conclusion. Use a clear headline and subheadings."
                                value={(selectedNode.data.blogPrompt as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, blogPrompt: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Uses upstream content (for example news source output) and generates blog-ready text.
                            </p>
                        </div>
                    </div>
                );

            case 'image-generation':
                return (
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Image Provider</Label>
                            <Select
                                value={(selectedNode.data.provider as string) || 'dalle-3'}
                                onValueChange={(val) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, provider: val } }
                                            : n
                                    ));
                                }}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dalle-3">DALL-E 3 (OpenAI)</SelectItem>
                                    <SelectItem value="nano-banana">Nano Banana (Gemini Flash)</SelectItem>
                                    <SelectItem value="stable-diffusion">Stable Diffusion (Coming Soon)</SelectItem>
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
            case 'threads-publisher':
            case 'wordpress-publisher':
            case 'wix-publisher':
            case 'squarespace-publisher':
            case 'google-sheets-publisher':
                const platformMap: Record<string, string> = {
                    'facebook-publisher': 'facebook',
                    'linkedin-publisher': 'linkedin',
                    'instagram-publisher': 'instagram',
                    'threads-publisher': 'threads',
                    'wordpress-publisher': 'wordpress',
                    'wix-publisher': 'wix',
                    'squarespace-publisher': 'squarespace',
                    'google-sheets-publisher': 'google-sheets',
                };

                if (selectedNode.type === 'google-sheets-publisher') {
                    return (
                        <div className="space-y-4">
                        <div className="space-y-2 border-l-2 border-muted pl-2 mt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full h-8 text-xs"
                                    onClick={() => applyGoogleSheetDetailsFromPreviousNode('publisher')}
                                >
                                    Use Previous Node Sheet Details
                                </Button>
                                <div className="grid gap-1">
                                    <Label className="text-xs">Spreadsheet ID</Label>
                                    <Input
                                        className="h-8 text-xs"
                                        value={(selectedNode.data.sheetId as string) || ''}
                                        onChange={(e) => {
                                            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetId: e.target.value } } : n));
                                        }}
                                        placeholder={useWorkflowStore.getState().googleSheetsConfig.spreadsheetId || "ID..."}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Tab Name</Label>
                                        <div className="flex gap-1">
                                            {availableSheets.length > 0 ? (
                                                <Select
                                                    value={(selectedNode.data.sheetTab as string) || ''}
                                                    onValueChange={(val) => {
                                                        setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetTab: val } } : n));
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Tab" /></SelectTrigger>
                                                    <SelectContent>
                                                        {availableSheets.map(sheet => (
                                                            <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    className="h-8 text-xs"
                                                    value={(selectedNode.data.sheetTab as string) || ''}
                                                    onChange={(e) => {
                                                        setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetTab: e.target.value } } : n));
                                                    }}
                                                    placeholder="Sheet1"
                                                />
                                            )}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                disabled={isFetchingSheets}
                                                onClick={() => fetchSheets(selectedNode.data.sheetId as string || useWorkflowStore.getState().googleSheetsConfig.spreadsheetId || '')}
                                            >
                                                <Plus className={`h-3 w-3 ${isFetchingSheets ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Content Column</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={(selectedNode.data.contentColumn as string) || ''}
                                            onChange={(e) => {
                                                setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, contentColumn: e.target.value } } : n));
                                            }}
                                            placeholder="A"
                                        />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">Image Column</Label>
                                        <Input
                                            className="h-8 text-xs"
                                            value={(selectedNode.data.imageColumn as string) || ''}
                                            onChange={(e) => {
                                                setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, imageColumn: e.target.value } } : n));
                                            }}
                                            placeholder="B (Optional)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
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

                        {(selectedNode.type === 'wordpress-publisher' || selectedNode.type === 'wix-publisher' || selectedNode.type === 'squarespace-publisher') && (
                            <div className="grid gap-2">
                                <Label>Site URL / API Endpoint</Label>
                                <Input
                                    placeholder={
                                        selectedNode.type === 'wordpress-publisher'
                                            ? "https://yoursite.com"
                                            : "https://api.example.com/publish"
                                    }
                                    value={(selectedNode.data.siteUrl as string) || ''}
                                    onChange={(e) => {
                                        setNodes(nodes.map(n =>
                                            n.id === selectedNode.id
                                                ? { ...n, data: { ...n.data, siteUrl: e.target.value } }
                                                : n
                                        ));
                                    }}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    For WordPress this is the site URL. For Wix/Squarespace this can be a publish endpoint/webhook.
                                </p>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Image URL (Optional)</Label>
                            <Input
                                placeholder="https://example.com/image.jpg (or leave empty to use generated image)"
                                value={(selectedNode.data.imageUrl as string) || ''}
                                onChange={(e) => {
                                    setNodes(nodes.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, imageUrl: e.target.value } }
                                            : n
                                    ));
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                If you have an Image Generation node before this, leave this empty to use its output automatically.
                            </p>
                        </div>

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

                        <div className="pt-4 space-y-3">
                            <Button
                                className="w-full"
                                variant="secondary"
                                size="sm"
                                onClick={handleTestExecution}
                                disabled={testLoading}
                            >
                                {testLoading ? 'Testing...' : 'Test Node Execution'}
                            </Button>
                            {testResult && (
                                <div className="rounded-md border bg-muted/50 p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                                    <p className="font-medium text-xs text-green-600 mb-1">✓ Test Result</p>
                                    {testResult}
                                </div>
                            )}
                            {testError && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    <p className="font-medium text-xs mb-1">✗ Error</p>
                                    {testError}
                                </div>
                            )}

                            <Separator className="my-4" />

                            <Button
                                className="w-full bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteNode}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Node
                            </Button>
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
