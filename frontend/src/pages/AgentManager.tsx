import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { 
  useAgents, 
  useCreateAgent, 
  useUpdateAgent, 
  useDeleteAgent, 
  useSetAgentStatus 
} from '@/hooks/useAgent';
import type { AgentConfig, AgentStatus, AgentCreateInput } from '@/types/agent';
import { AgentCard } from '@/components/common/AgentCard';
import { AgentEditor } from '@/components/common/AgentEditor';
import { 
  Modal, 
  Stack, 
  Group, 
  TextInput, 
  Select, 
  Button, 
  Text,
  Loader,
  Center,
  Grid,
} from '@mantine/core';

interface AgentManagerProps {}

export function AgentManager({}: AgentManagerProps) {
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
  
  if (loading) {
    return (
      <Center h={200}>
        <Loader size="md" />
      </Center>
    );
  }
  
  if (error) {
    return (
      <Text c="red" ta="center" mt="xl">
        错误: {error.message}
      </Text>
    );
  }
  
  return (
    <Stack gap="xl" p="md">
      <Group justify="space-between" align="center">
        <Text size="xl" fw={700}>Agent 管理</Text>
        <Button onClick={handleCreate} leftSection={<Plus size={16} />}>
          创建 Agent
        </Button>
      </Group>
      
      <Group align="center" gap="md">
        <TextInput 
          placeholder="搜索 Agent..."
          value={filter.search || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value || undefined }))}
          w={300}
        />
        <Select
          value={filter.status || 'all'}
          onChange={(v) => setFilter(prev => ({ ...prev, status: v === 'all' ? undefined : v as AgentStatus }))}
          w={180}
        >
          <option value="all">所有状态</option>
          <option value="idle">空闲</option>
          <option value="running">运行中</option>
          <option value="error">错误</option>
          <option value="disabled">已停用</option>
          <option value="initializing">初始化中</option>
        </Select>
      </Group>
      
      {agents.length === 0 ? (
        <Center h={200} ta="center">
          <Stack gap="md">
            <Text c="dimmed">暂无 Agent</Text>
            <Button onClick={handleCreate} variant="outline">
              创建第一个 Agent
            </Button>
          </Stack>
        </Center>
      ) : (
        <Grid>
          {agents.map(agent => (
            <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={agent.id}>
              <AgentCard 
                agent={agent}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}
      
      <Modal 
        opened={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingAgent(undefined); }}
        title={editingAgent ? '编辑 Agent' : '创建 Agent'}
        size="lg"
      >
        <AgentEditor 
          open={editorOpen}
          agent={editingAgent}
          onSave={handleSave}
          onCancel={handleCancel}
          onSaveAgent={async (input: AgentCreateInput) => {
            if (editingAgent) {
              await updateAgent(editingAgent.id, input);
            } else {
              await createAgent(input);
            }
          }}
          onUpdateAgent={async (id: string, input: Partial<AgentConfig>) => {
            await updateAgent(id, input);
          }}
        />
      </Modal>
      
      <Modal 
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        size="sm"
      >
        <Stack gap="md">
          <Text>确定要删除此 Agent 吗？此操作不可撤销。</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button 
              color="red" 
              onClick={confirmDelete}
              loading={deleteLoading}
            >
              删除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
