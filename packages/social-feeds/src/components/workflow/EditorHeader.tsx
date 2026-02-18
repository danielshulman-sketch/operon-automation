"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Play, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface EditorHeaderProps {
    workflowName: string;
    onSave: () => void;
    onNameChange: (name: string) => void;
    onRun: () => void;
    isSaving: boolean;
    isRunning: boolean;
    isDirty?: boolean;
    workflowId?: string;
}

export function EditorHeader({ workflowName, onSave, onNameChange, onRun, isSaving, isRunning, isDirty, workflowId }: EditorHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(workflowName);
    const [isRenameSaving, setIsRenameSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditValue(workflowName);
    }, [workflowName]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSubmit = async () => {
        const trimmed = editValue.trim();
        if (!trimmed || trimmed === workflowName) {
            setEditValue(workflowName);
            setIsEditing(false);
            return;
        }

        // Auto-save the new name immediately
        if (workflowId) {
            setIsRenameSaving(true);
            try {
                const res = await fetch(`/api/workflows/${workflowId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: trimmed }),
                });
                if (res.ok) {
                    onNameChange(trimmed);
                } else {
                    setEditValue(workflowName); // revert on failure
                }
            } catch {
                setEditValue(workflowName);
            } finally {
                setIsRenameSaving(false);
            }
        } else {
            onNameChange(trimmed);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(workflowName);
        setIsEditing(false);
    };

    return (
        <div className="h-14 border-b bg-background flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <input
                            ref={inputRef}
                            className="font-semibold text-sm bg-transparent border-b border-primary outline-none px-1 py-0.5 min-w-[160px] max-w-[300px]"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
                                if (e.key === 'Escape') handleCancel();
                            }}
                        />
                        <button
                            onMouseDown={(e) => { e.preventDefault(); handleSubmit(); }}
                            className="text-green-600 hover:text-green-700 p-0.5 rounded"
                            title="Confirm rename"
                        >
                            <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                            title="Cancel"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 group">
                        {isRenameSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : null}
                        <h1
                            className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setIsEditing(true)}
                            title="Click to rename"
                        >
                            {workflowName}
                        </h1>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            title="Rename workflow"
                        >
                            <Pencil className="h-3 w-3" />
                        </button>
                    </div>
                )}
                {isDirty && <span className="text-xs text-muted-foreground italic">- Unsaved changes</span>}
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="default" onClick={onRun} disabled={isRunning || isSaving} className="bg-green-600 hover:bg-green-700">
                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? 'Running...' : 'Run'}
                </Button>
                <Button size="sm" variant="outline" onClick={onSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
            </div>
        </div>
    );
}
