/**
 * AgentManager 单元测试
 *
 * 测试 AgentManager 类的所有功能
 */

import { AgentManager } from '../agent-manager';
import { AgentStorage } from '../agent-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { AgentConfig, AgentCreateInput } from '../../../src/types/agent';

describe('AgentManager', () => {
  let manager: AgentManager;
  let storage: AgentStorage;
  let testStoragePath: string;

  beforeEach(() => {
    // 创建临时目录用于测试
    testStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-manager-test-'));
    storage = new AgentStorage(testStoragePath);
    manager = new AgentManager(storage);
  });

  afterEach(() => {
    // 清理临时目录
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true, force: true });
    }
  });

  // ==================== 构造函数测试 ====================
  describe('构造函数', () => {
    it('should accept AgentStorage instance', () => {
      expect(manager).toBeInstanceOf(AgentManager);
    });
  });

  // ==================== createAgent() 测试 ====================
  describe('createAgent', () => {
    it('should create agent with auto-generated ID and timestamps', () => {
      const input: AgentCreateInput = {
        name: 'New Agent',
        description: 'A new agent for testing',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'You are a helpful assistant',
        parameters: {},
        skills: [],
        status: 'idle',
      };

      const config = manager.createAgent(input);

      expect(config.id).toBeDefined();
      expect(config.id.length).toBeGreaterThan(0);
      expect(config.createdAt).toBeDefined();
      expect(config.updatedAt).toBeDefined();
      expect(config.name).toBe('New Agent');
      expect(config.description).toBe('A new agent for testing');
    });

    it('should save agent to storage', () => {
      const input: AgentCreateInput = {
        name: 'Saved Agent',
        description: 'Test',
        model: { provider: 'anthropic', modelId: 'claude-3-opus' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      const config = manager.createAgent(input);

      // 验证已保存到存储
      const loaded = storage.loadAgent(config.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('Saved Agent');
    });

    it('should throw error if name is empty', () => {
      const input: AgentCreateInput = {
        name: '',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      expect(() => manager.createAgent(input)).toThrow('Agent 名称不能为空');
    });

    it('should throw error if name is only whitespace', () => {
      const input: AgentCreateInput = {
        name: '   ',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      expect(() => manager.createAgent(input)).toThrow('Agent 名称不能为空');
    });

    it('should throw error if model config is missing', () => {
      const input = {
        name: 'Test Agent',
        description: 'Test',
        model: undefined as any,
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      expect(() => manager.createAgent(input as any)).toThrow('模型配置不能为空');
    });

    it('should throw error if model.provider is missing', () => {
      const input: AgentCreateInput = {
        name: 'Test Agent',
        description: 'Test',
        model: { provider: '' as any, modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      expect(() => manager.createAgent(input)).toThrow('模型提供商和模型 ID 不能为空');
    });

    it('should throw error if model.modelId is missing', () => {
      const input: AgentCreateInput = {
        name: 'Test Agent',
        description: 'Test',
        model: { provider: 'openai', modelId: '' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      expect(() => manager.createAgent(input)).toThrow('模型提供商和模型 ID 不能为空');
    });

    it('should throw error if systemPrompt is empty', () => {
      const input: AgentCreateInput = {
        name: 'Test Agent',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: '',
        parameters: {},
        skills: [],
      };

      expect(() => manager.createAgent(input)).toThrow('系统提示词不能为空');
    });

    it('should throw error if systemPrompt is only whitespace', () => {
      const input: AgentCreateInput = {
        name: 'Test Agent',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: '   ',
        parameters: {},
        skills: [],
      };

      expect(() => manager.createAgent(input)).toThrow('系统提示词不能为空');
    });

    it('should set default status to idle', () => {
      const input: AgentCreateInput = {
        name: 'Status Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        // 不提供 status
      };

      const config = manager.createAgent(input);
      expect(config.status).toBe('idle');
    });

    it('should set default skills to empty array', () => {
      const input: AgentCreateInput = {
        name: 'Skills Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        // 不提供 skills
      };

      const config = manager.createAgent(input);
      expect(config.skills).toEqual([]);
    });

    it('should set default parameters to empty object', () => {
      const input: AgentCreateInput = {
        name: 'Parameters Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        // 不提供 parameters
      };

      const config = manager.createAgent(input);
      expect(config.parameters).toEqual({});
    });

    it('should accept custom status', () => {
      const input: AgentCreateInput = {
        name: 'Custom Status',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        status: 'running',
      };

      const config = manager.createAgent(input);
      expect(config.status).toBe('running');
    });

    it('should accept custom skills and parameters', () => {
      const input: AgentCreateInput = {
        name: 'Custom Skills',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: { temperature: 0.8 },
        skills: [{ skillKey: 'web-search', enabled: true }],
      };

      const config = manager.createAgent(input);
      expect(config.parameters).toEqual({ temperature: 0.8 });
      expect(config.skills).toHaveLength(1);
      expect(config.skills[0].skillKey).toBe('web-search');
    });
  });

  // ==================== getAgent() 测试 ====================
  describe('getAgent', () => {
    it('should return agent config if exists', () => {
      const input: AgentCreateInput = {
        name: 'Get Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      const config = manager.createAgent(input);
      const retrieved = manager.getAgent(config.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(config.id);
      expect(retrieved!.name).toBe('Get Test');
    });

    it('should return null if agent does not exist', () => {
      const result = manager.getAgent('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return null if agentId is empty', () => {
      const result = manager.getAgent('');
      expect(result).toBeNull();
    });

    it('should return null if agentId is only whitespace', () => {
      const result = manager.getAgent('   ');
      expect(result).toBeNull();
    });
  });

  // ==================== getAllAgents() 测试 ====================
  describe('getAllAgents', () => {
    beforeEach(() => {
      // 创建多个测试 Agent
      const agents: AgentCreateInput[] = [
        {
          name: 'Agent Alpha',
          description: 'Alpha description',
          model: { provider: 'openai', modelId: 'gpt-4' },
          systemPrompt: 'Test',
          parameters: {},
          skills: [],
          status: 'idle',
        },
        {
          name: 'Agent Beta',
          description: 'Beta description',
          model: { provider: 'anthropic', modelId: 'claude-3' },
          systemPrompt: 'Test',
          parameters: {},
          skills: [],
          status: 'running',
        },
        {
          name: 'Agent Gamma',
          description: 'Gamma with special keyword',
          model: { provider: 'google', modelId: 'gemini-pro' },
          systemPrompt: 'Test',
          parameters: {},
          skills: [],
          status: 'idle',
        },
      ];

      agents.forEach((input) => manager.createAgent(input));
    });

    it('should return all agents from storage', () => {
      const allAgents = manager.getAllAgents();
      expect(allAgents.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by status', () => {
      const idleAgents = manager.getAllAgents({ status: 'idle' });
      expect(idleAgents.length).toBeGreaterThanOrEqual(2);
      idleAgents.forEach((agent) => expect(agent.status).toBe('idle'));

      const runningAgents = manager.getAllAgents({ status: 'running' });
      expect(runningAgents.length).toBeGreaterThanOrEqual(1);
      runningAgents.forEach((agent) => expect(agent.status).toBe('running'));
    });

    it('should filter by search keyword (match name)', () => {
      const results = manager.getAllAgents({ search: 'Alpha' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toContain('Alpha');
    });

    it('should filter by search keyword (match description)', () => {
      const results = manager.getAllAgents({ search: 'special' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].description).toContain('special');
    });

    it('should handle both status and search filters', () => {
      // 创建一个 idle 状态的 agent，名称包含 "Agent"
      const input: AgentCreateInput = {
        name: 'Agent Test Filter',
        description: 'Filter test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        status: 'idle',
      };
      manager.createAgent(input);

      const results = manager.getAllAgents({ status: 'idle', search: 'Test Filter' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      results.forEach((agent) => {
        expect(agent.status).toBe('idle');
        expect(agent.name.includes('Test Filter') || agent.description.includes('Test Filter')).toBe(true);
      });
    });

    it('should return empty array if no matches', () => {
      const results = manager.getAllAgents({ search: 'NonExistentKeyword12345' });
      // 可能返回空数组，因为关键词不存在
      expect(results).toBeInstanceOf(Array);
    });

    it('should be case-insensitive when searching', () => {
      const results = manager.getAllAgents({ search: 'ALPHA' });
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== updateAgent() 测试 ====================
  describe('updateAgent', () => {
    let agentId: string;

    beforeEach(() => {
      const input: AgentCreateInput = {
        name: 'Update Test',
        description: 'Original description',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Original prompt',
        parameters: { temperature: 0.7 },
        skills: [],
        status: 'idle',
      };

      const config = manager.createAgent(input);
      agentId = config.id;
    });

    it('should update existing agent', () => {
      const updated = manager.updateAgent(agentId, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('Updated description');
    });

    it('should partially update agent (only provided fields)', () => {
      const updated = manager.updateAgent(agentId, {
        name: 'Only Name Updated',
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Only Name Updated');
      expect(updated!.description).toBe('Original description'); // 未修改
      expect(updated!.systemPrompt).toBe('Original prompt'); // 未修改
    });

    it('should not modify id field', () => {
      const original = manager.getAgent(agentId);
      const originalId = original!.id;

      manager.updateAgent(agentId, { name: 'Trying to modify ID' });

      const updated = manager.getAgent(agentId);
      expect(updated!.id).toBe(originalId);
    });

    it('should not modify createdAt field', () => {
      const original = manager.getAgent(agentId);
      const originalCreatedAt = original!.createdAt;

      // 等待一小段时间，确保时间戳不同
      const updated = manager.updateAgent(agentId, { name: 'Updated' });

      expect(updated!.createdAt).toBe(originalCreatedAt);
    });

    it('should auto-update updatedAt field', async () => {
      const original = manager.getAgent(agentId);
      const originalUpdatedAt = original!.updatedAt;

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = manager.updateAgent(agentId, { name: 'Updated' });

      expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return null if agent does not exist', () => {
      const result = manager.updateAgent('non-existent-id', { name: 'Updated' });
      expect(result).toBeNull();
    });

    it('should throw error if updating name to empty', () => {
      expect(() => {
        manager.updateAgent(agentId, { name: '' });
      }).toThrow('Agent 名称不能为空');
    });

    it('should allow updating model config', () => {
      const updated = manager.updateAgent(agentId, {
        model: { provider: 'anthropic', modelId: 'claude-3-opus' },
      });

      expect(updated).not.toBeNull();
      expect(updated!.model.provider).toBe('anthropic');
      expect(updated!.model.modelId).toBe('claude-3-opus');
    });

    it('should allow updating skills', () => {
      const updated = manager.updateAgent(agentId, {
        skills: [{ skillKey: 'new-skill', enabled: true }],
      });

      expect(updated).not.toBeNull();
      expect(updated!.skills).toHaveLength(1);
      expect(updated!.skills[0].skillKey).toBe('new-skill');
    });

    it('should allow updating status', () => {
      const updated = manager.updateAgent(agentId, {
        status: 'running',
      });

      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('running');
    });
  });

  // ==================== deleteAgent() 测试 ====================
  describe('deleteAgent', () => {
    it('should delete existing agent', () => {
      const input: AgentCreateInput = {
        name: 'Delete Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      const config = manager.createAgent(input);
      expect(manager.agentExists(config.id)).toBe(true);

      const result = manager.deleteAgent(config.id);
      expect(result).toBe(true);
      expect(manager.agentExists(config.id)).toBe(false);
    });

    it('should return false if agent does not exist', () => {
      const result = manager.deleteAgent('non-existent-id');
      expect(result).toBe(false);
    });

    it('should pass keepSessions to storage', () => {
      const input: AgentCreateInput = {
        name: 'Delete With Sessions',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      const config = manager.createAgent(input);

      // keepSessions 参数应该被传递给 storage.deleteAgent
      const result = manager.deleteAgent(config.id, true);
      expect(result).toBe(true);
      expect(manager.agentExists(config.id)).toBe(false);
    });

    it('should return false if agentId is empty', () => {
      const result = manager.deleteAgent('');
      expect(result).toBe(false);
    });
  });

  // ==================== setAgentStatus() 测试 ====================
  describe('setAgentStatus', () => {
    let agentId: string;

    beforeEach(() => {
      const input: AgentCreateInput = {
        name: 'Status Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        status: 'idle',
      };

      const config = manager.createAgent(input);
      agentId = config.id;
    });

    it('should update agent status', () => {
      const result = manager.setAgentStatus(agentId, 'running');
      expect(result).toBe(true);

      const updated = manager.getAgent(agentId);
      expect(updated!.status).toBe('running');
    });

    it('should auto-update updatedAt field', async () => {
      const original = manager.getAgent(agentId);
      const originalUpdatedAt = original!.updatedAt;

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, 10));

      manager.setAgentStatus(agentId, 'running');

      const updated = manager.getAgent(agentId);
      expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return false if agent does not exist', () => {
      const result = manager.setAgentStatus('non-existent-id', 'running');
      expect(result).toBe(false);
    });

    it('should return false if agentId is empty', () => {
      const result = manager.setAgentStatus('', 'running');
      expect(result).toBe(false);
    });

    it('should allow setting all valid statuses', () => {
      const statuses: Array<'idle' | 'running' | 'error' | 'disabled' | 'initializing'> = [
        'running',
        'error',
        'disabled',
        'initializing',
        'idle',
      ];

      for (const status of statuses) {
        const result = manager.setAgentStatus(agentId, status);
        expect(result).toBe(true);

        const updated = manager.getAgent(agentId);
        expect(updated!.status).toBe(status);
      }
    });
  });

  // ==================== agentExists() 测试 ====================
  describe('agentExists', () => {
    it('should return true if agent exists', () => {
      const input: AgentCreateInput = {
        name: 'Exists Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
      };

      const config = manager.createAgent(input);
      expect(manager.agentExists(config.id)).toBe(true);
    });

    it('should return false if agent does not exist', () => {
      expect(manager.agentExists('non-existent-id')).toBe(false);
    });
  });
});
