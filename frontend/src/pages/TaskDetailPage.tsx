import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  XCircle,
  X,
  Plus,
  MessageSquare,
  FileBox,
  Info,
  Send,
  Bot,
  User,
  Cog,
  Clock,
  ChevronRight,
  File,
  Download,
  Eye,
  GitBranch,
  RefreshCw,
} from 'lucide-react'
import {
  Button,
  Badge,
  Textarea,
  ScrollArea,
  Group,
  Text,
  Stack,
  ActionIcon,
  Divider,
  Tabs,
} from '@mantine/core'
import { useTasks } from '@/hooks/useTask'
import { useSessions, useMessages } from '@/hooks/useSession'
import { useWorkspaces } from '@/hooks/useWorkspace'
import { useArtifacts, getFileIcon, formatFileSize } from '@/hooks/useArtifact'
import { STATUS_CONFIG } from '@/components/workspace/TaskItem'
import { type ChatMessage, type ChatSession, type Task } from '@/types/workspace'
import { FileChangesTab } from '@/components/workspace/FileChangesTab'
import { LogsTab } from '@/components/workspace/LogsTab'

const PRIORITY_LABEL: Record<string, { label: string; color: string }> = {
  urgent: { label: '紧急', color: 'red' },
  high: { label: '高', color: 'orange' },
  normal: { label: '普通', color: 'blue' },
  low: { label: '低', color: 'gray' },
}

type Tab = 'sessions' | 'files' | 'artifacts' | 'logs' | 'details'

