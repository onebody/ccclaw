import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useWebRpaTask,
  useExecuteWebRpaTask,
  useDesktopRpaTask,
  useExecuteDesktopRpaTask,
} from '../../hooks/useRpa';
import type { RpaExecutionResult } from '../../types/rpa';

/**
 * RPA 任务执行页面
 */
const RpaExecutePage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [taskType, setTaskType] = useState<'web' | 'desktop'>('web');
  const [executionResult, setExecutionResult] = useState<RpaExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // 获取数据
  const { task: webTask, loading: webLoading } = useWebRpaTask(taskId || '');
  const { task: desktopTask, loading: desktopLoading } = useDesktopRpaTask(taskId || '');

  // 执行任务
  const { executeTask: executeWebTask } = useExecuteWebRpaTask();
  const { executeTask: executeDesktopTask } = useExecuteDesktopRpaTask();

  const task = webTask || desktopTask;
  const isLoading = webLoading || desktopLoading;

  // 检测任务类型
  useEffect(() => {
    if (task) {
      setTaskType(task.type);
    }
  }, [task]);

  // 执行任务
  const handleExecute = useCallback(async () => {
    if (!taskId) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      let result: RpaExecutionResult | null = null;

      if (taskType === 'web') {
        result = await executeWebTask(taskId) as RpaExecutionResult | null;
      } else {
        result = await executeDesktopTask(taskId) as RpaExecutionResult | null;
      }

      if (result) {
        setExecutionResult(result);
      }
    } catch (err) {
      alert(`执行失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExecuting(false);
    }
  }, [taskId, taskType, executeWebTask, executeDesktopTask]);

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'running': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      case 'stopped': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'running': return '运行中';
      case 'completed': return '已完成';
      case 'error': return '错误';
      case 'stopped': return '已停止';
      default: return status;
    }
  };

  // 格式化持续时间
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  if (isLoading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!task) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>任务不存在</p>
        <button onClick={() => navigate('/rpa')}>返回列表</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{task.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'white',
                backgroundColor: getStatusColor(task.status),
              }}
            >
              {getStatusText(task.status)}
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {task.type === 'web' ? '网页 RPA' : '桌面 RPA'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/rpa')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            返回列表
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting || task.status === 'running'}
            style={{
              padding: '8px 16px',
              backgroundColor: isExecuting || task.status === 'running' ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isExecuting || task.status === 'running' ? 'not-allowed' : 'pointer',
            }}
          >
            {isExecuting ? '执行中...' : task.status === 'running' ? '正在运行' : '执行任务'}
          </button>
        </div>
      </div>

      {/* 任务信息 */}
      <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>任务信息</h3>
        {task.description && (
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{task.description}</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px' }}>
          <div><strong>步骤数:</strong> {task.steps.length}</div>
          <div><strong>创建时间:</strong> {new Date(task.createdAt).toLocaleString()}</div>
          {task.lastExecutedAt && (
            <div><strong>最后执行:</strong> {new Date(task.lastExecutedAt).toLocaleString()}</div>
          )}
        </div>
      </div>

      {/* 执行结果 */}
      {executionResult && (
        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: executionResult.success ? '#f0fdf4' : '#fef2f2' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: executionResult.success ? '#166534' : '#991b1b' }}>
            执行结果 - {executionResult.success ? '成功' : '失败'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>执行步骤</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{executionResult.stepsExecuted}/{executionResult.totalSteps}</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>执行时长</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatDuration(executionResult.duration)}</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>状态</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: executionResult.success ? '#10b981' : '#ef4444' }}>
                {executionResult.success ? '成功' : '失败'}
              </div>
            </div>
          </div>

          {executionResult.error && (
            <div style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '12px' }}>
              <strong>错误:</strong> {executionResult.error}
            </div>
          )}

          {/* 步骤日志 */}
          {executionResult.stepLogs && executionResult.stepLogs.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>步骤日志</h4>
              <div style={{ display: 'grid', gap: '4px' }}>
                {executionResult.stepLogs.map((log: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>步骤 {log.stepIndex + 1}</span>
                      <span style={{ color: log.success ? '#10b981' : '#ef4444' }}>
                        {log.success ? '✓ 成功' : '✗ 失败'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', color: '#6b7280' }}>
                      <span>耗时: {formatDuration(log.duration)}</span>
                      {log.error && <span style={{ color: '#ef4444' }}>{log.error}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 步骤列表 */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>任务步骤</h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {task.steps.map((step, index) => (
            <div
              key={step.id}
              style={{
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{index + 1}</span>
                <span style={{ fontWeight: '500' }}>{step.action}</span>
                {step.description && (
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>({step.description})</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {JSON.stringify(step.params)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RpaExecutePage;
