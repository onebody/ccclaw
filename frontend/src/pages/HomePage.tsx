export function HomePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Welcome to Ccclaw - Your AI Agent Management Platform
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-medium">Agents</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your AI agents
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-medium">Workflows</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Orchestrate agent workflows
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-medium">Settings</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Configure your preferences
          </p>
        </div>
      </div>
    </div>
  )
}
