import { create } from 'zustand';
import { Node, Edge, ReactFlowInstance } from '@xyflow/react';

interface Persona {
    id: string;
    name: string;
    prompt: string;
}

export interface SocialAccount {
    id: string;
    platform: 'facebook' | 'linkedin' | 'instagram' | 'threads' | 'wordpress' | 'wix' | 'squarespace';
    name: string;
    status: 'active' | 'expired';
    username?: string;
    accessToken?: string;
}

export interface RSSFeed {
    id: string;
    name: string;
    url: string;
}

export interface GoogleSheetsConfig {
    spreadsheetId: string;
    sheetName: string;
    columns: {
        content: string;
        image: string;
        status: string;
    };
}

export interface AIConfig {
    openaiKey: string;
    openaiModel: string;
    anthropicKey: string;
    anthropicModel: string;
}

interface WorkflowState {
    nodes: Node[];
    edges: Edge[];
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    isConfigPanelOpen: boolean;
    personas: Persona[];
    defaultPersonaId: string | null;
    accounts: SocialAccount[];
    rssFeeds: RSSFeed[];
    googleSheetsConfig: GoogleSheetsConfig;
    aiConfig: AIConfig;

    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    setSelectedNode: (node: Node | null) => void;
    toggleConfigPanel: (isOpen: boolean) => void;
    setPersonas: (personas: Persona[]) => void;
    addPersona: (persona: Persona) => void;
    removePersona: (id: string) => void;
    setDefaultPersonaId: (id: string | null) => void;
    setAccounts: (accounts: SocialAccount[]) => void;
    addAccount: (account: SocialAccount) => void;
    removeAccount: (id: string) => void;
    addRSSFeed: (feed: RSSFeed) => void;
    removeRSSFeed: (id: string) => void;
    updateGoogleSheetsConfig: (config: Partial<GoogleSheetsConfig>) => void;
    updateAIConfig: (config: Partial<AIConfig>) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,
    isConfigPanelOpen: false,
    personas: [],
    defaultPersonaId: null,
    accounts: [],
    rssFeeds: [],
    googleSheetsConfig: {
        spreadsheetId: '',
        sheetName: 'Sheet1',
        columns: { content: 'A', status: 'B', image: 'C' }
    },
    aiConfig: {
        openaiKey: '',
        openaiModel: 'gpt-4',
        anthropicKey: '',
        anthropicModel: 'claude-3-opus'
    },

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSelectedNode: (node) => set({ selectedNode: node, isConfigPanelOpen: !!node }),
    toggleConfigPanel: (isOpen) => set({ isConfigPanelOpen: isOpen }),
    setPersonas: (personas) => set({ personas }),
    addPersona: (persona) => set((state) => ({ personas: [...state.personas, persona] })),
    removePersona: (id) => set((state) => ({
        personas: state.personas.filter((p) => p.id !== id),
        defaultPersonaId: state.defaultPersonaId === id ? null : state.defaultPersonaId
    })),
    setDefaultPersonaId: (id) => set({ defaultPersonaId: id }),
    setAccounts: (accounts) => set({ accounts }),
    addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
    removeAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
    addRSSFeed: (feed) => set((state) => ({ rssFeeds: [...state.rssFeeds, feed] })),
    removeRSSFeed: (id) => set((state) => ({ rssFeeds: state.rssFeeds.filter((f) => f.id !== id) })),
    updateGoogleSheetsConfig: (config) => set((state) => ({ googleSheetsConfig: { ...state.googleSheetsConfig, ...config } })),
    updateAIConfig: (config) => set((state) => ({ aiConfig: { ...state.aiConfig, ...config } })),
}));
