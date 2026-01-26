# Postfix Resend Troubleshooting - GELÖST ✅

## Problem

Postfix verbindet sich erfolgreich zu Resend, aber Resend lehnt die Mails ab mit:
- `550 Invalid 'from' field. The email address needs to follow the 'email@example.com' or 'Name <email@example.com>' format.`

**Ursache:** Die From-Adresse war `root@ubuntu` (nicht verifizierte Domain), Resend benötigt eine verifizierte Domain-Adresse.

---

## Lösung (implementiert)

### 1. Domain-Konfiguration
```bash
echo 'evidoxa.com' > /etc/mailname
postconf -e 'myhostname = evidoxa.com'
postconf -e 'mydomain = evidoxa.com'
postconf -e 'myorigin = $mydomain'
```

### 2. From-Adresse Mapping
```bash
# Generic Maps erstellen (root@ubuntu → logwatch@evidoxa.com)
postconf -e 'smtp_generic_maps = hash:/etc/postfix/generic'
echo 'root@ubuntu logwatch@evidoxa.com' > /etc/postfix/generic
postmap /etc/postfix/generic
```

### 3. Direktes Logging aktiviert
```bash
postconf -e 'maillog_file = /var/log/postfix.log'
```

### 4. Postfix neu starten
```bash
systemctl restart postfix
```

---

## Erfolgreiche Konfiguration

**Aktive Einstellungen:**
- **Relayhost:** `[smtp.resend.com]:587`
- **SASL Auth:** Aktiviert
- **From-Adresse:** `logwatch@evidoxa.com` (verifizierte Domain)
- **Logging:** `/var/log/postfix.log`

**Erfolgreiche Mail:**
```
status=sent (250 2f0fb221-3a79-4cde-9a80-3528c14abcc4)
```

---

## Wichtige Hinweise

1. **From-Adresse muss verifiziert sein:** Die verwendete From-Adresse (`logwatch@evidoxa.com`) muss in Resend verifiziert sein
2. **Logs:** Postfix-Logs sind jetzt in `/var/log/postfix.log` (nicht `/var/log/mail.log`)
3. **Test:** `echo "Test" | mail -s "Test" deine@email.com`

---

## Nützliche Befehle

```bash
# Mail senden
echo "Test" | mail -s "Subject" deine@email.com

# Queue prüfen
postqueue -p

# Logs prüfen
tail -f /var/log/postfix.log

# Postfix Status
systemctl status postfix

# Config prüfen
postconf | grep -E 'relayhost|smtp_sasl|smtp_generic'
```

---

## Status: ✅ FUNKTIONIERT

Postfix versendet jetzt erfolgreich E-Mails über Resend SMTP!
