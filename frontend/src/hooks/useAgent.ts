import { useState, useEffect, useCallback } from 'react';
import type {
  AgentConfig,
  AgentCreateInput,
  AgentUpdateInput,
  AgentListFilter,
  AgentStatus,
} from '@/types/agent';

// 调用 API 并处理响应
async function callAPI<T>(promise: Promise<any>): Promise<T> {
  const result = await promise;
  if (result.ok) {
    return result.data as T;
  }
  throw new Error(result.error || '未知错误');
}

const api = (window as any).api;

// 获取 Agent 列表
export function useAgents(filter?: AgentListFilter) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await callAPI<AgentConfig[]>(api.agentsGetAll(filter));
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { agents, loading, error, refetch: fetchAgents };
}

// 获取单个 Agent
export function useAgent(id: string | null) {
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgent = useCallback(async () => {
    if (!id) {
      setAgent(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await callAPI<AgentConfig>(api.agentsGet(id));
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { agent, loading, error, refetch: fetchAgent };
}

// 创建 Agent
export function useCreateAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAgent = useCallback(async (input: AgentCreateInput): Promise<AgentConfig> => {
    try {
      setLoading(true);
      setError(null);
      const data = await callAPI<AgentConfig>(api.agentsCreate(input));
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createAgent, loading, error };
}

// 更新 Agent
export function useUpdateAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateAgent = useCallback(async (id: string, input: AgentUpdateInput): Promise<AgentConfig> => {
    try {
      setLoading(true);
      setError(null);
      const data = await callAPI<AgentConfig>(api.agentsUpdate(id, input));
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateAgent, loading, error };
}

// 删除 Agent
export function useDeleteAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await callAPI<boolean>(api.agentsDelete(id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteAgent, loading, error };
}

// 设置 Agent 状态
export function useSetAgentStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setStatus = useCallback(async (id: string, status: AgentStatus): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await callAPI<boolean>(api.agentsSetStatus(id, status));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { setStatus, loading, error };
}
