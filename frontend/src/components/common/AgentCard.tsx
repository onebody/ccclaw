import type { AgentConfig, AgentStatus, AgentCreateInput } from '@/types/agent'
import { useState, useCallback } from 'react'
import { 
  Modal, 
  Stack, 
  Text, 
  TextInput, 
  Select, 
  Button, 
  Group, 
  ActionIcon,
  Switch,
} from '@mantine/core'
import { 
  Pencil, 
  Trash2, 
  Bot, 
  Plus,
} from 'lucide-react'

interface AgentCardProps {
  agent: AgentConfig
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: AgentStatus) => void
}

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: 'green',
  running: 'blue',
  error: 'red',
  disabled: 'gray',
  initializing: 'yellow',
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: '空闲',
  running: '运行中',
  error: '错误',
  disabled: '已停用',
  initializing: '初始化中',
}

export function AgentCard({ agent, onEdit, onDelete, onStatusChange }: AgentCardProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  
  const handleToggleStatus = useCallback(() => {
    const newStatus = agent.status === 'idle' ? 'disabled' : 'idle'
    onStatusChange(agent.id, newStatus)
  }, [agent.status, onStatusChange])
  
  return (
    <Stack gap="md" p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group gap="xs" align="center">
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              backgroundColor: STATUS_COLOR[agent.status] || 'gray',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}>
              <Bot size={18} color="white" />
            </div>
            <Text size="lg" fw={500}>{agent.name}</Text>
          </Group>
          <Text size="sm" c="dimmed">{agent.description}</Text>
        </Stack>
        
        <Group gap="xs">
          <ActionIcon 
            color="blue" 
            onClick={() => onEdit(agent.id)}
            title="编辑"
          >
            <Pencil size={16} />
          </ActionIcon>
          <ActionIcon 
            color="red" 
            onClick={() => setDeleteModalOpen(true)}
            title="删除"
          >
            <Trash2 size={16} />
          </ActionIcon>
        </Group>
      </Group>
      
      <Stack gap="xs">
        <Group gap="xs">
          <Text size="xs" c="dimmed" w={80}>模型 Provider</Text>
          <Text size="sm">{agent.model?.provider || '-'}</Text>
        </Group>
        <Group gap="xs">
          <Text size="xs" c="dimmed" w={80}>模型 ID</Text>
          <Text size="sm">{agent.model?.modelId || '-'}</Text>
        </Group>
        <Group gap="xs">
          <Text size="xs" c="dimmed" w={80}>状态</Text>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: STATUS_COLOR[agent.status] || 'gray',
            display: 'inline-block',
            marginRight: 8,
          }} />
          <Text size="sm">{STATUS_LABEL[agent.status]}</Text>
        </Group>
      </Stack>
      
      <Group justify="space-between" mt="md">
        <Text size="xs" c="dimmed">
          更新于 {new Date(agent.updatedAt).toLocaleDateString('zh-CN')}
        </Text>
        <Switch 
          checked={agent.status === 'idle'} 
          onChange={handleToggleStatus}
          label={agent.status === 'idle' ? '已启用' : '已停用'}
          size="sm"
        />
      </Group>
      
      {/* Delete Confirmation Modal */}
      <Modal 
        opened={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
        size="sm"
      >
        <Stack gap="md">
          <Text>确定要删除此 Agent 吗？此操作不可撤销。</Text>
          <Group justify="flex-end" gap="sm" mt="md">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              取消
            </Button>
            <Button 
              color="red" 
              onClick={() => {
                onDelete(agent.id)
                setDeleteModalOpen(false)
              }}
            >
              删除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

interface AgentManagerProps {
  onCreate: (input: AgentCreateInput) => Promise<void>
  onUpdate: (id: string, input: Partial<AgentConfig>) => Promise<void>
}

export function AgentManager({ onCreate, onUpdate }: AgentManagerProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined)
  
  const handleSave = useCallback(async (input: AgentCreateInput | Partial<AgentConfig>) => {
    if (editingAgent) {
      await onUpdate(editingAgent.id, input)
    } else {
      await onCreate(input as AgentCreateInput)
    }
    setEditorOpen(false)
    setEditingAgent(undefined)
  }, [editingAgent, onCreate, onUpdate])
  
  return (
    <Stack gap="md" p="md">
      <Group justify="space-between" align="center" mb="md">
        <Text size="xl" fw={700}>Agent 管理</Text>
        <Button 
          leftSection={<Plus size={16} />}
          onClick={() => {
            setEditingAgent(undefined)
            setEditorOpen(true)
          }}
        >
          创建 Agent
        </Button>
      </Group>
      
      {/* Agent list would go here - using mock data for now */}
      <div style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>
        <Text c="dimmed">Agent 列表区域（待实现）</Text>
      </div>
      
      {/* Agent Editor Modal */}
      <Modal 
        opened={editorOpen} 
        onClose={() => {
          setEditorOpen(false)
          setEditingAgent(undefined)
        }}
        title={editingAgent ? '编辑 Agent' : '创建 Agent'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput 
            label="Agent 名称"
            placeholder="输入 Agent 名称"
            defaultValue={editingAgent?.name || ''}
            required
          />
          <TextInput 
            label="描述"
            placeholder="输入 Agent 描述"
            defaultValue={editingAgent?.description || ''}
          />
          <Group grow gap="md">
            <Select 
              label="模型 Provider"
              defaultValue={editingAgent?.model?.provider || ''}
              data={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'azure', label: 'Azure' },
                { value: 'aliyuncs', label: '阿里云' },
              ]}
            />
            <TextInput 
              label="模型 ID"
              placeholder="输入模型 ID"
              defaultValue={editingAgent?.model?.modelId || ''}
            />
          </Group>
          <Group justify="flex-end" gap="sm" mt="md">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditorOpen(false)
                setEditingAgent(undefined)
              }}
            >
              取消
            </Button>
            <Button onClick={() => handleSave({} as any)}>
              {editingAgent ? '更新' : '创建'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
