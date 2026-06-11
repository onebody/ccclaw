import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
      // const nodes = await window.api.readDirectory(dirPath)
      // setFileTree(nodes)
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
    if (isDirectory) return <FolderOpen className="h-4 w-4 text-blue-500" />
    
    const ext = name.split('.').pop()?.toLowerCase()
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || ''))
      return <Image className="h-4 w-4 text-green-500" />
    if (['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'].includes(ext || ''))
      return <Code2 className="h-4 w-4 text-yellow-500" />
    if (['json', 'yaml', 'yml', 'toml'].includes(ext || ''))
      return <FileJson className="h-4 w-4 text-orange-500" />
    if (['md', 'txt', 'rst'].includes(ext || ''))
      return <FileText className="h-4 w-4 text-gray-500" />
    if (['csv', 'xlsx', 'xls'].includes(ext || ''))
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    return <File className="h-4 w-4 text-muted-foreground" />
  }

  const renderNode = (node: FileNode, depth: number = 0) => (
    <div key={node.path}>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1 hover:bg-accent/50 rounded cursor-pointer text-sm",
          "transition-colors"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.isDirectory && toggleDir(node.path)}
      >
        {node.isDirectory && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 flex-shrink-0 transition-transform",
              expandedDirs.has(node.path) && "rotate-90"
            )}
          />
        )}
        <span className="flex-shrink-0">{getFileIcon(node.name, node.isDirectory)}</span>
        <span className="truncate">{node.name}</span>
        {!node.isDirectory && node.size !== undefined && (
          <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
            {node.size < 1024 ? `${node.size}B` :
             node.size < 1024 * 1024 ? `${(node.size / 1024).toFixed(1)}KB` :
             `${(node.size / (1024 * 1024)).toFixed(1)}MB`}
          </span>
        )}
      </div>
      {node.isDirectory && expandedDirs.has(node.path) && node.children?.map(child =>
        renderNode(child, depth + 1)
      )}
    </div>
  )

  if (!workspacePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <FolderOpen className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">未选择工作空间</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b">
        <h4 className="text-sm font-medium">文件浏览器</h4>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {workspacePath}
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <span className="text-sm text-muted-foreground">加载中...</span>
          </div>
        ) : fileTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <p className="text-sm">暂无文件</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => loadDirectory(workspacePath)}
            >
              加载文件树
            </Button>
          </div>
        ) : (
          <div className="py-1">{fileTree.map(node => renderNode(node))}</div>
        )}
      </div>
    </div>
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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <GitBranch className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">未选择工作空间</p>
      </div>
    )
  }

  const renderFileList = (title: string, files: string[], colorClass: string) => {
    if (!files || files.length === 0) return null
    return (
      <div className="mb-3">
        <h5 className={cn("text-xs font-medium mb-1", colorClass)}>{title} ({files.length})</h5>
        <div className="space-y-0.5">
          {files.map(f => (
            <div key={f} className="text-xs px-2 py-0.5 rounded hover:bg-accent/50 cursor-pointer truncate">
              {f}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h4 className="text-sm font-medium">Git 面板</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadGitStatus}
          disabled={loading}
          className="h-7 px-2"
        >
          {loading ? '加载中...' : '刷新'}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {gitStatus ? (
          <>
            {renderFileList('已修改', gitStatus.modified || [], 'text-yellow-600')}
            {renderFileList('新建', gitStatus.created || [], 'text-green-600')}
            {renderFileList('已删除', gitStatus.deleted || [], 'text-red-600')}
            {renderFileList('冲突', gitStatus.conflicted || [], 'text-orange-600')}
            {gitStatus.renamed && gitStatus.renamed.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium mb-1 text-blue-600">
                  重命名 ({gitStatus.renamed.length})
                </h5>
                {gitStatus.renamed.map(r => (
                  <div key={r.from} className="text-xs px-2 py-0.5 rounded hover:bg-accent/50">
                    {r.from} → {r.to}
                  </div>
                ))}
              </div>
            )}
            {!gitStatus.modified?.length &&
             !gitStatus.created?.length &&
             !gitStatus.deleted?.length &&
             !gitStatus.renamed?.length &&
             !gitStatus.conflicted?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">
                工作区干净，无变更
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <GitBranch className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">点击刷新查看 Git 状态</p>
          </div>
        )}
      </div>
    </div>
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
      // TODO: 通过 IPC 调用主进程执行命令
      // const result = await window.api.runCommand(workspacePath, command)
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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <Terminal className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">未选择工作空间</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b">
        <h4 className="text-sm font-medium">终端</h4>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {workspacePath}
        </p>
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-sm bg-black/5 dark:bg-black/20">
        {history.map((item, idx) => (
          <div key={idx} className="mb-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span>$</span>
              <span>{item.cmd}</span>
            </div>
            <div className={cn(
              "pl-4 whitespace-pre-wrap",
              item.isError ? "text-red-500" : "text-foreground/80"
            )}>
              {item.output}
            </div>
          </div>
        ))}
        {isRunning && (
          <div className="text-muted-foreground">执行中...</div>
        )}
      </div>
      <div className="p-2 border-t flex gap-2">
        <span className="text-green-600 dark:text-green-400 font-mono text-sm flex-shrink-0">$</span>
        <input
          className="flex-1 bg-transparent outline-none text-sm font-mono"
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRunCommand()}
          placeholder="输入命令..."
          disabled={isRunning}
        />
      </div>
    </div>
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
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b">
        <h4 className="text-sm font-medium">Agent 配置</h4>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        <p className="text-xs text-muted-foreground mb-2">
          选择当前任务使用的 Agent
        </p>
        {availableAgents.map(agent => (
          <div
            key={agent.id}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors",
              agentId === agent.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent/30"
            )}
            onClick={() => setAgentId(agent.id)}
          >
            <div className="font-medium text-sm">{agent.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {agent.description}
            </div>
          </div>
        ))}
      </div>
    </div>
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
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-10 h-16 w-5 rounded-l-md rounded-r-none border border-r-0 bg-background hover:bg-accent"
        title={isOpen ? '收起面板' : '展开面板'}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Panel */}
      <div
        className={cn(
          "h-full border-l border-border bg-sidebar overflow-hidden transition-all duration-300",
          isOpen ? "w-[320px] opacity-100" : "w-0 opacity-0"
        )}
      >
        {isOpen && (
          <Tabs defaultValue="files" className="h-full flex flex-col">
            <TabsList className="w-full justify-start px-2 pt-2 bg-transparent">
              <TabsTrigger value="files" className="text-xs gap-1">
                <FolderOpen className="h-3.5 w-3.5" />
                文件
              </TabsTrigger>
              <TabsTrigger value="git" className="text-xs gap-1">
                <GitBranch className="h-3.5 w-3.5" />
                Git
              </TabsTrigger>
              <TabsTrigger value="terminal" className="text-xs gap-1">
                <Terminal className="h-3.5 w-3.5" />
                终端
              </TabsTrigger>
              <TabsTrigger value="agent" className="text-xs gap-1">
                <Settings className="h-3.5 w-3.5" />
                Agent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 overflow-hidden mt-0">
              <FileBrowser workspacePath={workspacePath} />
            </TabsContent>

            <TabsContent value="git" className="flex-1 overflow-hidden mt-0">
              <GitPanel workspacePath={workspacePath} taskId={taskId} />
            </TabsContent>

            <TabsContent value="terminal" className="flex-1 overflow-hidden mt-0">
              <TerminalPanel workspacePath={workspacePath} />
            </TabsContent>

            <TabsContent value="agent" className="flex-1 overflow-hidden mt-0">
              <AgentConfig />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
}
