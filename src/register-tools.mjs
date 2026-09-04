import { z } from 'zod/v4'

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
}

const WRITES_DATA = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: true,
}

function jsonResponse(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  }
}

function jsonError(error) {
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(error, null, 2) }],
    structuredContent: error,
  }
}

function encodePath(value) {
  return encodeURIComponent(value)
}

const roundInput = z.object({
  roundId: z.string().uuid().describe('CafeKong round id'),
})

export function registerCafeKongTools(server, { baseUrl, getBotToken }) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')

  async function callCafeKong(path, context, options = {}) {
    const botToken = getBotToken(context)

    if (!botToken) {
      return jsonError({
        status: 401,
        statusText: 'Unauthorized',
        payload: { message: 'CafeKong bot authentication required' },
      })
    }

    try {
      const response = await fetch(`${normalizedBaseUrl}${path}`, {
        method: options.method || 'GET',
        headers: {
          authorization: `Bearer ${botToken}`,
          accept: 'application/json',
          ...(options.body ? { 'content-type': 'application/json' } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(30_000),
      })

      const text = await response.text()
      let payload = null

      if (text) {
        try {
          payload = JSON.parse(text)
        } catch {
          payload = { raw: text }
        }
      }

      if (!response.ok) {
        return jsonError({ status: response.status, statusText: response.statusText, payload })
      }

      return jsonResponse(payload ?? {})
    } catch (error) {
      return jsonError({
        status: 502,
        statusText: 'Bad Gateway',
        payload: {
          message: 'CafeKong API request failed',
          error: error instanceof Error ? error.message : String(error),
        },
      })
    }
  }

  server.registerTool('cafekong_bot_me', {
    title: 'CafeKong Bot Identity',
    description: 'Show the authenticated CafeKong bot token identity and scopes.',
    annotations: READ_ONLY,
  }, async (context) => callCafeKong('/api/bot/me', context))

  server.registerTool('cafekong_list_rounds', {
    title: 'CafeKong List Rounds',
    description: 'List rounds visible to the bot token.',
    annotations: READ_ONLY,
  }, async (context) => callCafeKong('/api/bot/rounds', context))

  server.registerTool('cafekong_get_round_state', {
    title: 'CafeKong Round State',
    description: 'Load round, matches, odds context, and current user round state.',
    inputSchema: roundInput,
    annotations: READ_ONLY,
  }, async ({ roundId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/state`, context))

  server.registerTool('cafekong_get_wallet', {
    title: 'CafeKong Wallet',
    description: 'Load wallet balance, history, ledger, and coin ledger for a round.',
    inputSchema: roundInput,
    annotations: READ_ONLY,
  }, async ({ roundId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/wallet`, context))

  server.registerTool('cafekong_get_coins', {
    title: 'CafeKong Coins',
    description: 'Load double-quote coin balance and recent coin activity for a round.',
    inputSchema: roundInput,
    annotations: READ_ONLY,
  }, async ({ roundId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/coins`, context))

  server.registerTool('cafekong_list_wagers', {
    title: 'CafeKong Match Wagers',
    description: 'List the bot user match wagers for a round.',
    inputSchema: roundInput,
    annotations: READ_ONLY,
  }, async ({ roundId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/wagers`, context))

  server.registerTool('cafekong_get_match_wager_constraints', {
    title: 'CafeKong Match Wager Constraints',
    description: 'Check whether and how the bot user may place a wager for one match.',
    inputSchema: z.object({ roundId: z.string().uuid(), matchId: z.string().uuid() }),
    annotations: READ_ONLY,
  }, async ({ roundId, matchId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/matches/${encodePath(matchId)}/wager-constraints`, context))

  server.registerTool('cafekong_place_match_wager', {
    title: 'CafeKong Place Match Wager',
    description: 'Place or replace a normal match wager or combo wager under the normal CafeKong rules.',
    inputSchema: z.object({
      roundId: z.string().uuid(),
      matchId: z.string().uuid(),
      selection: z.enum(['home_win', 'draw', 'away_win']),
      stake: z.number().int().min(1).max(1_000_000),
      comboMarketType: z.enum(['totals_2_5']).optional(),
      comboSelection: z.enum(['over', 'under']).optional(),
      useDoubleQuoteCoin: z.boolean().optional(),
    }),
    annotations: WRITES_DATA,
  }, async (input, context) => callCafeKong(`/api/bot/rounds/${encodePath(input.roundId)}/wagers`, context, { method: 'POST', body: input }))

  server.registerTool('cafekong_cancel_match_wager', {
    title: 'CafeKong Cancel Match Wager',
    description: 'Cancel an active match wager owned by the bot user if normal rules allow it.',
    inputSchema: z.object({ roundId: z.string().uuid(), wagerId: z.string().uuid() }),
    annotations: WRITES_DATA,
  }, async ({ roundId, wagerId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/wagers/${encodePath(wagerId)}`, context, { method: 'DELETE' }))

  server.registerTool('cafekong_list_bonus_markets', {
    title: 'CafeKong Bonus Markets',
    description: 'List available bonus markets for a round.',
    inputSchema: roundInput,
    annotations: READ_ONLY,
  }, async ({ roundId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-markets`, context))

  server.registerTool('cafekong_list_bonus_wagers', {
    title: 'CafeKong Bonus Wagers',
    description: 'List the bot user bonus wagers for a round.',
    inputSchema: roundInput,
    annotations: READ_ONLY,
  }, async ({ roundId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-wagers`, context))

  server.registerTool('cafekong_get_bonus_wager_constraints', {
    title: 'CafeKong Bonus Wager Constraints',
    description: 'Check whether and how the bot user may place a bonus wager for one market.',
    inputSchema: z.object({ roundId: z.string().uuid(), marketId: z.string().uuid() }),
    annotations: READ_ONLY,
  }, async ({ roundId, marketId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-markets/${encodePath(marketId)}/constraints`, context))

  server.registerTool('cafekong_place_bonus_wager', {
    title: 'CafeKong Place Bonus Wager',
    description: 'Place or replace a bonus wager under the normal CafeKong rules.',
    inputSchema: z.object({
      roundId: z.string().uuid(),
      marketId: z.string().uuid(),
      optionId: z.string().uuid(),
      stake: z.number().int().min(1).max(1_000_000),
    }),
    annotations: WRITES_DATA,
  }, async (input, context) => callCafeKong(`/api/bot/rounds/${encodePath(input.roundId)}/bonus-wagers`, context, { method: 'POST', body: input }))

  server.registerTool('cafekong_cancel_bonus_wager', {
    title: 'CafeKong Cancel Bonus Wager',
    description: 'Cancel an active bonus wager owned by the bot user if normal rules allow it.',
    inputSchema: z.object({ roundId: z.string().uuid(), wagerId: z.string().uuid() }),
    annotations: WRITES_DATA,
  }, async ({ roundId, wagerId }, context) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-wagers/${encodePath(wagerId)}`, context, { method: 'DELETE' }))
}
