/**
 * RPA 类型定义单元测试
 *
 * @fileoverview 测试 RPA 相关的类型定义和类型 guards
 */

import { describe, it, expect } from 'vitest';
import type {
  RpaTask,
  RpaStep,
  RpaStepParams,
  WebRpaAction,
  DesktopRpaAction,
  OcrOptions,
  OcrPreprocessingOptions,
  ElementRecognitionOptions,
} from '../../../../src/types/rpa';

describe('RPA 类型定义', () => {
  describe('WebRpaAction', () => {
    it('应该包含所有 Web RPA 操作类型', () => {
      const actions: WebRpaAction[] = [
        'navigate',
        'click',
        'type',
        'screenshot',
        'evaluate',
        'wait',
        'scroll',
        'hover',
        'select',
        'upload',
        'press',
        'check',
        'uncheck',
      ];

      actions.forEach((action) => {
        expect(typeof action).toBe('string');
      });
    });
  });

  describe('DesktopRpaAction', () => {
    it('应该包含所有 Desktop RPA 操作类型', () => {
      const actions: DesktopRpaAction[] = [
        'captureScreen',
        'recognizeText',
        'findElement',
        'click',
        'doubleClick',
        'rightClick',
        'moveMouse',
        'drag',
        'scroll',
        'type',
        'keyPress',
        'keyCombo',
        'hotkey',
        'getWindow',
        'activateWindow',
        'maximizeWindow',
        'minimizeWindow',
        'closeWindow',
        'screenshot',
      ];

      actions.forEach((action) => {
        expect(typeof action).toBe('string');
      });
    });

    it('应该包含新增的 scroll 和 hotkey 操作', () => {
      const action: DesktopRpaAction = 'scroll';
      expect(action).toBe('scroll');

      const hotkeyAction: DesktopRpaAction = 'hotkey';
      expect(hotkeyAction).toBe('hotkey');
    });
  });

  describe('RpaStepParams', () => {
    it('应该支持拖拽参数', () => {
      const params: RpaStepParams = {
        startX: 100,
        startY: 200,
        endX: 300,
        endY: 400,
        duration: 500,
        steps: 10,
      };

      expect(params.startX).toBe(100);
      expect(params.endY).toBe(400);
      expect(params.duration).toBe(500);
    });

    it('应该支持滚动参数', () => {
      const params: RpaStepParams = {
        x: 500,
        y: 500,
        deltaX: 0,
        deltaY: 3,
      };

      expect(params.deltaY).toBe(3);
    });

    it('应该支持组合键参数', () => {
      const params: RpaStepParams = {
        combo: 'ctrl+shift+s',
      };

      expect(params.combo).toBe('ctrl+shift+s');
    });

    it('应该支持鼠标按钮参数', () => {
      const params: RpaStepParams = {
        button: 'right',
        double: true,
      };

      expect(params.button).toBe('right');
      expect(params.double).toBe(true);
    });
  });

  describe('OcrOptions', () => {
    it('应该支持 OCR 配置选项', () => {
      const options: OcrOptions = {
        language: 'eng+chi_sim',
        minConfidence: 0.8,
        detailed: true,
        psmMode: 'singleLine',
        oemMode: 'neuralLstm',
        preprocessing: {
          grayscale: true,
          binarize: true,
          binarizeThreshold: 128,
          denoise: true,
          scaleFactor: 2,
        },
      };

      expect(options.language).toBe('eng+chi_sim');
      expect(options.minConfidence).toBe(0.8);
      expect(options.preprocessing?.scaleFactor).toBe(2);
    });

    it('应该支持所有 PSM 模式', () => {
      const psmModes = [
        'auto',
        'autoWithOcr',
        'autoOnlyOsd',
        'normal',
        'singleColumn',
        'uniformBlock',
        'singleLine',
        'singleWord',
        'singleChar',
        'sparseText',
        'sparseTextOcr',
        'rawLine',
      ] as const;

      psmModes.forEach((mode) => {
        const options: OcrOptions = { psmMode: mode };
        expect(options.psmMode).toBe(mode);
      });
    });
  });

  describe('OcrPreprocessingOptions', () => {
    it('应该支持所有预处理选项', () => {
      const options: OcrPreprocessingOptions = {
        grayscale: true,
        binarize: true,
        binarizeThreshold: 100,
        contrastEnhance: true,
        contrastLevel: 7,
        denoise: true,
        scaleFactor: 1.5,
        sharpen: true,
      };

      expect(options.grayscale).toBe(true);
      expect(options.binarizeThreshold).toBe(100);
      expect(options.contrastLevel).toBe(7);
      expect(options.scaleFactor).toBe(1.5);
    });
  });

  describe('ElementRecognitionOptions', () => {
    it('应该支持图像匹配策略', () => {
      const options: ElementRecognitionOptions = {
        strategy: 'image-matching',
        templateImage: '/path/to/template.png',
        screenshotPath: '/path/to/screenshot.png',
        threshold: 0.85,
      };

      expect(options.strategy).toBe('image-matching');
      expect(options.templateImage).toBe('/path/to/template.png');
      expect(options.threshold).toBe(0.85);
    });

    it('应该支持 OCR 策略', () => {
      const options: ElementRecognitionOptions = {
        strategy: 'ocr',
        query: {
          text: 'Submit Button',
        },
      };

      expect(options.strategy).toBe('ocr');
      expect(options.query?.text).toBe('Submit Button');
    });
  });

  describe('RpaStep', () => {
    it('应该支持完整的步骤定义', () => {
      const step: RpaStep = {
        id: 'step-1',
        action: 'click',
        params: {
          x: 100,
          y: 200,
          button: 'left',
        },
        description: 'Click the button',
        status: 'pending',
      };

      expect(step.id).toBe('step-1');
      expect(step.action).toBe('click');
      expect(step.params.x).toBe(100);
      expect(step.status).toBe('pending');
    });

    it('应该支持拖拽步骤', () => {
      const step: RpaStep = {
        id: 'step-drag',
        action: 'drag',
        params: {
          startX: 100,
          startY: 100,
          endX: 400,
          endY: 400,
          duration: 500,
        },
      };

      expect(step.action).toBe('drag');
      expect(step.params.startX).toBe(100);
    });

    it('应该支持快捷键步骤', () => {
      const step: RpaStep = {
        id: 'step-hotkey',
        action: 'hotkey',
        params: {
          combo: 'ctrl+s',
        },
      };

      expect(step.action).toBe('hotkey');
      expect(step.params.combo).toBe('ctrl+s');
    });
  });

  describe('RpaTask', () => {
    it('应该支持完整的任务定义', () => {
      const task: RpaTask = {
        id: 'task-1',
        name: 'Test Task',
        type: 'web',
        description: 'A test task',
        status: 'idle',
        steps: [
          { id: 'step-1', action: 'navigate', params: { url: 'https://example.com' } },
          { id: 'step-2', action: 'click', params: { x: 100, y: 200 } },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(task.id).toBe('task-1');
      expect(task.steps.length).toBe(2);
      expect(task.type).toBe('web');
    });

    it('应该支持桌面 RPA 任务', () => {
      const task: RpaTask = {
        id: 'task-desktop',
        name: 'Desktop Task',
        type: 'desktop',
        description: 'A desktop task',
        status: 'idle',
        steps: [
          { id: 'step-1', action: 'captureScreen', params: {} },
          { id: 'step-2', action: 'click', params: { x: 100, y: 200 } },
          { id: 'step-3', action: 'drag', params: { startX: 100, startY: 100, endX: 300, endY: 300 } },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(task.type).toBe('desktop');
      expect(task.steps[2].action).toBe('drag');
    });
  });
});
