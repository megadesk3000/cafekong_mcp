# CafeKong MCP Server

Lokaler MCP-Adapter für CafeKong Bot-Tokens.

Der Server enthält keine CafeKong-App-Logik und keinen Datenbankzugriff. Er spricht nur mit der offiziellen CafeKong Bot-API über `CAFEKONG_BASE_URL` und `CAFEKONG_BOT_TOKEN`.

## Voraussetzungen

- Node.js 20 oder neuer
- Ein CafeKong Account, der in mindestens einer Runde für MCP freigeschaltet ist
- Ein Bot-Token aus dem CafeKong Profil

## Installation

```bash
npm install
```

## Lokaler Start

```bash
CAFEKONG_BASE_URL=https://cafekong.example.com \
CAFEKONG_BOT_TOKEN=ckbot_... \
npm start
```

Für lokale Entwicklung gegen CafeKong auf deinem Rechner:

```bash
CAFEKONG_BASE_URL=http://localhost:3000 \
CAFEKONG_BOT_TOKEN=ckbot_... \
npm start
```

Der Server ist ein stdio-MCP-Server. Er wird normalerweise nicht direkt im Terminal bedient, sondern von einem MCP-Client gestartet.

## Beispiel: MCP-Client-Konfiguration

```json
{
  "mcpServers": {
    "cafekong": {
      "command": "npm",
      "args": ["start", "--silent"],
      "cwd": "/Users/you/Develop/cafekong_mcp",
      "env": {
        "CAFEKONG_BASE_URL": "https://cafekong.example.com",
        "CAFEKONG_BOT_TOKEN": "ckbot_..."
      }
    }
  }
}
```

Alternativ direkt mit Node:

```json
{
  "mcpServers": {
    "cafekong": {
      "command": "node",
      "args": ["/Users/you/Develop/cafekong_mcp/src/server.mjs"],
      "env": {
        "CAFEKONG_BASE_URL": "https://cafekong.example.com",
        "CAFEKONG_BOT_TOKEN": "ckbot_..."
      }
    }
  }
}
```

## Tools

- `cafekong_bot_me`
- `cafekong_list_rounds`
- `cafekong_get_round_state`
- `cafekong_get_wallet`
- `cafekong_get_coins`
- `cafekong_list_wagers`
- `cafekong_get_match_wager_constraints`
- `cafekong_place_match_wager`
- `cafekong_cancel_match_wager`
- `cafekong_list_bonus_markets`
- `cafekong_list_bonus_wagers`
- `cafekong_get_bonus_wager_constraints`
- `cafekong_place_bonus_wager`
- `cafekong_cancel_bonus_wager`

## Sicherheit

- Den Bot-Token nicht committen.
- `.env` ist absichtlich ignoriert.
- Token können im CafeKong Profil widerrufen werden.
- Runde und User müssen im CafeKong Rundenadmin explizit für MCP freigeschaltet sein.
- Alle Wettregeln werden von der CafeKong API geprüft. Dieser MCP-Server setzt keine eigenen Regeln durch.

## Checks

```bash
npm run check
```
