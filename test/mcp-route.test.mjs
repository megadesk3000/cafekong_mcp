import assert from 'node:assert/strict'
import test from 'node:test'

process.env.CAFEKONG_BASE_URL = 'https://cafekong.test'

let authCalls = 0
globalThis.fetch = async (_url, options) => {
  authCalls += 1
  if (options.headers.authorization === 'Bearer ckbot_invalid') return new Response(null, { status: 401 })
  if (/client_[ab]$/.test(options.headers.authorization)) {
    const identity = options.headers.authorization.endsWith('client_a') ? 'client-a' : 'client-b'
    await new Promise(resolve => setTimeout(resolve, identity === 'client-a' ? 15 : 1))
    return Response.json({ bot: { user_id: identity, token_id: identity, scopes: ['bot:round:read'], round_ids: [] } })
  }
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


test('rejects oversized POST bodies before JSON parsing, including chunked bodies', async () => {
  for (const contentLength of [undefined, '1', String(2 * 1024 * 1024)]) {
    const headers = {
      authorization: 'Bearer ckbot_test',
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    }
    if (contentLength) headers['content-length'] = contentLength
    const response = await POST(new Request('https://mcp.cafekong.de/api/mcp', {
      method: 'POST', headers,
      body: new ReadableStream({
        start(controller) {
          for (let index = 0; index < 17; index += 1) controller.enqueue(new Uint8Array(65536))
          controller.close()
        },
      }),
      duplex: 'half',
    }))
    assert.equal(response.status, 413)
  }
})

test('invalid bearer tokens fail closed', async () => {
  const response = await post({ jsonrpc: '2.0', id: 10, method: 'tools/list' }, 'Bearer ckbot_invalid')
  assert.equal(response.status, 401)
})

test('simultaneous tool calls with identical RPC ids retain separate user identities', async () => {
  const body = { jsonrpc: '2.0', id: 11, method: 'tools/call', params: { name: 'cafekong_bot_me', arguments: {} } }
  const responses = await Promise.all([
    post(body, 'Bearer ckbot_client_a'),
    post(body, 'Bearer ckbot_client_b'),
  ])
  assert.deepEqual(responses.map(response => response.status), [200, 200])
  const results = await Promise.all(responses.map(response => response.text()))
  assert.match(results[0], /client-a/)
  assert.doesNotMatch(results[0], /client-b/)
  assert.match(results[1], /client-b/)
  assert.doesNotMatch(results[1], /client-a/)
})

test('oversized RPC batches are rejected by the updated SDK', async () => {
  const response = await post(Array.from({ length: 101 }, (_, id) => ({ jsonrpc: '2.0', id, method: 'tools/list' })))
  assert.equal(response.status, 400)
})
