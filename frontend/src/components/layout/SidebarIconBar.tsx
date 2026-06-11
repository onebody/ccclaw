import { NavLink } from 'react-router-dom'
import { Hexagon, Plus, MessageSquare, Users, Zap, MoreHorizontal, Settings, User } from 'lucide-react'
import { 
  Stack, 
  ActionIcon, 
  Tooltip,
} from '@mantine/core'

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
    <Stack 
      h="100%" 
      w={56} 
      bg="sidebar" 
      px="xs" 
      py="md" 
      justify="space-between"
      className="border-r border-border"
    >
      {/* Top: Logo */}
      <Stack align="center" gap="xs">
        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
          C
        </div>

        {/* New task button */}
        <Tooltip label="新建任务" position="right">
          <ActionIcon
            size="lg"
            color="blue"
            variant="filled"
            onClick={onNewTask}
            className="mb-2"
          >
            <Plus size={18} />
          </ActionIcon>
        </Tooltip>

        <div className="w-8 h-px border-t border-border my-1" />

        {/* Nav items */}
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => 
              `flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
            title={label}
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </Stack>

      {/* Bottom: More + Settings + User */}
      <Stack align="center" gap="xs">
        <ActionIcon
          size="lg"
          variant="subtle"
          onClick={() => {}}
          title="更多"
        >
          <MoreHorizontal size={20} />
        </ActionIcon>

        <ActionIcon
          size="lg"
          variant="subtle"
          onClick={() => {}}
          title="设置"
        >
          <Settings size={20} />
        </ActionIcon>

        <ActionIcon
          size="lg"
          variant="subtle"
          onClick={() => {}}
          title="用户"
        >
          <User size={20} />
        </ActionIcon>
      </Stack>
    </Stack>
  )
}
