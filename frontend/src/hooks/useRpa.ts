/**
 * RPA 功能 Hooks
 *
 * @fileoverview 提供 RPA 功能的 React Hooks，包括 Web RPA 和 Desktop RPA
 * @author Ccclaw Team
 * @version 2.0
 */

import { useState, useCallback } from 'react';
import type {
  RpaTask,
  RpaTaskCreateInput,
  RpaTaskUpdateInput,
  RpaTaskListFilter,
  RpaExecutionResult,
  ScreenCaptureOptions,
  OcrOptions,
  ElementRecognitionOptions,
  WindowQueryOptions,
} from '../types/rpa';

// ==================== Web RPA Hooks ====================

/**
 * 获取所有 Web RPA 任务
 */
export function useWebRpaTasks(filter?: RpaTaskListFilter) {
  const [tasks, setTasks] = useState<RpaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaWebGetAllTasks(filter);
      setTasks(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // 初始加载
  useState(() => {
    fetchTasks();
  });

  return { tasks, loading, error, refetch: fetchTasks };
}

/**
 * 获取单个 Web RPA 任务
 */
export function useWebRpaTask(taskId: string | null) {
  const [task, setTask] = useState<RpaTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaWebGetTask(taskId);
      setTask(result || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // 初始加载
  useState(() => {
    if (taskId) fetchTask();
  });

  return { task, loading, error, refetch: fetchTask };
}

/**
 * 创建 Web RPA 任务
 */
export function useCreateWebRpaTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (input: RpaTaskCreateInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaWebCreateTask(input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createTask, loading, error };
}

/**
 * 更新 Web RPA 任务
 */
export function useUpdateWebRpaTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = useCallback(async (taskId: string, input: RpaTaskUpdateInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaWebUpdateTask(taskId, input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateTask, loading, error };
}

/**
 * 删除 Web RPA 任务
 */
export function useDeleteWebRpaTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaWebDeleteTask(taskId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteTask, loading, error };
}

/**
 * 执行 Web RPA 任务
 */
export function useExecuteWebRpaTask() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RpaExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await window.api.rpaWebExecuteTask(taskId);
      setResult(response || null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeTask, loading, result, error };
}

// ==================== Desktop RPA Hooks ====================

/**
 * 获取所有 Desktop RPA 任务
 */
export function useDesktopRpaTasks(filter?: RpaTaskListFilter) {
  const [tasks, setTasks] = useState<RpaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopGetAllTasks(filter);
      setTasks(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // 初始加载
  useState(() => {
    fetchTasks();
  });

  return { tasks, loading, error, refetch: fetchTasks };
}

/**
 * 获取单个 Desktop RPA 任务
 */
export function useDesktopRpaTask(taskId: string | null) {
  const [task, setTask] = useState<RpaTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopGetTask(taskId);
      setTask(result || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // 初始加载
  useState(() => {
    if (taskId) fetchTask();
  });

  return { task, loading, error, refetch: fetchTask };
}

/**
 * 创建 Desktop RPA 任务
 */
export function useCreateDesktopRpaTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (input: RpaTaskCreateInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopCreateTask(input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createTask, loading, error };
}

/**
 * 更新 Desktop RPA 任务
 */
export function useUpdateDesktopRpaTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = useCallback(async (taskId: string, input: RpaTaskUpdateInput) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopUpdateTask(taskId, input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateTask, loading, error };
}

/**
 * 删除 Desktop RPA 任务
 */
export function useDeleteDesktopRpaTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopDeleteTask(taskId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteTask, loading, error };
}

/**
 * 执行 Desktop RPA 任务
 */
export function useExecuteDesktopRpaTask() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RpaExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await window.api.rpaDesktopExecuteTask(taskId);
      setResult(response || null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeTask, loading, result, error };
}

/**
 * Desktop RPA 操作 Hook
 */
export function useDesktopRpaActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 捕获屏幕
   */
  const captureScreen = useCallback(async (options: ScreenCaptureOptions) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopCaptureScreen(options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * OCR 识别文字
   */
  const recognizeText = useCallback(async (imagePath: string, options?: OcrOptions) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopRecognizeText(imagePath, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 查找元素
   */
  const findElement = useCallback(async (options: ElementRecognitionOptions) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopFindElement(options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 鼠标点击
   */
  const click = useCallback(async (x: number, y: number, options?: { button?: 'left' | 'right' | 'middle'; double?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopClick(x, y, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 键盘输入
   */
  const type = useCallback(async (text: string, options?: { delay?: number }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopType(text, options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取窗口列表
   */
  const getWindows = useCallback(async (options?: WindowQueryOptions) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.rpaDesktopGetWindows(options);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    captureScreen,
    recognizeText,
    findElement,
    click,
    type,
    getWindows,
    loading,
    error,
  };
}
