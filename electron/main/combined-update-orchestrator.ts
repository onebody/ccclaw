import type { CombinedUpdateCheckResult, CombinedUpdateRunResult } from '../../src/shared/openclaw-phase4'
import { checkOpenClawUpgrade, runOpenClawUpgrade } from './openclaw-upgrade-service'
import {
  checkCCClawUpdate,
  downloadCCClawUpdate,
  getCCClawUpdateStatus,
  installCCClawUpdate,
} from './ccclaw-update-service'

function canRunCombinedOpenClawUpgrade(check: CombinedUpdateCheckResult['openclaw']): boolean {
  return (
    check.policyState === 'supported_not_target' &&
    check.enforcement === 'optional_upgrade' &&
    check.targetAction === 'upgrade' &&
    Boolean(check.targetVersion)
  )
}

export async function checkCombinedUpdate(): Promise<CombinedUpdateCheckResult> {
  const openclaw = await checkOpenClawUpgrade()
  const ccclawBase = await getCCClawUpdateStatus()
  const ccclaw =
    ccclawBase.supported && ccclawBase.configured && !ccclawBase.downloaded
      ? await checkCCClawUpdate()
      : ccclawBase

  const warnings = [...openclaw.warnings]
  if (ccclaw.message && (!ccclaw.configured || ccclaw.status === 'error')) {
    warnings.push(ccclaw.message)
  }

  const ccclawReady = ccclaw.status === 'available' || ccclaw.status === 'downloaded'

  return {
    ok: openclaw.ok && ccclaw.ok,
    openclaw,
    ccclaw,
    canRun: canRunCombinedOpenClawUpgrade(openclaw) && ccclaw.supported && ccclaw.configured && ccclawReady,
    warnings,
  }
}

export async function runCombinedUpdate(): Promise<CombinedUpdateRunResult> {
  const check = await checkCombinedUpdate()
  if (!canRunCombinedOpenClawUpgrade(check.openclaw)) {
    return {
      ok: false,
      blocked: true,
      openclawResult: null,
      ccclawStatus: check.ccclaw,
      warnings: check.warnings,
      message: check.openclaw.manualHint || '当前 OpenClaw 不支持自动升级。',
      errorCode: 'openclaw_blocked',
    }
  }

  if (!check.ccclaw.supported || !check.ccclaw.configured) {
    return {
      ok: false,
      blocked: true,
      openclawResult: null,
      ccclawStatus: check.ccclaw,
      warnings: check.warnings,
      message: check.ccclaw.message || 'Ccclaw 自动更新当前不可用。',
      errorCode: 'ccclaw_unavailable',
    }
  }

  let ccclawStatus = check.ccclaw
  if (ccclawStatus.status !== 'downloaded') {
    const downloadResult = await downloadCCClawUpdate()
    ccclawStatus = downloadResult.status
    if (!downloadResult.ok || ccclawStatus.status !== 'downloaded') {
      return {
        ok: false,
        blocked: false,
        openclawResult: null,
        ccclawStatus,
        warnings: check.warnings,
        message: downloadResult.message || 'Ccclaw Lite 更新包下载失败。',
        errorCode: 'ccclaw_download_failed',
      }
    }
  }

  const openclawResult = await runOpenClawUpgrade()
  if (!openclawResult.ok) {
    return {
      ok: false,
      blocked: openclawResult.blocked,
      openclawResult,
      ccclawStatus,
      warnings: [...check.warnings, ...(openclawResult.warnings || [])],
      message: openclawResult.message || 'OpenClaw 升级失败，Ccclaw 更新不会继续安装。',
      errorCode: 'openclaw_upgrade_failed',
    }
  }

  const installResult = await installCCClawUpdate()
  return {
    ok: installResult.ok,
    blocked: false,
    openclawResult,
    ccclawStatus: installResult.status,
    warnings: [...check.warnings, ...(openclawResult.warnings || [])],
    message: installResult.message || 'Ccclaw 即将安装更新。',
  }
}
