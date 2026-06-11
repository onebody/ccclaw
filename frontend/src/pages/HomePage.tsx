import { Stack, Title, Text, Grid, Card } from '@mantine/core'

export function HomePage() {
  return (
    <Stack gap="xl">
      <div>
        <Title order={2}>Dashboard</Title>
        <Text c="dimmed" mt="xs">Welcome to Ccclaw - Your AI Agent Management Platform</Text>
      </div>
      
      <Grid>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card withBorder p="lg">
            <Text size="lg" fw={500}>Agents</Text>
            <Text size="sm" c="dimmed" mt="xs">Manage your AI agents</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card withBorder p="lg">
            <Text size="lg" fw={500}>Workflows</Text>
            <Text size="sm" c="dimmed" mt="xs">Orchestrate agent workflows</Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Card withBorder p="lg">
            <Text size="lg" fw={500}>Settings</Text>
            <Text size="sm" c="dimmed" mt="xs">Configure your preferences</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
