import { useState, useEffect, useCallback } from 'react'
import type { Workspace, WorkspaceCreateInput, WorkspaceUpdateInput } from '@/types/workspace'

const api = (window as any).api

async function callAPI<T>(promise: Promise<any>): Promise<T> {
  const result = await promise
  if (result?.ok !== false) return result as T
  throw new Error(result?.error || '未知错误')
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await callAPI<Workspace[]>(api.workspaceList())
      setWorkspaces(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (input: WorkspaceCreateInput) => {
    const ws = await callAPI<Workspace>(api.workspaceCreate(input))
    setWorkspaces(prev => [...prev, ws])
    return ws
  }, [])

  const update = useCallback(async (id: string, input: WorkspaceUpdateInput) => {
    const ws = await callAPI<Workspace>(api.workspaceUpdate(id, input))
    setWorkspaces(prev => prev.map(w => w.id === id ? ws : w))
    return ws
  }, [])

  const remove = useCallback(async (id: string) => {
    await callAPI<void>(api.workspaceDelete(id))
    setWorkspaces(prev => prev.filter(w => w.id !== id))
  }, [])

  const activate = useCallback(async (id: string) => {
    await callAPI<void>(api.workspaceActivate(id))
    setWorkspaces(prev => prev.map(w => ({ ...w, isActive: w.id === id })))
  }, [])

  return { workspaces, loading, error, refetch: fetch, create, update, remove, activate }
}

export function useActiveWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const data = await callAPI<Workspace | null>(api.workspaceGetActive())
      setWorkspace(data)
    } catch {
      setWorkspace(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const activate = useCallback(async (id: string) => {
    await callAPI<void>(api.workspaceActivate(id))
    await fetch()
  }, [fetch])

  return { workspace, loading, refetch: fetch, activate }
}
