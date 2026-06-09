import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useWebRpaTasks,
  useDeleteWebRpaTask,
  useExecuteWebRpaTask,
  useDesktopRpaTasks,
  useDeleteDesktopRpaTask,
  useExecuteDesktopRpaTask,
} from '../../hooks/useRpa';
import type { RpaTask } from '../../../src/types/rpa';

/**
 * RPA 任务列表页面
 */
const RpaListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'web' | 'desktop'>('web');
  const [search, setSearch] = useState('');

  // 获取数据
  const { tasks: webTasks, loading: webLoading, refetch: refetchWeb } = useWebRpaTasks();
  const { tasks: desktopTasks, loading: desktopLoading, refetch: refetchDesktop } = useDesktopRpaTasks();

  // 删除任务
  const { deleteTask: deleteWebTask } = useDeleteWebRpaTask();
  const { deleteTask: deleteDesktopTask } = useDeleteDesktopRpaTask();

  // 执行任务
  const { executeTask: executeWebTask } = useExecuteWebRpaTask();
  const { executeTask: executeDesktopTask } = useExecuteDesktopRpaTask();

  // 当前选中的任务类型
  const tasks = activeTab === 'web' ? webTasks : desktopTasks;
  const isLoading = activeTab === 'web' ? webLoading : desktopLoading;

  // 筛选任务
  const filteredTasks = tasks.filter((task: RpaTask) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      task.name.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower)
    );
  });

  // 删除任务
  const handleDelete = useCallback(async (taskId: string, taskName: string) => {
    if (!window.confirm(`确定要删除任务 "${taskName}" 吗？`)) {
      return;
    }

    try {
      if (activeTab === 'web') {
        await deleteWebTask(taskId);
      } else {
        await deleteDesktopTask(taskId);
      }
      alert('删除成功');
      // 刷新列表
      if (activeTab === 'web') {
        refetchWeb();
      } else {
        refetchDesktop();
      }
    } catch (err) {
      alert(`删除失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [activeTab, deleteWebTask, deleteDesktopTask, refetchWeb, refetchDesktop]);

  // 执行任务
  const handleExecute = useCallback(async (taskId: string, taskName: string) => {
    try {
      let result;
      if (activeTab === 'web') {
        result = await executeWebTask(taskId);
      } else {
        result = await executeDesktopTask(taskId);
      }
      alert(`任务 "${taskName}" 执行完成！\n成功: ${result?.success}\n执行步骤: ${result?.stepsExecuted}/${result?.totalSteps}`);
    } catch (err) {
      alert(`执行失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [activeTab, executeWebTask, executeDesktopTask]);

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return '#6b7280';
      case 'running': return '#3b82f6';
      case 'paused': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return '空闲';
      case 'running': return '运行中';
      case 'paused': return '已暂停';
      case 'completed': return '已完成';
      case 'error': return '错误';
      default: return status;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>RPA 任务管理</h1>
        <button
          onClick={() => navigate('/rpa/editor')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + 新建任务
        </button>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('web')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: activeTab === 'web' ? '#3b82f6' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === 'web' ? '2px solid #3b82f6' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'web' ? 'bold' : 'normal',
          }}
        >
          网页 RPA
        </button>
        <button
          onClick={() => setActiveTab('desktop')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: activeTab === 'desktop' ? '#3b82f6' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === 'desktop' ? '2px solid #3b82f6' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'desktop' ? 'bold' : 'normal',
          }}
        >
          桌面 RPA
        </button>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="搜索任务..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* 任务列表 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>加载中...</div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          暂无任务，点击"新建任务"创建
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredTasks.map((task: RpaTask) => (
            <div
              key={task.id}
              style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{task.name}</h3>
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
                </div>
                {task.description && (
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>{task.description}</p>
                )}
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  步骤数: {task.steps.length} | 创建时间: {new Date(task.createdAt).toLocaleString()}
                  {task.lastExecutedAt && (
                    <span> | 最后执行: {new Date(task.lastExecutedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/rpa/editor/${task.id}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => handleExecute(task.id, task.name)}
                  disabled={task.status === 'running'}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: task.status === 'running' ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: task.status === 'running' ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {task.status === 'running' ? '运行中' : '执行'}
                </button>
                <button
                  onClick={() => handleDelete(task.id, task.name)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#fef2f2',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RpaListPage;
