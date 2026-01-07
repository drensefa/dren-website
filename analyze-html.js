// Analysiert bayut_debug.html und findet relevante Selektoren
const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('bayut_debug.html', 'utf-8');
const $ = cheerio.load(html);

console.log('🔍 ANALYSE DER BAYUT HTML-STRUKTUR\n');
console.log('=====================================\n');

// 1. Suche nach Preis
console.log('💰 PREIS-ELEMENTE:');
console.log('-------------------');

// Alle Elemente mit "AED" im Text
let priceFound = false;
$('*').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.includes('AED') && text.length < 50 && text.includes(',')) {
        const ariaLabel = $(elem).attr('aria-label');
        const className = $(elem).attr('class');
        const tagName = elem.tagName;
        console.log(`Tag: <${tagName}>`);
        console.log(`Text: "${text}"`);
        console.log(`Class: "${className}"`);
        console.log(`Aria-Label: "${ariaLabel}"`);
        console.log('---');
        priceFound = true;
        if (priceFound) return false; // Stop nach dem ersten Fund
    }
});

// 2. Suche nach Schlafzimmer
console.log('\n🛏️  SCHLAFZIMMER-ELEMENTE:');
console.log('------------------------');
$('[aria-label*="Bed"], [aria-label*="bed"]').each((i, elem) => {
    const text = $(elem).text().trim();
    const ariaLabel = $(elem).attr('aria-label');
    const className = $(elem).attr('class');
    const tagName = elem.tagName;
    if (i < 3) { // Nur erste 3
        console.log(`Tag: <${tagName}>`);
        console.log(`Text: "${text}"`);
        console.log(`Class: "${className}"`);
        console.log(`Aria-Label: "${ariaLabel}"`);
        console.log('---');
    }
});

// 3. Suche nach Badezimmer
console.log('\n🚿 BADEZIMMER-ELEMENTE:');
console.log('----------------------');
$('[aria-label*="Bath"], [aria-label*="bath"]').each((i, elem) => {
    const text = $(elem).text().trim();
    const ariaLabel = $(elem).attr('aria-label');
    const className = $(elem).attr('class');
    const tagName = elem.tagName;
    if (i < 3) {
        console.log(`Tag: <${tagName}>`);
        console.log(`Text: "${text}"`);
        console.log(`Class: "${className}"`);
        console.log(`Aria-Label: "${ariaLabel}"`);
        console.log('---');
    }
});

// 4. Suche nach Größe (sqft)
console.log('\n📏 GRÖSSEN-ELEMENTE:');
console.log('-------------------');
$('*').each((i, elem) => {
    const text = $(elem).text().trim();
    if ((text.includes('sqft') || text.includes('sq ft')) && text.length < 50) {
        const ariaLabel = $(elem).attr('aria-label');
        const className = $(elem).attr('class');
        const tagName = elem.tagName;
        console.log(`Tag: <${tagName}>`);
        console.log(`Text: "${text}"`);
        console.log(`Class: "${className}"`);
        console.log(`Aria-Label: "${ariaLabel}"`);
        console.log('---');
        return false; // Stop nach dem ersten Fund
    }
});

// 5. Alle aria-labels mit "Property" finden
console.log('\n🏠 PROPERTY-RELATED ARIA-LABELS:');
console.log('--------------------------------');
$('[aria-label*="Property"], [aria-label*="property"]').each((i, elem) => {
    const ariaLabel = $(elem).attr('aria-label');
    const text = $(elem).text().trim().substring(0, 50);
    const className = $(elem).attr('class');
    if (i < 5) {
        console.log(`Aria-Label: "${ariaLabel}"`);
        console.log(`Text: "${text}..."`);
        console.log(`Class: "${className}"`);
        console.log('---');
    }
});

console.log('\n✅ Analyse abgeschlossen!');
