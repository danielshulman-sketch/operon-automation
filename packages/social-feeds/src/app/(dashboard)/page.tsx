'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Edit, Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/workflows')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWorkflows(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleCreateWorkflow = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Workflow' })
      });

      if (!res.ok) throw new Error("Failed to create workflow");

      const workflow = await res.json();
      router.push(`/editor/${workflow.id}`);
    } catch (error) {
      toast.error("Could not create workflow. Check your plan.");
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast.success("Workflow deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const startRename = (workflow: Workflow) => {
    setRenamingId(workflow.id);
    setRenameValue(workflow.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const submitRename = async (id: string) => {
    const trimmed = renameValue.trim();
    const original = workflows.find(w => w.id === id)?.name;
    if (!trimmed || trimmed === original) {
      cancelRename();
      return;
    }
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, name: trimmed } : w));
      toast.success('Workflow renamed');
    } catch {
      toast.error('Failed to rename workflow');
    } finally {
      cancelRename();
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your automation pipelines.</p>
        </div>
        <Button onClick={handleCreateWorkflow} disabled={isCreating}>
          {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          New Workflow
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No workflows found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell className="font-medium">
                  {renamingId === workflow.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={renameInputRef}
                        className="text-sm bg-transparent border-b border-primary outline-none px-1 py-0.5 min-w-[160px] max-w-[280px] font-medium"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => submitRename(workflow.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); submitRename(workflow.id); }
                          if (e.key === 'Escape') cancelRename();
                        }}
                      />
                      <button
                        onMouseDown={(e) => { e.preventDefault(); submitRename(workflow.id); }}
                        className="text-green-600 hover:text-green-700 p-0.5"
                        title="Confirm"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); cancelRename(); }}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <Link href={`/editor/${workflow.id}`} className="hover:underline">
                        {workflow.name}
                      </Link>
                      <button
                        onClick={() => startRename(workflow)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        title="Rename"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                    {workflow.isActive ? 'Active' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(workflow.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Link href={`/editor/${workflow.id}`} className="flex items-center w-full">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => startRename(workflow)}>
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(workflow.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
