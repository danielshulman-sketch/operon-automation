"use client";

import { useEffect, useState } from "react";
import { Canvas } from '@/components/workflow/Canvas';
import { EditorHeader } from '@/components/workflow/EditorHeader';
import { useWorkflowStore } from '@/lib/store';
import { toast } from 'sonner';
import { useParams } from "next/navigation";

export default function EditorPage() {
    const params = useParams();
    const workflowId = params.workflowId as string;

    const [workflowName, setWorkflowName] = useState("Loading...");
    const [isSaving, setIsSaving] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const { setNodes, setEdges, nodes, edges } = useWorkflowStore();

    useEffect(() => {
        if (!workflowId) return;

        fetch(`/api/workflows/${workflowId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load workflow");
                return res.json();
            })
            .then(data => {
                setWorkflowName(data.name);
                if (data.definition) {
                    const def = typeof data.definition === 'string' ? JSON.parse(data.definition) : data.definition;
                    if (def.nodes) setNodes(def.nodes);
                    if (def.edges) setEdges(def.edges);
                }
            })
            .catch(err => {
                console.error(err);
                toast.error("Failed to load workflow");
            });
    }, [workflowId, setNodes, setEdges]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const definition = { nodes, edges };
            const res = await fetch(`/api/workflows/${workflowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workflowName, definition }),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Workflow saved");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRun = async () => {
        // Auto-save first
        setIsRunning(true);
        try {
            const definition = { nodes, edges };
            await fetch(`/api/workflows/${workflowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workflowName, definition }),
            });

            const res = await fetch(`/api/workflows/${workflowId}/execute`, {
                method: 'POST',
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Execution failed');
                return;
            }

            if (data.status === 'completed') {
                toast.success('Workflow executed successfully!');
                // Show outputs in a readable way
                const results = data.results || {};
                for (const [nodeId, result] of Object.entries(results)) {
                    const r = result as any;
                    if (r.output && r.output.length > 0) {
                        const node = nodes.find((n: any) => n.id === nodeId);
                        const label = (node?.data?.label as string) || nodeId;
                        toast.message(`${label}`, {
                            description: r.output.substring(0, 200) + (r.output.length > 200 ? '...' : ''),
                            duration: 10000,
                        });
                    }
                }
            } else {
                toast.warning('Workflow completed with errors');
                const results = data.results || {};
                for (const [nodeId, result] of Object.entries(results)) {
                    const r = result as any;
                    if (r.status === 'failed') {
                        const node = nodes.find((n: any) => n.id === nodeId);
                        const label = (node?.data?.label as string) || nodeId;
                        toast.error(`${label}: ${r.error}`);
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to execute workflow");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex h-screen flex-col">
            <EditorHeader
                workflowName={workflowName}
                workflowId={workflowId}
                onSave={handleSave}
                onNameChange={(name) => setWorkflowName(name)}
                onRun={handleRun}
                isSaving={isSaving}
                isRunning={isRunning}
                isDirty={false}
            />
            <div className="flex-1 overflow-hidden">
                <Canvas />
            </div>
        </div>
    );
}
