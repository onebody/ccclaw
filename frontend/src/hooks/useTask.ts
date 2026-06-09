import { useState, useEffect, useCallback } from 'react'
import type { Task, TaskCreateInput, TaskUpdateInput, TaskListFilter } from '@/types/workspace'

const api = (window as any).api

async function callAPI<T>(promise: Promise<any>): Promise<T> {
  const result = await promise
  if (result?.ok !== false) return result as T
  throw new Error(result?.error || '未知错误')
}

export function useTasks(filter?: TaskListFilter) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await callAPI<Task[]>(api.taskList(filter))
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [filter?.workspaceId])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (input: TaskCreateInput) => {
    const task = await callAPI<Task>(api.taskCreate(input))
    setTasks(prev => [...prev, task])
    return task
  }, [])

  const update = useCallback(async (id: string, input: TaskUpdateInput) => {
    const task = await callAPI<Task>(api.taskUpdate(id, input))
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }, [])

  const remove = useCallback(async (id: string) => {
    await callAPI<void>(api.taskDelete(id))
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const start = useCallback(async (id: string) => {
    const task = await callAPI<Task>(api.taskStart(id))
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }, [])

  const complete = useCallback(async (id: string) => {
    const task = await callAPI<Task>(api.taskComplete(id))
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }, [])

  const fail = useCallback(async (id: string, notes: string) => {
    const task = await callAPI<Task>(api.taskFail(id, notes))
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }, [])

  const cancel = useCallback(async (id: string) => {
    const task = await callAPI<Task>(api.taskCancel(id))
    setTasks(prev => prev.map(t => t.id === id ? task : t))
    return task
  }, [])

  return { tasks, loading, error, refetch: fetch, create, update, remove, start, complete, fail, cancel }
}

// ----------------------------------------------------------------
// useActiveTask - 获取当前激活的任务
// ----------------------------------------------------------------
export function useActiveTask(filter?: TaskListFilter) {
  const [task, setTask] = useState<Task | null>(null)
  const { tasks, loading } = useTasks(filter)

  useEffect(() => {
    const active = tasks.find(t => t.status === 'running') || tasks[0] || null
    setTask(active || null)
  }, [tasks])

  return { task, loading }
}

export function useWorkspaceTasks(workspaceId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!workspaceId) { setTasks([]); return }
    try {
      setLoading(true)
      const data = await callAPI<Task[]>(api.taskListByWorkspace(workspaceId))
      setTasks(data)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { fetch() }, [fetch])

  return { tasks, loading, refetch: fetch }
}
