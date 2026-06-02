#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod/v4'

const baseUrl = (process.env.CAFEKONG_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const botToken = process.env.CAFEKONG_BOT_TOKEN || ''

if (!botToken) {
  console.error('Missing CAFEKONG_BOT_TOKEN')
  process.exit(1)
}

const server = new McpServer({
  name: 'cafekong-bot',
  version: '0.1.0',
})

function jsonResponse(data) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data,
  }
}

function jsonError(error) {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(error, null, 2),
      },
    ],
    structuredContent: error,
  }
}

async function callCafeKong(path, options = {}) {
  const headers = {
    authorization: `Bearer ${botToken}`,
    accept: 'application/json',
    ...(options.body ? { 'content-type': 'application/json' } : {}),
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
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
    return jsonError({
      status: response.status,
      statusText: response.statusText,
      payload,
    })
  }

  return jsonResponse(payload ?? {})
}

function encodePath(value) {
  return encodeURIComponent(value)
}

const roundInput = {
  roundId: z.string().uuid().describe('CafeKong round id'),
}

server.registerTool('cafekong_bot_me', {
  title: 'CafeKong Bot Identity',
  description: 'Show the authenticated CafeKong bot token identity and scopes.',
}, async () => callCafeKong('/api/bot/me'))

server.registerTool('cafekong_list_rounds', {
  title: 'CafeKong List Rounds',
  description: 'List rounds visible to the bot token.',
}, async () => callCafeKong('/api/bot/rounds'))

server.registerTool('cafekong_get_round_state', {
  title: 'CafeKong Round State',
  description: 'Load round, matches, odds context, and current user round state.',
  inputSchema: roundInput,
}, async ({ roundId }) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/state`))

server.registerTool('cafekong_get_wallet', {
  title: 'CafeKong Wallet',
  description: 'Load wallet balance, history, ledger, and coin ledger for a round.',
  inputSchema: roundInput,
}, async ({ roundId }) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/wallet`))

server.registerTool('cafekong_get_coins', {
  title: 'CafeKong Coins',
  description: 'Load double-quote coin balance and recent coin activity for a round.',
  inputSchema: roundInput,
}, async ({ roundId }) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/coins`))

server.registerTool('cafekong_list_wagers', {
  title: 'CafeKong Match Wagers',
  description: 'List the bot user match wagers for a round.',
  inputSchema: roundInput,
}, async ({ roundId }) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/wagers`))

server.registerTool('cafekong_get_match_wager_constraints', {
  title: 'CafeKong Match Wager Constraints',
  description: 'Check whether and how the bot user may place a wager for one match.',
  inputSchema: {
    roundId: z.string().uuid(),
    matchId: z.string().uuid(),
  },
}, async ({ roundId, matchId }) =>
  callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/matches/${encodePath(matchId)}/wager-constraints`)
)

server.registerTool('cafekong_place_match_wager', {
  title: 'CafeKong Place Match Wager',
  description: 'Place or replace a normal match wager or combo wager under the normal CafeKong rules.',
  inputSchema: {
    roundId: z.string().uuid(),
    matchId: z.string().uuid(),
    selection: z.enum(['home_win', 'draw', 'away_win']),
    stake: z.number().int().min(1).max(1_000_000),
    comboMarketType: z.enum(['totals_2_5']).optional(),
    comboSelection: z.enum(['over', 'under']).optional(),
    useDoubleQuoteCoin: z.boolean().optional(),
  },
}, async (input) =>
  callCafeKong(`/api/bot/rounds/${encodePath(input.roundId)}/wagers`, {
    method: 'POST',
    body: input,
  })
)

server.registerTool('cafekong_cancel_match_wager', {
  title: 'CafeKong Cancel Match Wager',
  description: 'Cancel an active match wager owned by the bot user if normal rules allow it.',
  inputSchema: {
    roundId: z.string().uuid(),
    wagerId: z.string().uuid(),
  },
}, async ({ roundId, wagerId }) =>
  callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/wagers/${encodePath(wagerId)}`, {
    method: 'DELETE',
  })
)

server.registerTool('cafekong_list_bonus_markets', {
  title: 'CafeKong Bonus Markets',
  description: 'List available bonus markets for a round.',
  inputSchema: roundInput,
}, async ({ roundId }) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-markets`))

server.registerTool('cafekong_list_bonus_wagers', {
  title: 'CafeKong Bonus Wagers',
  description: 'List the bot user bonus wagers for a round.',
  inputSchema: roundInput,
}, async ({ roundId }) => callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-wagers`))

server.registerTool('cafekong_get_bonus_wager_constraints', {
  title: 'CafeKong Bonus Wager Constraints',
  description: 'Check whether and how the bot user may place a bonus wager for one market.',
  inputSchema: {
    roundId: z.string().uuid(),
    marketId: z.string().uuid(),
  },
}, async ({ roundId, marketId }) =>
  callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-markets/${encodePath(marketId)}/constraints`)
)

server.registerTool('cafekong_place_bonus_wager', {
  title: 'CafeKong Place Bonus Wager',
  description: 'Place or replace a bonus wager under the normal CafeKong rules.',
  inputSchema: {
    roundId: z.string().uuid(),
    marketId: z.string().uuid(),
    optionId: z.string().uuid(),
    stake: z.number().int().min(1).max(1_000_000),
  },
}, async (input) =>
  callCafeKong(`/api/bot/rounds/${encodePath(input.roundId)}/bonus-wagers`, {
    method: 'POST',
    body: input,
  })
)

server.registerTool('cafekong_cancel_bonus_wager', {
  title: 'CafeKong Cancel Bonus Wager',
  description: 'Cancel an active bonus wager owned by the bot user if normal rules allow it.',
  inputSchema: {
    roundId: z.string().uuid(),
    wagerId: z.string().uuid(),
  },
}, async ({ roundId, wagerId }) =>
  callCafeKong(`/api/bot/rounds/${encodePath(roundId)}/bonus-wagers/${encodePath(wagerId)}`, {
    method: 'DELETE',
  })
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`CafeKong MCP server connected to ${baseUrl}`)
