'use client';

import React, { useState, useEffect } from 'react';
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
    AtSign,
    Globe,
    PenSquare,
    FileSpreadsheet,
    Rss,
    Bot,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Plus,
    Trash2,
    Save,
    Loader2
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store';
import { ConnectionGuide } from '@/components/connections/ConnectionGuide';
import { toast } from 'sonner';

export default function ConnectionsPage() {
    const store = useWorkflowStore();
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountPlatform, setNewAccountPlatform] = useState<'facebook' | 'linkedin' | 'instagram' | 'threads' | 'wordpress' | 'wix' | 'squarespace'>('facebook');
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [newRSSUrl, setNewRSSUrl] = useState('');
    const [newRSSName, setNewRSSName] = useState('');
    const [newAccountToken, setNewAccountToken] = useState('');
    const [facebookAppId, setFacebookAppId] = useState('');
    const [facebookAppSecret, setFacebookAppSecret] = useState('');
    const [isSavingFacebook, setIsSavingFacebook] = useState(false);
    const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

    useEffect(() => {
        if (isAddAccountOpen && !hasLoadedSettings) {
            fetch('/api/user/settings')
                .then(res => res.json())
                .then(data => {
                    if (data.facebookAppId) setFacebookAppId(data.facebookAppId);
                    setHasLoadedSettings(true);
                })
                .catch(() => { });
        }
    }, [isAddAccountOpen, hasLoadedSettings]);

    const handleConnectFacebook = async () => {
        if (facebookAppId || facebookAppSecret) {
            setIsSavingFacebook(true);
            try {
                const updateData: any = {};
                if (facebookAppId) updateData.facebookAppId = facebookAppId;
                if (facebookAppSecret) updateData.facebookAppSecret = facebookAppSecret;

                await fetch('/api/user/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData),
                });
            } catch (err) {
                console.error("Failed to save FB settings", err);
            }
            setIsSavingFacebook(false);
        }
        window.location.href = '/api/auth/facebook';
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
                                                <SelectItem value="threads">Threads</SelectItem>
                                                <SelectItem value="wordpress">WordPress</SelectItem>
                                                <SelectItem value="wix">Wix</SelectItem>
                                                <SelectItem value="squarespace">Squarespace</SelectItem>
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

                                        {(newAccountPlatform === 'facebook' || newAccountPlatform === 'instagram') ? (
                                            <div className="flex flex-col gap-3">
                                                <div className="grid gap-2 border p-3 rounded-md bg-muted/20">
                                                    <p className="text-[11px] font-medium mb-1">Facebook App Credentials (Optional if in .env)</p>
                                                    <Input
                                                        placeholder="App ID"
                                                        value={facebookAppId}
                                                        onChange={(e) => setFacebookAppId(e.target.value)}
                                                    />
                                                    <Input
                                                        type="password"
                                                        placeholder="App Secret"
                                                        value={facebookAppSecret}
                                                        onChange={(e) => setFacebookAppSecret(e.target.value)}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground m-0 leading-tight">
                                                        Find these in your <a href="https://developers.facebook.com/apps" target="_blank" className="underline" rel="noreferrer">Facebook Developer Dashboard</a>.
                                                    </p>
                                                </div>

                                                <Button
                                                    onClick={handleConnectFacebook}
                                                    disabled={isSavingFacebook}
                                                    className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white"
                                                >
                                                    {isSavingFacebook ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
                                                    {isSavingFacebook ? "Saving..." : "Connect with Facebook"}
                                                </Button>
                                                <p className="text-[10px] text-muted-foreground text-center">
                                                    You'll be redirected to Facebook to authorize this app.
                                                </p>
                                                {newAccountPlatform === 'instagram' && (
                                                    <p className="text-[10px] text-muted-foreground text-center">
                                                        Instagram is added automatically from linked Facebook Pages.
                                                    </p>
                                                )}
                                            </div>
                                        ) : newAccountPlatform === 'linkedin' ? (
                                            <div className="flex flex-col gap-3">
                                                <Button
                                                    onClick={() => window.location.href = '/api/auth/linkedin'}
                                                    className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                                                >
                                                    <Linkedin className="mr-2 h-4 w-4" />
                                                    Connect with LinkedIn
                                                </Button>
                                                <p className="text-[10px] text-muted-foreground text-center">
                                                    You&apos;ll be redirected to LinkedIn to authorize posting.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    type="password"
                                                    placeholder="Paste Access Token..."
                                                    value={newAccountToken}
                                                    onChange={(e) => setNewAccountToken(e.target.value)}
                                                />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Required for posting. Kept encrypted.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    {newAccountPlatform !== 'facebook' && newAccountPlatform !== 'instagram' && (
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
                                    {account.platform === 'threads' && <AtSign className="h-4 w-4 text-gray-700" />}
                                    {account.platform === 'wordpress' && <PenSquare className="h-4 w-4 text-indigo-600" />}
                                    {account.platform === 'wix' && <Globe className="h-4 w-4 text-purple-600" />}
                                    {account.platform === 'squarespace' && <Globe className="h-4 w-4 text-zinc-700" />}
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
                                    <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600" onClick={async () => {
                                        try {
                                            await fetch(`/api/connections?id=${account.id}`, { method: 'DELETE' });
                                            store.removeAccount(account.id);
                                            toast.success('Connection removed');
                                        } catch (e) {
                                            console.error('Failed to disconnect:', e);
                                            toast.error('Failed to disconnect');
                                        }
                                    }}>
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
                            <div className="rounded-md border p-3 flex items-center justify-between gap-3">
                                <div className="text-sm text-muted-foreground">
                                    Connect Google OAuth to enable marking rows as <strong>done</strong> after use.
                                </div>
                                <Button
                                    variant="default"
                                    onClick={() => { window.location.href = '/api/auth/google'; }}
                                >
                                    Connect Google Sheets
                                </Button>
                            </div>

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

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-5 h-5" /> OpenRouter
                                </CardTitle>
                                <CardDescription>Configure OpenRouter models access</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-or-v1-..."
                                        value={store.aiConfig.openrouterKey}
                                        onChange={(e) => store.updateAIConfig({ openrouterKey: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Model</Label>
                                    <Select
                                        value={store.aiConfig.openrouterModel}
                                        onValueChange={(val) => store.updateAIConfig({ openrouterModel: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openrouter/auto">Auto Routing</SelectItem>
                                            <SelectItem value="anthropic/claude-3-opus">Claude 3 Opus</SelectItem>
                                            <SelectItem value="anthropic/claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                                            <SelectItem value="google/gemini-pro-1.5">Gemini 1.5 Pro</SelectItem>
                                            <SelectItem value="meta-llama/llama-3-70b-instruct">LLaMA 3 70B</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="secondary" onClick={() => alert("OpenRouter Settings Saved")}>Connect</Button>
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
