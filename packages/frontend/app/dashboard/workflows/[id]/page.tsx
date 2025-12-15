'use client';

import { useParams } from 'next/navigation';
import { useWorkflowRuns } from '../../../../hooks/useApi';

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading } = useWorkflowRuns(workflowId);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Workflow {workflowId}</h2>
      {isLoading && <p className="text-sm text-slate-600">Loading runs…</p>}
      <div className="space-y-3">
        {data?.map((run) => (
          <div key={run.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Run {run.id.slice(0, 8)}</p>
              <span className="text-xs rounded bg-green-100 px-2 py-1 text-green-700">{run.status}</span>
            </div>
            <p className="text-xs text-slate-600">Detected Task: {run.detectedTaskId}</p>
            <p className="text-xs text-slate-500">Created: {new Date(run.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {!isLoading && (!data || data.length === 0) && <div className="text-sm text-slate-600">No runs yet.</div>}
      </div>
    </div>
  );
}
