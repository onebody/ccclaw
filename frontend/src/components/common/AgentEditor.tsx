import { useState, useEffect } from 'react';
import type { AgentConfig, AgentCreateInput, AgentStatus } from '@/types/agent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentEditorProps {
  open: boolean;
  agent?: AgentConfig;
  onSave: () => void;
  onCancel: () => void;
  onSaveAgent: (input: AgentCreateInput) => Promise<void>;
  onUpdateAgent?: (id: string, input: Partial<AgentConfig>) => Promise<void>;
}

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'local', label: 'Local' },
];

export function AgentEditor({
  open,
  agent,
  onSave,
  onCancel,
  onSaveAgent,
  onUpdateAgent,
}: AgentEditorProps) {
  const isEdit = !!agent;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'local'>('openai');
  const [modelId, setModelId] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setProvider(agent.model.provider);
      setModelId(agent.model.modelId);
      setTemperature(agent.parameters.temperature || 0.7);
      setMaxTokens(agent.parameters.maxTokens || 4096);
      setSystemPrompt(agent.systemPrompt);
      setStatus(agent.status);
    } else {
      setName('');
      setDescription('');
      setProvider('openai');
      setModelId('');
      setTemperature(0.7);
      setMaxTokens(4096);
      setSystemPrompt('');
      setStatus('idle');
    }
    setErrors({});
  }, [agent, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '名称不能为空';
    if (!modelId.trim()) newErrors.modelId = '模型 ID 不能为空';
    if (temperature < 0 || temperature > 2) newErrors.temperature = '温度必须在 0-2 之间';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const input: AgentCreateInput = {
      name,
      description,
      model: {
        provider,
        modelId,
      },
      systemPrompt,
      parameters: {
        temperature,
        maxTokens,
      },
      skills: [],
      status,
    };

    try {
      if (isEdit && agent && onUpdateAgent) {
        await onUpdateAgent(agent.id, input);
      } else {
        await onSaveAgent(input);
      }
      onSave();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑 Agent' : '创建 Agent'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改 Agent 配置' : '创建一个新的 Agent'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入 Agent 名称"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入 Agent 描述"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="provider">提供商 *</Label>
              <Select
                value={provider}
                onValueChange={(v) => setProvider(v as 'openai' | 'anthropic' | 'google' | 'local')}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modelId">模型 ID *</Label>
              <Input
                id="modelId"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder="如: gpt-4"
              />
              {errors.modelId && <p className="text-sm text-red-500">{errors.modelId}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="systemPrompt">系统提示词</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="输入系统提示词"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="temperature">温度: {temperature}</Label>
              <Input
                id="temperature"
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              {errors.temperature && <p className="text-sm text-red-500">{errors.temperature}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxTokens">最大 Token</Label>
              <Input
                id="maxTokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? '更新' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
