import { create } from "zustand"
import type { Agent, Workflow, Provider } from "@/types/api"

// Agent store
interface AgentStore {
  agents: Agent[]
  loading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  addAgent: (agent: Agent) => void
  removeAgent: (id: string) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null })
    try {
      // API call would go here
      // const agents = await apiGet<Agent[]>('/agents')
      // set({ agents, loading: false })
      set({ loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
    })),

  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
    })),
}))

// Workflow store
interface WorkflowStore {
  workflows: Workflow[]
  loading: boolean
  error: string | null
  fetchWorkflows: () => Promise<void>
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: [],
  loading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ loading: true, error: null })
    try {
      // API call would go here
      set({ loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
}))

// Provider store
interface ProviderStore {
  providers: Provider[]
  loading: boolean
  error: string | null
  fetchProviders: () => Promise<void>
}

export const useProviderStore = create<ProviderStore>((set) => ({
  providers: [],
  loading: false,
  error: null,

  fetchProviders: async () => {
    set({ loading: true, error: null })
    try {
      // API call would go here
      set({ loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
}))
