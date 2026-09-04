#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { registerCafeKongTools } from './register-tools.mjs'

const baseUrl = (process.env.CAFEKONG_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const botToken = process.env.CAFEKONG_BOT_TOKEN || ''

if (!botToken) {
  console.error('Missing CAFEKONG_BOT_TOKEN')
  process.exit(1)
}

const server = new McpServer({ name: 'cafekong-bot', version: '0.2.0' })

registerCafeKongTools(server, {
  baseUrl,
  getBotToken: () => botToken,
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`CafeKong MCP stdio server connected to ${baseUrl}`)
