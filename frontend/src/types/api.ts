// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  error: string | null
  metadata: {
    timestamp: string
    requestId: string
  }
}

// Agent types
export interface Agent {
  id: string
  name: string
  description: string
  model: {
    provider: string
    modelId: string
    fallbackProvider?: string
    fallbackModelId?: string
  }
  prompt: string
  tools: Tool[]
  maxTokens: number
  temperature: number
  createdAt: string
  updatedAt: string
}

export interface Tool {
  type: "api" | "function"
  name: string
  endpoint?: string
  description?: string
}

// Workflow types
export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  status: "active" | "inactive" | "draft"
  createdAt: string
  updatedAt: string
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

// Provider types
export interface Provider {
  id: string
  name: string
  apiKey?: string
  models: ModelInfo[]
  status: "connected" | "disconnected" | "error"
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  contextWindow: number
  maxTokens: number
  pricing?: {
    inputPrice: number
    outputPrice: number
    unit: number
  }
}
