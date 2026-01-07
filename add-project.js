// Add Project Tool - Scraped Bayut & PropertyFinder Immobilien
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const translate = require('@vitalets/google-translate-api').translate;

/**
 * Übersetzt Text in eine Zielsprache
 */
async function translateText(text, targetLang) {
    try {
        if (!text || text === 'N/A' || text === 'Unknown Location') {
            return text;
        }
        const result = await translate(text, { to: targetLang });
        return result.text;
    } catch (error) {
        console.warn(`Warnung: Übersetzung nach ${targetLang} fehlgeschlagen:`, error.message);
        return text; // Fallback: Original-Text
    }
}

/**
 * Übersetzt Projekt-Texte in alle Sprachen
 */
async function translateProjectTexts(scrapedData) {
    console.log('🌐 Übersetze Texte nach Deutsch und Albanisch...');

    try {
        // Übersetze Titel
        const titleDe = await translateText(scrapedData.title, 'de');
        const titleSq = await translateText(scrapedData.title, 'sq');

        // Kurze Pause zwischen Anfragen (Rate-Limiting vermeiden)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Übersetze Beschreibung
        const descriptionDe = await translateText(scrapedData.description, 'de');
        await new Promise(resolve => setTimeout(resolve, 500));
        const descriptionSq = await translateText(scrapedData.description, 'sq');

        // Übersetze Location (nur Stadt/Gebiet, nicht die vollständige Adresse)
        await new Promise(resolve => setTimeout(resolve, 500));
        const locationDe = await translateText(scrapedData.location, 'de');
        await new Promise(resolve => setTimeout(resolve, 500));
        const locationSq = await translateText(scrapedData.location, 'sq');

        console.log('✅ Übersetzungen abgeschlossen!');

        return {
            title_de: titleDe,
            title_sq: titleSq,
            description_de: descriptionDe,
            description_sq: descriptionSq,
            location_de: locationDe,
            location_sq: locationSq
        };
    } catch (error) {
        console.error('❌ Fehler bei der Übersetzung:', error.message);
        return {
            title_de: scrapedData.title,
            title_sq: scrapedData.title,
            description_de: scrapedData.description,
            description_sq: scrapedData.description,
            location_de: scrapedData.location,
            location_sq: scrapedData.location
        };
    }
}

/**
 * Erkennt die Quelle (Bayut oder PropertyFinder) anhand der URL
 */
function detectSource(url) {
    if (url.includes('bayut.com')) {
        return 'bayut';
    } else if (url.includes('propertyfinder.ae')) {
        return 'propertyfinder';
    }
    return 'unknown';
}

/**
 * Scraped eine Bayut-Immobilie
 */
async function scrapeBayut(page) {
    return await page.evaluate(() => {
        const getText = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : null;
        };

        const getAttr = (selector, attr) => {
            const element = document.querySelector(selector);
            return element ? element.getAttribute(attr) : null;
        };

        // Open Graph Daten
        const ogTitle = getAttr('meta[property="og:title"]', 'content');
        const ogDescription = getAttr('meta[property="og:description"]', 'content');
        const ogImage = getAttr('meta[property="og:image"]', 'content');

        // Bayut-spezifische Daten
        const title = getText('h1') || getText('[aria-label="Property overview"]');

        let price = getText('div.e0ab15b1');
        if (price) {
            price = price.replace(/Share.*$/, '').trim();
        }

        const location = getText('[aria-label="Property header"]');
        const bedrooms = getText('span[aria-label="Beds"]');
        const bathrooms = getText('span[aria-label="Baths"]');

        let size = getText('div.a6a8d692');
        if (size) {
            const sizeMatch = size.match(/[\d,]+\s*sqft/);
            size = sizeMatch ? sizeMatch[0] : size;
        }

        const description = getText('[aria-label="Property description"]') ||
                           getText('[data-testid="property-description"]') ||
                           getText('div[class*="description"]') ||
                           ogDescription;

        // Erstes Property-Bild finden
        const propertyImages = [];
        document.querySelectorAll('img').forEach(img => {
            const src = img.src || img.getAttribute('data-src');
            if (src && src.includes('images.bayut.com/thumbnails')) {
                propertyImages.push(src);
            }
        });

        return {
            source: 'bayut',
            title: title || ogTitle,
            price: price,
            location: location,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            size: size,
            description: description,
            image: propertyImages[0] || ogImage,
            url: window.location.href
        };
    });
}

