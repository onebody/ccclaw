import { HashRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { HomePage } from "@/pages/HomePage"
import { AgentManager } from "@/pages/AgentManager"
import { TaskDetailPage } from "@/pages/TaskDetailPage"
import RpaListPage from "@/pages/rpa"
import RpaEditorPage from "@/pages/rpa/editor"
import RpaExecutePage from "@/pages/rpa/execute"

function App() {
  return (
    <HashRouter>
      {/* AppLayout provides: Icon bar + Workspace panel + main content area */}
      <AppLayout>
        <Routes>
          {/* Main content routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/agents" element={<AgentManager />} />
          <Route path="/workflows" element={<div className="p-6"><h2 className="text-2xl font-bold">工作流</h2><p className="text-muted-foreground mt-2">工作流管理（即将推出）</p></div>} />
          <Route path="/settings" element={<div className="p-6"><h2 className="text-2xl font-bold">设置</h2><p className="text-muted-foreground mt-2">应用设置（即将推出）</p></div>} />

          {/* Task routes */}
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />

          {/* Chat routes */}
          <Route path="/chat" element={<div className="p-6"><h2 className="text-2xl font-bold">助手</h2><p className="text-muted-foreground mt-2">AI 对话（即将推出）</p></div>} />
          <Route path="/chat/:sessionId" element={<div className="p-6"><h2 className="text-2xl font-bold">会话</h2></div>} />

          {/* Expert routes */}
          <Route path="/experts" element={<div className="p-6"><h2 className="text-2xl font-bold">专家</h2><p className="text-muted-foreground mt-2">专家团队（即将推出）</p></div>} />

          {/* Automation routes */}
          <Route path="/automations" element={<div className="p-6"><h2 className="text-2xl font-bold">自动化</h2><p className="text-muted-foreground mt-2">定时任务和工作流（即将推出）</p></div>} />

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
