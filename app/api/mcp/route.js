import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { registerCafeKongTools } from '../../../src/register-tools.mjs'

export const runtime = 'nodejs'
export const maxDuration = 60

const baseUrl = (process.env.CAFEKONG_BASE_URL || '').replace(/\/+$/, '')

const handler = createMcpHandler((server) => {
  registerCafeKongTools(server, {
    baseUrl,
    getBotToken: (context) => context.http?.authInfo?.token || '',
  })
}, {
  serverInfo: { name: 'cafekong-bot', version: '0.2.0' },
  instructions: 'Use CafeKong constraint tools before placing wagers. Wager placement and cancellation modify user data and should be confirmed by the user. CafeKong API rate limits are 60 reads and 10 writes per minute per token.',
})

async function verifyToken(_request, bearerToken) {
  if (!baseUrl || !bearerToken) return undefined

  try {
    const response = await fetch(`${baseUrl}/api/bot/me`, {
      headers: {
        authorization: `Bearer ${bearerToken}`,
        accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) return undefined

    const payload = await response.json()
    const bot = payload?.bot

    if (!bot?.user_id || !bot?.token_id || !Array.isArray(bot.scopes)) {
      return undefined
    }

    return {
      token: bearerToken,
      clientId: bot.user_id,
      scopes: bot.scopes,
      extra: {
        tokenId: bot.token_id,
        roundIds: Array.isArray(bot.round_ids) ? bot.round_ids : [],
      },
    }
  } catch {
    return undefined
  }
}

const authenticatedHandler = withMcpAuth(handler, verifyToken, { required: true })

export { authenticatedHandler as GET, authenticatedHandler as POST }
