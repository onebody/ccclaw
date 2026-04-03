export interface CcclawProviderAuthRouteLike {
  kind?: string | null
  providerId?: string | null
  pluginId?: string | null
  requiresBrowser?: boolean
  requiresSecret?: boolean
}

export interface CcclawProviderAuthMethodLike {
  id?: string | null
  kind?: string | null
  route?: CcclawProviderAuthRouteLike | null
}

export type CcclawProviderAuthPersistenceStrategy =
  | {
      kind: 'openclaw-auth-route'
    }

export function resolveCcclawProviderAuthPersistenceStrategy(
  _providerId: string,
  _method?: CcclawProviderAuthMethodLike | null
): CcclawProviderAuthPersistenceStrategy {
  return { kind: 'openclaw-auth-route' }
}

export function usesEnvBackedApiKeyPersistence(
  _providerId: string,
  _method?: CcclawProviderAuthMethodLike | null
): boolean {
  return false
}
