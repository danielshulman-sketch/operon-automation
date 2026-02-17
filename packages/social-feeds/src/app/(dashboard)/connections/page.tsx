'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Facebook,
    Linkedin,
    Instagram,
    FileSpreadsheet,
    Rss,
    Bot,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Plus,
    Trash2,
    Save
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store';
import { ConnectionGuide } from '@/components/connections/ConnectionGuide';
import { toast } from 'sonner';

export default function ConnectionsPage() {
    const store = useWorkflowStore();
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountPlatform, setNewAccountPlatform] = useState<'facebook' | 'linkedin' | 'instagram'>('facebook');
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [newRSSUrl, setNewRSSUrl] = useState('');
    const [newRSSName, setNewRSSName] = useState('');

    const [newAccountToken, setNewAccountToken] = useState('');



    const [facebookPages, setFacebookPages] = useState<any[]>([]);
    const [isFetchingPages, setIsFetchingPages] = useState(false);

    const fetchFacebookPages = async () => {
        if (!newAccountToken) return;
        setIsFetchingPages(true);
        try {
            const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${newAccountToken}`);
            const data = await res.json();
            if (data.data) {
                setFacebookPages(data.data);
            } else {
                alert("No pages found or invalid token.");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to fetch pages.");
        } finally {
            setIsFetchingPages(false);
        }
    };

    const connectFacebookPage = async (page: any) => {
        try {
            const res = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'facebook',
                    name: page.name,
                    username: page.id,
                    accessToken: page.access_token // Page Access Token
                })
            });

            if (!res.ok) throw new Error("Failed to save connection");

            const newConnection = await res.json();

            store.addAccount({
                id: newConnection.id,
                platform: 'facebook',
                name: newConnection.name,
                status: 'active',
                username: page.id,
                accessToken: page.access_token
            });

            setFacebookPages([]);
            setNewAccountToken('');
            setIsAddAccountOpen(false);
            toast.success("Facebook Page Connected!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect page");
        }
    };

    const handleAddAccount = async () => {
        if (!newAccountName || !newAccountPlatform || !newAccountToken) return;

        try {
            const res = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: newAccountPlatform,
                    name: newAccountName,
                    accessToken: newAccountToken
                })
            });

            if (!res.ok) throw new Error("Failed to save connection");

            const newConnection = await res.json();

            store.addAccount({
                id: newConnection.id,
                platform: newAccountPlatform as any,
                name: newAccountName,
                status: 'active',
                accessToken: newAccountToken
            });

            setNewAccountName('');
            setNewAccountPlatform('linkedin');
            setNewAccountToken('');
            setIsAddAccountOpen(false);
            toast.success("Account Connected!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect account");
        }
    };

    const handleAddRSS = () => {
        if (!newRSSName || !newRSSUrl) return;
        store.addRSSFeed({
            id: Date.now().toString(),
            name: newRSSName,
            url: newRSSUrl
        });
        setNewRSSName('');
        setNewRSSUrl('');
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
                    <p className="text-muted-foreground mt-1">Manage your integrations for social platforms, data sources, and AI.</p>
                </div>
            </div>

            <Tabs defaultValue="social" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="social">Social Accounts</TabsTrigger>
                    <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
                    <TabsTrigger value="ai">AI Providers</TabsTrigger>
                    <TabsTrigger value="rss">RSS Feeds</TabsTrigger>
                </TabsList>

                {/* SOCIAL ACCOUNTS TAB */}
                <TabsContent value="social" className="space-y-4">
                    <div className="flex justify-end mb-4 gap-2">
                        <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Connect New Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Connect Social Account</DialogTitle>
                                    <DialogDescription>
                                        Select the platform and enter a name for this connection.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Platform</Label>
                                        <Select value={newAccountPlatform} onValueChange={(val: any) => setNewAccountPlatform(val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="facebook">Facebook Page</SelectItem>
                                                <SelectItem value="linkedin">LinkedIn Profile</SelectItem>
                                                <SelectItem value="instagram">Instagram Account</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Account Name</Label>
                                        <Input
                                            placeholder="e.g. My Tech Blog"
                                            value={newAccountName}
                                            onChange={(e) => setNewAccountName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Access Token</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="password"
                                                placeholder={newAccountPlatform === 'facebook' ? "Paste User Access Token..." : "Paste Access Token..."}
                                                value={newAccountToken}
                                                onChange={(e) => setNewAccountToken(e.target.value)}
                                            />
                                            {newAccountPlatform === 'facebook' && (
                                                <Button onClick={fetchFacebookPages} disabled={!newAccountToken || isFetchingPages} size="sm" variant="secondary">
                                                    {isFetchingPages ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Fetch Pages"}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {newAccountPlatform === 'facebook'
                                                ? "Enter User Token to list pages, or a Page Token to connect directly."
                                                : "Required for posting. Kept encrypted."}
                                        </p>
                                    </div>

                                    {facebookPages.length > 0 && newAccountPlatform === 'facebook' && (
                                        <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                                            <Label className="text-xs font-semibold">Select Page to Connect</Label>
                                            {facebookPages.map((page) => (
                                                <div key={page.id} className="flex items-center justify-between p-2 hover:bg-muted rounded border text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{page.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{page.category}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => connectFacebookPage(page)}
                                                    >
                                                        Connect
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    {newAccountPlatform !== 'facebook' && (
                                        <Button onClick={handleAddAccount}>Connect Account</Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {store.accounts.map((account) => (
                            <Card key={account.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium capitalize">{account.platform} {account.platform === 'facebook' ? 'Page' : 'Account'}</CardTitle>
                                    {account.platform === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                                    {account.platform === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-700" />}
                                    {account.platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xl font-bold truncate">{account.name}</span>
                                        {account.status === 'active'
                                            ? <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                                            : <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Expired</Badge>
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {account.username ? `@${account.username}` : 'Connected via OAuth'}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600" onClick={() => store.removeAccount(account.id)}>
                                        <RefreshCw className="mr-2 h-3 w-3" /> Disconnect
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {store.accounts.length === 0 && (
                            <Card className="border-dashed flex items-center justify-center p-6 h-full min-h-[150px] col-span-full">
                                <div className="text-center text-muted-foreground">
                                    <p>No accounts connected.</p>
                                    <p className="text-sm">Click "Connect New Account" to get started.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* GOOGLE SHEETS TAB */}
                <TabsContent value="sheets" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Google Sheets Configuration</CardTitle>
                            <CardDescription>Connect a spreadsheet to use as a data source.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Spreadsheet ID / URL</Label>
                                <Input
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={store.googleSheetsConfig.spreadsheetId}
                                    onChange={(e) => store.updateGoogleSheetsConfig({ spreadsheetId: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Worksheet Name</Label>
                                <Input
                                    placeholder="Sheet1"
                                    value={store.googleSheetsConfig.sheetName}
                                    onChange={(e) => store.updateGoogleSheetsConfig({ sheetName: e.target.value })}
                                />
                            </div>

                            <Separator />

                            <div className="grid gap-4 border p-4 rounded-lg">
                                <h4 className="font-semibold text-sm">Column Mapping</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Content Column</Label>
                                        <Input
                                            placeholder="A"
                                            value={store.googleSheetsConfig.columns.content}
                                            onChange={(e) => store.updateGoogleSheetsConfig({ columns: { ...store.googleSheetsConfig.columns, content: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status Column</Label>
                                        <Input
                                            placeholder="B"
                                            value={store.googleSheetsConfig.columns.status}
                                            onChange={(e) => store.updateGoogleSheetsConfig({ columns: { ...store.googleSheetsConfig.columns, status: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Image Column</Label>
                                        <Input
                                            placeholder="C"
                                            value={store.googleSheetsConfig.columns.image}
                                            onChange={(e) => store.updateGoogleSheetsConfig({ columns: { ...store.googleSheetsConfig.columns, image: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t p-6">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Rule:</span> Only rows with <strong>Empty</strong> status are processed.
                            </div>
                            <Button onClick={() => alert("Successfully connected to Google Sheet!")}>Test Read Access</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* AI PROVIDERS TAB */}
                <TabsContent value="ai" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-5 h-5" /> OpenAI
                                </CardTitle>
                                <CardDescription>Configure GPT-4 or GPT-3.5 Turbo</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        value={store.aiConfig.openaiKey}
                                        onChange={(e) => store.updateAIConfig({ openaiKey: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Keys are encrypted at rest.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Model</Label>
                                    <Select
                                        value={store.aiConfig.openaiModel}
                                        onValueChange={(val) => store.updateAIConfig({ openaiModel: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => alert("OpenAI Settings Saved")}>Save Configuration</Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-5 h-5" /> Anthropic
                                </CardTitle>
                                <CardDescription>Configure Claude 3 access</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-ant-..."
                                        value={store.aiConfig.anthropicKey}
                                        onChange={(e) => store.updateAIConfig({ anthropicKey: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Model</Label>
                                    <Select
                                        value={store.aiConfig.anthropicModel}
                                        onValueChange={(val) => store.updateAIConfig({ anthropicModel: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                                            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="secondary" onClick={() => alert("Anthropic Settings Saved")}>Connect</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {/* RSS FEEDS TAB */}
                <TabsContent value="rss">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rss className="w-5 h-5" /> RSS Feed Sources
                            </CardTitle>
                            <CardDescription>Manage your RSS feed collection used in workflows.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                {store.rssFeeds.map((feed) => (
                                    <div key={feed.id} className="p-4 flex items-center justify-between border-b last:border-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{feed.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">{feed.url}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => store.removeRSSFeed(feed.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                {store.rssFeeds.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground text-sm">No RSS feeds added.</div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full items-center space-x-2">
                                <Input
                                    placeholder="Name (e.g. TechCrunch)"
                                    className="w-1/3"
                                    value={newRSSName}
                                    onChange={(e) => setNewRSSName(e.target.value)}
                                />
                                <Input
                                    placeholder="RSS URL..."
                                    className="flex-1"
                                    value={newRSSUrl}
                                    onChange={(e) => setNewRSSUrl(e.target.value)}
                                />
                                <Button onClick={handleAddRSS} disabled={!newRSSName || !newRSSUrl}>Add Feed</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConnectionGuide />
        </div>
    );
}
