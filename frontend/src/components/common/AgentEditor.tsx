import { useState, useEffect } from 'react';
import type { AgentConfig, AgentCreateInput, AgentStatus } from '@/types/agent';
import { Modal, Stack, Group, TextInput, Textarea, Select, Slider, NumberInput, Text, Button } from '@mantine/core';

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
  const [provider, setProvider] = useState<string | null>('openai');
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
        provider: (provider || 'openai') as 'openai' | 'anthropic' | 'google' | 'local',
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
    <Modal
      opened={open}
      onClose={onCancel}
      title={isEdit ? '编辑 Agent' : '创建 Agent'}
      size="xl"
    >
      <Stack gap="md">
        <TextInput
          label="名称 *"
          placeholder="输入 Agent 名称"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          error={errors.name}
          required
        />

        <Textarea
          label="描述"
          placeholder="输入 Agent 描述"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={3}
        />

        <Group grow>
          <Select
            label="提供商 *"
            placeholder="选择提供商"
            data={providerOptions}
            value={provider}
            onChange={setProvider}
            required
          />

          <TextInput
            label="模型 ID *"
            placeholder="如: gpt-4"
            value={modelId}
            onChange={(e) => setModelId(e.currentTarget.value)}
            error={errors.modelId}
            required
          />
        </Group>

        <Textarea
          label="系统提示词"
          placeholder="输入系统提示词"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.currentTarget.value)}
          minRows={4}
        />

        <Group grow align="flex-start">
          <Stack gap={4}>
            <Text size="sm" fw={500}>温度: {temperature}</Text>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={setTemperature}
              marks={[
                { value: 0, label: '0' },
                { value: 1, label: '1' },
                { value: 2, label: '2' },
              ]}
            />
            {errors.temperature && (
              <Text size="xs" c="red">{errors.temperature}</Text>
            )}
          </Stack>

          <NumberInput
            label="最大 Token"
            value={maxTokens}
            onChange={(v) => setMaxTokens(Number(v))}
            min={1}
            max={128000}
          />
        </Group>
      </Stack>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={handleSave}>
          {isEdit ? '更新' : '创建'}
        </Button>
      </Group>
    </Modal>
  );
}