// ----------------------------------------------------------------
// Message bubble
// ----------------------------------------------------------------
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const senderIcon = {
    user: <User size={14} style={{ color: 'var(--mantine-color-blue-5)' }} />,
    ai: <Bot size={14} style={{ color: 'var(--mantine-color-green-5)' }} />,
    system: <Cog size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />,
  }

  const senderLabel = { user: '我', ai: 'AI', system: '系统' }

  return (
    <Group gap="md" px="md" py="xs" style={{ '&:hover': { backgroundColor: 'var(--mantine-color-gray-0)' } }}>
      {/* Avatar */}
      <div style={{
        flexShrink: 0,
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: 'var(--mantine-color-gray-1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {senderIcon[msg.sender]}
      </div>

      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Group gap="sm">
          <Text size="xs" fw={500}>{senderLabel[msg.sender]}</Text>
          <Text size="xs" c="dimmed">
            {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {msg.source && (
            <Text size="xs" c="dimmed">via {msg.source}</Text>
          )}
        </Group>

        {/* Content */}
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
          {msg.content}
        </Text>

        {/* Code blocks */}
        {msg.codeBlocks.length > 0 && (
          <Stack gap="xs" mt="xs">
            {msg.codeBlocks.map((block, i) => (
              <pre key={i} style={{
                backgroundColor: 'var(--mantine-color-gray-1)',
                borderRadius: 6,
                padding: 12,
                fontSize: 12,
                overflowX: 'auto',
              }}>
                <code data-language={block.language || undefined}>
                  {block.code}
                </code>
              </pre>
            ))}
          </Stack>
        )}

        {/* Attachments */}
        {msg.attachments.length > 0 && (
          <Group gap="xs" mt="xs">
            {msg.attachments.map((att, i) => (
              <Group key={i} gap="xs" style={{
                fontSize: 12,
                backgroundColor: 'var(--mantine-color-gray-1)',
                borderRadius: 4,
                padding: '2px 8px',
              }}>
                <FileBox size={14} />
                <Text size="xs" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </Text>
              </Group>
            ))}
          </Group>
        )}
      </Stack>
    </Group>
  )
}

// ----------------------------------------------------------------
// Session tab
// ----------------------------------------------------------------
function SessionTab({
  taskId,
  sessions,
  activeSessionId,
  setActiveSessionId,
}: {
  taskId: string
  sessions: ChatSession[]
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
}) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [addingSession, setAddingSession] = useState(false)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  const { messages, send, streamingContent, isStreaming } = useMessages(
    activeSessionId,
    activeSessionId
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const { create: createSession } = useSessions(taskId)

  // Auto-select first session
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, activeSessionId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await send(input.trim())
      setInput('')
    } catch (err) {
      console.error('Send failed:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAddSession = async () => {
    setAddingSession(true)
    try {
      const s = await createSession()
      setActiveSessionId(s.id)
    } finally {
      setAddingSession(false)
    }
  }

  return (
    <Stack h="100%" gap={0}>
      {/* Session tabs bar */}
      <Group gap="xs" px="xs" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-gray-0)', flexShrink: 0, overflowX: 'auto' }}>
        {sessions.map(s => (
          <Button
            key={s.id}
            variant={s.id === activeSessionId ? 'light' : 'subtle'}
            size="compact-xs"
            onClick={() => setActiveSessionId(s.id)}
            leftSection={<MessageSquare size={12} />}
          >
            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.title}
            </span>
            {s.messageCount > 0 && (
              <Badge size="xs" variant="outline" ml={4}>
                {s.messageCount}
              </Badge>
            )}
          </Button>
        ))}

        <ActionIcon
          size="xs"
          variant="subtle"
          onClick={handleAddSession}
          disabled={addingSession}
          title="新建会话"
        >
          <Plus size={12} />
        </ActionIcon>
      </Group>

      {/* Messages area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeSession ? (
          <>
            <ScrollArea style={{ flex: 1 }} ref={scrollRef}>
              <Stack gap={0} py="xs">
                {messages.length === 0 && !streamingContent ? (
                  <Stack align="center" justify="center" style={{ height: 192 }} c="dimmed">
                    <MessageSquare size={32} style={{ opacity: 0.3 }} />
                    <Text size="sm">还没有消息</Text>
                    <Text size="xs">发送消息开始对话</Text>
                  </Stack>
                ) : (
                  <>
                    {messages.map(msg => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {/* AI streaming preview */}
                    {streamingContent && (
                      <Group gap="md" px="md" py="xs">
                        <div style={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-gray-1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Bot size={14} style={{ color: 'var(--mantine-color-green-5)' }} />
                        </div>
                        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="sm">
                            <Text size="xs" fw={500}>AI</Text>
                            <Text size="xs" c="dimmed">思考中</Text>
                          </Group>
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
                            {streamingContent}
                          </Text>
                        </Stack>
                      </Group>
                    )}
                    {/* Waiting for first token */}
                    {isStreaming && !streamingContent && (
                      <Group gap="md" px="md" py="xs">
                        <div style={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: 'var(--mantine-color-gray-1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Bot size={14} style={{ color: 'var(--mantine-color-green-5)' }} />
                        </div>
                        <Group gap="sm">
                          <Text size="xs" fw={500}>AI</Text>
                          <Text size="xs" c="dimmed">思考中...</Text>
                        </Group>
                      </Group>
                    )}
                  </>
                )}
              </Stack>
            </ScrollArea>

            {/* Input bar */}
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--mantine-color-gray-3)', padding: 12, backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <Group gap="sm" align="flex-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
                  rows={2}
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  size="lg"
                  variant="filled"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                >
                  <Send size={16} />
                </ActionIcon>
              </Group>
            </div>
          </>
        ) : (
          <Stack align="center" justify="center" style={{ flex: 1 }} c="dimmed">
            <MessageSquare size={32} style={{ opacity: 0.3 }} />
            <Text size="sm">暂无会话</Text>
            <Button
              variant="outline"
              size="compact-sm"
              mt="sm"
              onClick={handleAddSession}
              disabled={addingSession}
              leftSection={<Plus size={14} />}
            >
              新建会话
            </Button>
          </Stack>
        )}
      </div>
    </Stack>
  )
}

