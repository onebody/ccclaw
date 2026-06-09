import { useState } from 'react'
import { SidebarIconBar } from './SidebarIconBar'
import { WorkspacePanel } from '@/components/workspace/WorkspacePanel'
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog'
import { useWorkspaces } from '@/hooks/useWorkspace'
import { Separator } from '@/components/ui/separator'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const { create } = useWorkspaces()

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Left: Icon bar (56px) */}
        <SidebarIconBar onNewTask={() => setCreateOpen(true)} />

        {/* Middle: Workspace panel (280px) */}
        <div className="w-[280px] flex-shrink-0 border-r border-border bg-sidebar overflow-hidden">
          <WorkspacePanel />
        </div>
        <Separator orientation="vertical" className="h-full" />

        {/* Main content: fills remaining space */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async input => { await create(input) }}
      />
    </>
  )
}
