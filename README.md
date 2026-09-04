# CafeKong MCP Server

Remote- und lokal nutzbarer MCP-Adapter für CafeKong.

## Empfohlener Standard

Der offizielle gehostete MCP-Endpunkt ist:

```text
https://mcp.cafekong.de/api/mcp
```

Für die normale Nutzung muss der Server nicht geklont, installiert oder lokal gestartet werden. Ein MCP-Client verbindet sich per Streamable HTTP und meldet den Nutzer über CafeKong OAuth an. Persönliche Bot-Tokens bleiben als kompatible Alternative erhalten.

Beispiel für Codex in `~/.codex/config.toml`:

```toml
[mcp_servers.cafekong]
url = "https://mcp.cafekong.de/api/mcp"
default_tools_approval_mode = "writes"
```

Danach startet `codex mcp login cafekong` den Browser-Login. Der gleiche Remote-Endpunkt funktioniert mit Claude. Details und die manuelle Token-Alternative stehen in [docs/setup.md](docs/setup.md).

Die vollständige Nutzeranleitung steht in [docs/setup.md](docs/setup.md).

## Funktionsweise

```text
MCP-Client
  -> https://mcp.cafekong.de/api/mcp
  -> https://www.cafekong.de/api/bot/*
  -> normale CafeKong Wettlogik
```

Der MCP-Server enthält keine CafeKong-App-Logik und keinen Datenbankzugriff. Runde, Nutzer, Token-Scopes, Wallet, Lock-Zeiten, Einsatzlimits, Coins und Wettregeln werden von der offiziellen CafeKong Bot-API geprüft.

## Unterstützte Transporte

- Streamable HTTP über den gehosteten Standard-Endpunkt
- `stdio` für lokale Entwicklung und eigene Installationen

Die lokale Variante mit `CAFEKONG_BOT_TOKEN` bleibt vollständig erhalten, ist für normale Nutzer aber nicht mehr notwendig.

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

## Lokale Entwicklung

Voraussetzung ist Node.js 20.9 oder neuer.

```bash
git clone https://github.com/megadesk3000/cafekong_mcp.git
cd cafekong_mcp
npm install
```

Lokalen stdio-Server starten:

```bash
CAFEKONG_BASE_URL=https://www.cafekong.de \
CAFEKONG_BOT_TOKEN='ckbot_...' \
npm start
```

HTTP-Transport lokal entwickeln:

```bash
CAFEKONG_BASE_URL=https://www.cafekong.de npm run dev:http
```

Der lokale HTTP-Endpunkt liegt danach unter `http://localhost:3000/api/mcp`.

## Eigenes Vercel-Deployment

Die Betreiberanleitung steht in [docs/vercel.md](docs/vercel.md). Ein gemeinsamer `CAFEKONG_BOT_TOKEN` gehört nicht in die Vercel-Umgebung.

## Sicherheit

- Bot-Token niemals committen oder teilen.
- Der gehostete Server speichert keinen Nutzer-Token dauerhaft.
- OAuth-Tokens werden gegen Supabase geprüft und gegen ein fünf Minuten gültiges CafeKong-Delegationstoken getauscht. Das OAuth-Token wird nicht an die Bot-API durchgereicht.
- OAuth-Verbindungen und persönliche Tokens können jederzeit im CafeKong Profil widerrufen werden.
- Schreibende Tools sind als schreibend und destruktiv annotiert.

## Checks

```bash
npm run check
```

Der Check führt Syntax- und Regressionstests aus und erstellt einen produktionsnahen Next.js-Build inklusive `/api/mcp`.
