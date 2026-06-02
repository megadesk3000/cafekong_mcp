# CafeKong MCP einrichten

Diese Anleitung ist für Spieler gedacht, die CafeKong per Bot oder Agent nutzen wollen.

Der MCP-Server läuft lokal auf deinem Rechner. Er verbindet deinen MCP-Client mit der CafeKong Bot-API. Der Server enthält keine CafeKong-Datenbankzugänge und keine App-Secrets.

## Überblick

```text
Dein MCP-Client
  -> lokaler CafeKong MCP Server
  -> CafeKong Bot-API
  -> normale CafeKong Wettlogik
```

Alle Regeln bleiben bei CafeKong:

- Du kannst nur in Runden handeln, in denen MCP aktiviert ist.
- Du musst in dieser Runde explizit für MCP freigeschaltet sein.
- Dein Token braucht die passenden Scopes.
- Lock, Wallet, Einsatzlimits, Coins, Kombiwetten und Bonuswetten werden serverseitig geprüft.

## 1. CafeKong Freischaltung

Bevor du lokal etwas einrichtest:

1. Erstelle oder nutze deinen normalen CafeKong Account.
2. Bitte den Rundenadmin, MCP für die Runde zu aktivieren.
3. Bitte den Rundenadmin, deinen User im MCP-Tab der Runde freizuschalten.
4. Öffne dein CafeKong Profil.
5. Erstelle im Bereich `MCP Bot-Zugriff` einen Bot-Token.
6. Kopiere den Token sofort. Er wird nur einmal angezeigt.

Wenn du im Profil keinen MCP-Bereich siehst, bist du noch in keiner Runde für MCP freigeschaltet.

## 2. Repo installieren

```bash
git clone https://github.com/<owner>/cafekong_mcp.git
cd cafekong_mcp
npm install
```

Voraussetzung ist Node.js 20 oder neuer:

```bash
node --version
```

## 3. Bot-API direkt testen

Setze die Werte für deine Shell:

```bash
export CAFEKONG_BASE_URL=https://cafekong.example.com
export CAFEKONG_BOT_TOKEN='ckbot_...'
```

Für lokale Entwicklung gegen eine CafeKong-Instanz auf deinem Rechner:

```bash
export CAFEKONG_BASE_URL=http://localhost:3000
export CAFEKONG_BOT_TOKEN='ckbot_...'
```

Teste zuerst direkt die CafeKong API:

```bash
curl -s "$CAFEKONG_BASE_URL/api/bot/me" \
  -H "Authorization: Bearer $CAFEKONG_BOT_TOKEN"
```

Dann die sichtbaren Runden:

```bash
curl -s "$CAFEKONG_BASE_URL/api/bot/rounds" \
  -H "Authorization: Bearer $CAFEKONG_BOT_TOKEN"
```

Wenn `rounds` leer ist oder `403` liefert, fehlen Runde- oder User-Freigabe.

## 4. MCP-Server manuell starten

```bash
npm start
```

Erwartete Ausgabe:

```text
CafeKong MCP server connected to https://cafekong.example.com
```

Der Prozess bleibt offen. Das ist normal. Der Server ist ein stdio-MCP-Server und wartet auf einen MCP-Client. Du tippst danach nicht manuell in dieses Terminal.

Du kannst Env Vars auch direkt nur für den Start setzen:

```bash
CAFEKONG_BASE_URL=https://cafekong.example.com \
CAFEKONG_BOT_TOKEN='ckbot_...' \
npm start
```

## 5. MCP-Client konfigurieren

### Allgemeines JSON-Beispiel

Viele MCP-Clients nutzen eine Konfiguration in dieser Form:

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

Passe `cwd`, `CAFEKONG_BASE_URL` und `CAFEKONG_BOT_TOKEN` an.

### Direkt mit Node

Wenn dein Client lieber direkt ein Script startet:

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

### Codex CLI

Einmalig hinzufügen:

```bash
codex mcp add cafekong \
  --env CAFEKONG_BASE_URL=https://cafekong.example.com \
  --env CAFEKONG_BOT_TOKEN='ckbot_...' \
  -- node /Users/you/Develop/cafekong_mcp/src/server.mjs
```

Prüfen:

```bash
codex mcp list
```

Wenn du den Token nicht dauerhaft in der Codex-Config speichern willst, setze ihn vor dem Start deiner Codex-Session:

```bash
export CAFEKONG_BOT_TOKEN='ckbot_...'
codex
```

Dann muss der MCP-Eintrag ohne gespeicherten Token angelegt sein:

```bash
codex mcp add cafekong \
  --env CAFEKONG_BASE_URL=https://cafekong.example.com \
  -- node /Users/you/Develop/cafekong_mcp/src/server.mjs
```

### Codex Tool-Freigaben

Codex fragt standardmässig vor MCP-Tool-Aufrufen nach. Für reine Lese-Tools kannst du `Always allow` wählen oder die Freigaben in `~/.codex/config.toml` eintragen.

Sinnvoll dauerhaft freigegeben:

```toml
[mcp_servers.cafekong.tools.cafekong_bot_me]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_list_rounds]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_get_round_state]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_get_wallet]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_get_coins]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_list_wagers]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_get_match_wager_constraints]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_list_bonus_markets]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_list_bonus_wagers]
approval_mode = "approve"

[mcp_servers.cafekong.tools.cafekong_get_bonus_wager_constraints]
approval_mode = "approve"
```

