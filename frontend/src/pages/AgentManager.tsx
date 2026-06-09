import { useState, useCallback } from 'react';
import {
  useAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useSetAgentStatus,
} from '@/hooks/useAgent';
import type { AgentConfig, AgentStatus, AgentCreateInput } from '@/types/agent';
import { AgentCard } from '@/components/common/AgentCard';
import { AgentEditor } from '@/components/common/AgentEditor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

export function AgentManager() {
  const [filter, setFilter] = useState<{ status?: AgentStatus; search?: string }>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { agents, loading, error, refetch } = useAgents({
    status: filter.status,
    search: filter.search,
  });
  const { createAgent } = useCreateAgent();
  const { updateAgent } = useUpdateAgent();
  const { deleteAgent, loading: deleteLoading } = useDeleteAgent();
  const { setStatus } = useSetAgentStatus();

  const handleSave = useCallback(() => {
    setEditorOpen(false);
    setEditingAgent(undefined);
    refetch();
  }, [refetch]);

  const handleCancel = useCallback(() => {
    setEditorOpen(false);
    setEditingAgent(undefined);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingAgent(undefined);
    setEditorOpen(true);
  }, []);

  const handleEdit = useCallback((id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      setEditingAgent(agent);
      setEditorOpen(true);
    }
  }, [agents]);

  const handleDelete = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteAgent(deleteTarget);
      setDeleteTarget(null);
      refetch();
    }
  }, [deleteTarget, deleteAgent, refetch]);

  const handleStatusChange = useCallback(async (id: string, status: AgentStatus) => {
    await setStatus(id, status);
    refetch();
  }, [setStatus, refetch]);

  const handleSaveAgent = useCallback(async (input: AgentCreateInput) => {
    await createAgent(input);
  }, [createAgent]);

  const handleUpdateAgent = useCallback(async (id: string, input: Partial<AgentConfig>) => {
    await updateAgent(id, input);
  }, [updateAgent]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  if (error) {
    return <div className="text-red-500">错误: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Agent 管理</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建 Agent
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索 Agent..."
          value={filter.search || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value || undefined }))}
          className="max-w-sm"
        />
        <Select
          value={filter.status || 'all'}
          onValueChange={(v) => setFilter(prev => ({ ...prev, status: v === 'all' ? undefined : v as AgentStatus }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="idle">空闲</SelectItem>
            <SelectItem value="running">运行中</SelectItem>
            <SelectItem value="error">错误</SelectItem>
            <SelectItem value="disabled">已停用</SelectItem>
            <SelectItem value="initializing">初始化中</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">暂无 Agent</p>
          <Button onClick={handleCreate}>创建第一个 Agent</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <AgentEditor
        open={editorOpen}
        agent={editingAgent}
        onSave={handleSave}
        onCancel={handleCancel}
        onSaveAgent={handleSaveAgent}
        onUpdateAgent={handleUpdateAgent}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此 Agent 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
