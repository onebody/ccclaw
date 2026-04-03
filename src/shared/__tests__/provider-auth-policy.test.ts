import { describe, expect, it } from 'vitest'
import {
  resolveCcclawProviderAuthPersistenceStrategy,
  usesEnvBackedApiKeyPersistence,
} from '../provider-auth-policy'

describe('provider-auth-policy', () => {
  it('routes secret-backed onboard api-key methods through the official OpenClaw auth path', () => {
    expect(
      resolveCcclawProviderAuthPersistenceStrategy('openai', {
        id: 'openai-api-key',
        kind: 'apiKey',
        route: {
          kind: 'onboard',
          requiresSecret: true,
        },
      })
    ).toEqual({
      kind: 'openclaw-auth-route',
    })
  })

  it('routes grouped api-key variants through the official OpenClaw auth path', () => {
    expect(
      resolveCcclawProviderAuthPersistenceStrategy('zai', {
        id: 'zai-coding-global',
        kind: 'apiKey',
        route: {
          kind: 'onboard',
          requiresSecret: true,
        },
      })
    ).toEqual({
      kind: 'openclaw-auth-route',
    })
  })

  it('does not treat browser oauth routes as env-file persistence', () => {
    expect(
      usesEnvBackedApiKeyPersistence('openai', {
        id: 'openai-codex',
        kind: 'oauth',
        route: {
          kind: 'models-auth-login',
          requiresBrowser: true,
        },
      })
    ).toBe(false)
  })

  it('does not treat unmapped api-key methods as env-file persistence', () => {
    expect(
      resolveCcclawProviderAuthPersistenceStrategy('custom-enterprise', {
        id: 'custom-enterprise-api-key',
        kind: 'apiKey',
        route: {
          kind: 'onboard',
          requiresSecret: true,
        },
      })
    ).toEqual({
      kind: 'openclaw-auth-route',
    })
  })

  it('does not treat grouped auth choices with a different route provider as env-file persistence', () => {
    expect(
      resolveCcclawProviderAuthPersistenceStrategy('moonshot', {
        id: 'kimi-code-api-key',
        kind: 'apiKey',
        route: {
          kind: 'onboard',
          providerId: 'kimi',
          requiresSecret: true,
        },
      })
    ).toEqual({
      kind: 'openclaw-auth-route',
    })
  })

  it('does not treat plugin-backed onboard api-key methods as env-file persistence', () => {
    expect(
      resolveCcclawProviderAuthPersistenceStrategy('openai', {
        id: 'openai-api-key',
        kind: 'apiKey',
        route: {
          kind: 'onboard',
          providerId: 'openai',
          pluginId: 'synthetic-openai-plugin',
          requiresSecret: true,
        },
      })
    ).toEqual({
      kind: 'openclaw-auth-route',
    })
  })
})
