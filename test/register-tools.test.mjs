import assert from 'node:assert/strict'
import test from 'node:test'
import { registerCafeKongTools } from '../src/register-tools.mjs'

function registeredTools() {
  const tools = new Map()
  const server = {
    registerTool(name, definition, handler) {
      tools.set(name, { definition, handler })
    },
  }

  registerCafeKongTools(server, {
    baseUrl: 'https://cafekong.example.com/',
    getBotToken: (context) => context.http?.authInfo?.token || '',
  })

  return tools
}

test('registers all CafeKong tools with write annotations', () => {
  const tools = registeredTools()

  assert.equal(tools.size, 14)
  assert.equal(tools.get('cafekong_get_wallet').definition.annotations.readOnlyHint, true)
  assert.equal(tools.get('cafekong_place_match_wager').definition.annotations.readOnlyHint, false)
  assert.equal(tools.get('cafekong_place_match_wager').definition.annotations.destructiveHint, true)
})

test('parameterless tools forward the request-scoped bearer token', async (context) => {
  const tools = registeredTools()
  const originalFetch = globalThis.fetch
  let observedRequest

  context.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (url, options) => {
    observedRequest = { url, options }
    return Response.json({ bot: { user_id: 'user-1' } })
  }

  const result = await tools.get('cafekong_bot_me').handler({
    http: { authInfo: { token: 'ckbot_request_scoped' } },
  })

  assert.equal(observedRequest.url, 'https://cafekong.example.com/api/bot/me')
  assert.equal(observedRequest.options.headers.authorization, 'Bearer ckbot_request_scoped')
  assert.equal(result.isError, undefined)
  assert.equal(JSON.parse(result.content[0].text).bot.user_id, 'user-1')
})

test('write tools forward method, path and body', async (context) => {
  const tools = registeredTools()
  const originalFetch = globalThis.fetch
  let observedRequest

  context.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (url, options) => {
    observedRequest = { url, options }
    return Response.json({ wager: { id: 'wager-1' } })
  }

  const input = {
    roundId: '00000000-0000-4000-8000-000000000001',
    matchId: '00000000-0000-4000-8000-000000000002',
    selection: 'home_win',
    stake: 10,
  }

  const result = await tools.get('cafekong_place_match_wager').handler(input, {
    http: { authInfo: { token: 'ckbot_request_scoped' } },
  })

  assert.equal(
    observedRequest.url,
    'https://cafekong.example.com/api/bot/rounds/00000000-0000-4000-8000-000000000001/wagers',
  )
  assert.equal(observedRequest.options.method, 'POST')
  assert.deepEqual(JSON.parse(observedRequest.options.body), input)
  assert.equal(JSON.parse(result.content[0].text).wager.id, 'wager-1')
})

test('read tools expose and forward compact filters', async (context) => {
  const tools = registeredTools()
  const originalFetch = globalThis.fetch
  const observedUrls = []

  context.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (url) => {
    observedUrls.push(url)
    return Response.json({ ok: true })
  }

  const roundId = '00000000-0000-4000-8000-000000000001'
  const matchId = '00000000-0000-4000-8000-000000000002'
  const stageId = '00000000-0000-4000-8000-000000000003'
  const participantId = '00000000-0000-4000-8000-000000000004'

  await tools.get('cafekong_get_round_state').handler({
    roundId,
    matchState: 'upcoming',
    matchIds: [matchId],
    matchday: 5,
    stageId,
    participantId,
    kickoffFrom: '2026-10-22T00:00:00.000Z',
    kickoffTo: '2026-10-23T00:00:00.000Z',
    bettingState: 'open',
    includeOdds: false,
    limit: 10,
    offset: 20,
  }, { http: { authInfo: { token: 'ckbot_request_scoped' } } })
  await tools.get('cafekong_list_wagers').handler({
    roundId,
    status: 'settled',
    pricingStatus: 'priced',
    matchId,
    limit: 25,
    offset: 50,
  }, { http: { authInfo: { token: 'ckbot_request_scoped' } } })
  await tools.get('cafekong_get_coins').handler({
    roundId,
    limit: 20,
    offset: 40,
  }, { http: { authInfo: { token: 'ckbot_request_scoped' } } })
  await tools.get('cafekong_list_bonus_markets').handler({
    roundId,
    marketState: 'settled',
    marketId: matchId,
    limit: 10,
    offset: 20,
  }, { http: { authInfo: { token: 'ckbot_request_scoped' } } })

  assert.equal(
    observedUrls[0],
    `https://cafekong.example.com/api/bot/rounds/${roundId}/state?matchState=upcoming&matchIds=${matchId}&matchday=5&stageId=${stageId}&participantId=${participantId}&kickoffFrom=2026-10-22T00%3A00%3A00.000Z&kickoffTo=2026-10-23T00%3A00%3A00.000Z&bettingState=open&includeOdds=false&limit=10&offset=20`,
  )
  assert.equal(
    observedUrls[1],
    `https://cafekong.example.com/api/bot/rounds/${roundId}/wagers?status=settled&pricingStatus=priced&matchId=${matchId}&limit=25&offset=50`,
  )
  assert.equal(
    observedUrls[2],
    `https://cafekong.example.com/api/bot/rounds/${roundId}/coins?view=compact&limit=20&offset=40`,
  )
  assert.equal(
    observedUrls[3],
    `https://cafekong.example.com/api/bot/rounds/${roundId}/bonus-markets?view=compact&marketState=settled&marketId=${matchId}&limit=10&offset=20`,
  )
})