/**
 * Scraped ein PropertyFinder-Projekt
 */
async function scrapePropertyFinder(page) {
    return await page.evaluate(() => {
        const getText = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : null;
        };

        const getAttr = (selector, attr) => {
            const element = document.querySelector(selector);
            return element ? element.getAttribute(attr) : null;
        };

        // Open Graph Daten
        const ogTitle = getAttr('meta[property="og:title"]', 'content');
        const ogDescription = getAttr('meta[property="og:description"]', 'content');
        const ogImage = getAttr('meta[property="og:image"]', 'content');

        // PropertyFinder-spezifische Daten
        const title = getText('h1.styles_intro__title__Eq0nF') ||
                     getText('h1') ||
                     ogTitle;

        let price = getText('p.styles_intro__price__cd2I_');
        if (price) {
            // "Launch price 5.5M AED*" → "5.5M AED"
            price = price.replace(/Launch price\s*/i, '').replace(/\*.*$/, '').trim();
        }

        // Standort aus verschiedenen Quellen extrahieren
        let location = getText('p.styles_card__location___DKoB');
        if (!location && ogDescription) {
            // Versuche aus Beschreibung zu extrahieren (z.B. "...in Palm Jumeirah...")
            const locationMatch = ogDescription.match(/in\s+([^.]+)/i);
            if (locationMatch) {
                location = locationMatch[1].trim();
            }
        }

        // Schlafzimmer aus Button extrahieren
        let bedrooms = null;
        const bedroomButton = getText('button.styles_desktop_accordion__header__oJAiF');
        if (bedroomButton) {
            const bedMatch = bedroomButton.match(/(\d+)\s*Bed/i);
            if (bedMatch) {
                bedrooms = bedMatch[1] + ' Bed';
            }
        }

        // Größe aus Button extrahieren
        let size = null;
        if (bedroomButton) {
            const sizeMatch = bedroomButton.match(/([\d,]+[-\d,]*)\s*sqft/i);
            if (sizeMatch) {
                size = sizeMatch[1] + ' sqft';
            }
        }

        const description = ogDescription || getText('p.styles-desktop-module_promo__description__PIR1R');

        // Erstes Project-Bild finden
        const projectImage = getAttr('img[alt="Project hero Image"]', 'src') || ogImage;

        return {
            source: 'propertyfinder',
            title: title,
            price: price,
            location: location,
            bedrooms: bedrooms,
            bathrooms: null, // PropertyFinder zeigt oft keine Badezimmer auf Projektseiten
            size: size,
            description: description,
            image: projectImage,
            url: window.location.href
        };
    });
}

/**
 * Scraped eine URL mit Puppeteer (Bayut oder PropertyFinder)
 */
