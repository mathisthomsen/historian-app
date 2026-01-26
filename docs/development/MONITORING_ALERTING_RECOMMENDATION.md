# Monitoring & Alerting – Empfehlung nach Sicherheitsleck

## Kontext

- **1 VPS** mit Historian App (Next.js, Redis, Nginx) + WordPress (MySQL, PHP-FPM)
- Bereits: Fail2ban, UFW, Security Hardening
- Ziel: zuverlässig, angemessen, **nicht mit Kanonen auf Spatzen**

---

## Deine Optionen im Vergleich

### 1. Prometheus + Grafana + Alertmanager

| Aspekt | Bewertung |
|--------|-----------|
| **Stärken** | Metriken, Dashboards, flexible Alerts, Branchen-Standard |
| **Aufwand** | Hoch: Prometheus, Grafana, Alertmanager, node_exporter, ggf. cAdvisor |
| **Ressourcen** | ~500 MB–1 GB+ RAM, Storage für Time-Series |
| **Wartung** | Config, Retention, Updates, Dashboards pflegen |

**Fazit:** Passt gut zu **mehreren Servern**, Microservices, Kubernetes. Für **einen** VPS mit 2 Anwendungen tendenziell **Overkill** – viele Komponenten für wenig Nutzen.

---

### 2. Monit + Logwatch

| Aspekt | Bewertung |
|--------|-----------|
| **Stärken** | Leichtgewichtig, wenig Config, wenig Ressourcen |
| **Monit** | Überwacht Prozesse/Container, Restart bei Ausfall, Alerts (Mail/Webhook) |
| **Logwatch** | Täglicher Log-Digest (Auth, Nginx, etc.) – gut für **Security-Awareness** |
| **Aufwand** | Gering |
| **Ressourcen** | Vernachlässigbar |

**Fazit:** Gut geeignet für **einen** VPS: zuverlässig, angemessen, wenig Overhead.

---

## Empfehlung: **Monit + Logwatch** als Basis

**Warum das passt:**

1. **Zuverlässig:** Monit startet abgestürzte Container/Dienste neu und kann dich per Mail/Webhook alarmieren.
2. **Angemessen:** Kein eigener Metrik-Stack, kein zusätzlicher Speicherbedarf.
3. **Security-relevant:** Logwatch liefert täglich einen Überblick über Logs (z. B. Failed Logins, Nginx-Fehler) – ideal nach einem Sicherheitsvorfall.
4. **Einfach:** Install, konfigurieren, laufen lassen.

**Was du damit abdeckst:**

- **Prozess-/Container-Überwachung** (Monit): Historian App, Nginx, Redis, WordPress-Container, ggf. MySQL.
- **Auto-Recovery:** Monit startet Dienste bei Absturz neu.
- **Alerting:** Mail oder Webhook (z. B. Telegram, Slack) bei Ausfall oder Schwellwerten (CPU, Disk, Memory).
- **Security & Log-Überblick:** Logwatch als tägliche E-Mail mit Highlights aus Auth-, Nginx-, System-Logs.

---

## Optional: Erweiterung um Uptime-Checks

Wenn du zusätzlich **„Läuft die Website von außen?“** prüfen willst:

- **[Uptime Kuma](https://github.com/louislam/uptime-kuma)** (self-hosted, 1 Container):  
  HTTP(S)-Checks für evidoxa.com, bhgv.evidoxa.com, ggf. Health-Endpoints. Alerts per Mail, Telegram, Slack, etc.  
  Leichtgewichtig, guter Kompromiss zwischen „einfach“ und „sichtbar“.

- **[Healthchecks.io](https://healthchecks.io)** (SaaS, Free Tier):  
  Extern gehostet, keine eigenen Container. Gut für Cron-Jobs, Scheduled Tasks, Ping-URLs.

**Empfehlung:** Monit + Logwatch **erst mal** einführen. Wenn du merkst, dass dir HTTP-Uptime-Monitoring fehlt, Uptime Kuma (oder Healthchecks.io) **dazu** nehmen – ohne Prometheus/Grafana.

---

## Was du *nicht* brauchst (für dein Setup)

- **Prometheus + Grafana + Alertmanager:** Erst sinnvoll, wenn du mehrere Server, viele Services oder detaillierte Metriken/APM brauchst.
- **Komplexe Log-Aggregation (ELK, Loki, etc.):** Ebenfalls Overkill für einen einzelnen VPS; Logwatch reicht für den täglichen Überblick.

---

## Nächste Schritte (konkret)

1. **Monit** installieren und konfigurieren:
   - Docker-Container (historian-app, nginx, redis, wordpress-app, mysql) überwachen.
   - Bei Bedarf: Checks für Disk, CPU, Memory.
   - Alerting: Mail und/oder Webhook (z. B. Telegram).

2. **Logwatch** einrichten:
   - Täglich E-Mail mit Log-Digest (Auth, Nginx, System).
   - E-Mail-Adresse für Alerts/Reports festlegen.

3. **(Optional)** **Uptime Kuma** deployen:
   - Einmaliger Setup (Compose/Container).
   - HTTP(S)-Checks für evidoxa.com, bhgv.evidoxa.com.
   - Alerts über denselben Kanal wie Monit (oder getrennt, je nach Präferenz).

---

## Kurzfassung

| Ziel | Lösung |
|------|--------|
| **Zuverlässig** | Monit (Prozesse/Container, Auto-Restart, Alerts) |
| **Angemessen** | Monit + Logwatch, kein Prometheus-Stack |
| **Security-Awareness** | Logwatch (täglicher Log-Digest) |
| **Optional: „Ist die Seite erreichbar?“** | Uptime Kuma oder Healthchecks.io |

**Empfehlung:** Mit **Monit + Logwatch** starten. Das ist robust, passend für einen VPS und deckt Monitoring + Alerting + Security-Überblick gut ab. Prometheus/Grafana kannst du später ergänzen, wenn du mehrere Server oder tiefere Metriken brauchst.

Wenn du magst, kann als Nächstes eine konkrete **Monit-Config** (inkl. Docker-Checks und Alerting) sowie eine **Logwatch-Setup-Anleitung** für deinen Server ausgearbeitet werden.
