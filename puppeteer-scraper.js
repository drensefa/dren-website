// Puppeteer Web Scraper für Immobilien-Daten
// Nutzt einen echten Chrome-Browser, um Websites zu laden
// Funktioniert auch mit Websites, die Bot-Schutz haben (z.B. Bayut)

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

/**
 * Extrahiert Immobilien-Daten von einer URL mit Puppeteer
 * @param {string} url - Die URL der Immobilien-Webseite
 */
async function scrapeBayutProperty(url) {
    let browser;

    try {
        console.log('🚀 Starte Chrome Browser...\n');

        // Schritt 1: Browser starten
        // headless: false -> zeigt den Browser (zum Debuggen)
        // headless: true -> Browser läuft im Hintergrund (schneller)
        browser = await puppeteer.launch({
            headless: true, // Ändere zu 'false' wenn du den Browser sehen willst
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });

        console.log('📄 Öffne neue Seite...\n');

        // Schritt 2: Neue Seite öffnen
        const page = await browser.newPage();

        // User-Agent setzen (damit die Website denkt, wir sind ein echter Browser)
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Viewport setzen (Bildschirmgröße simulieren)
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('⏳ Lade Website:', url);
        console.log('   (Das kann 5-10 Sekunden dauern...)\n');

        // Schritt 3: URL laden und warten bis alles geladen ist
        await page.goto(url, {
            waitUntil: 'networkidle2', // Wartet bis Netzwerk-Aktivität minimal ist
            timeout: 30000 // 30 Sekunden Timeout
        });

        // Menschliches Verhalten simulieren: Längere Wartezeit + zufälliger Delay
        const randomDelay = 2000 + Math.floor(Math.random() * 3000); // 2-5 Sekunden
        console.log(`⏱️  Warte ${Math.round(randomDelay/1000)} Sekunden (simuliere menschliches Verhalten)...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // Optional: Scroll-Verhalten simulieren (macht es noch "menschlicher")
        await page.evaluate(() => {
            window.scrollBy(0, 300);
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ Seite geladen! Extrahiere Daten...\n');

        // Schritt 4: Daten aus der Seite extrahieren
        // page.evaluate() führt JavaScript direkt auf der Webseite aus
        const propertyData = await page.evaluate(() => {
            // Diese Funktion läuft IM BROWSER, nicht in Node.js!

            // Hilfsfunktion: Sicher Text aus einem Element holen
            const getText = (selector) => {
                const element = document.querySelector(selector);
                return element ? element.textContent.trim() : null;
            };

            // Hilfsfunktion: Attribut aus einem Element holen
            const getAttr = (selector, attr) => {
                const element = document.querySelector(selector);
                return element ? element.getAttribute(attr) : null;
            };

            // Open Graph Tags (funktioniert auf fast allen Seiten)
            const ogTitle = getAttr('meta[property="og:title"]', 'content');
            const ogDescription = getAttr('meta[property="og:description"]', 'content');
            const ogImage = getAttr('meta[property="og:image"]', 'content');
            const ogPrice = getAttr('meta[property="og:price:amount"]', 'content') ||
                           getAttr('meta[property="product:price:amount"]', 'content');

            // Bayut-spezifische Selektoren
            // (Diese sind aktuell für Bayut - Stand Januar 2026)
            const bayutTitle = getText('h1') ||
                              getText('[aria-label="Property overview"]');

            // Preis aus div mit Klasse e0ab15b1
            let bayutPrice = getText('div.e0ab15b1');
            if (bayutPrice) {
                // Entferne "Share" und andere Zusätze
                bayutPrice = bayutPrice.replace(/Share.*$/, '').trim();
            }

            // Standort aus Property header
            const bayutLocation = getText('[aria-label="Property header"]');

            // Schlafzimmer aus span mit aria-label="Beds"
            const bayutBedrooms = getText('span[aria-label="Beds"]');

            // Badezimmer aus span mit aria-label="Baths"
            const bayutBathrooms = getText('span[aria-label="Baths"]');

            // Größe aus dem kombinierten div extrahieren
            let bayutSize = getText('div.a6a8d692');
            if (bayutSize) {
                // Extrahiere nur den sqft-Teil (z.B. "5,700 sqft")
                const sizeMatch = bayutSize.match(/[\d,]+\s*sqft/);
                bayutSize = sizeMatch ? sizeMatch[0] : bayutSize;
            }

            // Alle Bilder auf der Seite finden
            const images = [];
            document.querySelectorAll('img').forEach(img => {
                const src = img.src || img.getAttribute('data-src');
                if (src && (src.includes('bayut') || src.includes('property'))) {
                    images.push(src);
                }
            });

            // Beschreibung finden
            const description = getText('[aria-label="Property description"]') ||
                               getText('[data-testid="property-description"]') ||
                               getText('div[class*="description"]');

            return {
                // Open Graph Daten
                og: {
                    title: ogTitle,
                    description: ogDescription,
                    image: ogImage,
                    price: ogPrice
                },
                // Bayut-spezifische Daten
                bayut: {
                    title: bayutTitle,
                    price: bayutPrice,
                    location: bayutLocation,
                    bedrooms: bayutBedrooms,
                    bathrooms: bayutBathrooms,
                    size: bayutSize,
                    description: description ? description.substring(0, 200) : null
                },
                // Alle gefundenen Bilder
                images: images.slice(0, 5), // Nur erste 5 Bilder
                // Meta-Informationen
                pageTitle: document.title,
                url: window.location.href
            };
        });

        // Optional: Screenshot machen (zum Debuggen)
        // await page.screenshot({ path: 'bayut-screenshot.png', fullPage: true });

        console.log('-----------------------------------');
        console.log('📊 EXTRAHIERTE DATEN');
        console.log('===================================\n');

        console.log('🏠 IMMOBILIEN-DETAILS:');
        console.log('----------------------');
        console.log('Titel:        ', propertyData.bayut.title || propertyData.og.title || 'Nicht gefunden');
        console.log('Preis:        ', propertyData.bayut.price || propertyData.og.price || 'Nicht gefunden');
        console.log('Standort:     ', propertyData.bayut.location || 'Nicht gefunden');
        console.log('Schlafzimmer: ', propertyData.bayut.bedrooms || 'Nicht gefunden');
        console.log('Badezimmer:   ', propertyData.bayut.bathrooms || 'Nicht gefunden');
        console.log('Größe:        ', propertyData.bayut.size || 'Nicht gefunden');

        console.log('\n📝 BESCHREIBUNG:');
        console.log('----------------');
        console.log(propertyData.bayut.description || propertyData.og.description || 'Nicht gefunden');

        console.log('\n🖼️  BILDER:');
        console.log('----------');
        if (propertyData.images.length > 0) {
            propertyData.images.forEach((img, i) => {
                console.log(`${i + 1}. ${img.substring(0, 80)}...`);
            });
        } else {
            console.log('Keine Bilder gefunden');
        }

        console.log('\n📋 OPEN GRAPH DATEN:');
        console.log('--------------------');
        console.log('OG Titel:     ', propertyData.og.title || 'Nicht gefunden');
        console.log('OG Bild:      ', propertyData.og.image || 'Nicht gefunden');

        console.log('\n🔗 SEITEN-INFO:');
        console.log('---------------');
        console.log('Seiten-Titel: ', propertyData.pageTitle);
        console.log('URL:          ', propertyData.url);

        console.log('\n-----------------------------------');
        console.log('✅ Scraping erfolgreich abgeschlossen!');

        // HTML-Content für Debug-Zwecke speichern
        console.log('\n💾 Speichere HTML-Content in bayut_debug.html...');
        const htmlContent = await page.content();
        await fs.writeFile('bayut_debug.html', htmlContent, 'utf-8');
        console.log('✅ bayut_debug.html wurde erstellt!');

        console.log('🌐 Browser wird geschlossen...\n');

        return propertyData;

    } catch (error) {
        console.error('\n❌ FEHLER beim Scraping:');
        console.error('========================\n');
        console.error('Fehler:', error.message);

        if (error.message.includes('timeout')) {
            console.error('\n💡 TIPP: Die Seite lädt zu langsam. Versuche:');
            console.error('   - Eine bessere Internetverbindung');
            console.error('   - Timeout erhöhen (Zeile 52)');
        }

        throw error;
    } finally {
        // Browser IMMER schließen, auch bei Fehler
        if (browser) {
            await browser.close();
        }
    }
}

// Hauptfunktion
async function main() {
    const url = process.argv[2];

    if (!url) {
        console.error('\n❌ FEHLER: Keine URL angegeben!');
        console.log('\n📖 VERWENDUNG:');
        console.log('=============');
        console.log('node puppeteer-scraper.js <URL>\n');
        console.log('Beispiel:');
        console.log('node puppeteer-scraper.js https://www.bayut.com/property/details-9388673.html\n');
        process.exit(1);
    }

    try {
        new URL(url);
    } catch (e) {
        console.error('\n❌ FEHLER: Ungültige URL!');
        console.log('Bitte gib eine vollständige URL an (z.B. https://www.bayut.com/...)\n');
        process.exit(1);
    }

    await scrapeBayutProperty(url);
}

// Skript ausführen
main().catch(error => {
    console.error('\n❌ Unerwarteter Fehler:', error.message);
    process.exit(1);
});
