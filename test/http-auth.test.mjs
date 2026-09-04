import assert from 'node:assert/strict'
import test from 'node:test'
import { createCafeKongTokenVerifier } from '../src/http-auth.mjs'

test('personal tokens keep using the existing bot identity endpoint', async () => {
  const requests = []
  const verify = createCafeKongTokenVerifier({
    baseUrl: 'https://cafekong.test',
    oauthExchangeSecret: 'shared-secret',
    fetchImpl: async (url, options) => {
      requests.push({ url, options })
      return Response.json({
        bot: { user_id: 'user-1', token_id: 'token-1', scopes: ['bot:round:read'], round_ids: null },
      })
    },
  })

  const result = await verify(new Request('https://mcp.test/api/mcp'), 'ckbot_personal')
  assert.equal(requests[0].url, 'https://cafekong.test/api/bot/me')
  assert.equal(result.token, 'ckbot_personal')
  assert.equal(result.extra.authType, 'personal_token')
})

test('OAuth access tokens are exchanged and never forwarded to bot tools', async () => {
  const requests = []
  const verify = createCafeKongTokenVerifier({
    baseUrl: 'https://cafekong.test',
    oauthExchangeSecret: 'shared-secret',
    fetchImpl: async (url, options) => {
      requests.push({ url, options })
      return Response.json({
        delegation_token: 'ckmcp_delegated',
        expires_in: 300,
        bot: {
          user_id: 'user-1',
          client_id: 'claude-client',
          oauth_grant_id: 'grant-1',
          scopes: ['bot:round:read'],
          round_ids: null,
        },
      })
    },
  })

  const result = await verify(new Request('https://mcp.test/api/mcp'), 'supabase-oauth-token')
  assert.equal(requests[0].url, 'https://cafekong.test/api/mcp/oauth/exchange')
  assert.equal(requests[0].options.headers.authorization, 'Bearer supabase-oauth-token')
  assert.equal(result.token, 'ckmcp_delegated')
  assert.equal(result.clientId, 'claude-client')
  assert.equal(result.extra.authType, 'oauth')
})
