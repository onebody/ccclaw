import { useState, useCallback } from 'react'
import { Tabs, Group, Text, Button, ActionIcon, Stack, TextInput } from '@mantine/core'
import {
  FolderOpen,
  GitBranch,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  Code2,
  FileJson,
  FileSpreadsheet,
  File,
} from 'lucide-react'

// ----------------------------------------------------------------
// File tree types
// ----------------------------------------------------------------
interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
  size?: number
  modifiedAt?: string
}

// ----------------------------------------------------------------
// FileBrowser - 文件浏览器
// ----------------------------------------------------------------
function FileBrowser({ workspacePath }: { workspacePath?: string }) {
  const [fileTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  const loadDirectory = useCallback(async (_dirPath: string) => {
    if (!workspacePath) return
    setLoading(true)
    try {
      // TODO: 通过 IPC 调用主进程的文件系统读取
    } catch (err) {
      console.error('Failed to load directory:', err)
    } finally {
      setLoading(false)
    }
  }, [workspacePath])

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
        loadDirectory(path)
      }
      return next
    })
  }

  const getFileIcon = (name: string, isDirectory: boolean) => {
    if (isDirectory) return <FolderOpen size={16} style={{ color: 'var(--mantine-color-blue-5)' }} />
    
    const ext = name.split('.').pop()?.toLowerCase()
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || ''))
      return <Image size={16} style={{ color: 'var(--mantine-color-green-5)' }} />
    if (['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'].includes(ext || ''))
      return <Code2 size={16} style={{ color: 'var(--mantine-color-yellow-5)' }} />
    if (['json', 'yaml', 'yml', 'toml'].includes(ext || ''))
      return <FileJson size={16} style={{ color: 'var(--mantine-color-orange-5)' }} />
    if (['md', 'txt', 'rst'].includes(ext || ''))
      return <FileText size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />
    if (['csv', 'xlsx', 'xls'].includes(ext || ''))
      return <FileSpreadsheet size={16} style={{ color: 'var(--mantine-color-teal-5)' }} />
    return <File size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
  }

  const renderNode = (node: FileNode, depth: number = 0) => (
    <div key={node.path}>
      <Group 
        gap="xs" 
        px="xs" 
        py={4}
        style={{ 
          cursor: 'pointer', 
          borderRadius: 4,
          paddingLeft: `${depth * 16 + 8}px`,
        }}
        onClick={() => node.isDirectory && toggleDir(node.path)}
      >
        {node.isDirectory && (
          <ChevronRight
            size={14}
            style={{
              flexShrink: 0,
              transition: 'transform 0.2s',
              transform: expandedDirs.has(node.path) ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        )}
        <div style={{ flexShrink: 0 }}>{getFileIcon(node.name, node.isDirectory)}</div>
        <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {node.name}
        </Text>
        {!node.isDirectory && node.size !== undefined && (
          <Text size="xs" c="dimmed" style={{ flexShrink: 0, marginLeft: 'auto' }}>
            {node.size < 1024 ? `${node.size}B` :
             node.size < 1024 * 1024 ? `${(node.size / 1024).toFixed(1)}KB` :
             `${(node.size / (1024 * 1024)).toFixed(1)}MB`}
          </Text>
        )}
      </Group>
      {node.isDirectory && expandedDirs.has(node.path) && node.children?.map(child =>
        renderNode(child, depth + 1)
      )}
    </div>
  )

  if (!workspacePath) {
    return (
      <Stack align="center" justify="center" h="100%" c="dimmed" p="md">
        <FolderOpen size={32} style={{ opacity: 0.3 }} />
        <Text size="sm">未选择工作空间</Text>
      </Stack>
    )
  }

  return (
    <Stack h="100%" gap={0}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" fw={500}>文件浏览器</Text>
        <Text size="xs" c="dimmed" mt={2} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {workspacePath}
        </Text>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Group justify="center" p="md">
            <Text size="sm" c="dimmed">加载中...</Text>
          </Group>
        ) : fileTree.length === 0 ? (
          <Stack align="center" p="xl" c="dimmed">
            <Text size="sm">暂无文件</Text>
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => loadDirectory(workspacePath)}
            >
              加载文件树
            </Button>
          </Stack>
        ) : (
          <div style={{ padding: 4 }}>{fileTree.map(node => renderNode(node))}</div>
        )}
      </div>
    </Stack>
  )
}

