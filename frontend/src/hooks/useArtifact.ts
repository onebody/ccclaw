/**
 * Artifact 管理 Hook
 *
 * @fileoverview 提供制品的增删改查功能
 * @author Ccclaw Team
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Artifact } from '@/types/workspace'

const api = (window as any).api

interface ArtifactUpdateInput {
  name?: string
  description?: string
  isNew?: boolean
  path?: string
  size?: number
  type?: any
}

/**
 * 获取任务的制品列表
 */
export function useArtifacts(taskId: string | null) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetch = useCallback(async () => {
    if (!taskId) {
      setArtifacts([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await api.artifactListByTask(taskId)
      if (mountedRef.current) {
        setArtifacts(data ?? [])
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message ?? '获取制品失败')
        setArtifacts([])
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [taskId])

  useEffect(() => {
    mountedRef.current = true
    fetch()
    return () => { mountedRef.current = false }
  }, [fetch])

  return { artifacts, loading, error, refetch: fetch }
}

/**
 * 单个制品操作
 */
export function useArtifact(id: string | null) {
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  const fetch = useCallback(async () => {
    if (!id) {
      setArtifact(null)
      return
    }

    setLoading(true)
    try {
      const data = await api.artifactGet(id)
      if (mountedRef.current) {
        setArtifact(data ?? null)
      }
    } catch {
      if (mountedRef.current) {
        setArtifact(null)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    mountedRef.current = true
    fetch()
    return () => { mountedRef.current = false }
  }, [fetch])

  const update = useCallback(async (input: ArtifactUpdateInput) => {
    if (!id) return null
    const result = await api.artifactUpdate(id, input)
    setArtifact(result)
    return result
  }, [id])

  const remove = useCallback(async () => {
    if (!id) return false
    await api.artifactDelete(id)
    setArtifact(null)
    return true
  }, [id])

  return { artifact, loading, update, remove, refetch: fetch }
}

/**
 * 创建制品
 */
export function useCreateArtifact() {
  const [loading, setLoading] = useState(false)

  const create = useCallback(async (input: Omit<Artifact, 'id' | 'createdAt'>) => {
    setLoading(true)
    try {
      const result = await api.artifactAdd(input)
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading }
}

/**
 * 文件类型图标映射
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  const iconMap: Record<string, string> = {
    // 代码
    'ts': '📄', 'tsx': '📄', 'js': '📄', 'jsx': '📄',
    'py': '🐍', 'rb': '💎', 'go': '📄', 'rs': '⚙️',
    'java': '☕', 'kt': '📄', 'swift': '📄', 'c': '📄', 'cpp': '📄',
    'cs': '📄', 'php': '📄',

    // Web
    'html': '🌐', 'css': '🎨', 'scss': '🎨', 'less': '🎨',
    'vue': '🟢', 'svelte': '🟠',

    // 数据
    'json': '📋', 'yaml': '📋', 'yml': '📋', 'toml': '📋',
    'xml': '📋', 'csv': '📊', 'sql': '🗃️',

    // 文档
    'md': '📝', 'mdx': '📝', 'txt': '📄',
    'pdf': '📕', 'doc': '📘', 'docx': '📘',
    'xls': '📗', 'xlsx': '📗', 'ppt': '📙', 'pptx': '📙',

    // 图片
    'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️',
    'svg': '🖼️', 'webp': '🖼️', 'ico': '🖼️',

    // 配置
    'gitignore': '🙈', 'env': '🔒', 'lock': '�锁',
    'dockerignore': '🐳', 'dockerfile': '🐳',

    // 其他
    'sh': '⚡', 'bash': '⚡', 'zsh': '⚡',
    'zip': '📦', 'tar': '📦', 'gz': '📦',
  }

  return iconMap[ext] ?? '📄'
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
