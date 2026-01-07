// Web Scraper für Immobilien-Daten
// Nutzt axios zum Laden von Webseiten und cheerio zum Parsen von HTML

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extrahiert Open Graph Tags von einer URL
 * @param {string} url - Die URL der Webseite, die gescraped werden soll
 */
async function scrapePropertyData(url) {
    try {
        console.log('Lade Daten von:', url);
        console.log('-----------------------------------\n');

        // Schritt 1: Webseite mit axios abrufen
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 Sekunden Timeout
        });

        // Schritt 2: HTML mit cheerio parsen
        const $ = cheerio.load(response.data);

        // Schritt 3: Open Graph Tags extrahieren
        const ogData = {
            title: $('meta[property="og:title"]').attr('content') ||
                   $('meta[name="title"]').attr('content') ||
                   $('title').text() ||
                   'Nicht gefunden',
            description: $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="description"]').attr('content') ||
                        'Nicht gefunden',
            image: $('meta[property="og:image"]').attr('content') ||
                   $('meta[name="image"]').attr('content') ||
                   'Nicht gefunden',
            price: $('meta[property="og:price:amount"]').attr('content') ||
                   $('meta[property="product:price:amount"]').attr('content') ||
                   $('meta[property="og:price"]').attr('content') ||
                   $('meta[name="price"]').attr('content') ||
                   'Nicht gefunden',
            url: $('meta[property="og:url"]').attr('content') ||
                 $('link[rel="canonical"]').attr('href') ||
                 url,
            type: $('meta[property="og:type"]').attr('content') || 'Nicht gefunden'
        };

        // Zusätzliche Immobilien-spezifische Meta Tags (falls vorhanden)
        const additionalData = {
            siteName: $('meta[property="og:site_name"]').attr('content') || 'Nicht gefunden',
            locale: $('meta[property="og:locale"]').attr('content') || 'Nicht gefunden'
        };

        // Debug: Alle Meta-Tags finden (hilfreich für Entwicklung)
        const allMetaTags = [];
        $('meta').each((i, elem) => {
            const property = $(elem).attr('property');
            const name = $(elem).attr('name');
            const content = $(elem).attr('content');
            if ((property || name) && content) {
                allMetaTags.push({
                    tag: property || name,
                    content: content.substring(0, 100)
                });
            }
        });

        // Schritt 4: Ergebnisse in der Konsole ausgeben
        console.log('📋 OPEN GRAPH DATEN:');
        console.log('====================\n');
        console.log('Titel:        ', ogData.title);
        console.log('Beschreibung: ', ogData.description.substring(0, 100) + (ogData.description.length > 100 ? '...' : ''));
        console.log('Bild URL:     ', ogData.image);
        console.log('Preis:        ', ogData.price);
        console.log('URL:          ', ogData.url);
        console.log('Typ:          ', ogData.type);
        console.log('\n📌 ZUSÄTZLICHE INFOS:');
        console.log('=====================\n');
        console.log('Website:      ', additionalData.siteName);
        console.log('Sprache:      ', additionalData.locale);

        // Debug-Info: Alle gefundenen Meta-Tags anzeigen
        if (allMetaTags.length > 0) {
            console.log('\n🔍 DEBUG - ALLE META TAGS:');
            console.log('===========================\n');
            console.log(`Gefunden: ${allMetaTags.length} Meta-Tags\n`);
            allMetaTags.slice(0, 10).forEach(tag => {
                console.log(`  ${tag.tag}: ${tag.content}`);
            });
            if (allMetaTags.length > 10) {
                console.log(`  ... und ${allMetaTags.length - 10} weitere`);
            }
        }

        console.log('\n-----------------------------------');
        console.log('✅ Scraping erfolgreich abgeschlossen!');

        // Rückgabe der Daten (für zukünftige Verwendung)
        return {
            ...ogData,
            ...additionalData
        };

    } catch (error) {
        console.error('\n❌ FEHLER beim Scraping:');
        console.error('========================\n');

        if (error.response) {
            console.error(`HTTP Error ${error.response.status}: ${error.response.statusText}`);
            console.error('Die Webseite hat einen Fehler zurückgegeben.');
        } else if (error.request) {
            console.error('Keine Antwort von der Webseite erhalten.');
            console.error('Überprüfe deine Internetverbindung oder die URL.');
        } else {
            console.error('Fehler:', error.message);
        }

        process.exit(1);
    }
}

// Hauptfunktion - wird beim Aufruf des Skripts ausgeführt
async function main() {
    // URL aus den Kommandozeilen-Argumenten holen
    const url = process.argv[2];

    // Überprüfen, ob eine URL angegeben wurde
    if (!url) {
        console.error('\n❌ FEHLER: Keine URL angegeben!');
        console.log('\n📖 VERWENDUNG:');
        console.log('=============');
        console.log('node scraper.js <URL>\n');
        console.log('Beispiel:');
        console.log('node scraper.js https://www.example.com/property\n');
        process.exit(1);
    }

    // URL validieren
    try {
        new URL(url);
    } catch (e) {
        console.error('\n❌ FEHLER: Ungültige URL!');
        console.log('Bitte gib eine vollständige URL an (z.B. https://www.example.com)\n');
        process.exit(1);
    }

    // Scraping starten
    await scrapePropertyData(url);
}

// Skript ausführen
main();
