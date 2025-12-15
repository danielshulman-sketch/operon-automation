'use client';

import { useQuery } from '@tanstack/react-query';

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

export const useTasks = () =>
  useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchJson('/api/email/tasks'),
  });

export const useWorkflows = () =>
  useQuery({
    queryKey: ['workflows'],
    queryFn: () => fetchJson('/api/workflows'),
  });

export const useWorkflowRuns = (workflowId?: string) =>
  useQuery({
    queryKey: ['workflow-runs', workflowId],
    queryFn: () => fetchJson(`/api/workflow-runs?workflowId=${workflowId ?? ''}`),
    enabled: Boolean(workflowId),
  });

export const useEmailEvents = () =>
  useQuery({
    queryKey: ['email-events'],
    queryFn: () => fetchJson('/api/email/events'),
  });
