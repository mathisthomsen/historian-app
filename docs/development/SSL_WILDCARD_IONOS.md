# Wildcard-SSL mit Let's Encrypt und Ionos (DNS-01)

Ein einziges Zertifikat für **evidoxa.com** und **\*.evidoxa.com** (inkl. bhgv.evidoxa.com). Kein separates Zertifikat für bhgv nötig, keine „unsafe“-Meldung mehr.

## Voraussetzungen

- **DNS für evidoxa.com** wird bei **Ionos** verwaltet (gleicher Anbieter wie in der Ionos-API).
- Du hast einen **Ionos Remote User** mit API-Zugang (Prefix + Secret).

## 1. Ionos API-Zugang anlegen

1. Im Ionos-Kundenbereich: **System → Remote Users** (oder [Ionos Developer](https://developer.hosting.ionos.de/?source=IonosControlPanel)).
2. Neuen Remote User anlegen oder bestehenden nutzen.
3. Rechte setzen:
   - **Client Functions**
   - **DNS zone functions**
   - **DNS txt functions**
4. **Prefix** und **Secret** notieren (Secret nur einmal sichtbar).

## 2. Zugangsdaten als Secrets/Env setzen

- **Lokal / auf dem Server:** In `.env` eintragen (Datei nicht committen, bleibt nur auf dem Server):

  ```ini
  IONOS_DNS_PREFIX=dein-api-prefix
  IONOS_DNS_SECRET=dein-api-secret
  ```

  Optional, falls du einen anderen Endpoint brauchst:

  ```ini
  IONOS_DNS_ENDPOINT=https://api.hosting.ionos.com
  ```

- **GitHub Actions:** In den Repo-Secrets anlegen:
  - `IONOS_DNS_PREFIX`
  - `IONOS_DNS_SECRET`  
  Dann im Deploy-Workflow die `.env` auf dem Server um diese Werte ergänzen (siehe Abschnitt „Workflow“ unten), wenn du Wildcard im automatischen Deploy nutzen willst.

## 3. Wildcard-Zertifikat anfordern

**Auf dem Server** (nach Deploy, mit Zugriff auf die aktuelle Codebasis und `.env`):

```bash
cd /opt/historian-app/production
./scripts/build/deploy-production.sh ssl-wildcard
```

Das Skript:

- erstellt aus `IONOS_DNS_PREFIX` / `IONOS_DNS_SECRET` eine Credentials-Datei unter `certbot-secrets/ionos.ini`,
- installiert im Certbot-Container das Plugin `certbot-dns-ionos`,
- fordert ein Zertifikat für **evidoxa.com** und **\*.evidoxa.com** per DNS-01 an,
- schaltet Nginx auf `nginx-ssl-wildcard.conf` um (ein Zertifikat für beide Domains).

Danach sollten **evidoxa.com** und **bhgv.evidoxa.com** mit demselben Zertifikat und ohne „connection not private“ laufen.

## 4. Verzeichnis für Credentials

- `certbot-secrets/` wird vom Skript angelegt und enthält `ionos.ini`.
- Dieses Verzeichnis sollte **nicht** ins Repo (z. B. in `.gitignore`).
- Für **Erneuerung** des Wildcard-Zertifikats muss Certbot wieder mit dem Plugin und dieser Credentials-Datei laufen (siehe Erneuerung).

## 5. Erneuerung (Renewal)

Das Standard-`renew` im Deploy-Skript nutzt nur HTTP-01. Für das **Wildcard-Zertifikat** gibt es den Befehl **`renew-wildcard`** (nutzt DNS-01 wie bei ssl-wildcard).

**Manuell oder per Cron:**

```bash
cd /opt/historian-app/production
./scripts/build/deploy-production.sh renew-wildcard
```

**Cron (z. B. monatlich):** `0 3 1 * * root cd /opt/historian-app/production && ./scripts/build/deploy-production.sh renew-wildcard`

## 6. Workflow (optional): Wildcard im automatischen Deploy

Wenn die Ionos-Credentials in GitHub Secrets liegen, kannst du die Server-`.env` im Deploy um sie ergänzen, damit z. B. ein manueller Aufruf von `ssl-wildcard` auf dem Server nach dem Deploy funktioniert:

- Im Step „Write .env on server“ zusätzlich eintragen (nur wenn die Secrets gesetzt sind):

  ```yaml
  IONOS_DNS_PREFIX=${{ secrets.IONOS_DNS_PREFIX }}
  IONOS_DNS_SECRET=${{ secrets.IONOS_DNS_SECRET }}
  ```

Du musst **nicht** in jedem Deploy `ssl-wildcard` ausführen; einmal anfordern, danach Erneuerung wie oben reicht.

## Kurzüberblick

| Schritt | Aktion |
|--------|--------|
| 1 | Ionos Remote User mit DNS-Rechten anlegen, Prefix + Secret sichern |
| 2 | `IONOS_DNS_PREFIX` und `IONOS_DNS_SECRET` in Server-.env (und ggf. GitHub Secrets) setzen |
| 3 | Auf dem Server: `./scripts/build/deploy-production.sh ssl-wildcard` ausführen |
| 4 | Erneuerung: wie in Abschnitt 5 (manuell oder zukünftiger `renew-wildcard`-Befehl) |

Nach Schritt 3 nutzen evidoxa.com und bhgv.evidoxa.com dasselbe Wildcard-Zertifikat; die Browser-Warnung für bhgv entfällt.
