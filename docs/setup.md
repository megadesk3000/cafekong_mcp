# CafeKong MCP einrichten

Diese Anleitung ist für Spieler gedacht, die CafeKong mit Codex oder Claude Code verwenden wollen.

## Standard: gehosteten MCP-Server verwenden

Der empfohlene CafeKong MCP-Endpunkt ist:

```text
https://mcp.cafekong.de/api/mcp
```

Du musst dafür weder dieses Repository klonen noch Node.js oder einen lokalen Server installieren.

```text
Dein MCP-Client
  -> CafeKong MCP auf Vercel
  -> CafeKong Bot-API
  -> normale CafeKong Wettlogik
```

Die lokale stdio-Variante bleibt als Alternative für Entwicklung und eigene Installationen verfügbar.

## 1. CafeKong freischalten

1. Erstelle oder nutze deinen normalen CafeKong Account.
2. Bitte den Rundenadmin, MCP für die Runde zu aktivieren.
3. Bitte den Rundenadmin, deinen User im MCP-Tab der Runde freizuschalten.
4. Verbinde in deinem MCP-Client den gehosteten CafeKong-Endpunkt.
5. Melde dich im geöffneten Browser bei CafeKong an und erlaube den Zugriff.

Wenn du im Profil keinen MCP-Bereich siehst, bist du noch in keiner Runde für MCP freigeschaltet.

## 2. Codex konfigurieren

Codex unterstützt Remote-MCP-Server per Streamable HTTP und OAuth.

```toml
[mcp_servers.cafekong]
url = "https://mcp.cafekong.de/api/mcp"
default_tools_approval_mode = "writes"
```

Danach den Browser-Login starten:

```bash
codex mcp login cafekong
```

Nach Zustimmung speichert Codex seine OAuth-Zugangsdaten. Ein CafeKong Bot-Token muss dafür nicht mehr lokal hinterlegt werden.

### Alternative: persönlicher Token

### Token aus einer Umgebungsvariable

Setze den Token in deiner Shell:

```bash
export CAFEKONG_BOT_TOKEN='ckbot_...'
```

Trage danach in `~/.codex/config.toml` ein:

```toml
[mcp_servers.cafekong]
url = "https://mcp.cafekong.de/api/mcp"
bearer_token_env_var = "CAFEKONG_BOT_TOKEN"
default_tools_approval_mode = "writes"
```

Wenn du Codex aus dem Terminal startest und den Token dauerhaft für neue Shells setzen willst, kannst du den Export in `~/.zshrc` aufnehmen.

### Token direkt in der persönlichen Codex-Konfiguration

Wenn die Codex Desktop-App deine Shell-Umgebung nicht übernimmt, kannst du den Header direkt konfigurieren:

```toml
[mcp_servers.cafekong]
url = "https://mcp.cafekong.de/api/mcp"
http_headers = { Authorization = "Bearer ckbot_DEIN_TOKEN" }
default_tools_approval_mode = "writes"
```

Der Token liegt dann im Klartext in deiner persönlichen `config.toml`. Schütze die Datei und teile sie nicht. Unter macOS kannst du die Dateirechte einschränken:

```bash
chmod 600 ~/.codex/config.toml
```

Starte Codex nach der Änderung vollständig neu.

## 3. Claude konfigurieren

Füge `https://mcp.cafekong.de/api/mcp` als Remote-MCP-Server beziehungsweise benutzerdefinierte Integration hinzu. Claude entdeckt die OAuth-Konfiguration automatisch und öffnet den CafeKong-Login. Das gilt für OAuth-fähige Claude-Oberflächen; die genaue Bezeichnung des Menüpunkts hängt vom verwendeten Claude-Produkt ab.

### Alternative für Claude Code: persönlicher Token

Claude Code unterstützt den gleichen gehosteten Streamable-HTTP-Endpunkt und einen Bearer-Token im `Authorization`-Header.

Setze den Token zuerst dauerhaft in deiner Shell, zum Beispiel in `~/.zshrc`:

```bash
export CAFEKONG_BOT_TOKEN='ckbot_...'
```

Lege danach im gewünschten Projekt eine `.mcp.json` an oder ergänze sie:

```json
{
  "mcpServers": {
    "cafekong": {
      "type": "http",
      "url": "https://mcp.cafekong.de/api/mcp",
      "headers": {
        "Authorization": "Bearer ${CAFEKONG_BOT_TOKEN}"
      }
    }
  }
}
```

Die `${CAFEKONG_BOT_TOKEN}`-Referenz wird von Claude Code beim Laden aus der Umgebung ersetzt. So kann die `.mcp.json` geteilt werden, ohne den Token einzuchecken. Alternativ kannst du den Server nur für deinen Benutzer per CLI hinzufügen:

```bash
claude mcp add --transport http cafekong \
  https://mcp.cafekong.de/api/mcp \
  --scope user \
  --header "Authorization: Bearer ${CAFEKONG_BOT_TOKEN}"
```

