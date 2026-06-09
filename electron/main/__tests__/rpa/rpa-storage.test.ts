/**
 * RPA 存储层单元测试
 *
 * @fileoverview 测试 RpaStorage 类的CRUD操作
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RpaStorage } from '../../rpa/rpa-storage';
import type { RpaTask } from '../../../../src/types/rpa';

// 测试数据
const createMockTask = (id: string, overrides: Partial<RpaTask> = {}): RpaTask => ({
  id,
  name: `Test Task ${id}`,
  type: 'web',
  description: 'A test task',
  status: 'idle',
  steps: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('RpaStorage', () => {
  let storage: RpaStorage;
  let testDir: string;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = path.join(__dirname, `.test-storage-${Date.now()}`);
    storage = new RpaStorage(testDir);
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('saveTask', () => {
    it('应该保存任务到 JSON 文件', () => {
      const task = createMockTask('task-1');

      storage.saveTask(task);

      expect(fs.existsSync(path.join(testDir, 'task-1.json'))).toBe(true);
    });

    it('应该保存正确的 JSON 内容', () => {
      const task = createMockTask('task-2', {
        name: 'Custom Name',
        description: 'Custom Description',
      });

      storage.saveTask(task);

      const content = fs.readFileSync(path.join(testDir, 'task-2.json'), 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.id).toBe('task-2');
      expect(parsed.name).toBe('Custom Name');
      expect(parsed.description).toBe('Custom Description');
    });

    it('应该覆盖已存在的任务', () => {
      const task1 = createMockTask('task-3', { name: 'Version 1' });
      const task2 = createMockTask('task-3', { name: 'Version 2' });

      storage.saveTask(task1);
      storage.saveTask(task2);

      const content = fs.readFileSync(path.join(testDir, 'task-3.json'), 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe('Version 2');
    });
  });

  describe('loadTask', () => {
    it('应该加载已保存的任务', () => {
      const task = createMockTask('task-4', { name: 'Load Test' });
      storage.saveTask(task);

      const loaded = storage.loadTask('task-4');

      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe('task-4');
      expect(loaded!.name).toBe('Load Test');
    });

    it('应该返回 null 当任务不存在', () => {
      const loaded = storage.loadTask('non-existent');

      expect(loaded).toBeNull();
    });

    it('应该验证任务必需字段', () => {
      // 手动写入无效的 JSON 文件
      const invalidPath = path.join(testDir, 'invalid-task.json');
      fs.writeFileSync(invalidPath, JSON.stringify({ id: 'invalid-task' }));

      const loaded = storage.loadTask('invalid-task');

      expect(loaded).toBeNull();
    });
  });

  describe('loadAllTasks', () => {
    it('应该加载所有任务', () => {
      storage.saveTask(createMockTask('task-5'));
      storage.saveTask(createMockTask('task-6'));
      storage.saveTask(createMockTask('task-7'));

      const tasks = storage.loadAllTasks();

      expect(tasks.length).toBe(3);
    });

    it('应该返回空数组当目录为空', () => {
      const tasks = storage.loadAllTasks();

      expect(tasks).toEqual([]);
    });

    it('应该跳过无效的 JSON 文件', () => {
      storage.saveTask(createMockTask('task-8'));

      // 写入一个无效文件
      const invalidPath = path.join(testDir, 'invalid.json');
      fs.writeFileSync(invalidPath, '{ invalid json }');

      const tasks = storage.loadAllTasks();

      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe('task-8');
    });

    it('应该跳过非 JSON 文件', () => {
      storage.saveTask(createMockTask('task-9'));

      // 写入一个非 JSON 文件
      const nonJsonPath = path.join(testDir, 'readme.txt');
      fs.writeFileSync(nonJsonPath, 'This is not a JSON file');

      const tasks = storage.loadAllTasks();

      expect(tasks.length).toBe(1);
    });
  });

  describe('deleteTask', () => {
    it('应该删除已存在的任务', () => {
      storage.saveTask(createMockTask('task-10'));

      const result = storage.deleteTask('task-10');

      expect(result).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'task-10.json'))).toBe(false);
    });

    it('应该返回 false 当任务不存在', () => {
      const result = storage.deleteTask('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('taskExists', () => {
    it('应该返回 true 当任务存在', () => {
      storage.saveTask(createMockTask('task-11'));

      const exists = storage.taskExists('task-11');

      expect(exists).toBe(true);
    });

    it('应该返回 false 当任务不存在', () => {
      const exists = storage.taskExists('non-existent');

      expect(exists).toBe(false);
    });
  });
});
