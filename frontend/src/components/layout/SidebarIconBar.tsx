import { NavLink, useLocation } from 'react-router-dom'
import { Hexagon, Plus, MessageSquare, Users, Zap, MoreHorizontal, Settings, User } from 'lucide-react'
import { 
  Stack, 
  ActionIcon, 
  Tooltip,
  Box,
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
  const location = useLocation()

  return (
    <Stack 
      h="100%" 
      w={56} 
      bg="var(--mantine-color-sidebar, #1a1b1e)" 
      px="xs" 
      py="md" 
      justify="space-between"
      style={{ borderRight: '1px solid var(--mantine-color-border, #373a40)' }}
    >
      {/* Top: Logo */}
      <Stack align="center" gap="xs">
        <Box
          w={32}
          h={32}
          style={{
            borderRadius: '0.75rem',
            background: 'var(--mantine-color-blue-5, #339af0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
          }}
        >
          C
        </Box>

        {/* New task button */}
        <Tooltip label="新建任务" position="right">
          <ActionIcon
            size="lg"
            color="blue"
            variant="filled"
            onClick={onNewTask}
            mb="xs"
          >
            <Plus size={18} />
          </ActionIcon>
        </Tooltip>

        <Box 
          w={32} 
          h={1} 
          style={{ 
            borderTop: '1px solid var(--mantine-color-border, #373a40)' 
          }} 
          my="xs" 
        />

        {/* Nav items */}
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path))
          
          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '0.75rem',
                transition: 'colors 0.15s',
                background: isActive ? 'var(--mantine-color-accent, #25262b)' : 'transparent',
                color: isActive 
                  ? 'var(--mantine-color-accent-foreground, #c1c2c5)' 
                  : 'var(--mantine-color-dimmed, #909296)',
              }}
              title={label}
            >
              <Icon size={20} />
            </NavLink>
          )
        })}
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
