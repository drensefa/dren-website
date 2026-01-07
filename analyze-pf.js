// PropertyFinder Analyse-Skript
// Lädt eine PropertyFinder-URL mit Puppeteer und speichert den HTML-Code

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function analyzePropertyFinder(url) {
    let browser;

    try {
        console.log('🚀 Starte Chrome Browser...\n');

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

        // User-Agent setzen (simuliere echten Browser)
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('⏳ Lade PropertyFinder Seite:', url);
        console.log('   (Das kann 5-10 Sekunden dauern...)\n');

        // Seite laden
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Menschliches Verhalten simulieren
        const randomDelay = 2000 + Math.floor(Math.random() * 3000);
        console.log(`⏱️  Warte ${Math.round(randomDelay/1000)} Sekunden (simuliere menschliches Verhalten)...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // Scroll simulieren
        await page.evaluate(() => {
            window.scrollBy(0, 300);
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ Seite geladen!\n');

        // Schnelle Info über die Seite
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                metaTagCount: document.querySelectorAll('meta').length,
                h1Count: document.querySelectorAll('h1').length,
                imageCount: document.querySelectorAll('img').length
            };
        });

        console.log('📊 SEITEN-INFO:');
        console.log('===============\n');
        console.log('Titel:      ', pageInfo.title);
        console.log('URL:        ', pageInfo.url);
        console.log('Meta-Tags:  ', pageInfo.metaTagCount);
        console.log('H1-Tags:    ', pageInfo.h1Count);
        console.log('Bilder:     ', pageInfo.imageCount);

        // HTML-Content speichern
        console.log('\n💾 Speichere HTML-Content in pf_debug.html...');
        const htmlContent = await page.content();
        await fs.writeFile('pf_debug.html', htmlContent, 'utf-8');

        const fileSizeKB = Math.round(htmlContent.length / 1024);
        console.log(`✅ pf_debug.html wurde erstellt! (${fileSizeKB} KB)`);

        console.log('\n🔍 NÄCHSTER SCHRITT:');
        console.log('====================');
        console.log('Die Datei pf_debug.html enthält jetzt den kompletten HTML-Code.');
        console.log('Ich kann sie jetzt analysieren, um die richtigen Selektoren zu finden.\n');

        await browser.close();

    } catch (error) {
        console.error('\n❌ FEHLER:', error.message);
        if (browser) {
            await browser.close();
        }
        throw error;
    }
}

// Hauptfunktion
async function main() {
    const url = process.argv[2];

    if (!url) {
        console.error('\n❌ FEHLER: Keine URL angegeben!');
        console.log('\n📖 VERWENDUNG:');
        console.log('node analyze-pf.js <PROPERTYFINDER_URL>\n');
        console.log('Beispiel:');
        console.log('node analyze-pf.js https://www.propertyfinder.ae/en/property/...\n');
        process.exit(1);
    }

    try {
        new URL(url);
    } catch (e) {
        console.error('\n❌ FEHLER: Ungültige URL!');
        process.exit(1);
    }

    await analyzePropertyFinder(url);
}

main().catch(error => {
    console.error('\n❌ Unerwarteter Fehler:', error.message);
    process.exit(1);
});
