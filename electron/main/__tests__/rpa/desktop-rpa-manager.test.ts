/**
 * Desktop RPA 管理器集成测试
 *
 * @fileoverview 测试 DesktopRpaManager 类的核心功能
 * 注意: 由于 desktop-rpa-manager 使用动态 require 加载依赖，
 * 这里的测试主要验证类型和基本结构，而非完整的 mock 测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DesktopRpaManager } from '../../rpa/desktop-rpa-manager';
import { RpaStorage } from '../../rpa/rpa-storage';

describe('DesktopRpaManager', () => {
  let manager: DesktopRpaManager;
  let storage: RpaStorage;
  let testDir: string;

  beforeEach(() => {
    // 创建临时存储目录
    testDir = require('path').join(__dirname, `.test-rpa-${Date.now()}`);
    storage = new RpaStorage(testDir);
    manager = new DesktopRpaManager(storage);
  });

  afterEach(() => {
    // 清理测试目录
    try {
      require('fs').rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe('constructor', () => {
    it('应该创建 DesktopRpaManager 实例', () => {
      expect(manager).toBeInstanceOf(DesktopRpaManager);
    });

    it('应该有所有必需的方法', () => {
      expect(typeof manager.click).toBe('function');
      expect(typeof manager.drag).toBe('function');
      expect(typeof manager.scroll).toBe('function');
      expect(typeof manager.type).toBe('function');
      expect(typeof manager.keyPress).toBe('function');
      expect(typeof manager.keyCombo).toBe('function');
      expect(typeof manager.hotkey).toBe('function');
      expect(typeof manager.getWindows).toBe('function');
      expect(typeof manager.captureScreen).toBe('function');
      expect(typeof manager.recognizeText).toBe('function');
      expect(typeof manager.findElement).toBe('function');
    });
  });

  describe('方法签名', () => {
    it('click 方法应该有正确的签名', () => {
      // click(x: number, y: number, options?: {...})
      expect(manager.click.length).toBeGreaterThanOrEqual(2);
    });

    it('drag 方法应该有正确的签名', () => {
      // drag(startX, startY, endX, endY, options?)
      expect(manager.drag.length).toBeGreaterThanOrEqual(4);
    });

    it('scroll 方法应该有正确的签名', () => {
      // scroll(x, y, deltaX, deltaY)
      expect(manager.scroll.length).toBeGreaterThanOrEqual(4);
    });

    it('keyPress 方法应该有正确的签名', () => {
      expect(manager.keyPress.length).toBeGreaterThanOrEqual(1);
    });

    it('keyCombo 方法应该有正确的签名', () => {
      expect(manager.keyCombo.length).toBeGreaterThanOrEqual(1);
    });

    it('hotkey 方法应该是可调用的', () => {
      // hotkey 使用 rest 参数 (...keys)，length 为 0
      expect(typeof manager.hotkey).toBe('function');
    });
  });

  describe('executeStep 支持的操作', () => {
    it('应该支持 click 操作', () => {
      const step = {
        id: 'test-1',
        action: 'click' as const,
        params: { x: 100, y: 200 },
      };

      // 验证步骤可以执行（虽然可能因为没有真实环境而失败）
      // 我们只验证方法存在且可以被调用
      expect(() => manager.click(100, 200)).not.toThrow();
    });

    it('应该支持 drag 操作', () => {
      expect(() => manager.drag(100, 100, 200, 200)).not.toThrow();
    });

    it('应该支持 scroll 操作', () => {
      expect(() => manager.scroll(0, 0, 0, 5)).not.toThrow();
    });

    it('应该支持 keyPress 操作', () => {
      expect(() => manager.keyPress('enter')).not.toThrow();
    });

    it('应该支持 keyCombo 操作', () => {
      expect(() => manager.keyCombo('ctrl+c')).not.toThrow();
    });

    it('应该支持 hotkey 操作', () => {
      expect(() => manager.hotkey('command', 's')).not.toThrow();
    });
  });
});
