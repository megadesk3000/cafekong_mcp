# CafeKong MCP Server

Remote- und lokal nutzbarer MCP-Adapter für CafeKong.

## Empfohlener Standard

Der offizielle gehostete MCP-Endpunkt ist:

```text
https://mcp.cafekong.de/api/mcp
```

Für die normale Nutzung muss der Server nicht geklont, installiert oder lokal gestartet werden. Ein MCP-Client verbindet sich per Streamable HTTP und meldet den Nutzer über CafeKong OAuth an. Persönliche Bot-Tokens bleiben als kompatible Alternative erhalten.

### Schnellstart: Codex

```bash
codex mcp add cafekong --url https://mcp.cafekong.de/api/mcp
codex mcp login cafekong
```

Im Browser bei CafeKong anmelden und die angefragten Rechte prüfen. Im
Serverblock der persönlichen `~/.codex/config.toml` zusätzlich
`default_tools_approval_mode = "writes"` setzen, wenn schreibende Tools eine
Bestätigung benötigen sollen. Der Add-Befehl setzt diese Option nicht selbst.

### Schnellstart: Claude Code

```bash
claude mcp add --transport http --scope user cafekong https://mcp.cafekong.de/api/mcp
claude
```

In der gestarteten Claude-Code-Sitzung `/mcp` eingeben, `cafekong` auswählen
und die OAuth-Anmeldung starten. Keinen Token-Header für diesen Weg ergänzen.

Voraussetzung für beide Clients ist ein CafeKong-Account mit MCP-Freischaltung
für die gewünschte Runde. Die CLI muss bereits installiert sein; das
MCP-Repository selbst wird für diesen Schnellstart nicht benötigt.

Die ausführliche [Nutzeranleitung](docs/setup.md) beschreibt Einrichtung,
Client-Scopes, Schreibfreigaben, Verbindungsprüfung, versionsabhängige
OAuth-Optionen, Token-Alternativen und Fehlerbehebung. Existiert bereits ein
CafeKong-Eintrag, zuerst den
[Umstellungsabschnitt](docs/setup.md#9-von-lokal-oder-persönlichem-token-auf-oauth-wechseln)
lesen. Claude Web/Desktop und Claude Code sind dort getrennt beschrieben.

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

Read-Tools sind standardmässig kompakt:

- `cafekong_get_round_state` liefert nur aktuell relevante Matches und kann
  nach Match-Zustand, IDs, Spieltag, Stage, Teilnehmer, Anstossfenster oder
  Wettverfügbarkeit gefiltert und paginiert werden. Die sehr grosse
  Vollansicht ist nur explizit mit `view=full` erreichbar.
- `cafekong_list_wagers` liefert standardmässig nur aktive Wetten und kann
  nach Status, Pricing-Status und Match gefiltert und paginiert werden.
- `cafekong_get_coins` liefert den aktuellen Coin-Stand und ein kompaktes,
  mit `limit` und `offset` paginiertes Coin-Ledger. Umfangreiche Admin- und
  Stage-Prognosen werden nicht in den MCP-Kontext kopiert.
- `cafekong_list_bonus_markets` liefert kompakte, filter- und paginierbare
  Markt-Zusammenfassungen ohne Optionslisten oder Provider-Rohdaten. Optionen
  und aktuelle Quoten werden erst gezielt mit
  `cafekong_get_bonus_wager_constraints` fuer einen Markt geladen.
- API-JSON wird pro Tool-Aufruf nur einmal als Textinhalt übertragen, nicht
  zusätzlich als identische `structuredContent`-Kopie.

## Lokale Entwicklung

Voraussetzung ist einer aktuellen Node.js-Version aus der LTS-Linie 22 oder 24.

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

Der Check führt Syntax- und Regressionstests aus, erstellt einen produktionsnahen Next.js-Build inklusive `/api/mcp` und prüft diesen über echte lokale HTTP-Anfragen. Der lokale API-Mock testet Token-Ablehnung, OAuth-Delegation, Client-Isolation und Request-Limits ohne Produktionszugriff. Nach einem bestehenden Build kann `npm run test:http` separat ausgeführt werden.
