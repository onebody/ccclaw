import type { OpenClawShellManagedBlockRecord } from '../../src/shared/openclaw-phase2'
import {
  CCCLAW_OPENCLAW_SHELL_BLOCK_END,
  CCCLAW_OPENCLAW_SHELL_BLOCK_START,
  resolveShellInitFiles,
} from './openclaw-cleanup'

export function resolveManagedShellBlockTargets(
  now: string = new Date().toISOString()
): OpenClawShellManagedBlockRecord[] {
  return resolveShellInitFiles().map((filePath) => ({
    filePath,
    blockId: `shell-init:${filePath}`,
    blockType: 'openclaw-shell-init',
    startMarker: CCCLAW_OPENCLAW_SHELL_BLOCK_START,
    endMarker: CCCLAW_OPENCLAW_SHELL_BLOCK_END,
    source: 'ccclaw-lite',
    firstManagedAt: now,
    lastManagedAt: now,
  }))
}

export function describeManagedShellBlockScopes(): string[] {
  const targets = resolveManagedShellBlockTargets()
  if (targets.length === 0) {
    return ['如后续接管 shell 初始化，仅会操作 Ccclaw 自己写入的 managed block。']
  }

  return targets.map(
    (target) => `如后续接管 shell 初始化，仅会操作 ${target.filePath} 中由 Ccclaw 写入的 managed block。`
  )
}
