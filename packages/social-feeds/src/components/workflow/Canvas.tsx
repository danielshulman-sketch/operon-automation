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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sidebar } from './Sidebar';
import TriggerNode from './nodes/TriggerNode';
import SourceNode from './nodes/SourceNode';
import ProcessorNode from './nodes/ProcessorNode';
import DestinationNode from './nodes/DestinationNode';
import ImageGenNode from './nodes/ImageGenNode';

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
        (params) => setEdges(addEdge(params, edges)),
        [edges, setEdges],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, [setSelectedNode]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);

    const nodeTypes = useMemo(() => ({
        'manual-trigger': TriggerNode,
        'schedule-trigger': TriggerNode,
        'rss-source': SourceNode,
        'google-sheets-source': SourceNode,
        'ai-generation': ProcessorNode,
        'image-generation': ImageGenNode,
        'router': ProcessorNode,
        'facebook-publisher': DestinationNode,
        'linkedin-publisher': DestinationNode,
        'instagram-publisher': DestinationNode,
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
                    fitView
                >
                    <Controls />
                    <MiniMap />
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
