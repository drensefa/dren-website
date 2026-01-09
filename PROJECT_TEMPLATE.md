# Project Template für neue Listings

## JSON Struktur für projects.json

Nutze diese Template-Struktur für alle neuen Immobilien-Listings:

```json
{
  "id": 4,
  "title": "Projektname",
  "location": "Standort, Dubai",
  "price": "1500000",
  "developer": "Entwickler Name",
  "status": "Off Plan",
  "handover": "Q2 2027",
  "paymentPlan": "30/70",
  "propertyTypes": "1-3 Bedroom Apartments | Penthouses",
  "images": [
    "images/projekt-main.jpg",
    "images/projekt-1.jpg",
    "images/projekt-2.jpg",
    "images/projekt-3.jpg",
    "images/projekt-4.jpg"
  ],
  "description_en": "Short, compelling overview (2-3 sentences). Highlight key selling points and unique features.",
  "description_de": "Kurze, überzeugende Übersicht (2-3 Sätze). Hebe wichtige Verkaufsargumente und einzigartige Merkmale hervor.",
  "description_sq": "Përmbledhje e shkurtër dhe bindëse (2-3 fjali). Theksoni pikat kryesore të shitjes dhe karakteristikat unike.",
  "amenities_en": "Feature 1 | Feature 2 | Feature 3 | Feature 4 | Feature 5",
  "amenities_de": "Merkmal 1 | Merkmal 2 | Merkmal 3 | Merkmal 4 | Merkmal 5",
  "amenities_sq": "Veçoria 1 | Veçoria 2 | Veçoria 3 | Veçoria 4 | Veçoria 5",
  "title_de": "Projektname (Deutsch)",
  "title_sq": "Projektname (Shqip)",
  "location_de": "Standort, Dubai",
  "location_sq": "Vendndodhja, Dubai"
}
```

## Pflichtfelder

### Grunddaten:
- `id` - Eindeutige Nummer (fortlaufend)
- `title` - Projektname (Englisch)
- `location` - Standort (Englisch)
- `price` - Preis als **String** (z.B. "2500000")
- `developer` - Entwickler Name
- `status` - "Off Plan" oder "Ready"
- `handover` - Übergabedatum (z.B. "Q4 2026" oder "August 2029")

### Neue strukturierte Felder:
- `paymentPlan` - Zahlungsplan kurz (z.B. "20/50/30" oder "1% Monthly")
- `propertyTypes` - Immobilientypen (z.B. "1-5 Bed Apartments | Penthouses")

### Bilder:
- `images` - Array mit 5 Bildern (erste ist Hauptbild)
  - Nutze lokale Pfade: `images/projektname-X.jpg`
  - Oder externe URLs

### Beschreibungen:
- `description_en/de/sq` - **Kurze Übersicht** (2-4 Sätze, KEIN HTML!)
  - Fokus auf Selling Points
  - Keine Bullet-Lists mehr!

### Ausstattung:
- `amenities_en/de/sq` - Pipe-separierte Liste (z.B. "Pool | Gym | Security")
  - Werden als Badges angezeigt
  - 5-8 wichtigste Features

### Übersetzungen:
- `title_de/sq` - Übersetzte Titel
- `location_de/sq` - Übersetzte Standorte

## Beispiele

### Zahlungsplan Formate:
- `"20/50/30"` = 20% Anzahlung, 50% Bauzeit, 30% Übergabe
- `"60/40"` = 60% Bauzeit, 40% Übergabe
- `"1% Monthly"` = 1% monatliche Raten
- `"10/80/10"` = 10% down, 80% construction, 10% handover

### Property Types:
- `"1-5 Bed Apartments | Penthouses | Townhouses"`
- `"Studio - 3 Bed Apartments"`
- `"2-4 Bedroom Villas"`

### Amenities (Beispiele):
- Deutsch: "Privatstrand | Pool | Gym | 24/7 Security | Concierge | Parkplatz | Spa"
- English: "Private Beach | Pool | Gym | 24/7 Security | Concierge | Parking | Spa"
- Shqip: "Plazh Privat | Pishinë | Palestër | Siguri 24/7 | Concierge | Parking | Spa"

## WICHTIG: Preis als String!

```json
✅ RICHTIG: "price": "2500000"
❌ FALSCH:  "price": 2500000
```

Der Preis MUSS als String in Anführungszeichen stehen, sonst stürzt die Seite ab!

## Design wird automatisch angewendet

Die Detailseite (`project-detail.html`) nutzt diese Struktur automatisch:
- Overview-Text wird oben angezeigt
- Payment Plan Kachel (wenn vorhanden)
- Property Types Kachel (wenn vorhanden)
- Amenities als stylische Badges
- Sidebar mit Preis, Developer, Status, Handover

Keine Code-Änderungen nötig - einfach JSON ausfüllen und fertig!
