# CafeKong MCP auf Vercel bereitstellen

Der öffentlich dokumentierte Standard-Endpunkt ist:

```text
https://mcp.cafekong.de/api/mcp
```

Er verwendet Streamable HTTP. Der lokale stdio-Server bleibt unabhängig davon als Entwicklungs- und Ausweichoption verfügbar.

## Architektur

```text
MCP-Client
  -> HTTPS mit Supabase OAuth-Token
  -> Vercel /api/mcp
  -> kurzlebiger CafeKong-Token-Exchange
  -> CafeKong Bot-API
```

Der OAuth-Token wird geprüft und serverseitig gegen ein fünf Minuten gültiges Delegationstoken getauscht. Nur dieses Delegationstoken erreicht die CafeKong Bot-API. Persönliche `ckbot_`-Tokens funktionieren aus Kompatibilitätsgründen weiterhin, werden aber nie als gemeinsames Vercel-Secret gespeichert.

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
CAFEKONG_OAUTH_ISSUER=https://PROJECT_REF.supabase.co/auth/v1
CAFEKONG_MCP_SERVICE_SECRET=<langer-zufälliger-wert>
MCP_RESOURCE_URL=https://mcp.cafekong.de/api/mcp
```

`CAFEKONG_MCP_SERVICE_SECRET` muss exakt denselben Wert wie in der CafeKong-App haben. `CAFEKONG_BOT_TOKEN` nicht in Vercel hinterlegen.

## 3. Eigene Domain verbinden

1. Im Vercel-Projekt unter `Settings > Domains` die Domain
   `mcp.cafekong.de` hinzufügen.
2. Beim DNS-Anbieter den von Vercel angezeigten CNAME für den Host `mcp`
   setzen.
3. Warten, bis Vercel Domain und TLS-Zertifikat als gültig anzeigt.

`https://mcp.cafekong.de/api/mcp` ist die kanonische OAuth-Resource. Die
automatisch vergebene `*.vercel.app`-Adresse nicht in MCP-Clients oder als
OAuth-Audience verwenden.

## 4. Deployment prüfen

Für das Standard-Deployment lautet der MCP-Endpunkt:

```text
https://mcp.cafekong.de/api/mcp
```

Der Endpunkt muss Requests ohne Bearer-Token mit `401 Unauthorized` ablehnen.

Mit dem MCP Inspector kann der vollständige Transport geprüft werden:

```bash
npx @modelcontextprotocol/inspector@latest
```

Im Inspector `Streamable HTTP` auswählen und die vollständige `/api/mcp`-URL eintragen. Für den OAuth-Test die angebotene Anmeldung verwenden; alternativ kann weiterhin ein persönlicher CafeKong Bot-Token als Bearer-Token gesetzt werden.

## 5. Codex oder Claude Code mit dem Remote-Server verbinden

In `~/.codex/config.toml`:

```toml
[mcp_servers.cafekong]
url = "https://mcp.cafekong.de/api/mcp"
default_tools_approval_mode = "writes"
```

Danach `codex mcp login cafekong` ausführen. Claude verwendet dieselbe URL und startet seinen OAuth-Flow über die Oberfläche.

Dabei läuft kein lokaler MCP-Prozess und es muss kein CafeKong-Token von Hand gespeichert werden. Die vollständige Konfiguration und die persönliche Token-Alternative stehen in [setup.md](setup.md).

## Lokale Variante weiterhin verwenden

Der lokale Start bleibt erhalten:

```bash
CAFEKONG_BASE_URL=https://www.cafekong.de \
CAFEKONG_BOT_TOKEN='ckbot_...' \
npm start
```

Remote und lokal können als getrennte MCP-Einträge konfiguriert werden. Damit Tools nicht doppelt erscheinen, sollte normalerweise nur einer der beiden Einträge aktiviert sein.

## CafeKong- und Supabase-Konfiguration

- In Supabase unter `Authentication > URL Configuration` die Site URL `https://www.cafekong.de` prüfen.
- Unter `Authentication > OAuth Server` OAuth und Dynamic Client Registration aktivieren.
- Authorization Path auf `/oauth/consent` setzen.
- Die Migration `202609041200_mcp_oauth.sql` anwenden und den darin angelegten Custom Access Token Hook im Supabase-Dashboard aktivieren.
- In der CafeKong-Vercel-App `CAFEKONG_MCP_SERVICE_SECRET`, `MCP_DELEGATION_SIGNING_SECRET` und `MCP_OAUTH_AUDIENCE=https://mcp.cafekong.de/api/mcp` setzen.
- Für beide Secrets unterschiedliche, zufällige Werte mit mindestens 32 Zeichen verwenden. Nur der Service-Secret wird mit dem MCP-Projekt geteilt.
