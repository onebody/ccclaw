import { Outlet } from "react-router-dom"
import { Container, Text, Stack } from '@mantine/core'

export function Layout() {
  return (
    <Stack gap={0} h="100vh">
      <header style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Container size="xl" h={64} style={{ display: 'flex', alignItems: 'center' }}>
          <Text size="lg" fw={600}>Ccclaw</Text>
        </Container>
      </header>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Container size="xl" py="md" px="md">
          <Outlet />
        </Container>
      </main>
    </Stack>
  )
}
