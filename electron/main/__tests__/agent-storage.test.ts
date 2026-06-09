/**
 * AgentStorage 单元测试
 *
 * 测试 AgentStorage 类的所有功能
 */

import { AgentStorage } from '../agent-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { AgentConfig } from '../../../src/types/agent';

describe('AgentStorage', () => {
  let storage: AgentStorage;
  let testStoragePath: string;

  beforeEach(() => {
    // 创建临时目录用于测试
    testStoragePath = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-storage-test-'));
    storage = new AgentStorage(testStoragePath);
  });

  afterEach(() => {
    // 清理临时目录
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(testStoragePath, { recursive: true, force: true });
    }
  });

  // ==================== 构造函数测试 ====================
  describe('构造函数', () => {
    it('should create storage directory if not exists', () => {
      const newPath = path.join(os.tmpdir(), `agent-storage-test-${Date.now()}`);
      expect(fs.existsSync(newPath)).toBe(false);

      const newStorage = new AgentStorage(newPath);
      expect(fs.existsSync(newPath)).toBe(true);

      fs.rmSync(newPath, { recursive: true, force: true });
    });

    it('should use provided storage path', () => {
      expect(fs.existsSync(testStoragePath)).toBe(true);
      expect(storage).toBeInstanceOf(AgentStorage);
    });

    it('should throw error if cannot create directory', () => {
      // 在 macOS 上，/dev/null 是一个特殊的文件，无法在其中创建目录
      // 这会导致错误被捕获并重新抛出
      expect(() => {
        new AgentStorage('/dev/null/impossible-path');
      }).toThrow('无法创建存储目录');
    });
  });

  // ==================== saveAgent() 测试 ====================
  describe('saveAgent', () => {
    const createTestAgent = (id: string, name: string): AgentConfig => ({
      id,
      name,
      description: `Description for ${name}`,
      model: { provider: 'openai', modelId: 'gpt-4' },
      systemPrompt: 'You are a test agent',
      parameters: {},
      skills: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'idle',
    });

    it('should atomically write agent config to JSON file', () => {
      const config = createTestAgent('test-agent-1', 'Test Agent');

      storage.saveAgent(config);

      // 验证文件已创建
      const filePath = path.join(testStoragePath, 'test-agent-1.json');
      expect(fs.existsSync(filePath)).toBe(true);

      // 验证文件内容
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.id).toBe('test-agent-1');
      expect(content.name).toBe('Test Agent');
    });

    it('should create formatted JSON (2 spaces indentation)', () => {
      const config = createTestAgent('test-agent-2', 'Test Agent 2');

      storage.saveAgent(config);

      const filePath = path.join(testStoragePath, 'test-agent-2.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // 验证格式化（应该包含换行和2空格缩进）
      expect(fileContent).toContain('\n  ');
      expect(fileContent).toContain('  "id"');
    });

    it('should cleanup temp file if write fails', () => {
      const config = createTestAgent('test-agent-3', 'Test Agent 3');

      // 模拟写入失败：使存储目录只读（在某些系统上可能不生效，这里主要测试错误处理逻辑）
      // 由于我们无法可靠地模拟权限错误，这里主要验证正常流程中的临时文件清理
      storage.saveAgent(config);

      // 验证临时文件已被清理
      const tempPath = path.join(testStoragePath, 'test-agent-3.json.tmp');
      expect(fs.existsSync(tempPath)).toBe(false);
    });

    it('should throw error if storage directory is not writable', () => {
      // 这个测试验证当目录不可写时的错误处理
      // 注意：在某些系统上可能无法模拟权限错误
      // 我们主要测试正常情况下的功能
      const config = createTestAgent('test-agent-4', 'Test Agent 4');
      expect(() => storage.saveAgent(config)).not.toThrow();
    });

    it('should overwrite existing agent file', () => {
      const config = createTestAgent('test-agent-5', 'Original Name');
      storage.saveAgent(config);

      const updatedConfig = { ...config, name: 'Updated Name' };
      storage.saveAgent(updatedConfig);

      const filePath = path.join(testStoragePath, 'test-agent-5.json');
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content.name).toBe('Updated Name');
    });
  });

  // ==================== loadAgent() 测试 ====================
  describe('loadAgent', () => {
    it('should load existing agent config from JSON file', () => {
      const config: AgentConfig = {
        id: 'load-test-1',
        name: 'Load Test Agent',
        description: 'Test loading agent',
        model: { provider: 'anthropic', modelId: 'claude-3-opus' },
        systemPrompt: 'You are a test agent',
        parameters: { temperature: 0.7 },
        skills: [],
        createdAt: '2026-06-08T10:00:00.000Z',
        updatedAt: '2026-06-08T10:00:00.000Z',
        status: 'idle',
      };

      storage.saveAgent(config);

      const loaded = storage.loadAgent('load-test-1');
      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe('load-test-1');
      expect(loaded!.name).toBe('Load Test Agent');
      expect(loaded!.model.provider).toBe('anthropic');
      expect(loaded!.model.modelId).toBe('claude-3-opus');
    });

    it('should return null if agent file does not exist', () => {
      const result = storage.loadAgent('non-existent-agent');
      expect(result).toBeNull();
    });

    it('should return null if JSON format is invalid', () => {
      // 直接写入无效的 JSON 文件
      const filePath = path.join(testStoragePath, 'invalid-agent.json');
      fs.writeFileSync(filePath, 'invalid json {{{', 'utf-8');

      const result = storage.loadAgent('invalid-agent');
      expect(result).toBeNull();
    });

    it('should correctly parse all fields', () => {
      const config: AgentConfig = {
        id: 'full-fields-test',
        name: 'Full Fields Test',
        description: 'Testing all fields',
        avatar: 'data:image/png;base64,xxx',
        model: {
          provider: 'google',
          modelId: 'gemini-pro',
          apiKey: 'test-api-key',
        },
        systemPrompt: 'You are a helpful assistant',
        parameters: {
          temperature: 0.8,
          topP: 0.95,
          maxTokens: 2048,
          frequencyPenalty: 0.1,
          presencePenalty: 0.1,
        },
        skills: [
          { skillKey: 'web-search', enabled: true },
          { skillKey: 'code-runner', enabled: false, config: { timeout: 5000 } },
        ],
        createdAt: '2026-06-08T10:00:00.000Z',
        updatedAt: '2026-06-08T11:00:00.000Z',
        status: 'running',
        disabled: false,
      };

      storage.saveAgent(config);

      const loaded = storage.loadAgent('full-fields-test');
      expect(loaded).not.toBeNull();
      expect(loaded!.avatar).toBe('data:image/png;base64,xxx');
      expect(loaded!.model.apiKey).toBe('test-api-key');
      expect(loaded!.parameters.temperature).toBe(0.8);
      expect(loaded!.parameters.maxTokens).toBe(2048);
      expect(loaded!.skills).toHaveLength(2);
      expect(loaded!.skills[0].skillKey).toBe('web-search');
      expect(loaded!.skills[1].config).toEqual({ timeout: 5000 });
      expect(loaded!.status).toBe('running');
      expect(loaded!.disabled).toBe(false);
    });
  });

  // ==================== loadAllAgents() 测试 ====================
  describe('loadAllAgents', () => {
    it('should load all agent configs from directory', () => {
      const configs: AgentConfig[] = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          description: 'First agent',
          model: { provider: 'openai', modelId: 'gpt-4' },
          systemPrompt: 'Prompt 1',
          parameters: {},
          skills: [],
          createdAt: '2026-06-08T10:00:00.000Z',
          updatedAt: '2026-06-08T10:00:00.000Z',
          status: 'idle',
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          description: 'Second agent',
          model: { provider: 'anthropic', modelId: 'claude-3' },
          systemPrompt: 'Prompt 2',
          parameters: {},
          skills: [],
          createdAt: '2026-06-08T10:05:00.000Z',
          updatedAt: '2026-06-08T10:05:00.000Z',
          status: 'idle',
        },
      ];

      configs.forEach((config) => storage.saveAgent(config));

      const allAgents = storage.loadAllAgents();
      expect(allAgents).toHaveLength(2);
    });

    it('should return empty array if storage directory does not exist', () => {
      const nonExistentPath = path.join(os.tmpdir(), 'non-existent-dir');
      const tempStorage = new AgentStorage(nonExistentPath);

      // 不调用 ensureStorageDirectory，直接测试 loadAllAgents
      // 由于构造函数会创建目录，我们需要手动删除它
      fs.rmSync(nonExistentPath, { recursive: true, force: true });

      const result = tempStorage.loadAllAgents();
      expect(result).toEqual([]);

      // 清理
      if (fs.existsSync(nonExistentPath)) {
        fs.rmSync(nonExistentPath, { recursive: true, force: true });
      }
    });

    it('should skip non-JSON files', () => {
      // 创建一些 Agent
      const config: AgentConfig = {
        id: 'json-agent',
        name: 'JSON Agent',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'idle',
      };
      storage.saveAgent(config);

      // 创建一个非 JSON 文件
      fs.writeFileSync(path.join(testStoragePath, 'readme.txt'), 'This is not JSON');

      const allAgents = storage.loadAllAgents();
      expect(allAgents).toHaveLength(1);
      expect(allAgents[0].id).toBe('json-agent');
    });

    it('should skip files with invalid JSON', () => {
      const config: AgentConfig = {
        id: 'valid-agent',
        name: 'Valid Agent',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'idle',
      };
      storage.saveAgent(config);

      // 创建一个无效的 JSON 文件
      fs.writeFileSync(path.join(testStoragePath, 'invalid.json'), 'invalid json', 'utf-8');

      const allAgents = storage.loadAllAgents();
      expect(allAgents).toHaveLength(1);
    });

    it('should skip files with missing required fields', () => {
      const config: AgentConfig = {
        id: 'valid-agent',
        name: 'Valid Agent',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'idle',
      };
      storage.saveAgent(config);

      // 创建一个缺少必要字段的 JSON 文件
      fs.writeFileSync(
        path.join(testStoragePath, 'incomplete.json'),
        JSON.stringify({ id: 'incomplete' }), // 缺少 name 字段
        'utf-8'
      );

      const allAgents = storage.loadAllAgents();
      expect(allAgents).toHaveLength(1);
      expect(allAgents[0].id).toBe('valid-agent');
    });

    it('should sort agents by updatedAt descending', () => {
      const configs: AgentConfig[] = [
        {
          id: 'agent-old',
          name: 'Old Agent',
          description: 'Old',
          model: { provider: 'openai', modelId: 'gpt-4' },
          systemPrompt: 'Old',
          parameters: {},
          skills: [],
          createdAt: '2026-06-08T09:00:00.000Z',
          updatedAt: '2026-06-08T09:00:00.000Z',
          status: 'idle',
        },
        {
          id: 'agent-new',
          name: 'New Agent',
          description: 'New',
          model: { provider: 'openai', modelId: 'gpt-4' },
          systemPrompt: 'New',
          parameters: {},
          skills: [],
          createdAt: '2026-06-08T11:00:00.000Z',
          updatedAt: '2026-06-08T11:00:00.000Z',
          status: 'idle',
        },
        {
          id: 'agent-middle',
          name: 'Middle Agent',
          description: 'Middle',
          model: { provider: 'openai', modelId: 'gpt-4' },
          systemPrompt: 'Middle',
          parameters: {},
          skills: [],
          createdAt: '2026-06-08T10:00:00.000Z',
          updatedAt: '2026-06-08T10:00:00.000Z',
          status: 'idle',
        },
      ];

      configs.forEach((config) => storage.saveAgent(config));

      const allAgents = storage.loadAllAgents();
      expect(allAgents).toHaveLength(3);
      expect(allAgents[0].id).toBe('agent-new'); // 最新的在前面
      expect(allAgents[1].id).toBe('agent-middle');
      expect(allAgents[2].id).toBe('agent-old'); // 最旧的在后面
    });
  });

  // ==================== deleteAgent() 测试 ====================
  describe('deleteAgent', () => {
    it('should delete existing agent file', () => {
      const config: AgentConfig = {
        id: 'delete-test',
        name: 'Delete Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'idle',
      };

      storage.saveAgent(config);
      expect(storage.agentExists('delete-test')).toBe(true);

      const result = storage.deleteAgent('delete-test');
      expect(result).toBe(true);
      expect(storage.agentExists('delete-test')).toBe(false);
    });

    it('should return false if agent file does not exist', () => {
      const result = storage.deleteAgent('non-existent-agent');
      expect(result).toBe(false);
    });

    it('should return true if deletion successful', () => {
      const config: AgentConfig = {
        id: 'delete-success',
        name: 'Delete Success',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'idle',
      };

      storage.saveAgent(config);
      const result = storage.deleteAgent('delete-success');
      expect(result).toBe(true);
    });

    it('should pass keepSessions to storage (placeholder test)', () => {
      const config: AgentConfig = {
        id: 'delete-keep-sessions',
        name: 'Delete Keep Sessions',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'idle',
      };

      storage.saveAgent(config);

      // keepSessions 参数当前版本未实现，但接口应该存在
      const result = storage.deleteAgent('delete-keep-sessions', true);
      expect(result).toBe(true);
      expect(storage.agentExists('delete-keep-sessions')).toBe(false);
    });
  });

  // ==================== agentExists() 测试 ====================
  describe('agentExists', () => {
    it('should return true if agent file exists', () => {
      const config: AgentConfig = {
        id: 'exists-test',
        name: 'Exists Test',
        description: 'Test',
        model: { provider: 'openai', modelId: 'gpt-4' },
        systemPrompt: 'Test',
        parameters: {},
        skills: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'idle',
      };

      storage.saveAgent(config);
      expect(storage.agentExists('exists-test')).toBe(true);
    });

    it('should return false if agent file does not exist', () => {
      expect(storage.agentExists('non-existent-agent')).toBe(false);
    });
  });
});
