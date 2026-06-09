import type { AgentStatus } from '@/types/agent';

interface AgentStatusProps {
  status: AgentStatus;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig: Record<AgentStatus, { label: string; bgClass: string; dotClass: string }> = {
  idle: { label: '空闲', bgClass: 'bg-green-100 text-green-800', dotClass: 'bg-green-400' },
  running: { label: '运行中', bgClass: 'bg-blue-100 text-blue-800', dotClass: 'bg-blue-400' },
  error: { label: '错误', bgClass: 'bg-red-100 text-red-800', dotClass: 'bg-red-400' },
  disabled: { label: '已停用', bgClass: 'bg-gray-100 text-gray-800', dotClass: 'bg-gray-400' },
  initializing: { label: '初始化中', bgClass: 'bg-yellow-100 text-yellow-800', dotClass: 'bg-yellow-400' },
};

const sizeClasses = {
  small: 'px-2 py-0.5 text-xs',
  medium: 'px-2.5 py-0.5 text-sm',
  large: 'px-3 py-1 text-base',
};

export function AgentStatus({ status, showLabel = true, size = 'medium' }: AgentStatusProps) {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bgClass} ${sizeClass}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {showLabel && config.label}
    </span>
  );
}
