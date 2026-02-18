'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Loader2, Eye, EyeOff, Key } from 'lucide-react';
import { useWorkflowStore } from '@/lib/store';
import { toast } from 'sonner';

export default function SettingsPage() {
    const personas = useWorkflowStore((state) => state.personas);
    const defaultPersonaId = useWorkflowStore((state) => state.defaultPersonaId);
    const setDefaultPersonaId = useWorkflowStore((state) => state.setDefaultPersonaId);
    const addPersona = useWorkflowStore((state) => state.addPersona);
    const removePersona = useWorkflowStore((state) => state.removePersona);

    const [newName, setNewName] = useState('');
    const [newPrompt, setNewPrompt] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [hasExistingKey, setHasExistingKey] = useState(false);
    const [keyPreview, setKeyPreview] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [linkedinClientId, setLinkedinClientId] = useState('');
    const [linkedinClientSecret, setLinkedinClientSecret] = useState('');
    const [hasLinkedinCredentials, setHasLinkedinCredentials] = useState(false);
    const [linkedinClientIdPreview, setLinkedinClientIdPreview] = useState('');
    const [showLinkedinSecret, setShowLinkedinSecret] = useState(false);
    const [isSavingLinkedin, setIsSavingLinkedin] = useState(false);

    useEffect(() => {
        fetch('/api/user/settings')
            .then(res => res.json())
            .then(data => {
                if (data.name) setDisplayName(data.name);
                if (data.email) setEmail(data.email);
                if (data.hasOpenaiKey) {
                    setHasExistingKey(true);
                    setKeyPreview(data.openaiKeyPreview || '');
                }
                if (data.hasLinkedinCredentials) {
                    setHasLinkedinCredentials(true);
                    setLinkedinClientIdPreview(data.linkedinClientId || '');
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: displayName }),
            });
            if (!res.ok) throw new Error();
            toast.success('Profile saved!');
        } catch {
            toast.error('Failed to save profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveApiKey = async () => {
        if (!openaiKey.trim()) {
            toast.error('Please enter an API key');
            return;
        }
        setIsSavingKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openaiApiKey: openaiKey.trim() }),
            });
            if (!res.ok) throw new Error();
            setHasExistingKey(true);
            setKeyPreview(`sk-...${openaiKey.trim().slice(-4)}`);
            setOpenaiKey('');
            toast.success('API key saved! You can now test AI nodes.');
        } catch {
            toast.error('Failed to save API key');
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleRemoveApiKey = async () => {
        setIsSavingKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openaiApiKey: null }),
            });
            if (!res.ok) throw new Error();
            setHasExistingKey(false);
            setKeyPreview('');
            setOpenaiKey('');
            toast.success('API key removed');
        } catch {
            toast.error('Failed to remove API key');
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleSaveLinkedin = async () => {
        if (!linkedinClientId.trim() || !linkedinClientSecret.trim()) {
            toast.error('Please enter both Client ID and Client Secret');
            return;
        }
        setIsSavingLinkedin(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedinClientId: linkedinClientId.trim(), linkedinClientSecret: linkedinClientSecret.trim() }),
            });
            if (!res.ok) throw new Error();
            setHasLinkedinCredentials(true);
            setLinkedinClientIdPreview(linkedinClientId.trim());
            setLinkedinClientId('');
            setLinkedinClientSecret('');
            toast.success('LinkedIn credentials saved! Go to Connections to connect your account.');
        } catch {
            toast.error('Failed to save LinkedIn credentials');
        } finally {
            setIsSavingLinkedin(false);
        }
    };

    const handleRemoveLinkedin = async () => {
        setIsSavingLinkedin(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedinClientId: null, linkedinClientSecret: null }),
            });
            if (!res.ok) throw new Error();
            setHasLinkedinCredentials(false);
            setLinkedinClientIdPreview('');
            toast.success('LinkedIn credentials removed');
        } catch {
            toast.error('Failed to remove LinkedIn credentials');
        } finally {
            setIsSavingLinkedin(false);
        }
    };

    const handleAddPersona = () => {
        if (newName && newPrompt) {
            addPersona({ id: Date.now().toString(), name: newName, prompt: newPrompt });
            setNewName('');
            setNewPrompt('');
            toast.success('Persona added!');
        }
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account and application preferences.</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* PROFILE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Your account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={email} disabled />
                        </div>
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                {/* API KEYS */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            API Keys
                        </CardTitle>
                        <CardDescription>Manage your AI provider API keys. Your key is stored securely and only used for your workflow executions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>OpenAI API Key</Label>
                            {hasExistingKey && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{keyPreview}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveApiKey} disabled={isSavingKey}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showKey ? 'text' : 'password'}
                                        placeholder={hasExistingKey ? 'Enter new key to replace...' : 'sk-...'}
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowKey(!showKey)}
                                    >
                                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button onClick={handleSaveApiKey} disabled={isSavingKey || !openaiKey.trim()}>
                                    {isSavingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Key
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:text-foreground">platform.openai.com/api-keys</a>
                            </p>
                        </div>

                        <Separator />

                        {/* LinkedIn Credentials */}
                        <div className="grid gap-2">
                            <Label>LinkedIn Developer App</Label>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                Required to post to LinkedIn. Create an app at{' '}
                                <a href="https://www.linkedin.com/developers/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">linkedin.com/developers</a>
                                {' '}and enable &quot;Share on LinkedIn&quot; + &quot;Sign In with LinkedIn using OpenID Connect&quot;.
                            </p>
                            {hasLinkedinCredentials && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{linkedinClientIdPreview || 'Configured'}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveLinkedin} disabled={isSavingLinkedin}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Client ID"
                                    value={linkedinClientId}
                                    onChange={(e) => setLinkedinClientId(e.target.value)}
                                />
                                <div className="relative">
                                    <Input
                                        type={showLinkedinSecret ? 'text' : 'password'}
                                        placeholder="Client Secret"
                                        value={linkedinClientSecret}
                                        onChange={(e) => setLinkedinClientSecret(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowLinkedinSecret(!showLinkedinSecret)}
                                    >
                                        {showLinkedinSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button
                                    onClick={handleSaveLinkedin}
                                    disabled={isSavingLinkedin || !linkedinClientId.trim() || !linkedinClientSecret.trim()}
                                    size="sm"
                                >
                                    {isSavingLinkedin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save LinkedIn Credentials
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Add redirect URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/linkedin/callback</code>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* PERSONAS */}
                <Card>
                    <CardHeader>
                        <CardTitle>AI Personas</CardTitle>
                        <CardDescription>Manage master prompts for your AI workflows.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {personas.length === 0 && (
                                <p className="text-sm text-muted-foreground">No personas created yet. Add one below.</p>
                            )}
                            {personas.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 border rounded bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center ${defaultPersonaId === p.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                                            onClick={() => setDefaultPersonaId(p.id)}
                                            title="Set as Default"
                                        >
                                            {defaultPersonaId === p.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                {p.name}
                                                {defaultPersonaId === p.id && <Badge variant="secondary" className="text-[10px] h-5">Default</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">{p.prompt}</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removePersona(p.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label>New Persona Name</Label>
                            <Input placeholder="e.g. Friendly Helper" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Master Prompt</Label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="You are a helper..."
                                value={newPrompt}
                                onChange={(e) => setNewPrompt(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddPersona}>Add Persona</Button>
                    </CardContent>
                </Card>

                {/* NOTIFICATIONS */}
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

                {/* DANGER ZONE */}
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
