import { HashRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { HomePage } from "@/pages/HomePage"
import { AgentManager } from "@/pages/AgentManager"
import { TaskDetailPage } from "@/pages/TaskDetailPage"
import RpaListPage from "@/pages/rpa"
import RpaEditorPage from "@/pages/rpa/editor"
import RpaExecutePage from "@/pages/rpa/execute"
import { Stack, Text, Title } from '@mantine/core'

function App() {
  return (
    <HashRouter>
      {/* AppLayout provides: Icon bar + Workspace panel + main content area */}
      <AppLayout>
        <Routes>
          {/* Main content routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/agents" element={<AgentManager />} />
          <Route path="/workflows" element={
            <Stack p="md">
              <Title order={2}>工作流</Title>
              <Text c="dimmed">工作流管理（即将推出）</Text>
            </Stack>
          } />
          <Route path="/settings" element={
            <Stack p="md">
              <Title order={2}>设置</Title>
              <Text c="dimmed">应用设置（即将推出）</Text>
            </Stack>
          } />

          {/* Task routes */}
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="/tasks/:taskId/:tab" element={<TaskDetailPage />} />

          {/* Chat routes */}
          <Route path="/chat" element={
            <Stack p="md">
              <Title order={2}>助手</Title>
              <Text c="dimmed">AI 对话（即将推出）</Text>
            </Stack>
          } />
          <Route path="/chat/:sessionId" element={
            <Stack p="md">
              <Title order={2}>会话</Title>
            </Stack>
          } />

          {/* Expert routes */}
          <Route path="/experts" element={
            <Stack p="md">
              <Title order={2}>专家</Title>
              <Text c="dimmed">专家团队（即将推出）</Text>
            </Stack>
          } />

          {/* Automation routes */}
          <Route path="/automations" element={
            <Stack p="md">
              <Title order={2}>自动化</Title>
              <Text c="dimmed">定时任务和工作流（即将推出）</Text>
            </Stack>
          } />

          {/* RPA routes */}
          <Route path="/rpa" element={<RpaListPage />} />
          <Route path="/rpa/editor" element={<RpaEditorPage />} />
          <Route path="/rpa/editor/:taskId" element={<RpaEditorPage />} />
          <Route path="/rpa/execute/:taskId" element={<RpaExecutePage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  )
}

export default App
