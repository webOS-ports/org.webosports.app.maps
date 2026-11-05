/*
 * Touch smoke test: a hold drops a pin, a pinch does not.
 * Enyo's hold follows the first finger only; see watchMultiTouch in
 * source/views/main.js. The pin's address lookup is replaced, so nothing
 * goes to Nominatim.
 * usage: node tests/smoke/touch.test.js <url of index.html>
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

function findChromium() {
	const candidates = [process.env.CHROME_BIN, '/snap/bin/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
	for (const c of candidates) {
		if (c && fs.existsSync(c)) return c;
	}
	throw new Error('No Chromium found, set CHROME_BIN');
}

const base = process.argv[2] || 'http://127.0.0.1:8282/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
function check(name, ok, detail) {
	if (!ok) failed++;
	console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' :: ' + JSON.stringify(detail) : ''));
}

(async () => {
	const browser = await puppeteer.launch({executablePath: findChromium(), headless: true, args: ['--no-sandbox', '--window-size=450,810', '--touch-events=enabled']});
	try {
		const page = await browser.newPage();
		await page.setViewport({width: 450, height: 810, hasTouch: true, isMobile: true});
		await page.goto(base, {waitUntil: 'networkidle2'});
		await page.waitForFunction('window.mapEngine && mapEngine.map', {timeout: 30000});
		const mainView = `(function(){ for (var k in enyo.$) { if (enyo.$[k].kindName == "Maps.MainView") return enyo.$[k]; } })()`;
		await page.evaluate(`(function(){ var mv = ${mainView}; mv.pins = 0; mv.GeocodeFromLatLng = function(){ mv.pins++; }; })()`);
		const pins = () => page.evaluate(`${mainView}.pins`);
		const cdp = await page.target().createCDPSession();
		const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: points.map(([x, y], id) => ({x, y, id}))});
		const hold = async () => {
			await touch('touchStart', [[225, 450]]);
			await sleep(1000);
			await touch('touchEnd', []);
			await sleep(300);
		};

		await hold();
		check('touch: a hold drops a pin', await pins() === 1, await pins());

		/* the first finger stays put while the second moves */
		await touch('touchStart', [[200, 450]]);
		await sleep(40);
		await touch('touchStart', [[200, 450], [260, 450]]);
		for (let i = 0; i < 20; i++) {
			await touch('touchMove', [[200, 450], [260 + i * 4, 450 + i * 2]]);
			await sleep(50);
		}
		await touch('touchEnd', [[200, 450]]);
		await sleep(700);
		await touch('touchEnd', []);
		await sleep(300);
		check('touch: a pinch with a still first finger drops no pin', await pins() === 1, await pins());

		/* lifting the fingers reaches the page as all up and a new touch on the finger left */
		await touch('touchStart', [[200, 450]]);
		await sleep(40);
		await touch('touchStart', [[200, 450], [260, 450]]);
		for (let i = 0; i < 6; i++) {
			await touch('touchMove', [[200 - i * 4, 450], [260 + i * 4, 450]]);
			await sleep(50);
		}
		await touch('touchEnd', []);
		await touch('touchStart', [[180, 450]]);
		await sleep(900);
		await touch('touchEnd', []);
		await sleep(300);
		check('touch: releasing a pinch drops no pin', await pins() === 1, await pins());

		await sleep(1200);
		await hold();
		check('touch: a hold after a pinch drops a pin again', await pins() === 2, await pins());
	} finally {
		await browser.close();
	}
	process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