async function scrapeProperty(url) {
    let browser;

    try {
        const source = detectSource(url);

        if (source === 'unknown') {
            throw new Error('Unbekannte Quelle! Nur Bayut und PropertyFinder werden unterstützt.');
        }

        console.log(`🚀 Starte Chrome Browser (Quelle: ${source})...`);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });

        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('⏳ Lade Seite:', url);

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        const randomDelay = 2000 + Math.floor(Math.random() * 3000);
        console.log(`⏱️  Warte ${Math.round(randomDelay/1000)} Sekunden...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        await page.evaluate(() => window.scrollBy(0, 300));
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🔍 Extrahiere Daten...\n');

        // Wähle die richtige Scraping-Funktion
        let propertyData;
        if (source === 'bayut') {
            propertyData = await scrapeBayut(page);
        } else if (source === 'propertyfinder') {
            propertyData = await scrapePropertyFinder(page);
        }

        await browser.close();
        return propertyData;

    } catch (error) {
        if (browser) {
            await browser.close();
        }
        throw error;
    }
}

/**
 * Lädt die projects.json Datei
 */
async function loadProjects() {
    try {
        const data = await fs.readFile('projects.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

/**
 * Speichert die Projekte in projects.json
 */
async function saveProjects(projects) {
    await fs.writeFile('projects.json', JSON.stringify(projects, null, 2), 'utf-8');
}

/**
 * Generiert eine neue ID
 */
function generateNewId(projects) {
    if (projects.length === 0) {
        return 1;
    }
    const maxId = Math.max(...projects.map(p => p.id));
    return maxId + 1;
}

/**
 * Erstellt ein Projekt-Objekt (mit Übersetzungen)
 */
function createProjectObject(id, scrapedData) {
    // Developer basierend auf Quelle
    const developer = scrapedData.source === 'bayut' ? 'Bayut' : 'PropertyFinder';

    const projectObject = {
        id: id,
        title: scrapedData.title || 'Untitled Property',
        location: scrapedData.location || 'Unknown Location',
        price: scrapedData.price || 'Price on Request',
        bedrooms: scrapedData.bedrooms || 'N/A',
        bathrooms: scrapedData.bathrooms || 'N/A',
        size: scrapedData.size || 'N/A',
        status: 'For Sale',
        description: scrapedData.description || 'No description available',
        image: scrapedData.image || '',
        sourceUrl: scrapedData.url,
        developer: developer,
        region: 'dubai',
        addedAt: new Date().toISOString()
    };

    // Übersetzungen hinzufügen (falls vorhanden)
    if (scrapedData.translations) {
        projectObject.title_de = scrapedData.translations.title_de;
        projectObject.title_sq = scrapedData.translations.title_sq;
        projectObject.description_de = scrapedData.translations.description_de;
        projectObject.description_sq = scrapedData.translations.description_sq;
        projectObject.location_de = scrapedData.translations.location_de;
        projectObject.location_sq = scrapedData.translations.location_sq;
    }

    return projectObject;
}

/**
 * Hauptfunktion
 */
async function main() {
    const url = process.argv[2];

    if (!url) {
        console.error('\n❌ FEHLER: Keine URL angegeben!');
        console.log('\n📖 VERWENDUNG:');
        console.log('node add-project.js <URL>\n');
        console.log('Unterstützte Quellen:');
        console.log('  • Bayut:          https://www.bayut.com/property/details-...');
        console.log('  • PropertyFinder: https://www.propertyfinder.ae/en/new-projects/...\n');
        process.exit(1);
    }

    try {
        new URL(url);
    } catch (e) {
        console.error('\n❌ FEHLER: Ungültige URL!');
        process.exit(1);
    }

    try {
        // Schritt 1: Scraping
        console.log('\n📋 SCHRITT 1: SCRAPING');
        console.log('=====================\n');
        const scrapedData = await scrapeProperty(url);

        console.log('✅ Erfolgreich gescraped: ' + scrapedData.title);
        console.log('\n📊 GESAMMELTE DATEN:');
        console.log('-------------------');
        console.log('Quelle:       ', scrapedData.source.toUpperCase());
        console.log('Titel:        ', scrapedData.title);
        console.log('Preis:        ', scrapedData.price);
        console.log('Ort:          ', scrapedData.location);
        console.log('Schlafzimmer: ', scrapedData.bedrooms || 'N/A');
        console.log('Badezimmer:   ', scrapedData.bathrooms || 'N/A');
        console.log('Größe:        ', scrapedData.size || 'N/A');
        console.log('Bild:         ', scrapedData.image ? '✓ Gefunden' : '✗ Nicht gefunden');
        console.log('Beschreibung: ', scrapedData.description ? (scrapedData.description.substring(0, 50) + '...') : '✗ Nicht gefunden');

        // Schritt 2: Übersetzung
        console.log('\n📋 SCHRITT 2: ÜBERSETZUNG');
        console.log('=========================\n');

        const translations = await translateProjectTexts(scrapedData);
        scrapedData.translations = translations;

        console.log('Titel (DE):   ', translations.title_de);
        console.log('Titel (SQ):   ', translations.title_sq);
        console.log('Ort (DE):     ', translations.location_de);
        console.log('Ort (SQ):     ', translations.location_sq);

        // Schritt 3: Speichern
        console.log('\n📋 SCHRITT 3: SPEICHERN');
        console.log('=======================\n');

        const projects = await loadProjects();
        console.log(`📁 Existierende Projekte: ${projects.length}`);

        const newId = generateNewId(projects);
        console.log(`🆔 Neue ID: ${newId}`);

        const newProject = createProjectObject(newId, scrapedData);

        projects.unshift(newProject);

        await saveProjects(projects);

        console.log(`\n✅ Gespeichert als ID: ${newId}`);
        console.log(`📁 Gesamte Projekte: ${projects.length}`);
        console.log('\n🎉 Projekt erfolgreich hinzugefügt!\n');

    } catch (error) {
        console.error('\n❌ FEHLER:', error.message);
        process.exit(1);
    }
}

main();