// ----------------------------------------------------------------
// Artifacts tab
// ----------------------------------------------------------------
function ArtifactsTab({ taskId, workspacePath }: { taskId: string; workspacePath?: string }) {
  const { artifacts, loading, error, refetch } = useArtifacts(taskId)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const api = (window as any).api

  const handleScanChanges = async () => {
    setScanning(true)
    setScanResult(null)
    try {
      const result = await api.gitScanChanges(taskId)
      if (result?.error) {
        setScanResult(`错误: ${result.error}`)
      } else {
        setScanResult(`成功扫描 ${result?.count ?? 0} 个变更文件`)
        refetch()
      }
    } catch (err: any) {
      setScanResult(`错误: ${err.message ?? '扫描失败'}`)
    } finally {
      setScanning(false)
    }
  }

  const handlePreview = (artifact: any) => {
    if (!artifact.path) return
    if ((window as any).api?.openFile) {
      (window as any).api.openFile(artifact.path)
    } else {
      alert(`预览功能即将推出\n文件路径: ${artifact.path}`)
    }
  }

  const handleDownload = (artifact: any) => {
    if (!artifact.path) return
    if ((window as any).api?.saveFile) {
      (window as any).api.saveFile(artifact.path)
    } else {
      alert(`下载功能即将推出\n文件路径: ${artifact.path}`)
    }
  }

  const getChangeTypeBadge = (type?: string) => {
    if (!type) return null
    const config: Record<string, { label: string; color: string }> = {
      added: { label: '新增', color: 'green' },
      modified: { label: '修改', color: 'blue' },
      deleted: { label: '删除', color: 'red' },
    }
    const c = config[type]
    if (!c) return null
    return <Badge size="xs" color={c.color} variant="light">{c.label}</Badge>
  }

  if (loading) {
    return (
      <Group justify="center" h="100%" c="dimmed">
        <RefreshCw size={20} style={scanning ? { animation: 'spin 1s linear infinite' } : undefined} />
        <Text size="sm">加载中...</Text>
      </Group>
    )
  }

  if (error) {
    return (
      <Stack align="center" justify="center" h="100%" c="red">
        <XCircle size={32} />
        <Text size="sm">{error}</Text>
      </Stack>
    )
  }

  return (
    <Stack h="100%" gap={0}>
      {/* Header */}
      <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="sm">
          <Text size="sm" fw={500}>制品列表</Text>
          {artifacts.length > 0 && (
            <Badge size="xs" variant="light">{artifacts.length}</Badge>
          )}
        </Group>
        <Group gap="sm">
          {scanResult && (
            <Text size="xs" c={scanResult.includes('错误') ? 'red' : 'green'}>
              {scanResult}
            </Text>
          )}
          <Button
            variant="outline"
            size="compact-sm"
            onClick={handleScanChanges}
            disabled={scanning || !workspacePath}
            leftSection={<GitBranch size={16} style={scanning ? { animation: 'spin 1s linear infinite' } : undefined} />}
          >
            {scanning ? '扫描中...' : '扫描变更'}
          </Button>
        </Group>
      </Group>

      {/* Artifacts list */}
      <ScrollArea style={{ flex: 1 }}>
        {artifacts.length === 0 ? (
          <Stack align="center" justify="center" style={{ height: 192 }} c="dimmed">
            <FileBox size={32} style={{ opacity: 0.3 }} />
            <Text size="sm">暂无制品</Text>
            <Text size="xs">点击"扫描变更"检测文件变更</Text>
          </Stack>
        ) : (
          <Stack gap="sm" p="md">
            {artifacts.map(a => (
              <Group key={a.id} gap="md" p="md" style={{
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-3)',
                '&:hover': { backgroundColor: 'var(--mantine-color-gray-0)' },
              }}>
                {/* File icon */}
                <div style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: 'var(--mantine-color-gray-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {a.type === 'screenshot' ? '🖼️' :
                   a.type === 'code' ? '📄' :
                   a.type === 'report' ? '📊' :
                   getFileIcon(a.name)}
                </div>

                {/* File info */}
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="sm">
                    <Text size="sm" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </Text>
                    {getChangeTypeBadge(a.gitChangeType)}
                  </Group>
                  <Group gap="md">
                    <Text size="xs" c="dimmed">{formatFileSize(a.size)}</Text>
                    <Text size="xs" c="dimmed">{new Date(a.createdAt).toLocaleString('zh-CN')}</Text>
                    {a.isNew && <Badge size="xs" variant="light">新文件</Badge>}
                  </Group>
                  {a.description && (
                    <Text size="xs" c="dimmed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.description}
                    </Text>
                  )}
                </Stack>

                {/* Actions */}
                {a.path && (
                  <Group gap="xs" style={{ flexShrink: 0 }}>
                    <ActionIcon variant="subtle" size="sm" onClick={() => handlePreview(a)} title="预览">
                      <Eye size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" size="sm" onClick={() => handleDownload(a)} title="下载">
                      <Download size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  )
}

// ----------------------------------------------------------------
// Details tab
// ----------------------------------------------------------------
function DetailsTab({ task, workspaceName }: { task: Task; workspaceName?: string }) {
  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('zh-CN') : '—'

  const formatDuration = (ms?: number) => {
    if (!ms) return '—'
    const s = Math.round(ms / 1000)
    if (s < 60) return `${s}秒`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}分${s % 60}秒`
    const h = Math.floor(m / 60)
    return `${h}时${m % 60}分`
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: '任务标题', value: task.title },
    { label: '工作空间', value: workspaceName ?? task.workspaceId },
    { label: '状态', value: (
      <Group gap="xs">
        <Badge size="xs" color={STATUS_CONFIG[task.status]?.color} variant="filled" circle />
        <Text size="sm">{STATUS_CONFIG[task.status]?.label ?? task.status}</Text>
      </Group>
    )},
    { label: '优先级', value: (
      <Badge size="xs" color={PRIORITY_LABEL[task.priority]?.color} variant="light">
        {PRIORITY_LABEL[task.priority]?.label ?? task.priority}
      </Badge>
    )},
    { label: '创建时间', value: formatDate(task.createdAt) },
    { label: '开始时间', value: formatDate(task.startedAt) },
    { label: '结束时间', value: formatDate(task.finishedAt) },
    { label: '耗时', value: formatDuration(task.durationMs) },
    { label: '会话数', value: task.chatSessionIds.length },
    ...(task.description ? [{ label: '描述', value: task.description }] : []),
    ...(task.notes ? [{ label: '备注', value: task.notes }] : []),
  ]

  return (
    <ScrollArea h="100%">
      <Stack gap="sm" p="md">
        {rows.map(row => (
          <Group key={row.label} gap="md">
            <Text size="xs" c="dimmed" style={{ width: 80, flexShrink: 0 }}>{row.label}</Text>
            <Text size="sm" style={{ flex: 1 }}>{row.value}</Text>
          </Group>
        ))}
      </Stack>
    </ScrollArea>
  )
}

// ----------------------------------------------------------------
// TaskDetailPage
// ----------------------------------------------------------------
export function TaskDetailPage() {
  const { taskId, tab } = useParams<{ taskId: string; tab?: string }>()
  const navigate = useNavigate()
  const { tasks, start, complete, fail, cancel } = useTasks()
  const { workspaces } = useWorkspaces()
  const { sessions } = useSessions(taskId ?? null)
  const [activeTab, setActiveTab] = useState<Tab>('sessions')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync activeTab with URL param
  useEffect(() => {
    if (tab && ['sessions', 'files', 'artifacts', 'logs', 'details'].includes(tab)) {
      setActiveTab(tab as Tab)
    }
  }, [tab])

  // Auto-select first session
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, activeSessionId])

  const task = tasks.find(t => t.id === taskId)
  const workspace = workspaces.find(w => w.id === task?.workspaceId)

  // Load task if not in local state
  useEffect(() => {
    if (!task && taskId) {
      ;(window as any).api.taskGet(taskId).then(() => {
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [task, taskId])

  const handleStart = async () => {
    if (!taskId) return
    await start(taskId)
  }

  const handleComplete = async () => {
    if (!taskId) return
    await complete(taskId)
  }

  const handleFail = async () => {
    if (!taskId) return
    const notes = prompt('请输入失败原因（可选）：') ?? ''
    await fail(taskId, notes)
  }

  const handleCancel = async () => {
    if (!taskId) return
    await cancel(taskId)
  }

  if (loading) {
    return (
      <Group justify="center" h="100%" c="dimmed">
        <Clock size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <Text size="sm">加载中...</Text>
      </Group>
    )
  }

  if (!task) {
    return (
      <Stack align="center" justify="center" h="100%" c="dimmed" gap="md">
        <XCircle size={40} style={{ opacity: 0.3 }} />
        <Text size="lg" fw={500}>任务不存在</Text>
        <Button variant="outline" onClick={() => navigate(-1)}>
          返回
        </Button>
      </Stack>
    )
  }

  const statusConfig = STATUS_CONFIG[task.status]

  return (
    <Stack h="100%" gap={0}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Group gap="md" px="md" py="sm">
          {/* Back button */}
          <ActionIcon variant="subtle" onClick={() => navigate(-1)} title="返回">
            <ArrowLeft size={16} />
          </ActionIcon>

          <Divider orientation="vertical" />

          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="sm">
              <Badge size="sm" color={statusConfig.color} variant="light">
                {statusConfig.label}
              </Badge>
            </Group>
            {workspace && (
              <Group gap={4}>
                <ChevronRight size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                <Text size="xs" c="dimmed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {workspace.name}
                </Text>
              </Group>
            )}
          </Stack>

          {/* Action buttons */}
          <Group gap="xs" style={{ flexShrink: 0 }}>
            {task.status === 'pending' && (
              <Button size="compact-sm" variant="filled" leftSection={<PlayCircle size={16} />} onClick={handleStart}>
                开始
              </Button>
            )}
            {task.status === 'running' && (
              <>
                <Button size="compact-sm" variant="outline" color="green" leftSection={<CheckCircle2 size={16} />} onClick={handleComplete}>
                  完成
                </Button>
                <Button size="compact-sm" variant="outline" color="red" leftSection={<XCircle size={16} />} onClick={handleFail}>
                  失败
                </Button>
                <Button size="compact-sm" variant="subtle" color="gray" leftSection={<X size={16} />} onClick={handleCancel}>
                  取消
                </Button>
              </>
            )}
            {(task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') && (
              <Text size="xs" c="dimmed" px="sm">
                已结束 · {task.finishedAt && new Date(task.finishedAt).toLocaleString('zh-CN')}
              </Text>
            )}
          </Group>
        </Group>

        {/* Tab bar */}
        <Tabs value={activeTab} onChange={(v) => {
          setActiveTab(v as Tab)
          navigate(`/tasks/${task.id}/${v}`)
        }}>
          <Tabs.List style={{ paddingLeft: 16 }}>
            {([
              { key: 'sessions' as Tab, label: '对话', icon: MessageSquare },
              { key: 'files' as Tab, label: '文件变更', icon: File },
              { key: 'artifacts' as Tab, label: '制品', icon: FileBox },
              { key: 'logs' as Tab, label: '日志', icon: Info },
              { key: 'details' as Tab, label: '详情', icon: Info },
            ]).map(tab => (
              <Tabs.Tab key={tab.key} value={tab.key} leftSection={<tab.icon size={16} />}>
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'sessions' && (
          <SessionTab
            taskId={task.id}
            sessions={sessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
          />
        )}
        {activeTab === 'files' && (
          <FileChangesTab taskId={task.id} workspacePath={workspace?.rootPath} />
        )}
        {activeTab === 'artifacts' && (
          <ArtifactsTab taskId={task.id} workspacePath={workspace?.rootPath} />
        )}
        {activeTab === 'logs' && (
          <LogsTab task={task} />
        )}
        {activeTab === 'details' && (
          <DetailsTab task={task} workspaceName={workspace?.name} />
        )}
      </div>
    </Stack>
  )
}
