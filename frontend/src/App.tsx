import { HashRouter, Routes, Route } from "react-router-dom"
import { Layout } from "@/components/layout/Layout"
import { HomePage } from "@/pages/HomePage"
import { AgentManager } from "@/pages/AgentManager"
import RpaListPage from "@/pages/rpa"
import RpaEditorPage from "@/pages/rpa/editor"
import RpaExecutePage from "@/pages/rpa/execute"

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/agents" element={<AgentManager />} />
          <Route path="/workflows" element={<div>Workflows Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          {/* RPA 路由 */}
          <Route path="/rpa" element={<RpaListPage />} />
          <Route path="/rpa/editor" element={<RpaEditorPage />} />
          <Route path="/rpa/editor/:taskId" element={<RpaEditorPage />} />
          <Route path="/rpa/execute/:taskId" element={<RpaExecutePage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
