const personalTokenPrefix = 'ckbot_'

async function fetchJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, {
    ...options,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) return null
  return response.json()
}

export function createCafeKongTokenVerifier({ baseUrl, oauthExchangeSecret, fetchImpl = fetch }) {
  return async function verifyToken(_request, bearerToken) {
    if (!baseUrl || !bearerToken) return undefined

    try {
      if (bearerToken.startsWith(personalTokenPrefix)) {
        const payload = await fetchJson(fetchImpl, `${baseUrl}/api/bot/me`, {
          headers: {
            authorization: `Bearer ${bearerToken}`,
            accept: 'application/json',
          },
        })
        const bot = payload?.bot

        if (!bot?.user_id || !bot?.token_id || !Array.isArray(bot.scopes)) return undefined

        return {
          token: bearerToken,
          clientId: bot.user_id,
          scopes: bot.scopes,
          extra: {
            tokenId: bot.token_id,
            roundIds: Array.isArray(bot.round_ids) ? bot.round_ids : [],
            authType: 'personal_token',
          },
        }
      }

      if (!oauthExchangeSecret) return undefined

      const payload = await fetchJson(fetchImpl, `${baseUrl}/api/mcp/oauth/exchange`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${bearerToken}`,
          'x-cafekong-mcp-secret': oauthExchangeSecret,
          accept: 'application/json',
        },
      })
      const bot = payload?.bot

      if (!payload?.delegation_token || !bot?.user_id || !bot?.client_id || !bot?.oauth_grant_id || !Array.isArray(bot.scopes)) {
        return undefined
      }

      return {
        token: payload.delegation_token,
        clientId: bot.client_id,
        scopes: bot.scopes,
        expiresAt: Math.floor(Date.now() / 1000) + Number(payload.expires_in || 0),
        extra: {
          userId: bot.user_id,
          oauthGrantId: bot.oauth_grant_id,
          roundIds: Array.isArray(bot.round_ids) ? bot.round_ids : [],
          authType: 'oauth',
        },
      }
    } catch {
      return undefined
    }
  }
}
