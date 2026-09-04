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
  assert.equal(result.structuredContent.bot.user_id, 'user-1')
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
  assert.equal(result.structuredContent.wager.id, 'wager-1')
})
