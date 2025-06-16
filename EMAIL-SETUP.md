# E-Mail Setup für Kontaktformular

## 📧 Einrichtung der E-Mail-Funktionalität

### Schritt 1: Abhängigkeiten installieren
```bash
npm install
```

### Schritt 2: E-Mail-Konfiguration erstellen
1. Kopieren Sie `.env.example` zu `.env`:
   ```bash
   copy .env.example .env
   ```

2. Bearbeiten Sie die `.env` Datei mit Ihren E-Mail-Daten

### Schritt 3: Gmail Setup (Empfohlen)

#### Option A: Gmail mit App-Passwort (Sicher)
1. Gehen Sie zu Ihrem Google-Konto: https://myaccount.google.com/
2. Aktivieren Sie die 2-Faktor-Authentifizierung
3. Gehen Sie zu "Sicherheit" → "App-Passwörter"
4. Erstellen Sie ein neues App-Passwort für "Mail"
5. Tragen Sie in die `.env` Datei ein:
   ```
   EMAIL_USER=vermietung@simon-trapp.de
   EMAIL_PASS=ihr-16-stelliges-app-passwort
   ```

#### Option B: Andere E-Mail-Provider
Für andere Provider bearbeiten Sie `server.js` und ändern Sie die Transporter-Konfiguration:

```javascript
const transporter = nodemailer.createTransporter({
    host: 'smtp.ihr-provider.de',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
```

### Schritt 4: Server starten
```bash
npm start
```

### Schritt 5: Testen
1. Öffnen Sie http://localhost:3000/kontakt.html
2. Füllen Sie das Kontaktformular aus
3. Prüfen Sie Ihr E-Mail-Postfach

## 🔧 Häufige E-Mail-Provider Einstellungen

### Gmail
- Host: smtp.gmail.com
- Port: 587
- Secure: false
- Benötigt App-Passwort

### Outlook/Hotmail
- Host: smtp-mail.outlook.com
- Port: 587
- Secure: false

### Yahoo
- Host: smtp.mail.yahoo.com
- Port: 587
- Secure: false

### 1&1/IONOS
- Host: smtp.1und1.de
- Port: 587
- Secure: false

### Strato
- Host: smtp.strato.de
- Port: 465
- Secure: true

## 🚨 Wichtige Sicherheitshinweise

1. **Niemals** echte Passwörter in den Code schreiben
2. Die `.env` Datei sollte **nicht** in Git committed werden
3. Verwenden Sie App-Passwörter statt echte Passwörter
4. Für Produktionsumgebungen verwenden Sie sichere Umgebungsvariablen

## 📝 Funktionsweise

1. Benutzer füllt Kontaktformular aus
2. JavaScript sendet Daten an `/api/contact`
3. Server validiert die Daten
4. E-Mail wird an `vermietung@simon-trapp.de` gesendet
5. Benutzer erhält Bestätigung

## 🔍 Fehlerbehebung

### "Authentication failed"
- Prüfen Sie E-Mail und Passwort
- Verwenden Sie App-Passwort statt normales Passwort
- Aktivieren Sie "Weniger sichere Apps" (nicht empfohlen)

### "Connection timeout"
- Prüfen Sie Host und Port
- Firewall könnte SMTP blockieren

### "Self signed certificate"
- Fügen Sie `tls: { rejectUnauthorized: false }` zur Konfiguration hinzu (nur für Tests)

## 📞 Support

Bei Problemen kontaktieren Sie den Entwickler oder prüfen Sie die Konsole für Fehlermeldungen.