import { useState, useEffect, useCallback } from 'react'
import type { ChatSession, ChatMessage, MessageSender } from '@/types/workspace'

const api = (window as any).api

async function callAPI<T>(promise: Promise<any>): Promise<T> {
  const result = await promise
  if (result?.ok !== false) return result as T
  throw new Error(result?.error || '未知错误')
}

/** 会话列表 Hook */
export function useSessions(taskId: string | null) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!taskId) { setSessions([]); return }
    try {
      setLoading(true)
      const data = await callAPI<ChatSession[]>(api.sessionListByTask(taskId))
      setSessions(data)
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (title?: string) => {
    if (!taskId) throw new Error('No taskId')
    const session = await callAPI<ChatSession>(api.sessionCreate(taskId, title))
    setSessions(prev => [...prev, session])
    return session
  }, [taskId])

  const remove = useCallback(async (id: string) => {
    await callAPI<void>(api.sessionDelete(id))
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

  return { sessions, loading, refetch: fetch, create, remove }
}

/** 消息列表 Hook */
export function useMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!sessionId) { setMessages([]); return }
    try {
      setLoading(true)
      const data = await callAPI<ChatMessage[]>(api.messageListBySession(sessionId))
      setMessages(data)
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { fetch() }, [fetch])

  const send = useCallback(async (content: string, sender: MessageSender = 'user') => {
    if (!sessionId) throw new Error('No sessionId')
    // 乐观更新：先加入一条本地消息
    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id: tempId,
      sessionId,
      sender,
      content,
      codeBlocks: [],
      attachments: [],
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const msg = await callAPI<ChatMessage>(api.messageSend(sessionId, content))
      // 替换临时消息
      setMessages(prev => prev.map(m => m.id === tempId ? msg : m))
      return msg
    } catch (err) {
      // 移除临时消息
      setMessages(prev => prev.filter(m => m.id !== tempId))
      throw err
    }
  }, [sessionId])

  return { messages, loading, refetch: fetch, send }
}