// ----------------------------------------------------------------
// GitPanel - Git 面板
// ----------------------------------------------------------------
function GitPanel({ workspacePath, taskId }: { workspacePath?: string; taskId?: string }) {
  const [gitStatus, setGitStatus] = useState<{
    modified?: string[]
    created?: string[]
    deleted?: string[]
    renamed?: { from: string; to: string }[]
    conflicted?: string[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadGitStatus = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    try {
      const result = await (window as any).api.gitStatus(taskId)
      if (result?.error) {
        console.error('Git status error:', result.error)
      } else {
        setGitStatus(result)
      }
    } catch (err) {
      console.error('Failed to load git status:', err)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  if (!workspacePath) {
    return (
      <Stack align="center" justify="center" h="100%" c="dimmed" p="md">
        <GitBranch size={32} style={{ opacity: 0.3 }} />
        <Text size="sm">未选择工作空间</Text>
      </Stack>
    )
  }

  const renderFileList = (title: string, files: string[], color: string) => {
    if (!files || files.length === 0) return null
    return (
      <Stack gap="xs" mb="sm">
        <Text size="xs" fw={500} c={color}>{title} ({files.length})</Text>
        {files.map(f => (
          <Text 
            key={f} 
            size="xs" 
            px="xs" 
            py={2} 
            style={{ borderRadius: 4, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {f}
          </Text>
        ))}
      </Stack>
    )
  }

  return (
    <Stack h="100%" gap={0}>
      <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" fw={500}>Git 面板</Text>
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={loadGitStatus}
          disabled={loading}
        >
          {loading ? '加载中...' : '刷新'}
        </Button>
      </Group>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {gitStatus ? (
          <>
            {renderFileList('已修改', gitStatus.modified || [], 'yellow')}
            {renderFileList('新建', gitStatus.created || [], 'green')}
            {renderFileList('已删除', gitStatus.deleted || [], 'red')}
            {renderFileList('冲突', gitStatus.conflicted || [], 'orange')}
            {gitStatus.renamed && gitStatus.renamed.length > 0 && (
              <Stack gap="xs" mb="sm">
                <Text size="xs" fw={500} c="blue">重命名 ({gitStatus.renamed.length})</Text>
                {gitStatus.renamed.map(r => (
                  <Text key={r.from} size="xs" px="xs" py={2} style={{ borderRadius: 4 }}>
                    {r.from} → {r.to}
                  </Text>
                ))}
              </Stack>
            )}
            {!gitStatus.modified?.length &&
             !gitStatus.created?.length &&
             !gitStatus.deleted?.length &&
             !gitStatus.renamed?.length &&
             !gitStatus.conflicted?.length && (
              <Text size="sm" c="dimmed" ta="center" py="md">
                工作区干净，无变更
              </Text>
            )}
          </>
        ) : (
          <Stack align="center" justify="center" py="xl" c="dimmed">
            <GitBranch size={32} style={{ opacity: 0.3 }} />
            <Text size="sm">点击刷新查看 Git 状态</Text>
          </Stack>
        )}
      </div>
    </Stack>
  )
}

// ----------------------------------------------------------------
// TerminalPanel - 终端面板
// ----------------------------------------------------------------
function TerminalPanel({ workspacePath }: { workspacePath?: string }) {
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<{ cmd: string; output: string; isError: boolean }[]>([
    { cmd: 'echo "欢迎使用 Ccclaw 终端"', output: '欢迎使用 Ccclaw 终端', isError: false },
    { cmd: 'ls -la', output: '（终端功能即将推出，将集成 xterm.js）', isError: false },
  ])
  const [isRunning, setIsRunning] = useState(false)

  const handleRunCommand = async () => {
    if (!command.trim() || !workspacePath) return
    setIsRunning(true)
    try {
      setHistory(prev => [...prev, { cmd: command, output: `(已执行: ${command})`, isError: false }])
      setCommand('')
    } catch (err: any) {
      setHistory(prev => [...prev, { cmd: command, output: err.message || '执行失败', isError: true }])
    } finally {
      setIsRunning(false)
    }
  }

  if (!workspacePath) {
    return (
      <Stack align="center" justify="center" h="100%" c="dimmed" p="md">
        <Terminal size={32} style={{ opacity: 0.3 }} />
        <Text size="sm">未选择工作空间</Text>
      </Stack>
    )
  }

  return (
    <Stack h="100%" gap={0}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" fw={500}>终端</Text>
        <Text size="xs" c="dimmed" mt={2} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {workspacePath}
        </Text>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12, fontFamily: 'monospace', fontSize: 13, backgroundColor: 'var(--mantine-color-gray-0)' }}>
        {history.map((item, idx) => (
          <Stack key={idx} gap={2} mb="sm">
            <Group gap="sm">
              <Text size="sm" c="green" ff="monospace">$</Text>
              <Text size="sm" ff="monospace">{item.cmd}</Text>
            </Group>
            <Text 
              size="sm" 
              pl="md" 
              c={item.isError ? 'red' : 'dimmed'}
              ff="monospace"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {item.output}
            </Text>
          </Stack>
        ))}
        {isRunning && (
          <Text size="sm" c="dimmed">执行中...</Text>
        )}
      </div>
      <Group gap="sm" p="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" c="green" ff="monospace" style={{ flexShrink: 0 }}>$</Text>
        <TextInput
          variant="unstyled"
          value={command}
          onChange={(e) => setCommand(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRunCommand() }}
          placeholder="输入命令..."
          disabled={isRunning}
          style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
        />
      </Group>
    </Stack>
  )
}

// ----------------------------------------------------------------
// AgentConfig - Agent 配置面板
// ----------------------------------------------------------------
function AgentConfig() {
  const [agentId, setAgentId] = useState<string | null>(null)
  const availableAgents = [
    { id: 'agent-1', name: '代码助手', description: '代码编写与重构' },
    { id: 'agent-2', name: '测试专家', description: '自动化测试生成' },
    { id: 'agent-3', name: '文档编写', description: '技术文档与注释' },
  ]

  return (
    <Stack h="100%" gap={0}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" fw={500}>Agent 配置</Text>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <Text size="xs" c="dimmed" mb="sm">
          选择当前任务使用的 Agent
        </Text>
        <Stack gap="sm">
          {availableAgents.map(agent => (
            <div
              key={agent.id}
              onClick={() => setAgentId(agent.id)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: agentId === agent.id ? '2px solid var(--mantine-color-blue-5)' : '1px solid var(--mantine-color-gray-3)',
                backgroundColor: agentId === agent.id ? 'var(--mantine-color-blue-0)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Text size="sm" fw={500}>{agent.name}</Text>
              <Text size="xs" c="dimmed" mt={2}>{agent.description}</Text>
            </div>
          ))}
        </Stack>
      </div>
    </Stack>
  )
}

// ----------------------------------------------------------------
// RightPanel - 主容器
// ----------------------------------------------------------------
interface RightPanelProps {
  isOpen: boolean
  onToggle: () => void
  workspacePath?: string
  taskId?: string
}

export function RightPanel({ isOpen, onToggle, workspacePath, taskId }: RightPanelProps) {
  return (
    <>
      {/* Toggle button */}
      <ActionIcon
        variant="default"
        size="lg"
        onClick={onToggle}
        title={isOpen ? '收起面板' : '展开面板'}
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          height: 48,
          width: 20,
          borderRadius: '6px 0 0 6px',
          borderRight: 'none',
        }}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </ActionIcon>

      {/* Panel */}
      <div
        style={{
          height: '100%',
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-body)',
          overflow: 'hidden',
          transition: 'all 0.3s',
          width: isOpen ? 320 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        {isOpen && (
          <Tabs defaultValue="files" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs.List style={{ paddingLeft: 8, paddingTop: 8 }}>
              <Tabs.Tab value="files" leftSection={<FolderOpen size={14} />}>
                <Text size="xs">文件</Text>
              </Tabs.Tab>
              <Tabs.Tab value="git" leftSection={<GitBranch size={14} />}>
                <Text size="xs">Git</Text>
              </Tabs.Tab>
              <Tabs.Tab value="terminal" leftSection={<Terminal size={14} />}>
                <Text size="xs">终端</Text>
              </Tabs.Tab>
              <Tabs.Tab value="agent" leftSection={<Settings size={14} />}>
                <Text size="xs">Agent</Text>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="files" style={{ flex: 1, overflow: 'hidden' }}>
              <FileBrowser workspacePath={workspacePath} />
            </Tabs.Panel>

            <Tabs.Panel value="git" style={{ flex: 1, overflow: 'hidden' }}>
              <GitPanel workspacePath={workspacePath} taskId={taskId} />
            </Tabs.Panel>

            <Tabs.Panel value="terminal" style={{ flex: 1, overflow: 'hidden' }}>
              <TerminalPanel workspacePath={workspacePath} />
            </Tabs.Panel>

            <Tabs.Panel value="agent" style={{ flex: 1, overflow: 'hidden' }}>
              <AgentConfig />
            </Tabs.Panel>
          </Tabs>
        )}
      </div>
    </>
  )
}
