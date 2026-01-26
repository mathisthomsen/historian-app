# Logwatch Mail-Konfiguration mit Resend

## Resend SMTP Setup für Logwatch

Da du bereits **Resend** für System-Mails verwendest, können wir dasselbe für Logwatch nutzen!

---

## Setup: "Internet with smarthost" + Resend

### 1. Wähle "Internet with smarthost"

### 2. System Mail Name
```
evidoxa.com
```

### 3. Smarthost
```
smtp.resend.com:587
```
(oder `smtp.resend.com:465` für SSL)

---

## Resend SMTP Credentials konfigurieren

### Schritt 1: Resend SMTP-Daten holen

1. Gehe zu [Resend Dashboard](https://resend.com/dashboard)
2. Wähle dein API Key oder erstelle einen neuen
3. Gehe zu **SMTP** Tab
4. Kopiere:
   - **SMTP Host:** `smtp.resend.com`
   - **Port:** `587` (TLS) oder `465` (SSL)
   - **Username:** `resend`
   - **Password:** Dein API Key

### Schritt 2: Postfix konfigurieren

```bash
# Credentials-Datei erstellen
sudo nano /etc/postfix/sasl_passwd
```

Füge hinzu:
```
[smtp.resend.com]:587    resend:dein-resend-api-key
```

**Wichtig:** Ersetze `dein-resend-api-key` mit deinem tatsächlichen Resend API Key!

```bash
# Passwort-Datei verschlüsseln
sudo postmap /etc/postfix/sasl_passwd
sudo chmod 600 /etc/postfix/sasl_passwd

# Postfix Config erweitern
sudo nano /etc/postfix/main.cf
```

Füge am Ende hinzu:
```
relayhost = [smtp.resend.com]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_tls_security_level = encrypt
smtp_tls_note_starttls_offer = yes
```

```bash
# Postfix neu laden
sudo systemctl restart postfix

# Test-Mail senden
echo "Test von Server" | mail -s "Logwatch Test" deine@email.com
```

---

## Automatisiertes Setup-Script

Alternativ kannst du dieses Script verwenden:

```bash
#!/bin/bash
# Resend SMTP Setup für Postfix

read -p "Resend API Key: " RESEND_API_KEY
read -p "E-Mail-Adresse für Tests: " TEST_EMAIL

# Credentials
echo "[smtp.resend.com]:587    resend:${RESEND_API_KEY}" | sudo tee /etc/postfix/sasl_passwd
sudo postmap /etc/postfix/sasl_passwd
sudo chmod 600 /etc/postfix/sasl_passwd

# Postfix Config
sudo bash -c 'cat >> /etc/postfix/main.cf << EOF

# Resend SMTP Configuration
relayhost = [smtp.resend.com]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_tls_security_level = encrypt
smtp_tls_note_starttls_offer = yes
EOF'

# Postfix neu laden
sudo systemctl restart postfix

# Test
echo "Test von Server" | mail -s "Resend Test" "${TEST_EMAIL}"
echo "Test-Mail gesendet an ${TEST_EMAIL}"
```

---

## Resend SMTP Details

| Setting | Wert |
|---------|------|
| **SMTP Host** | `smtp.resend.com` |
| **Port (TLS)** | `587` |
| **Port (SSL)** | `465` |
| **Username** | `resend` |
| **Password** | Dein Resend API Key |
| **From Address** | Muss verifizierte Domain sein (z.B. `noreply@evidoxa.com`) |

**Wichtig:** 
- Die "From"-Adresse muss eine **verifizierte Domain** in Resend sein
- Für Logwatch: Setze `MailFrom` in `/etc/logwatch/conf/logwatch.conf` auf deine verifizierte Domain

---

## Logwatch Config anpassen

Nach Postfix-Setup, passe Logwatch an:

```bash
sudo nano /etc/logwatch/conf/logwatch.conf
```

Stelle sicher, dass:
```
MailFrom = logwatch@evidoxa.com
```

(Verwende deine verifizierte Resend-Domain!)

---

## Test

```bash
# Test-Mail senden
echo "Dies ist ein Test von Logwatch" | mail -s "Logwatch Test" deine@email.com

# Prüfe Postfix Logs
sudo tail -f /var/log/mail.log

# Prüfe Resend Dashboard
# Gehe zu Logs → Siehst du die E-Mail?
```

---

## Troubleshooting

### E-Mails kommen nicht an

```bash
# Prüfe Postfix Logs
sudo tail -f /var/log/mail.log

# Prüfe ob Credentials korrekt sind
sudo cat /etc/postfix/sasl_passwd

# Teste Verbindung
sudo postfix check
```

### "Authentication failed"

- Prüfe ob API Key korrekt ist
- Prüfe ob Username `resend` ist (nicht deine E-Mail!)

### "Relay access denied"

- Prüfe ob `relayhost` korrekt gesetzt ist
- Prüfe ob `smtp_sasl_auth_enable = yes` gesetzt ist

---

## Zusammenfassung

**Für Logwatch mit Resend:**

1. Wähle **"Internet with smarthost"**
2. System Mail Name: `evidoxa.com`
3. Smarthost: `smtp.resend.com:587`
4. Konfiguriere Postfix:
   ```bash
   echo "[smtp.resend.com]:587    resend:DEIN_API_KEY" | sudo tee /etc/postfix/sasl_passwd
   sudo postmap /etc/postfix/sasl_passwd
   # Config in main.cf hinzufügen (siehe oben)
   sudo systemctl restart postfix
   ```
5. Test: `echo "Test" | mail -s "Test" deine@email.com`

**Vorteil:** Du nutzt bereits Resend, also keine zusätzlichen Credentials nötig! 🎉
