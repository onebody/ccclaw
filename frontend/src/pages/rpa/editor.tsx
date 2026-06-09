import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useWebRpaTask,
  useCreateWebRpaTask,
  useUpdateWebRpaTask,
  useDesktopRpaTask,
  useCreateDesktopRpaTask,
  useUpdateDesktopRpaTask,
} from '../../hooks/useRpa';
import type { RpaStep } from '../../types/rpa';

/**
 * RPA 任务编辑器页面
 */
const RpaEditorPage: React.FC = () => {
  const { taskId } = useParams<{ taskId?: string }>();
  const navigate = useNavigate();
  const isEditing = !!taskId;

  // 任务类型（新建时从 URL 参数获取，编辑时从任务数据获取）
  const [taskType, setTaskType] = useState<'web' | 'desktop'>('web');

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<RpaStep[]>([]);
  const [config, setConfig] = useState<any>({});

  // 获取数据（编辑模式）
  const { task: webTask, loading: webLoading } = useWebRpaTask(taskId || '');
  const { task: desktopTask, loading: desktopLoading } = useDesktopRpaTask(taskId || '');

  // 创建/更新任务
  const { createTask: createWebTask, loading: createWebLoading } = useCreateWebRpaTask();
  const { updateTask: updateWebTask, loading: updateWebLoading } = useUpdateWebRpaTask();
  const { createTask: createDesktopTask, loading: createDesktopLoading } = useCreateDesktopRpaTask();
  const { updateTask: updateDesktopTask, loading: updateDesktopLoading } = useUpdateDesktopRpaTask();

  // 加载任务数据（编辑模式）
  useEffect(() => {
    if (isEditing) {
      const task = webTask || desktopTask;
      if (task) {
        setName(task.name);
        setDescription(task.description || '');
        setSteps(task.steps || []);
        setConfig(task.config || {});
        setTaskType(task.type);
      }
    }
  }, [isEditing, webTask, desktopTask]);

  // 添加步骤
  const addStep = () => {
    const newStep: RpaStep = {
      id: `step-${Date.now()}`,
      action: taskType === 'web' ? 'navigate' : 'captureScreen',
      params: {},
      status: 'pending',
    };
    setSteps([...steps, newStep]);
  };

  // 更新步骤
  const updateStep = (index: number, updates: Partial<RpaStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  // 删除步骤
  const deleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // 保存任务
  const saveTask = async () => {
    if (!name.trim()) {
      alert('请输入任务名称');
      return;
    }

    if (taskType === 'web') {
      const input = {
        name,
        description,
        type: 'web' as const,
        steps: steps.map(({ id, status, executedAt, result, error, ...rest }) => rest),
        config,
      };

      if (isEditing && taskId) {
        await updateWebTask(taskId, input);
      } else {
        await createWebTask(input);
      }
    } else {
      const input = {
        name,
        description,
        type: 'desktop' as const,
        steps: steps.map(({ id, status, executedAt, result, error, ...rest }) => rest),
        config,
      };

      if (isEditing && taskId) {
        await updateDesktopTask(taskId, input);
      } else {
        await createDesktopTask(input);
      }
    }

    navigate('/rpa');
  };

  // 可用的操作类型
  const getAvailableActions = (): string[] => {
    if (taskType === 'web') {
      return [
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
    } else {
      return [
        'captureScreen',
        'recognizeText',
        'click',
        'type',
        'findElement',
        'getWindows',
      ];
    }
  };

  if ((webLoading || desktopLoading) && isEditing) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? '编辑 RPA 任务' : '新建 RPA 任务'}
        </h1>
        <button
          onClick={() => navigate('/rpa')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          返回列表
        </button>
      </div>

      {/* 任务类型选择（仅新建时） */}
      {!isEditing && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">任务类型</label>
          <div className="flex gap-4">
            <button
              onClick={() => setTaskType('web')}
              className={`px-4 py-2 rounded ${
                taskType === 'web' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              网页 RPA
            </button>
            <button
              onClick={() => setTaskType('desktop')}
              className={`px-4 py-2 rounded ${
                taskType === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              桌面 RPA
            </button>
          </div>
        </div>
      )}

      {/* 基本信息 */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">任务名称 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="输入任务名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">任务描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            placeholder="输入任务描述（可选）"
          />
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">执行步骤</h2>
          <button
            onClick={addStep}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            + 添加步骤
          </button>
        </div>

        {steps.length === 0 ? (
          <div className="text-gray-500 text-center py-8 border-2 border-dashed rounded">
            暂无步骤，点击"添加步骤"开始
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="border rounded p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">步骤 {index + 1}</span>
                  <button
                    onClick={() => deleteStep(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    删除
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">操作类型</label>
                    <select
                      value={step.action}
                      onChange={(e) => updateStep(index, { action: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded"
                    >
                      {getAvailableActions().map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">状态</label>
                    <span className="px-2 py-1 rounded text-sm bg-gray-100">
                      {step.status}
                    </span>
                  </div>
                </div>

                {/* 参数输入 */}
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">参数 (JSON)</label>
                  <textarea
                    value={JSON.stringify(step.params || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const params = JSON.parse(e.target.value);
                        updateStep(index, { params });
                      } catch (err) {
                        // JSON 解析错误，暂不更新
                      }
                    }}
                    className="w-full px-3 py-2 border rounded font-mono text-sm"
                    rows={3}
                    placeholder='{"url": "https://example.com"}'
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      <div className="flex gap-4">
        <button
          onClick={saveTask}
          disabled={createWebLoading || updateWebLoading || createDesktopLoading || updateDesktopLoading}
          className={`px-6 py-2 rounded text-white ${
            createWebLoading || updateWebLoading || createDesktopLoading || updateDesktopLoading
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {(createWebLoading || updateWebLoading || createDesktopLoading || updateDesktopLoading)
            ? '保存中...'
            : '保存任务'}
        </button>

        <button
          onClick={() => navigate('/rpa')}
          className="px-6 py-2 border rounded hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default RpaEditorPage;
