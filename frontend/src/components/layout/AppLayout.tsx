import { useState } from 'react'
import { SidebarIconBar } from './SidebarIconBar'
import { WorkspacePanel } from '@/components/workspace/WorkspacePanel'
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog'
import { RightPanel } from './RightPanel'
import { useWorkspaces, useActiveWorkspace } from '@/hooks/useWorkspace'
import { useActiveTask } from '@/hooks/useTask'
import { Box } from '@mantine/core'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const { create } = useWorkspaces()
  const { workspace } = useActiveWorkspace()
  const { task: activeTask } = useActiveTask()

  return (
    <>
      <Box
        display="flex"
        style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--mantine-color-body)' }}
      >
        {/* Left: Icon bar (56px) */}
        <SidebarIconBar onNewTask={() => setCreateOpen(true)} />

        {/* Middle: Workspace panel (280px) */}
        <Box
          w={280}
          style={{
            flexShrink: 0,
            borderRight: '1px solid var(--mantine-color-border, #373a40)',
            background: 'var(--mantine-color-sidebar, #1a1b1e)',
            overflow: 'hidden',
          }}
        >
          <WorkspacePanel />
        </Box>

        {/* Main content: fills remaining space */}
        <Box style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </Box>

        {/* Right: Tool panel (320px, collapsible) */}
        <RightPanel
          isOpen={rightPanelOpen}
          onToggle={() => setRightPanelOpen(v => !v)}
          workspacePath={workspace?.rootPath}
          taskId={activeTask?.id}
        />
      </Box>

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async input => { await create(input) }}
      />
    </>
  )
}
