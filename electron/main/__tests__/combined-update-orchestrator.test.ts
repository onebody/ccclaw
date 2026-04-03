import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  checkOpenClawUpgradeMock,
  runOpenClawUpgradeMock,
  checkCCClawUpdateMock,
  downloadCCClawUpdateMock,
  getCCClawUpdateStatusMock,
  installCCClawUpdateMock,
} = vi.hoisted(() => ({
  checkOpenClawUpgradeMock: vi.fn(),
  runOpenClawUpgradeMock: vi.fn(),
  checkCCClawUpdateMock: vi.fn(),
  downloadCCClawUpdateMock: vi.fn(),
  getCCClawUpdateStatusMock: vi.fn(),
  installCCClawUpdateMock: vi.fn(),
}))

vi.mock('../openclaw-upgrade-service', () => ({
  checkOpenClawUpgrade: checkOpenClawUpgradeMock,
  runOpenClawUpgrade: runOpenClawUpgradeMock,
}))

vi.mock('../ccclaw-update-service', () => ({
  checkCCClawUpdate: checkCCClawUpdateMock,
  downloadCCClawUpdate: downloadCCClawUpdateMock,
  getCCClawUpdateStatus: getCCClawUpdateStatusMock,
  installCCClawUpdate: installCCClawUpdateMock,
}))

import { checkCombinedUpdate, runCombinedUpdate } from '../combined-update-orchestrator'

describe('combined update orchestrator', () => {
  beforeEach(() => {
    checkOpenClawUpgradeMock.mockReset()
    runOpenClawUpgradeMock.mockReset()
    checkCCClawUpdateMock.mockReset()
    downloadCCClawUpdateMock.mockReset()
    getCCClawUpdateStatusMock.mockReset()
    installCCClawUpdateMock.mockReset()

    getCCClawUpdateStatusMock.mockResolvedValue({
      ok: true,
      supported: true,
      configured: true,
      currentVersion: '2.2.0',
      availableVersion: '2.3.0',
      status: 'available',
      progressPercent: null,
      downloaded: false,
    })
    checkCCClawUpdateMock.mockResolvedValue({
      ok: true,
      supported: true,
      configured: true,
      currentVersion: '2.2.0',
      availableVersion: '2.3.0',
      status: 'available',
      progressPercent: null,
      downloaded: false,
    })
    downloadCCClawUpdateMock.mockResolvedValue({
      ok: true,
      status: {
        ok: true,
        supported: true,
        configured: true,
        currentVersion: '2.2.0',
        availableVersion: '2.3.0',
        status: 'downloaded',
        progressPercent: 100,
        downloaded: true,
      },
    })
    runOpenClawUpgradeMock.mockResolvedValue({
      ok: true,
      blocked: false,
      currentVersion: '2026.3.24',
      targetVersion: '2026.3.24',
      installSource: 'npm-global',
      backupCreated: null,
      gatewayWasRunning: false,
      gatewayRestored: true,
      warnings: [],
    })
    installCCClawUpdateMock.mockResolvedValue({
      ok: true,
      status: {
        ok: true,
        supported: true,
        configured: true,
        currentVersion: '2.2.0',
        availableVersion: '2.3.0',
        status: 'downloaded',
        progressPercent: 100,
        downloaded: true,
      },
    })
  })

  it('allows combined update only for the optional upgrade to the pinned openclaw version', async () => {
    checkOpenClawUpgradeMock.mockResolvedValue({
      ok: true,
      activeCandidate: null,
      currentVersion: '2026.3.23',
      targetVersion: '2026.3.24',
      latestCheck: null,
      policyState: 'supported_not_target',
      enforcement: 'optional_upgrade',
      targetAction: 'upgrade',
      blocksContinue: false,
      canSelfHeal: true,
      canAutoUpgrade: true,
      upToDate: false,
      gatewayRunning: false,
      warnings: [],
    })

    const result = await checkCombinedUpdate()

    expect(result.canRun).toBe(true)
  })

  it('does not allow combined update for manual_block states', async () => {
    checkOpenClawUpgradeMock.mockResolvedValue({
      ok: false,
      activeCandidate: null,
      currentVersion: '2026.3.25',
      targetVersion: '2026.3.24',
      latestCheck: null,
      policyState: 'above_max',
      enforcement: 'manual_block',
      targetAction: 'downgrade',
      blocksContinue: true,
      canSelfHeal: false,
      canAutoUpgrade: false,
      upToDate: false,
      gatewayRunning: false,
      warnings: [],
      manualHint: '请手动回退到 2026.3.24',
      errorCode: 'manual_only',
    })

    const result = await checkCombinedUpdate()

    expect(result.canRun).toBe(false)
  })

  it('does not allow combined update for startup auto-correction states', async () => {
    checkOpenClawUpgradeMock.mockResolvedValue({
      ok: true,
      activeCandidate: null,
      currentVersion: '2026.3.21',
      targetVersion: '2026.3.24',
      latestCheck: null,
      policyState: 'below_min',
      enforcement: 'auto_correct',
      targetAction: 'upgrade',
      blocksContinue: true,
      canSelfHeal: true,
      canAutoUpgrade: true,
      upToDate: false,
      gatewayRunning: false,
      warnings: [],
    })

    const result = await checkCombinedUpdate()

    expect(result.canRun).toBe(false)
  })

  it('blocks runCombinedUpdate when openclaw is not in the optional-upgrade state', async () => {
    checkOpenClawUpgradeMock.mockResolvedValue({
      ok: false,
      activeCandidate: null,
      currentVersion: '2026.3.25',
      targetVersion: '2026.3.24',
      latestCheck: null,
      policyState: 'above_max',
      enforcement: 'manual_block',
      targetAction: 'downgrade',
      blocksContinue: true,
      canSelfHeal: false,
      canAutoUpgrade: false,
      upToDate: false,
      gatewayRunning: false,
      warnings: [],
      manualHint: '请手动回退到 2026.3.24',
      errorCode: 'manual_only',
    })

    const result = await runCombinedUpdate()

    expect(result.ok).toBe(false)
    expect(result.blocked).toBe(true)
    expect(result.errorCode).toBe('openclaw_blocked')
    expect(runOpenClawUpgradeMock).not.toHaveBeenCalled()
  })
})
