"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface EditorHeaderProps {
    workflowName: string;
    onSave: () => void;
    isSaving: boolean;
    isDirty?: boolean;
}

export function EditorHeader({ workflowName, onSave, isSaving, isDirty }: EditorHeaderProps) {
    return (
        <div className="h-14 border-b bg-background flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="font-semibold text-sm">{workflowName}</h1>
                {isDirty && <span className="text-xs text-muted-foreground italic">- Unsaved changes</span>}
            </div>
            <div>
                <Button size="sm" onClick={onSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
            </div>
        </div>
    );
}
