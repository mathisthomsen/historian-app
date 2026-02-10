# Logwatch Mail-Konfiguration

## Welche Option wählen?

### **Empfehlung: "Internet with smarthost"**

**Warum?**
- Viele VPS-Provider blockieren direkte E-Mail-Auslieferung (Port 25)
- Externe SMTP-Server sind zuverlässiger (Gmail, SendGrid, etc.)
- Weniger Spam-Probleme
- Einfacher zu konfigurieren

### Optionen im Detail:

| Option | Wann verwenden | Vorteile | Nachteile |
|--------|----------------|----------|-----------|
| **Internet with smarthost** | ✅ **Empfohlen** | Zuverlässig, funktioniert fast überall | Benötigt SMTP-Credentials |
| **Internet Site** | Nur wenn Port 25 offen ist | Einfach, keine Credentials | Oft blockiert, Spam-Risiko |
| **Local only** | Nur für Tests | Funktioniert immer | E-Mails bleiben lokal |
| **No configuration** | Nicht empfohlen | - | Keine E-Mails möglich |

---

## Setup: "Internet with smarthost"

### 1. Wähle "Internet with smarthost"

### 2. System Mail Name
```
evidoxa.com
```
(oder dein Domain-Name)

### 3. Smarthost
**Option A: Gmail (einfach)**
```
smtp.gmail.com:587
```

**Option B: SendGrid**
```
smtp.sendgrid.net:587
```

**Option C: Anderer SMTP-Server**
```
dein-smtp-server.com:587
```

### 4. Credentials konfigurieren

Nach der Installation:

```bash
# Gmail Beispiel
sudo nano /etc/postfix/sasl_passwd

# Füge hinzu:
[smtp.gmail.com]:587    deine-email@gmail.com:app-password
```

**Gmail App-Password erstellen:**
1. Google Account → Sicherheit
2. 2-Faktor-Authentifizierung aktivieren
3. App-Passwörter → E-Mail → App-Passwort generieren

```bash
# Passwort-Datei verschlüsseln
sudo postmap /etc/postfix/sasl_passwd
sudo chmod 600 /etc/postfix/sasl_passwd

# Postfix Config erweitern
sudo nano /etc/postfix/main.cf
```

Füge hinzu:
```
relayhost = [smtp.gmail.com]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_tls_security_level = encrypt
smtp_tls_note_starttls_offer = yes
```

```bash
# Postfix neu laden
sudo systemctl restart postfix

# Test
echo "Test" | mail -s "Test" deine@email.com
```

---

## Alternative: Ohne Postfix (einfacher)

Falls Postfix zu kompliziert ist, kannst du Logwatch auch ohne Postfix verwenden:

### Option 1: Sendmail via msmtp (einfacher)

```bash
# Installiere msmtp
sudo apt-get install msmtp msmtp-mta

# Konfiguriere
sudo nano ~/.msmtprc
```

```
defaults
auth on
tls on
tls_trust_file /etc/ssl/certs/ca-certificates.crt

account gmail
host smtp.gmail.com
port 587
from deine-email@gmail.com
user deine-email@gmail.com
password dein-app-password

account default : gmail
```

```bash
# Test
echo "Test" | msmtp deine@email.com
```

### Option 2: Logwatch mit externem Script

Logwatch kann auch ein Custom-Script verwenden statt Mail:

```bash
# In /etc/logwatch/conf/logwatch.conf
MailTo = /usr/local/bin/send-logwatch-email.sh
```

---

## Schnellstart (Gmail)

```bash
# 1. Wähle "Internet with smarthost"
# 2. System Mail Name: evidoxa.com
# 3. Smarthost: smtp.gmail.com:587

# 4. Nach Installation:
sudo nano /etc/postfix/sasl_passwd
# Füge hinzu: [smtp.gmail.com]:587    deine-email@gmail.com:app-password

sudo postmap /etc/postfix/sasl_passwd
sudo chmod 600 /etc/postfix/sasl_passwd

sudo nano /etc/postfix/main.cf
# Füge am Ende hinzu:
relayhost = [smtp.gmail.com]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_tls_security_level = encrypt

sudo systemctl restart postfix

# 5. Test
echo "Test von Server" | mail -s "Test" deine@email.com
```

---

## Troubleshooting

### E-Mails kommen nicht an

```bash
# Prüfe Postfix Logs
sudo tail -f /var/log/mail.log

# Test-Mail senden
echo "Test" | mail -s "Test" deine@email.com

# Prüfe Postfix Status
sudo systemctl status postfix
```

### Port 25 blockiert

Das ist normal! Deshalb "Internet with smarthost" verwenden (Port 587).

### Gmail "Less secure app" Fehler

Verwende **App-Passwort**, nicht dein normales Passwort!

---

## Zusammenfassung

**Für Logwatch:**
1. Wähle **"Internet with smarthost"**
2. System Mail Name: `evidoxa.com`
3. Smarthost: `smtp.gmail.com:587` (oder dein SMTP)
4. Konfiguriere Credentials (siehe oben)
5. Teste mit: `echo "Test" | mail -s "Test" deine@email.com`

**Einfachste Lösung:** Gmail mit App-Password
