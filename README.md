# CafeKong MCP Server

Lokaler und remote hostbarer MCP-Adapter für CafeKong Bot-Tokens.

Der Server enthält keine CafeKong-App-Logik und keinen Datenbankzugriff. Er spricht nur mit der offiziellen CafeKong Bot-API.

Zwei Transportarten werden unterstützt:

- `stdio` für den weiterhin verfügbaren lokalen Betrieb
- Streamable HTTP unter `/api/mcp` für Vercel und andere Remote-Deployments

## Schnellstart

```bash
git clone https://github.com/<owner>/cafekong_mcp.git
cd cafekong_mcp
npm install
```

Danach brauchst du:

- die CafeKong URL, zum Beispiel `https://cafekong.example.com`
- deinen eigenen Bot-Token aus dem CafeKong Profil
- eine Freischaltung in der gewünschten CafeKong Runde

Die detaillierte lokale Anleitung steht in [docs/setup.md](docs/setup.md). Das Remote-Deployment ist in [docs/vercel.md](docs/vercel.md) beschrieben.

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

Dieser Start verwendet weiterhin den lokalen stdio-Transport. Der Prozess wird normalerweise vom MCP-Client gestartet.

## HTTP-Entwicklung

Der Remote-Endpunkt kann lokal separat gestartet werden:

```bash
CAFEKONG_BASE_URL=https://cafekong.example.com npm run dev:http
```

Der MCP-Endpunkt ist danach unter `http://localhost:3000/api/mcp` erreichbar. Der persönliche CafeKong Bot-Token wird bei HTTP nicht als Server-Environment-Variable gespeichert, sondern vom MCP-Client als Bearer-Token pro Request gesendet.

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
- Bei einem Remote-Deployment keinen gemeinsamen `CAFEKONG_BOT_TOKEN` in Vercel hinterlegen.
- Der Remote-Endpunkt validiert den eingehenden Bearer-Token über `/api/bot/me` und reicht ihn nur für Requests dieses Nutzers an die CafeKong Bot-API weiter.
- Token können im CafeKong Profil widerrufen werden.
- Runde und User müssen im CafeKong Rundenadmin explizit für MCP freigeschaltet sein.
- Alle Wettregeln werden von der CafeKong API geprüft. Dieser MCP-Server setzt keine eigenen Regeln durch.

## Checks

```bash
npm run check
```

Der Check prüft die JavaScript-Einstiegspunkte und erstellt einen produktionsnahen Next.js-Build inklusive `/api/mcp`.

## Fehlerbehebung

Mehr Details zu `Missing CAFEKONG_BOT_TOKEN`, `401`, `403` und Client-Konfigurationen stehen in [docs/setup.md](docs/setup.md).
