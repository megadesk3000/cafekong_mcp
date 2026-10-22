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

## Wegweiser und Voraussetzungen

- [Codex per CLI und OAuth](#2-codex-konfigurieren)
- [Claude Code per CLI und OAuth](#3-claude-konfigurieren)
- [Verbindung prüfen](#4-verbindung-prüfen)
- [Fehlerbehebung](#8-fehlerbehebung)
- [Bestehenden Eintrag umstellen](#9-von-lokal-oder-persönlichem-token-auf-oauth-wechseln)
- [Zugriff widerrufen](#10-abmelden-und-zugriff-widerrufen)

Die folgenden Terminalbefehle setzen voraus, dass die jeweilige CLI installiert
ist. Mit `codex --version` beziehungsweise `claude --version` lässt sich das
prüfen. Falls der Befehl nicht gefunden wird, zuerst den gewünschten Client
installieren; ein Clone dieses MCP-Repositories ist dafür nicht erforderlich.

Für den gehosteten OAuth-Zugang brauchen Spieler keine Supabase-Keys, keine
Vercel-Secrets und keinen manuell erzeugten `CAFEKONG_BOT_TOKEN`. Die
Betreiberkonfiguration ist separat in [vercel.md](vercel.md) dokumentiert.
OAuth bedeutet nicht, dass der Client ohne gespeicherte Zugangsdaten arbeitet:
Er verwaltet seine OAuth-Zugangsdaten selbst, statt dass du einen Bot-Token
von Hand in eine Konfigurationsdatei kopierst.

## 1. CafeKong freischalten

1. Erstelle oder nutze deinen normalen CafeKong Account.
2. Bitte den Rundenadmin, MCP für die Runde zu aktivieren.
3. Bitte den Rundenadmin, deinen User im MCP-Tab der Runde freizuschalten.
4. Verbinde in deinem MCP-Client den gehosteten CafeKong-Endpunkt.
5. Melde dich im geöffneten Browser bei CafeKong an und erlaube den Zugriff.

Wenn du im Profil keinen MCP-Bereich siehst, bist du noch in keiner Runde für MCP freigeschaltet.

## 2. Codex konfigurieren

Codex unterstützt Remote-MCP-Server per Streamable HTTP und OAuth.

### Empfohlen: per Terminal hinzufügen

Für eine neue Einrichtung im Terminal ausführen:

```bash
codex mcp add cafekong --url https://mcp.cafekong.de/api/mcp
codex mcp login cafekong
```

Der erste Befehl speichert die Serverkonfiguration. Der zweite startet den
OAuth-Login. Falls bereits beim Hinzufügen eine Anmeldung angeboten und
abgeschlossen wird, ist keine zweite Zustimmung erforderlich.

Im Browser:

1. Bei CafeKong mit deinem eigenen Account anmelden.
2. Den anfragenden Client und die angezeigten Berechtigungen prüfen.
3. Nur zustimmen, wenn du diese Verbindung selbst gestartet hast.
4. Den Rücksprung zum Client abwarten und das Terminal bis zum Abschluss
   geöffnet lassen.

Keinen `--bearer-token-env-var`-Parameter und keinen festen Authorization-Header
für diesen OAuth-Weg ergänzen. Existiert bereits ein Eintrag `cafekong`, zuerst
den [Umstellungsabschnitt](#9-von-lokal-oder-persönlichem-token-auf-oauth-wechseln)
lesen.

### Konfiguration und Schreibfreigaben prüfen

```bash
codex mcp list
codex mcp get cafekong
```

Die URL muss `https://mcp.cafekong.de/api/mcp` sein. Ein Listeneintrag bestätigt
noch keinen erfolgreichen Tool-Aufruf; dafür folgt der Test in Abschnitt 4.

Die persönliche Konfiguration liegt standardmässig in `~/.codex/config.toml`.
Ergänze im bereits vorhandenen Serverblock die Schreibfreigabe-Einstellung,
statt einen zweiten gleichnamigen TOML-Block anzulegen:

```toml
[mcp_servers.cafekong]
url = "https://mcp.cafekong.de/api/mcp"
default_tools_approval_mode = "writes"
```

`codex mcp add` setzt diese Freigabe-Einstellung nicht automatisch. `writes`
fordert für Tools, die nicht als read-only markiert sind, eine Bestätigung an.
Prüfe vorhandene `tools.<tool>.approval_mode`-Overrides, da diese die
Server-Vorgabe überschreiben können. Es handelt sich um eine Client-Freigabe,
nicht um eine Einschränkung der serverseitigen OAuth-Berechtigungen.

CLI und Desktop-/IDE-Nutzung müssen dieselbe Codex-Konfiguration auf demselben
Host verwenden. Nach einer Änderung laufende Clients neu laden beziehungsweise
neu starten. Projektbezogene `.codex/config.toml`-Einträge ebenfalls auf alte
CafeKong-Definitionen prüfen.

### Alternative: Konfiguration von Hand anlegen

Statt `codex mcp add` kannst du den oben gezeigten TOML-Block direkt in deine
persönliche Konfiguration eintragen. Nicht beide Methoden mit doppelten
Serverblöcken kombinieren.

Danach den Browser-Login starten:

```bash
codex mcp login cafekong
```

Nach Zustimmung speichert Codex seine OAuth-Zugangsdaten. Ein CafeKong Bot-Token muss dafür nicht mehr lokal hinterlegt werden.

### Optional: Dynamic Client Registration ausdrücklich wählen

Der normale Login wählt die Registrierung automatisch. Neuere CLI-Versionen
bieten zusätzlich diesen einmaligen Diagnose-/Fallback-Schalter:

```bash
codex mcp login cafekong --oauth-client-registration dcr
```

Vorher mit `codex mcp login --help` prüfen, ob die eigene Version den Schalter
kennt. Die bei Erstellung dieser Anleitung lokal geprüfte CLI bot ihn noch
nicht an. Bei `unexpected argument` den normalen Login ohne den Schalter
verwenden oder die CLI aktualisieren. Der Schalter ersetzt weder einen
aktivierten Supabase-OAuth-Server noch aktivierte Dynamic Client Registration.
Er wird nicht als dauerhafte Konfiguration gespeichert.

### Alternative: persönlicher Token

#### Token aus einer Umgebungsvariable

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

#### Token direkt in der persönlichen Codex-Konfiguration

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

### Claude Code: per Terminal hinzufügen

```bash
claude mcp add --transport http --scope user cafekong https://mcp.cafekong.de/api/mcp
```

- `--transport http` wählt den gehosteten Streamable-HTTP-Transport.
- `--scope user` macht die Konfiguration für deine Projekte auf diesem Rechner
  verfügbar; sie ist keine Freigabe für andere Benutzer.
- `cafekong` ist der lokale Name des Eintrags.
- Kein `--header` mit einem Bot-Token und keine Betreiber-Secrets ergänzen.

### OAuth-Anmeldung in Claude Code

Claude Code im gewünschten Arbeitsverzeichnis starten:

```bash
claude
```

Danach **innerhalb der Claude-Code-Sitzung**, nicht in der normalen Shell,
eingeben:

```text
/mcp
```

1. Den Server `cafekong` auswählen.
2. Die angebotene Authentifizierung starten.
3. Im Browser bei CafeKong anmelden.
4. Client und Berechtigungen prüfen und der selbst gestarteten Verbindung
   zustimmen.
5. Nach dem Rücksprung den Verbindungsstatus in `/mcp` prüfen.

Ein Zustand wie `Needs authentication` vor der Anmeldung ist erwartbar.
Die CLI-Konfiguration allein ist noch kein abgeschlossener OAuth-Login.
Nachträglich hinzugefügte Server gegebenenfalls in einer neuen Sitzung laden.

Für die Statusprüfung im Terminal:

```bash
claude mcp list
claude mcp get cafekong
```

### Optional: nur für ein Projekt konfigurieren

Wenn der Server bewusst als Projektkonfiguration geteilt werden soll, im
Projektverzeichnis statt der User-Einrichtung ausführen:

```bash
claude mcp add --transport http --scope project cafekong https://mcp.cafekong.de/api/mcp
```

Damit wird eine `.mcp.json` verwendet. Sie kann die öffentliche URL enthalten,
aber keine persönlichen Tokens. Jeder Nutzer meldet sich separat an und muss
die Projektkonfiguration gegebenenfalls freigeben. Ohne `--scope` verwendet
Claude Code standardmässig den lokalen, projektbezogenen Scope; für eine
projektübergreifende persönliche Einrichtung deshalb explizit `user` wählen.
Nicht mehrere Scopes für denselben Server anlegen, ohne die alten Einträge zu
bereinigen.

### Claude im Web beziehungsweise Desktop

Die `claude mcp ...`-Befehle oben konfigurieren Claude Code, nicht automatisch
einen Web-/Desktop-Connector. In einer Claude-Oberfläche mit Unterstützung für
eigene Remote-Connectoren die URL `https://mcp.cafekong.de/api/mcp` eintragen
und den angebotenen OAuth-Flow verwenden. Menüname und Verfügbarkeit hängen
vom Produkt und den Account-/Organisationsrichtlinien ab.

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

Prüfe dabei, dass die angezeigte Identität dein eigener Account ist und die
Rundenliste die für dich freigegebenen Runden enthält. Nutze zunächst nur
Lese-Tools, etwa `cafekong_bot_me`, `cafekong_list_rounds` und nach Auswahl
einer freigegebenen Runde `cafekong_get_wallet`. Eine Testwette ist für den
Verbindungstest nicht nötig.

Ein HTTP-`401` beim direkten Öffnen von `/api/mcp` im Browser ist ohne
Authorization-Header normal: Das ist ein Protokoll-Endpunkt, keine Webseite.
Erreichbare Metadaten oder ein erfolgreicher Login allein beweisen noch nicht,
dass der nachfolgende Tool-Aufruf und Token-Exchange funktionieren.

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

Die folgenden `bot:*`-Werte sind CafeKong-Berechtigungen, nicht die Standard-
OAuth-Scopes von Supabase. Sie werden beim OAuth-Weg über den CafeKong-Grant
verwaltet; nicht als `codex mcp login --scopes ...` übergeben. Bei persönlichen
Bot-Tokens müssen sie bei der Token-Erstellung passend ausgewählt werden.

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

`cafekong_get_coins` liefert standardmaessig nur den aktuellen Coin-Stand und
eine kompakte Ledger-Seite. Mit `limit` (maximal 100) und `offset` koennen
weitere Eintraege gezielt nachgeladen werden; umfangreiche Stage- und
Admin-Prognosen werden nicht in den MCP-Kontext kopiert.

Wenn ein Scope fehlt, antwortet CafeKong mit `403`.

## 7. Rate Limits

CafeKong begrenzt Bot-Requests pro Token:

- 60 Read-Requests pro Minute
- 10 Write-Requests pro Minute

Der Remote-MCP-Server validiert die Zugangsdaten bei jedem MCP-Request über
CafeKong. Bei persönlichen Tokens läuft dafür zusätzlich `/api/bot/me` und
verbraucht einen Read-Request; OAuth verwendet stattdessen den separaten
Token-Exchange. Bei `429` soll der Client warten und später erneut versuchen.

## 8. Fehlerbehebung

### Befehl oder Option wird nicht erkannt

`command not found` betrifft die lokale CLI-Installation beziehungsweise den
PATH, nicht den gehosteten MCP-Server. Version und Hilfe prüfen:

```bash
codex --version
codex mcp add --help
codex mcp login --help
claude --version
claude mcp add --help
```

Nicht alle Versionen bieten alle optionalen OAuth-Schalter. Für Claude Code
ist der hier beschriebene `/mcp`-Weg der Standard dieser Anleitung.

### OAuth Discovery oder Registrierung schlägt fehl

Zuerst die konfigurierte URL inklusive `/api/mcp` prüfen. Kein `/rest/v1/`,
keine Supabase-URL und keine frühere Vercel-Adresse als MCP-Server verwenden.
Bei Codex nur dann den DCR-Fallback aus Abschnitt 2 versuchen, wenn die CLI
ihn unterstützt.

Bleibt der Fehler bestehen, dem Betreiber die Fehlermeldung und den Zeitpunkt
mitteilen. Dieser prüft OAuth Discovery, Dynamic Client Registration und die
Consent-Konfiguration anhand von [vercel.md](vercel.md). Keine Access-Tokens,
Refresh-Tokens oder vollständigen Callback-URLs mit Authorization-Code teilen.

### Browser-Login abgeschlossen, aber Tools liefern weiterhin `401`

Alte feste Authorization-Header oder `bearer_token_env_var`-Einträge entfernen,
wenn OAuth verwendet werden soll. Danach erneut anmelden. Falls das nicht
hilft, muss der Betreiber zusätzlich den gemeinsamen Service-Secret, den
Delegation-Signing-Secret, den aktiven Hook, dessen Audience und den
Token-Exchange prüfen. Wiederholte Logins lösen keine falsche Serverkonfiguration.

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

## 9. Von lokal oder persönlichem Token auf OAuth wechseln

Vor dem Ersetzen die persönliche Konfiguration sichern und bestehende
Tool-Freigaben notieren. Backups mit Tokens vertraulich behandeln.
Die folgenden Remove-Befehle entfernen nur den Client-Eintrag; sie deinstallieren
keinen Server und widerrufen keine bestehenden CafeKong-Berechtigungen.

### Codex umstellen

Mit `codex mcp get cafekong` prüfen, welcher Eintrag vorhanden ist. Soll er
vollständig ersetzt werden:

```bash
codex mcp remove cafekong
codex mcp add cafekong --url https://mcp.cafekong.de/api/mcp
codex mcp login cafekong
```

Danach `default_tools_approval_mode = "writes"` und gewünschte Tool-Regeln
wie in Abschnitt 2 prüfen beziehungsweise wieder ergänzen.

Bei manueller Bearbeitung entfallen im Remote-OAuth-Eintrag `command`, `args`,
der bisherige `[mcp_servers.cafekong.env]`-Block, `bearer_token_env_var` und ein
fest hinterlegter `Authorization`-Header. Andere Serverblöcke nicht ändern.
Eine alte projektbezogene Definition separat prüfen, falls sie den persönlichen
Eintrag überlagert.

### Claude Code umstellen

Mit `claude mcp get cafekong` und gegebenenfalls der Projektdatei `.mcp.json`
den bisherigen Scope prüfen. Für einen alten User-Eintrag:

```bash
claude mcp remove cafekong --scope user
claude mcp add --transport http --scope user cafekong https://mcp.cafekong.de/api/mcp
```

Lag der alte Eintrag in `local` oder `project`, beim Entfernen genau diesen
Scope verwenden. Danach Claude Code starten und über `/mcp` anmelden.
Nicht pauschal die komplette `.mcp.json` löschen; sie kann andere Server
enthalten. Alte `Authorization`-Header dürfen im neuen OAuth-Eintrag nicht
stehen bleiben.

Bei einem Wechsel von der früheren `*.vercel.app`-Adresse zur eigenen Domain
erneut anmelden. Bestehende OAuth-Zugangsdaten nicht manuell zwischen URLs
kopieren. Für einen weiterhin benötigten lokalen Server einen getrennten Namen
wie `cafekong-local` verwenden und normalerweise nur einen Transport aktivieren.

## 10. Abmelden und Zugriff widerrufen

Die massgebliche serverseitige Sperre erfolgt im CafeKong-Profil unter
„Verbundene AI-Clients“: die betreffende Verbindung widerrufen. Danach braucht
dieser Client eine neue Zustimmung. Persönliche `ckbot_`-Tokens sind davon
getrennt und müssen im Token-Bereich des Profils separat widerrufen werden.

Bei Codex können zusätzlich lokal gespeicherte OAuth-Zugangsdaten entfernt
werden:

```bash
codex mcp logout cafekong
```

Bei Claude Code die Authentifizierungsoptionen des Servers unter `/mcp`
verwenden. Das Entfernen eines Client-Eintrags oder lokale Abmelden ersetzt
nicht den Widerruf im CafeKong-Profil. Alte Shell-Token-Exports erst entfernen,
wenn sie nicht mehr für die lokale Variante oder andere Clients benötigt werden.

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

## Offizielle Client-Referenzen

Die Einrichtung und verfügbaren CLI-Optionen können sich mit Client-Versionen
ändern. Bei Abweichungen zusätzlich die Hilfe der installierten CLI prüfen.

- [OpenAI Docs: MCP-Konfiguration und OAuth](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [Claude Code: MCP-Installation, Scopes und Authentifizierung](https://code.claude.com/docs/en/mcp)
