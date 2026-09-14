import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { registerCafeKongTools } from '../../../src/register-tools.mjs'
import { createCafeKongTokenVerifier } from '../../../src/http-auth.mjs'

export const runtime = 'nodejs'
export const maxDuration = 60

const baseUrl = (process.env.CAFEKONG_BASE_URL || '').replace(/\/+$/, '')
const resourceUrl = (process.env.MCP_RESOURCE_URL || 'https://mcp.cafekong.de/api/mcp').replace(/\/+$/, '')

const mcpHandler = createMcpHandler((server) => {
  registerCafeKongTools(server, {
    baseUrl,
    getBotToken: (context) => context.http?.authInfo?.token || '',
  })
}, {
  serverInfo: { name: 'cafekong-bot', version: '0.2.0' },
  // The tool catalog is fixed for the lifetime of a deployment.
  capabilities: { tools: { listChanged: false } },
  instructions: 'Use CafeKong constraint tools before placing wagers. Wager placement and cancellation modify user data and should be confirmed by the user. CafeKong API rate limits are 60 reads and 10 writes per minute per token.',
})

async function handler(request) {
  if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
    const body = await request.clone().json().catch(() => null)
    if (body && !Array.isArray(body) && body.method === 'subscriptions/listen') {
      // This server has no live change notifications. Rejecting the unused
      // stream prevents Vercel from holding an invocation until its timeout.
      return Response.json({
        jsonrpc: '2.0',
        id: body.id ?? null,
        error: { code: -32601, message: 'Method not found' },
      }, { status: 404 })
    }
  }

  return mcpHandler(request)
}

const verifyToken = createCafeKongTokenVerifier({
  baseUrl,
  oauthExchangeSecret: process.env.CAFEKONG_MCP_SERVICE_SECRET || '',
})

const authenticatedHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceUrl: new URL(resourceUrl).origin,
})

export { authenticatedHandler as GET, authenticatedHandler as POST }
