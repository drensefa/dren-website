// Analysiert pf_debug.html und findet relevante Selektoren für PropertyFinder
const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('pf_debug.html', 'utf-8');
const $ = cheerio.load(html);

console.log('🔍 ANALYSE DER PROPERTYFINDER HTML-STRUKTUR\n');
console.log('=============================================\n');

// 1. Suche nach Titel
console.log('📋 TITEL-ELEMENTE:');
console.log('------------------');
$('h1').each((i, elem) => {
    const text = $(elem).text().trim();
    const className = $(elem).attr('class');
    const id = $(elem).attr('id');
    if (i < 3) {
        console.log(`Text: "${text}"`);
        console.log(`Class: "${className}"`);
        console.log(`ID: "${id}"`);
        console.log('---');
    }
});

// 2. Suche nach Preis (AED)
console.log('\n💰 PREIS-ELEMENTE:');
console.log('------------------');
let priceCount = 0;
$('*').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.includes('AED') && text.length < 100 && /[\d,]+/.test(text)) {
        const tagName = elem.tagName;
        const className = $(elem).attr('class');
        const ariaLabel = $(elem).attr('aria-label');
        if (priceCount < 5) {
            console.log(`Tag: <${tagName}>`);
            console.log(`Text: "${text}"`);
            console.log(`Class: "${className}"`);
            console.log(`Aria-Label: "${ariaLabel}"`);
            console.log('---');
            priceCount++;
        }
    }
});

// 3. Suche nach Standort
console.log('\n📍 STANDORT-ELEMENTE:');
console.log('--------------------');
$('[class*="location"], [class*="address"], [aria-label*="location"]').each((i, elem) => {
    const text = $(elem).text().trim();
    const className = $(elem).attr('class');
    const tagName = elem.tagName;
    if (text && text.length > 5 && text.length < 100 && i < 5) {
        console.log(`Tag: <${tagName}>`);
        console.log(`Text: "${text}"`);
        console.log(`Class: "${className}"`);
        console.log('---');
    }
});

// 4. Suche nach Beschreibung
console.log('\n📝 BESCHREIBUNGS-ELEMENTE:');
console.log('-------------------------');
$('[class*="description"], [class*="about"]').each((i, elem) => {
    const text = $(elem).text().trim();
    const className = $(elem).attr('class');
    const tagName = elem.tagName;
    if (text && text.length > 100 && i < 3) {
        console.log(`Tag: <${tagName}>`);
        console.log(`Text: "${text.substring(0, 100)}..."`);
        console.log(`Class: "${className}"`);
        console.log('---');
    }
});

// 5. Suche nach Bildern
console.log('\n🖼️  BILD-ELEMENTE:');
console.log('-----------------');
let imgCount = 0;
$('img').each((i, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src');
    const alt = $(elem).attr('alt');
    const className = $(elem).attr('class');
    if (src && (src.includes('property') || src.includes('image') || src.includes('photo')) && imgCount < 5) {
        console.log(`Src: ${src.substring(0, 80)}...`);
        console.log(`Alt: "${alt}"`);
        console.log(`Class: "${className}"`);
        console.log('---');
        imgCount++;
    }
});

// 6. Open Graph Tags
console.log('\n🌐 OPEN GRAPH TAGS:');
console.log('-------------------');
$('meta[property^="og:"]').each((i, elem) => {
    const property = $(elem).attr('property');
    const content = $(elem).attr('content');
    if (content) {
        console.log(`${property}: ${content.substring(0, 80)}${content.length > 80 ? '...' : ''}`);
    }
});

// 7. Suche nach Schlafzimmer/Badezimmer
console.log('\n🛏️  SCHLAFZIMMER/BADEZIMMER:');
console.log('---------------------------');
$('*').each((i, elem) => {
    const text = $(elem).text().trim();
    if ((text.match(/\d+\s*(bed|bedroom|bath|bathroom)/i) || text.match(/bed|bath/i)) && text.length < 50) {
        const tagName = elem.tagName;
        const className = $(elem).attr('class');
        const ariaLabel = $(elem).attr('aria-label');
        console.log(`Tag: <${tagName}>`);
        console.log(`Text: "${text}"`);
        console.log(`Class: "${className}"`);
        console.log(`Aria-Label: "${ariaLabel}"`);
        console.log('---');
        return false; // Stop nach dem ersten Fund
    }
});

console.log('\n✅ Analyse abgeschlossen!');
