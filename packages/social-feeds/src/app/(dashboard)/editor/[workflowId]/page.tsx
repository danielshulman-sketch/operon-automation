"use client";

import { useEffect, useState } from "react";
import { Canvas } from '@/components/workflow/Canvas';
import { EditorHeader } from '@/components/workflow/EditorHeader';
import { useWorkflowStore } from '@/lib/store';
import { toast } from 'sonner';
import { useParams } from "next/navigation"; // Use useParams instead of props for client component

// Note: Ensure the EditorPage receives params correctly or use useParams if easier
export default function EditorPage() {
    const params = useParams();
    const workflowId = params.workflowId as string;

    const [workflowName, setWorkflowName] = useState("Loading...");
    const [isSaving, setIsSaving] = useState(false);
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
            const definition = {
                nodes,
                edges
            };

            const res = await fetch(`/api/workflows/${workflowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    definition: definition // Prisma handles JSON
                })
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

    return (
        <div className="flex h-screen flex-col">
            <EditorHeader
                workflowName={workflowName}
                onSave={handleSave}
                isSaving={isSaving}
                isDirty={false} // TODO: Track dirty state
            />
            <div className="flex-1 overflow-hidden">
                <Canvas />
            </div>
        </div>
    );
}
