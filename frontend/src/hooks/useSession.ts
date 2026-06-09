import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChatSession, ChatMessage } from '@/types/workspace'

const api = (window as any).api

async function callAPI<T>(promise: Promise<any>): Promise<T> {
  const result = await promise
  if (result?.ok !== false) return result as T
  throw new Error(result?.error || '未知错误')
}

// ============================================================================
// useSessions — 会话 CRUD
// ============================================================================

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

    // 尝试创建 OpenClaw 聊天会话并关联
    try {
      const chatSession = await callAPI<{ id: string }>(api.createChatSession())
      if (chatSession?.id) {
        await callAPI<void>(api.sessionUpdate(session.id, { chatSessionId: chatSession.id }))
        session.chatSessionId = chatSession.id
      }
    } catch (e: any) {
      console.warn('[useSessions] 创建聊天会话失败，将仅使用本地会话:', e?.message)
    }

    setSessions(prev => [...prev, session])
    return session
  }, [taskId])

  const remove = useCallback(async (id: string) => {
    await callAPI<void>(api.sessionDelete(id))
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

  return { sessions, loading, refetch: fetch, create, remove }
}

// ============================================================================
// useMessages — 消息列表 + 发送 + AI 流式响应
// ============================================================================

/**
 * @param sessionId     工作空间会话 ID
 * @param chatSessionId OpenClaw 聊天会话 ID（有则走 AI 流式，无则仅本地）
 */
export function useMessages(sessionId: string | null, chatSessionId?: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const streamingRef = useRef('')
  const sessionIdRef = useRef(sessionId)
  const chatSessionIdRef = useRef(chatSessionId)

  // 保持 ref 最新
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { chatSessionIdRef.current = chatSessionId }, [chatSessionId])

  // ---- 拉取历史消息 ----
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

  // ---- 监听 AI 流式响应 ----
  useEffect(() => {
    if (!chatSessionId) return

    streamingRef.current = ''
    setStreamingContent('')
    setIsStreaming(false)

    const unsubscribe = api.onChatStream((payload: any) => {
      const currentChatId = chatSessionIdRef.current
      if (!currentChatId || payload.sessionId !== currentChatId) return

      if (payload.content) {
        streamingRef.current += payload.content
        setStreamingContent(streamingRef.current)
        setIsStreaming(true)
      }

      if (payload.done) {
        const fullContent = streamingRef.current
        streamingRef.current = ''
        setStreamingContent('')
        setIsStreaming(false)

        if (fullContent) {
          // 将 AI 完整回复存入本地会话
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sessionId: sessionIdRef.current ?? '',
            sender: 'ai',
            content: fullContent,
            codeBlocks: [],
            attachments: [],
            createdAt: new Date().toISOString(),
          }
          // 乐观追加（如果尚未通过 messageSend 写入）
          setMessages(prev => {
            // 避免重复追加
            if (prev.some(m => m.content === fullContent && m.sender === 'ai')) return prev
            return [...prev, aiMsg]
          })
        }
      }

      if (payload.error) {
        setIsStreaming(false)
        setStreamingContent('')
        console.error('[ChatStream] 错误:', payload.error)
      }
    })

    return unsubscribe
  }, [chatSessionId])

  // ---- 发送消息 ----
  const send = useCallback(async (content: string) => {
    if (!sessionId) throw new Error('No sessionId')
    if (!content.trim()) throw new Error('消息内容不能为空')

    const now = new Date().toISOString()
    const tempId = `temp-${Date.now()}`

    // 乐观更新：立即显示用户消息
    const userMsg: ChatMessage = {
      id: tempId,
      sessionId,
      sender: 'user',
      content,
      codeBlocks: [],
      attachments: [],
      createdAt: now,
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(!!chatSessionId)
    setStreamingContent('')
    streamingRef.current = ''

    try {
      if (chatSessionId) {
        // 走 AI：通过 OpenClaw 聊天会话发送
        await api.sendChatMessage({ sessionId: chatSessionId, message: content })
        // AI 响应会通过 onChatStream 异步返回
      } else {
        // 无 AI 会话：仅本地保存
        const saved = await callAPI<ChatMessage>(api.messageSend(sessionId, content))
        setMessages(prev => prev.map(m => m.id === tempId ? saved : m))
        setIsStreaming(false)
      }
      return userMsg
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setIsStreaming(false)
      setStreamingContent('')
      throw err
    }
  }, [sessionId, chatSessionId])

  return { messages, loading, streamingContent, isStreaming, refetch: fetch, send }
}
