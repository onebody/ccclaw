import type { AgentConfig, AgentStatus } from '@/types/agent';
import { Card, CardHeader, CardContent, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AgentStatus as AgentStatusBadge } from './AgentStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface AgentCardProps {
  agent: AgentConfig;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: AgentStatus) => void;
}

const statusOptions: AgentStatus[] = ['idle', 'running', 'error', 'disabled', 'initializing'];

export function AgentCard({ agent, onEdit, onDelete, onStatusChange }: AgentCardProps) {
  const handleStatusChange = (status: AgentStatus) => {
    onStatusChange(agent.id, status);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold leading-none">{agent.name}</h3>
          <AgentStatusBadge status={agent.status} size="small" />
        </div>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(agent.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={status === agent.status}
                >
                  设为{status}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => onDelete(agent.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        {agent.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
            {agent.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{agent.model.provider}</span>
          <span>/</span>
          <span>{agent.model.modelId}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          更新于 {new Date(agent.updatedAt).toLocaleDateString('zh-CN')}
        </div>
      </CardContent>
    </Card>
  );
}
