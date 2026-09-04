# CafeKong MCP auf Vercel bereitstellen

Der öffentlich dokumentierte Standard-Endpunkt ist:

```text
https://cafekong-mcp.vercel.app/api/mcp
```

Er verwendet Streamable HTTP. Der lokale stdio-Server bleibt unabhängig davon als Entwicklungs- und Ausweichoption verfügbar.

## Architektur

```text
MCP-Client
  -> HTTPS mit persönlichem CafeKong Bot-Token
  -> Vercel /api/mcp
  -> CafeKong Bot-API
```

Der persönliche Bot-Token wird nicht als gemeinsames Vercel-Secret gespeichert. Der MCP-Client sendet ihn als Bearer-Token. Der Remote-Handler validiert ihn über `GET /api/bot/me` und verwendet ihn anschliessend für den jeweiligen Tool-Aufruf.

## 1. Repository importieren

1. Im Vercel Dashboard `Add New...` und dann `Project` wählen.
2. Das GitHub-Repository `megadesk3000/cafekong_mcp` importieren.
3. Falls es nicht angezeigt wird, der Vercel GitHub App Zugriff auf das Repository geben.

## 2. Projekt konfigurieren

Folgende Einstellungen verwenden:

- Framework Preset: `Next.js`
- Root Directory: `./`
- Build Command: Vercel-Standard
- Install Command: Vercel-Standard
- Node.js: 20 oder neuer

Als Environment Variable für Production und Preview setzen:

```text
CAFEKONG_BASE_URL=https://www.cafekong.de
```

`CAFEKONG_BOT_TOKEN` nicht in Vercel hinterlegen. Ein gemeinsamer Token würde alle Nutzer unter derselben CafeKong-Identität ausführen.

## 3. Deployment prüfen

Für das Standard-Deployment lautet der MCP-Endpunkt:

```text
https://cafekong-mcp.vercel.app/api/mcp
```

Der Endpunkt muss Requests ohne Bearer-Token mit `401 Unauthorized` ablehnen.

Mit dem MCP Inspector kann der vollständige Transport geprüft werden:

```bash
npx @modelcontextprotocol/inspector@latest
```

Im Inspector `Streamable HTTP` auswählen, die vollständige `/api/mcp`-URL eintragen und den persönlichen CafeKong Bot-Token als Bearer-Token verwenden.

## 4. Codex oder Claude Code mit dem Remote-Server verbinden

Den persönlichen Token lokal in der Umgebung setzen:

```bash
export CAFEKONG_BOT_TOKEN='ckbot_...'
```

Danach in `~/.codex/config.toml`:

```toml
[mcp_servers.cafekong]
url = "https://cafekong-mcp.vercel.app/api/mcp"
bearer_token_env_var = "CAFEKONG_BOT_TOKEN"
default_tools_approval_mode = "writes"
```

Codex anschliessend neu starten.

Claude Code verwendet denselben Endpunkt und Bearer-Token. Die vollständige Konfiguration steht in [setup.md](setup.md). Für Claude.ai und Claude Desktop wäre zusätzlich OAuth nötig; der aktuelle manuelle Bearer-Token ist dort nicht direkt über die Connector-Oberfläche konfigurierbar.

Dabei läuft kein lokaler MCP-Prozess. Nur der persönliche Token kommt weiterhin aus der lokalen Umgebung und wird über HTTPS an den Remote-Endpunkt gesendet.

## Lokale Variante weiterhin verwenden

Der lokale Start bleibt erhalten:

```bash
CAFEKONG_BASE_URL=https://www.cafekong.de \
CAFEKONG_BOT_TOKEN='ckbot_...' \
npm start
```

Remote und lokal können als getrennte MCP-Einträge konfiguriert werden. Damit Tools nicht doppelt erscheinen, sollte normalerweise nur einer der beiden Einträge aktiviert sein.

## Einschränkungen

- Der Remote-Endpunkt unterstützt derzeit vorkonfigurierte Bearer-Tokens für Codex und Claude Code, aber keinen interaktiven OAuth-Login für Claude.ai oder Claude Desktop.
- Jeder MCP-Request validiert den Token gegen CafeKong. Diese Prüfung zählt als Bot-API-Read.
- Die normalen CafeKong Scopes, Rundenfreigaben und Rate Limits bleiben unverändert aktiv.
