import assert from 'node:assert/strict'
import test from 'node:test'

process.env.CAFEKONG_BASE_URL = 'https://cafekong.test'

let authCalls = 0
globalThis.fetch = async () => {
  authCalls += 1
  return Response.json({
    bot: { user_id: 'user-1', token_id: 'token-1', scopes: ['bot:round:read'], round_ids: [] },
  })
}

const { POST } = await import('../app/api/mcp/route.js')

function post(body, authorization = 'Bearer ckbot_test') {
  return POST(new Request('https://mcp.cafekong.de/api/mcp', {
    method: 'POST',
    headers: {
      authorization,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  }))
}

test('unused listen subscription returns immediately while auth remains required', async () => {
  const listen = { jsonrpc: '2.0', id: 7, method: 'subscriptions/listen', params: { notifications: { toolsListChanged: true } } }
  const rejected = await post(listen)
  assert.equal(rejected.status, 404)
  assert.deepEqual(await rejected.json(), {
    jsonrpc: '2.0',
    id: 7,
    error: { code: -32601, message: 'Method not found' },
  })
  assert.equal(authCalls, 1)

  const unauthorized = await post(listen, '')
  assert.equal(unauthorized.status, 401)
  assert.equal(authCalls, 1)
})

test('authenticated tool listing still works', async () => {
  const response = await post({ jsonrpc: '2.0', id: 8, method: 'tools/list', params: {} })
  assert.equal(response.status, 200)
  const body = await response.text()
  assert.match(body, /cafekong_bot_me/)
  assert.match(body, /cafekong_place_match_wager/)
})

test('initialization advertises the fixed tool catalog', async () => {
  const response = await post({
    jsonrpc: '2.0',
    id: 9,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  })
  assert.equal(response.status, 200)
  assert.match(await response.text(), /"tools":\{"listChanged":false\}/)
})
