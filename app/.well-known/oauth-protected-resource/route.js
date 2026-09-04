import { protectedResourceHandler } from 'mcp-handler'

const issuer = (process.env.CAFEKONG_OAUTH_ISSUER || '').replace(/\/+$/, '')
const resourceUrl = (process.env.MCP_RESOURCE_URL || 'https://mcp.cafekong.de/api/mcp').replace(/\/+$/, '')

const handler = protectedResourceHandler({
  authServerUrls: issuer ? [issuer] : [],
  resourceUrl,
})

export { handler as GET }