Nicht pauschal freigeben:

- `cafekong_place_match_wager`
- `cafekong_cancel_match_wager`
- `cafekong_place_bonus_wager`
- `cafekong_cancel_bonus_wager`

Diese Tools können echte Wetten platzieren oder stornieren und sollten bewusst bestätigt werden.

## 6. Erste Tests im Agent

Nach dem Neustart deines MCP-Clients sollten diese Tools verfügbar sein:

- `cafekong_bot_me`
- `cafekong_list_rounds`
- `cafekong_get_round_state`
- `cafekong_get_wallet`
- `cafekong_list_wagers`
- `cafekong_place_match_wager`
- `cafekong_cancel_match_wager`
- `cafekong_list_bonus_markets`
- `cafekong_place_bonus_wager`
- `cafekong_cancel_bonus_wager`

Sinnvolle erste Prompts:

```text
Nutze CafeKong und zeige mir meine Bot-Identität.
```

```text
Nutze CafeKong und liste meine verfügbaren Runden.
```

```text
Lade den Status meiner CafeKong Runde und zeige mir die nächsten offenen Spiele.
```

Vor einer echten Wette:

```text
Prüfe für dieses Spiel zuerst die Wetteinschränkungen. Platziere keine Wette, bevor du mir Auswahl, Einsatz und mögliche Auszahlung genannt hast.
```

## 7. Wetten platzieren

Der Agent kann Matchwetten, Kombiwetten und Bonuswetten nur über die CafeKong Bot-API platzieren.

Für Matchwetten braucht der Token:

- `bot:round:read`
- `bot:wagers:read`
- `bot:wagers:write`
- optional `bot:coins:use`, falls Coins eingesetzt werden sollen

Für Bonuswetten braucht der Token:

- `bot:round:read`
- `bot:bonus-wagers:read`
- `bot:bonus-wagers:write`

Für Wallet und Coins:

- `bot:wallet:read`
- `bot:coins:read`

Wenn ein Scope fehlt, antwortet CafeKong mit `403`.

## Rate Limits

CafeKong begrenzt Bot-Requests pro Token:

- 60 Read-Requests pro Minute
- 10 Write-Requests pro Minute

Wenn dein Agent zu schnell pollt oder in einer Schleife Wetten aktualisiert, antwortet CafeKong mit `429`. In dem Fall soll der Client warten und später erneut versuchen.

## Lokal vs. PRD

Der MCP-Server läuft immer lokal auf deinem Rechner. Nur das CafeKong-Ziel ändert sich.

Lokal:

```bash
CAFEKONG_BASE_URL=http://localhost:3000 \
CAFEKONG_BOT_TOKEN='ckbot_LOKALER_TOKEN' \
npm start
```

PRD:

```bash
CAFEKONG_BASE_URL=https://www.cafekong.de \
CAFEKONG_BOT_TOKEN='ckbot_PRD_TOKEN' \
npm start
```

Ein lokaler Token funktioniert nur gegen deine lokale CafeKong-DB. Für PRD brauchst du einen neuen Token aus dem PRD-Profil.

## 8. Sicherheit

- Committe niemals deinen Token.
- Teile deinen Token nicht.
- Erstelle lieber einen neuen Token, wenn du unsicher bist.
- Widerrufe alte Tokens im CafeKong Profil.
- Begrenze Tokens auf die Runden, die dein Bot wirklich nutzen soll.
- Nutze für Tests kleine Einsätze.
- Lass deinen Agent vor einer Wette Auswahl, Einsatz und Markt bestätigen.

## 9. Häufige Fehler

### `Missing CAFEKONG_BOT_TOKEN`

Der Serverprozess sieht keinen Token.

Falsch:

```bash
CAFEKONG_BOT_TOKEN='ckbot_...'
npm start
```

Wenn deine Shell die Variable nicht exportiert, kommt sie nicht beim Node-Prozess an.

Richtig:

```bash
export CAFEKONG_BOT_TOKEN='ckbot_...'
npm start
```

Oder:

```bash
CAFEKONG_BOT_TOKEN='ckbot_...' npm start
```

### `401`

Der Token ist ungültig, abgelaufen oder widerrufen.

Lösung:

1. Im CafeKong Profil neuen Token erstellen.
2. MCP-Client-Konfiguration aktualisieren.
3. MCP-Client neu starten.

### `403`

Der Token ist gültig, darf die gewünschte Aktion aber nicht ausführen.

Mögliche Gründe:

- MCP ist für die Runde nicht aktiviert.
- Dein User ist in der Runde nicht für MCP freigeschaltet.
- Der Token ist nicht auf diese Runde berechtigt.
- Dem Token fehlt ein Scope, zum Beispiel `bot:wagers:write`.
- Die normale CafeKong-Regel blockiert die Aktion.

### `ECONNREFUSED` bei `localhost:3000`

Die lokale CafeKong-App läuft nicht.

Starte CafeKong lokal und prüfe:

```bash
curl http://localhost:3000
```

### Tool ist im Client nicht sichtbar

- MCP-Client neu starten.
- Pfad in `cwd` oder `args` prüfen.
- `npm install` im `cafekong_mcp` Repo ausführen.
- `npm run check` ausführen.

## 10. Version prüfen

```bash
npm run check
```

Dieser Check prüft nur Syntax und Startbarkeit des Servers. Ob dein Token und deine Runde passen, prüfst du über `curl` oder direkt im MCP-Client.
