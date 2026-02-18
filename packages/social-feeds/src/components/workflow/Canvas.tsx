'use client';

import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    ReactFlowProvider,
    Node,
    ReactFlowInstance,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sidebar } from './Sidebar';
import DeletableEdge from './edges/DeletableEdge';
import TriggerNode from './nodes/TriggerNode';
import SourceNode from './nodes/SourceNode';
import ProcessorNode from './nodes/ProcessorNode';
import DestinationNode from './nodes/DestinationNode';
import ImageGenNode from './nodes/ImageGenNode';
import { LayoutGrid } from 'lucide-react';

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'manual-trigger',
        position: { x: 250, y: 50 },
        data: { label: 'Start Manually' }
    },
];

import { useWorkflowStore } from '@/lib/store';
import { NodeConfigPanel } from './config/NodeConfigPanel';

// Auto-layout: topological sort → assign columns, then stack rows within each column
function tidyLayout(nodes: Node[], edges: Edge[]): Node[] {
    if (nodes.length === 0) return nodes;

    const NODE_WIDTH = 140;
    const NODE_HEIGHT = 80;
    const H_GAP = 80;
    const V_GAP = 40;

    // Build adjacency
    const inDegree: Record<string, number> = {};
    const outEdges: Record<string, string[]> = {};
    nodes.forEach(n => { inDegree[n.id] = 0; outEdges[n.id] = []; });
    edges.forEach(e => {
        if (inDegree[e.target] !== undefined) inDegree[e.target]++;
        if (outEdges[e.source]) outEdges[e.source].push(e.target);
    });

    // Assign column (depth) via BFS from roots
    const col: Record<string, number> = {};
    const queue: string[] = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    queue.forEach(id => { col[id] = 0; });

    let head = 0;
    while (head < queue.length) {
        const cur = queue[head++];
        for (const next of (outEdges[cur] || [])) {
            const newCol = (col[cur] ?? 0) + 1;
            if (col[next] === undefined || col[next] < newCol) {
                col[next] = newCol;
            }
            if (!queue.includes(next)) queue.push(next);
        }
    }

    // Nodes not reached (disconnected) get their own column
    nodes.forEach(n => { if (col[n.id] === undefined) col[n.id] = 0; });

    // Group by column, assign row within column
    const colGroups: Record<number, string[]> = {};
    nodes.forEach(n => {
        const c = col[n.id] ?? 0;
        if (!colGroups[c]) colGroups[c] = [];
        colGroups[c].push(n.id);
    });

    const positions: Record<string, { x: number; y: number }> = {};
    Object.entries(colGroups).forEach(([c, ids]) => {
        const colNum = parseInt(c);
        const totalH = ids.length * NODE_HEIGHT + (ids.length - 1) * V_GAP;
        const startY = -totalH / 2;
        ids.forEach((id, row) => {
            positions[id] = {
                x: colNum * (NODE_WIDTH + H_GAP) + 50,
                y: startY + row * (NODE_HEIGHT + V_GAP) + 200,
            };
        });
    });

    return nodes.map(n => ({ ...n, position: positions[n.id] ?? n.position }));
}

const CanvasContent = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const {
        nodes,
        edges,
        setNodes,
        setEdges,
        setSelectedNode,
        personas,
        defaultPersonaId
    } = useWorkflowStore();

    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const { fitView } = useReactFlow();

    // Initialize store with some data if empty (mock for development)
    React.useEffect(() => {
        if (nodes.length === 0) {
            setNodes(initialNodes);
        }
    }, [nodes.length, setNodes]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
        [nodes, setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
        [edges, setEdges]
    );

    const onConnect: OnConnect = useCallback(
        (params) => setEdges(addEdge({ ...params, type: 'deletable-edge' }, edges)),
        [edges, setEdges],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, [setSelectedNode]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);

    const handleTidy = useCallback(() => {
        const tidied = tidyLayout(nodes, edges);
        setNodes(tidied);
        setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
    }, [nodes, edges, setNodes, fitView]);

    const nodeTypes = useMemo(() => ({
        'manual-trigger': TriggerNode,
        'schedule-trigger': TriggerNode,
        'rss-source': SourceNode,
        'google-sheets-source': SourceNode,
        'ai-generation': ProcessorNode,
        'blog-creation': ProcessorNode,
        'image-generation': ImageGenNode,
        'router': ProcessorNode,
        'facebook-publisher': DestinationNode,
        'linkedin-publisher': DestinationNode,
        'instagram-publisher': DestinationNode,
        'threads-publisher': DestinationNode,
        'wordpress-publisher': DestinationNode,
        'wix-publisher': DestinationNode,
        'squarespace-publisher': DestinationNode,
    }), []);

    const edgeTypes = useMemo(() => ({
        'deletable-edge': DeletableEdge,
    }), []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/label');

            if (typeof type === 'undefined' || !type || !reactFlowInstance) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let nodeData: any = { label: label || `${type} node`, type };

            if (type === 'ai-generation' && defaultPersonaId) {
                const defaultPersona = personas.find(p => p.id === defaultPersonaId);
                if (defaultPersona) {
                    nodeData = { ...nodeData, masterPrompt: defaultPersona.prompt };
                }
            }

            const newNode: Node = {
                id: `${type}-${nodes.length + 1}`,
                type,
                position,
                data: nodeData,
            };

            setNodes(nodes.concat(newNode));
        },
        [reactFlowInstance, nodes, setNodes, personas, defaultPersonaId],
    );

    return (
        <div className="dndflow w-full h-full flex flex-row">
            <Sidebar />
            <div className="reactflow-wrapper flex-grow h-full bg-background relative" ref={reactFlowWrapper}>
                {/* Tidy button overlay */}
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={handleTidy}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-background border border-border rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Auto-arrange nodes"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Tidy
                    </button>
                </div>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Controls />
                    <MiniMap nodeStrokeWidth={3} zoomable pannable />
                    <Background gap={12} size={1} />
                </ReactFlow>
            </div>
            <NodeConfigPanel />
        </div>
    );
};

export const Canvas = () => {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    );
};
