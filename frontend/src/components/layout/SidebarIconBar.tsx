import { NavLink } from 'react-router-dom'
import {
  Hexagon, Plus, MessageSquare, Users, Zap, MoreHorizontal,
  Settings, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface IconBarProps {
  onNewTask?: () => void
}

const NAV_ITEMS = [
  { icon: Hexagon, label: '首页', path: '/' },
  { icon: MessageSquare, label: '助手', path: '/chat' },
  { icon: Users, label: '专家', path: '/experts' },
  { icon: Zap, label: '自动化', path: '/automations' },
]

export function SidebarIconBar({ onNewTask }: IconBarProps) {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-border w-14">
      {/* Top: Logo */}
      <div className="flex items-center justify-center h-14 flex-shrink-0 border-b border-border">
        <Hexagon className="h-6 w-6 text-blue-500" />
      </div>

      {/* Main nav */}
      <div className="flex-1 flex flex-col items-center py-3 gap-1">
        {/* New task button */}
        <button
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors mb-2"
          onClick={onNewTask}
          title="新建任务"
        >
          <Plus className="h-5 w-5" />
        </button>

        <Separator className="w-8 mb-2" />

        {/* Nav items */}
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "flex items-center justify-center h-10 w-10 rounded-xl transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              isActive && "bg-accent text-accent-foreground"
            )}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        ))}

        {/* More */}
        <button
          className="flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1"
          title="更多"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom: Settings + User */}
      <div className="flex flex-col items-center py-3 gap-1 border-t border-border">
        <button
          className="flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="设置"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          className="flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="用户"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
