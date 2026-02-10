# Logwatch: Keine E-Mails / Nichts in Resend

Wenn du **keine Logwatch-E-Mails** bekommst und in **Resend unter Logs auch nichts** erscheint, erreicht die Mail Resend nie. Typische Ursachen und Lösung:

---

## Schnell-Check auf dem Server

Im Repo gibt es ein Diagnose-Script. **Auf dem Server** (im Projektordner oder mit dem Script-Pfad):

```bash
cd /opt/historian-app/production   # oder wo dein Repo liegt
sudo bash scripts/monitoring/check-logwatch-resend.sh
```

Das Script prüft: Postfix, Relayhost, SASL, Generic Maps, Logwatch MailFrom, Cron und zeigt konkrete Befehle zum Beheben.

---

## Häufige Ursachen

### 1. From-Adresse von Resend abgelehnt

**Symptom:** In Resend erscheint nichts (Mail wird schon vorher abgelehnt oder gar nicht erst gesendet).

**Ursache:** Resend akzeptiert nur **verifizierte** Absenderadressen. Standardmäßig sendet der Server als `root@hostname` (z.B. `root@ubuntu`). Diese Adresse ist bei Resend nicht verifiziert → Fehler z.B. `550 Invalid 'from' field`.

**Lösung:**

1. **Postfix Generic Maps** setzen, damit `root@hostname` auf deine verifizierte Adresse gemappt wird:

   ```bash
   # Hostname anzeigen
   hostname

   # Eintrag für DEINEN Hostname (Beispiel: ubuntu)
   echo 'root@ubuntu logwatch@evidoxa.com' | sudo tee /etc/postfix/generic
   sudo postmap /etc/postfix/generic
   sudo postconf -e 'smtp_generic_maps = hash:/etc/postfix/generic'
   sudo systemctl restart postfix
   ```

   Wichtig: `root@ubuntu` durch `root@$(hostname)` ersetzen, wenn dein Hostname anders ist.

2. **Logwatch MailFrom** auf die gleiche verifizierte Adresse setzen:

   ```bash
   sudo nano /etc/logwatch/conf/logwatch.conf
   ```

   Zeile anpassen/hinzufügen:

   ```
   MailFrom = logwatch@evidoxa.com
   ```

   (Falls dort noch `MailFrom = logwatch@$(hostname)` steht, genau so ersetzen.)

---

### 2. Postfix sendet nicht an Resend (Relay/SASL)

**Prüfen:**

```bash
# Läuft Postfix?
systemctl status postfix

# Resend als Relay?
postconf relayhost
# Erwartung: relayhost = [smtp.resend.com]:587

# SASL aktiv?
postconf smtp_sasl_auth_enable
# Erwartung: smtp_sasl_auth_enable = yes
```

**Credentials:**

```bash
# Datei existiert? (Inhalt nicht anzeigen lassen wegen API-Key!)
ls -la /etc/postfix/sasl_passwd /etc/postfix/sasl_passwd.db
```

Inhalt von `sasl_passwd` (eine Zeile):

```
[smtp.resend.com]:587    resend:DEIN_RESEND_API_KEY
```

- Username muss **genau** `resend` sein (nicht deine E-Mail).
- Nach Änderung: `sudo postmap /etc/postfix/sasl_passwd` und `sudo systemctl restart postfix`.

Vollständige Anleitung: [LOGWATCH_RESEND_SETUP.md](./LOGWATCH_RESEND_SETUP.md).

---

### 3. Logwatch wird gar nicht ausgeführt (Cron)

**Prüfen:**

```bash
crontab -l
```

Erwartung: ein Eintrag wie:

```
0 6 * * * /usr/sbin/logwatch --output mail --mailto deine@email.com --detail medium
```

- Wenn **kein** Logwatch-Eintrag da ist: Cron-Job einrichten (siehe [MONITORING_SETUP_GUIDE.md](./MONITORING_SETUP_GUIDE.md) oder `scripts/monitoring/setup-logwatch.sh`).
- Cron läuft als **root** – gleiche Umgebung wie beim manuellen Test mit `mail` unten.

---

### 4. Manueller Test

So siehst du, ob Postfix + Resend überhaupt funktionieren:

```bash
# Test-Mail (Empfänger durch deine echte Adresse ersetzen)
echo "Test $(date)" | mail -s "Logwatch Test" deine@email.com

# Logs beobachten (je nach Setup eine der beiden Dateien)
tail -f /var/log/postfix.log
# oder
tail -f /var/log/mail.log
```

- **status=sent** oder **250 …** → Mail ging an Resend; in Resend unter **Logs** prüfen und ggf. Spam/Postfach prüfen.
- **550 Invalid 'from'** → Generic Maps und/oder Logwatch MailFrom anpassen (siehe Abschnitt 1).
- **Authentication failed** → SASL/API-Key prüfen (Username `resend`, korrekter API-Key, `postmap` ausgeführt).
- **Connection timed out** → Firewall/Netzwerk (Port 587).

---

### 5. Logwatch einmal von Hand ausführen

Damit du siehst, ob der Report gebaut und versendet wird:

```bash
# E-Mail-Adresse durch die gewünschte Empfängeradresse ersetzen
/usr/sbin/logwatch --output mail --mailto deine@email.com --detail medium --range yesterday
```

Dann wieder Postfix-Log beobachten und in Resend unter Logs nachsehen.

### 6. „You have old files in your logwatch tmpdir“

Logwatch meldet alte Temp-Verzeichnisse von abgebrochenen Läufen (z.B. `logwatch.gou_rXKJ`) und kann dann pausieren oder die Meldung stören.

**Aufräumen:**

```bash
sudo rm -rf /tmp/logwatch.*
```

Danach den Report erneut ausführen. Die Mail kann trotzdem schon versendet worden sein – in `/var/log/postfix.log` nach `status=sent` schauen.

---

## Checkliste (kurz)

- [ ] `sudo bash scripts/monitoring/check-logwatch-resend.sh` ohne Fehler
- [ ] Postfix läuft: `systemctl status postfix`
- [ ] `relayhost = [smtp.resend.com]:587`, SASL aktiv, `sasl_passwd` + `postmap` korrekt
- [ ] Generic Map: `root@$(hostname)` → `logwatch@evidoxa.com`, `postmap /etc/postfix/generic`, Postfix neu gestartet
- [ ] In `/etc/logwatch/conf/logwatch.conf`: `MailFrom = logwatch@evidoxa.com`
- [ ] Cron: `crontab -l` enthält Logwatch-Job
- [ ] Test: `echo "Test" | mail -s "Test" deine@email.com` → in Resend Logs sichtbar, Mail kommt an

---

## Weitere Docs

- [LOGWATCH_RESEND_SETUP.md](./LOGWATCH_RESEND_SETUP.md) – Resend SMTP einrichten
- [POSTFIX_RESEND_TROUBLESHOOTING.md](./POSTFIX_RESEND_TROUBLESHOOTING.md) – From-Adresse und Generic Maps
- [MONITORING_SETUP_GUIDE.md](./MONITORING_SETUP_GUIDE.md) – Logwatch/Monit Übersicht
