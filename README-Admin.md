# Admin Panel - Mietservice Trapp

Ein einfaches Admin-Panel zum Verwalten von Artikeln für die Mietservice Trapp Website.

## Features

- ✅ Artikel hinzufügen, bearbeiten und löschen
- ✅ Kategorisierung (Anhänger, Party & Events, Bauarbeiten)
- ✅ Bild-URLs für Artikel
- ✅ Eigenschaften/Features pro Artikel
- ✅ Verfügbarkeitsstatus
- ✅ Preisangaben
- ✅ JSON-basierte Datenspeicherung
- ✅ Responsive Design
- ✅ Automatische Integration in bestehende Kategorieseiten

## Installation

### 1. Node.js installieren
Stellen Sie sicher, dass Node.js (Version 14 oder höher) installiert ist:
```bash
node --version
npm --version
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Server starten
```bash
npm start
```

Für Entwicklung mit automatischem Neustart:
```bash
npm run dev
```

## Verwendung

### Admin Panel aufrufen
Nach dem Start des Servers ist das Admin Panel verfügbar unter:
```
http://localhost:3000/admin
```

### API Endpoints
- `GET /api/articles` - Alle Artikel abrufen
- `GET /api/articles/category/:category` - Artikel nach Kategorie
- `GET /api/articles/:id` - Einzelnen Artikel abrufen
- `POST /api/articles` - Neuen Artikel erstellen
- `PUT /api/articles/:id` - Artikel aktualisieren
- `DELETE /api/articles/:id` - Artikel löschen

### Artikel hinzufügen
1. Admin Panel öffnen
2. Formular ausfüllen:
   - **Titel**: Name des Artikels
   - **Kategorie**: anhaenger, party-events, oder bauarbeiten
   - **Beschreibung**: Detaillierte Beschreibung
   - **Preis**: Preis pro Tag in Euro
   - **Bild-URL**: Optional, Link zu einem Bild
   - **Eigenschaften**: Optional, eine pro Zeile
   - **Verfügbar**: Checkbox für Verfügbarkeitsstatus

### Artikel bearbeiten/löschen
- In der Artikelliste auf "Bearbeiten" oder "Löschen" klicken
- Änderungen werden sofort gespeichert

## Datenspeicherung

Alle Artikel werden in der Datei `articles.json` gespeichert. Diese Datei wird automatisch erstellt, wenn sie nicht existiert.

### Beispiel-Artikel-Struktur:
```json
{
  "id": "uuid-string",
  "title": "Baumaschine XY",
  "category": "bauarbeiten",
  "description": "Professionelle Baumaschine für...",
  "price": 45.00,
  "imageUrl": "https://example.com/image.jpg",
  "features": ["Feature 1", "Feature 2"],
  "available": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Integration in bestehende Website

Die Kategorieseiten (anhaenger.html, party-events.html, bauarbeiten.html) laden automatisch die entsprechenden Artikel aus der JSON-Datei und zeigen sie anstelle der Platzhalter an.

### Automatische Integration:
- Das `products-loader.js` Skript ist bereits in die Kategorieseiten eingebunden
- Artikel werden automatisch nach Kategorie gefiltert und angezeigt
- Responsive Produktkarten mit allen Artikeldetails

## Sicherheitshinweise

⚠️ **Wichtig**: Das Admin Panel ist öffentlich zugänglich (wie gewünscht). Für Produktionsumgebungen sollten Sie:

1. **Zugriffsbeschränkung** implementieren (IP-Whitelist, Basic Auth, etc.)
2. **HTTPS** verwenden
3. **Input-Validierung** erweitern
4. **Backup-Strategie** für articles.json implementieren

## Backup

Erstellen Sie regelmäßig Backups der `articles.json` Datei:
```bash
cp articles.json articles-backup-$(date +%Y%m%d).json
```

## Troubleshooting

### Server startet nicht
- Prüfen Sie, ob Port 3000 bereits verwendet wird
- Installieren Sie die Abhängigkeiten neu: `npm install`

### Artikel werden nicht angezeigt
- Prüfen Sie, ob der Server läuft
- Öffnen Sie die Browser-Konsole für Fehlermeldungen
- Prüfen Sie die Netzwerk-Registerkarte in den Entwicklertools

### CORS-Fehler
- Stellen Sie sicher, dass Frontend und Backend auf derselben Domain laufen
- Für verschiedene Domains passen Sie die CORS-Konfiguration in `server.js` an

## Erweiterungsmöglichkeiten

- **Bildupload**: Lokale Bildverwaltung statt URLs
- **Kategorien verwalten**: Dynamische Kategorienverwaltung
- **Benutzerauthentifizierung**: Login-System
- **Erweiterte Suche**: Volltext-Suche in Artikeln
- **Statistiken**: Dashboard mit Artikel-Statistiken
- **Export/Import**: CSV/Excel Export/Import Funktionalität

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Prüfen Sie die Server-Logs
3. Stellen Sie sicher, dass alle Abhängigkeiten installiert sind