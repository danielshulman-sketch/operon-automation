import React from 'react';

export const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 border-r bg-muted p-4 flex flex-col gap-4 h-full">
            <div className="font-semibold text-lg mb-2">Workflow Nodes</div>

            <div className="text-sm font-medium text-muted-foreground mb-1">Triggers</div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'manual-trigger', 'Manual Trigger')}
                draggable
            >
                Manual Trigger
            </div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'schedule-trigger', 'Schedule Trigger')}
                draggable
            >
                Schedule Trigger
            </div>

            <div className="text-sm font-medium text-muted-foreground mt-4 mb-1">Sources</div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'rss-source', 'RSS Feed')}
                draggable
            >
                RSS Feed
            </div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'google-sheets-source', 'Google Sheets')}
                draggable
            >
                Google Sheets
            </div>

            <div className="text-sm font-medium text-muted-foreground mt-4 mb-1">Processors</div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'ai-generation', 'AI Text Generation')}
                draggable
            >
                AI Text Generation
            </div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'image-generation', 'AI Image Generation')}
                draggable
            >
                AI Image Generation
            </div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'router', 'Router')}
                draggable
            >
                Router
            </div>

            <div className="text-sm font-medium text-muted-foreground mt-4 mb-1">Destinations</div>
            <div
                className="p-3 border rounded bg-background shadow-sm cursor-grab hover:border-primary transition-colors"
                onDragStart={(event) => onDragStart(event, 'facebook-publisher', 'Facebook Publisher')}
                draggable
            >
                Facebook Publisher
            </div>
        </aside>
    );
};
