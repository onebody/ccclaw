import type { OpenClawInstallCandidate, OpenClawLatestVersionCheckResult } from './openclaw-phase1'
import type { OpenClawBackupEntry } from './openclaw-phase3'
import type {
  OpenClawVersionEnforcement,
  OpenClawVersionPolicyState,
  OpenClawVersionTargetAction,
} from './openclaw-version-policy'

export interface OpenClawUpgradeCheckResult {
  ok: boolean
  activeCandidate: OpenClawInstallCandidate | null
  currentVersion: string | null
  targetVersion: string | null
  latestCheck: OpenClawLatestVersionCheckResult | null
  policyState: OpenClawVersionPolicyState | null
  enforcement: OpenClawVersionEnforcement | null
  targetAction: OpenClawVersionTargetAction
  blocksContinue: boolean
  canSelfHeal: boolean
  canAutoUpgrade: boolean
  upToDate: boolean
  gatewayRunning: boolean
  warnings: string[]
  manualHint?: string
  errorCode?: 'not_installed' | 'latest_unknown' | 'manual_only'
}

export interface OpenClawUpgradeRunResult {
  ok: boolean
  blocked: boolean
  currentVersion: string | null
  targetVersion: string | null
  installSource: OpenClawInstallCandidate['installSource'] | null
  backupCreated: OpenClawBackupEntry | null
  gatewayWasRunning: boolean
  gatewayRestored: boolean
  warnings: string[]
  message?: string
  errorCode?:
    | 'not_installed'
    | 'latest_unknown'
    | 'manual_only'
    | 'snapshot_failed'
    | 'lifecycle_failed_environment_repaired'
    | 'post_repair_failed_after_lifecycle'
    | 'post_repair_verification_failed'
    | 'upgrade_failed'
}

export type CCClawUpdateStatusState =
  | 'disabled'
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'error'

export type CCClawUpdateErrorCode =
  | 'network'
  | 'metadata_missing'
  | 'signature_invalid'
  | 'no_update'
  | 'unsupported'
  | 'not_configured'
  | 'invalid_download_url'
  | 'unknown'

export interface CCClawUpdateStatus {
  ok: boolean
  supported: boolean
  configured: boolean
  currentVersion: string
  availableVersion: string | null
  manualDownloadUrl?: string
  releaseDate?: string
  releaseNotes?: string
  feedUrl?: string
  status: CCClawUpdateStatusState
  progressPercent: number | null
  downloaded: boolean
  message?: string
  error?: string
  errorCode?: CCClawUpdateErrorCode
}

export interface CCClawUpdateActionResult {
  ok: boolean
  status: CCClawUpdateStatus
  message?: string
  error?: string
  errorCode?: CCClawUpdateErrorCode
  willQuitAndInstall?: boolean
}

export interface CCClawUpdateOpenDownloadResult extends CCClawUpdateActionResult {
  openedUrl?: string
}

export interface CombinedUpdateCheckResult {
  ok: boolean
  openclaw: OpenClawUpgradeCheckResult
  ccclaw: CCClawUpdateStatus
  canRun: boolean
  warnings: string[]
}

export interface CombinedUpdateRunResult {
  ok: boolean
  blocked: boolean
  openclawResult: OpenClawUpgradeRunResult | null
  ccclawStatus: CCClawUpdateStatus
  warnings: string[]
  message?: string
  errorCode?: 'openclaw_blocked' | 'ccclaw_unavailable' | 'ccclaw_download_failed' | 'openclaw_upgrade_failed'
}