Prüfe die Verbindung mit `claude mcp list` oder innerhalb von Claude Code mit `/mcp`.

## 4. Verbindung prüfen

Sinnvolle erste Prompts:

```text
Nutze CafeKong und zeige mir meine Bot-Identität.
```

```text
Nutze CafeKong und liste meine verfügbaren Runden.
```

Wenn diese Aufrufe funktionieren, sind Remote-Verbindung, Token und grundlegende Freischaltung korrekt.

## 5. Sicher mit Wetten arbeiten

Der MCP-Server markiert Lese-Tools als read-only und Wettaktionen als schreibend. Mit `default_tools_approval_mode = "writes"` darf Codex lesen, fragt aber vor schreibenden Aktionen nach einer Freigabe.

Ein sinnvoller Prompt vor einer Wette ist:

```text
Prüfe zuerst die Wetteinschränkungen. Platziere keine Wette, bevor du mir Auswahl, Einsatz und mögliche Auszahlung genannt hast.
```

Alle eigentlichen Regeln bleiben bei CafeKong:

- MCP muss für die Runde aktiviert sein.
- Dein Nutzer muss in der Runde freigeschaltet sein.
- Der Token muss für die Runde und Aktion berechtigt sein.
- Lock-Zeit, Wallet, Einsatzlimits, Coins und Wettregeln werden serverseitig geprüft.

## 6. Benötigte Scopes

Für Matchwetten:

- `bot:round:read`
- `bot:wagers:read`
- `bot:wagers:write`
- optional `bot:coins:use`

Für Bonuswetten:

- `bot:round:read`
- `bot:bonus-wagers:read`
- `bot:bonus-wagers:write`

Für Wallet und Coins:

- `bot:wallet:read`
- `bot:coins:read`

Wenn ein Scope fehlt, antwortet CafeKong mit `403`.

## 7. Rate Limits

CafeKong begrenzt Bot-Requests pro Token:

- 60 Read-Requests pro Minute
- 10 Write-Requests pro Minute

Der Remote-MCP-Server validiert den Token bei jedem MCP-Request über CafeKong. Diese Validierung zählt ebenfalls als Read-Request. Bei `429` soll der Client warten und später erneut versuchen.

## 8. Fehlerbehebung

### `401 Unauthorized`

Die OAuth-Anmeldung fehlt, ist abgelaufen oder wurde widerrufen. Bei der Token-Alternative kann auch der persönliche Token fehlen oder ungültig sein.

1. Starte im Client die OAuth-Anmeldung erneut.
2. Prüfe im CafeKong Profil unter „Verbundene AI-Clients“, ob die Verbindung aktiv ist.
3. Bei der Token-Alternative prüfst du `Authorization` beziehungsweise `bearer_token_env_var`.

### `403 Forbidden`

Der Token ist gültig, darf die gewünschte Aktion aber nicht ausführen. Prüfe Rundenfreigabe, User-Freigabe, Token-Runden und Scopes.

### Tools erscheinen nicht

1. Prüfe die URL exakt auf `https://mcp.cafekong.de/api/mcp`.
2. Starte Codex oder Claude Code vollständig neu.
3. Prüfe mit `codex mcp list` beziehungsweise `claude mcp list`, ob `cafekong` aktiviert ist.

### Doppelte CafeKong-Tools

Wahrscheinlich sind der Remote- und der lokale Server gleichzeitig aktiviert. Entferne oder deaktiviere einen der beiden Einträge.

## Optional: lokalen stdio-Server verwenden

Für lokale Entwicklung oder eine eigene Installation:

```bash
git clone https://github.com/megadesk3000/cafekong_mcp.git
cd cafekong_mcp
npm install
```

Start gegen das produktive CafeKong:

```bash
CAFEKONG_BASE_URL=https://www.cafekong.de \
CAFEKONG_BOT_TOKEN='ckbot_PRD_TOKEN' \
npm start
```

Start gegen eine lokale CafeKong-App:

```bash
CAFEKONG_BASE_URL=http://localhost:3000 \
CAFEKONG_BOT_TOKEN='ckbot_LOKALER_TOKEN' \
npm start
```

Ein lokaler Token funktioniert nur gegen die zugehörige lokale CafeKong-Datenbank. Für `https://www.cafekong.de` brauchst du einen Token aus dem dortigen Profil.

Allgemeine lokale Codex-Konfiguration:

```toml
[mcp_servers.cafekong-local]
command = "node"
args = ["/Users/you/Develop/cafekong_mcp/src/server.mjs"]

[mcp_servers.cafekong-local.env]
CAFEKONG_BASE_URL = "https://www.cafekong.de"
CAFEKONG_BOT_TOKEN = "ckbot_..."
```

Der lokale Server verwendet weiterhin `stdio`; der gehostete Standard-Endpunkt verwendet Streamable HTTP.
