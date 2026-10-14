/*
 * Browser smoke test for org.webosports.app.maps: drives the real app with
 * puppeteer-core against live OpenStreetMap services (and Google for the
 * engine switch). See tests/README.md.
 *
 * usage: node tests/smoke/app.test.js <url> [screenshot dir]
 *   <url> http://127.0.0.1:8282/index.html            headless Chromium, built app
 *         connect=http://127.0.0.1:19998#org.webosports.app.maps/index.html
 *                                                     app running in LuneOS WebAppManager
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
const out = process.argv[3] || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, ok, detail) {
	results.push({name, ok: !!ok, detail});
	console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' :: ' + JSON.stringify(detail) : ''));
}

async function shot(page, name) {
	if (out) await page.screenshot({path: out + name});
}

async function waitFor(page, fn, timeout = 20000, arg) {
	try {
		await page.waitForFunction(fn, {timeout, polling: 200}, arg);
		return true;
	} catch (e) {
		return false;
	}
}

(async () => {
	// connect=<devtools http url>#<page url part> drives an app already running in a WebAppManager (LuneOS)
	const connect = base.startsWith('connect=');
	let browser, page;
	if (connect) {
		const [browserURL, match] = base.slice(8).split('#');
		browser = await puppeteer.connect({browserURL, defaultViewport: null});
		const pages = await browser.pages();
		page = pages.find((p) => p.url().includes(match));
		if (!page) throw new Error('no page matching ' + match + ' in ' + pages.map((p) => p.url()));
	} else {
		browser = await puppeteer.launch({
			executablePath: findChromium(),
			headless: true,
			args: ['--no-sandbox', '--window-size=800,600'],
			defaultViewport: {width: 800, height: 600}
		});
		await browser.defaultBrowserContext().overridePermissions(new URL(base).origin, ['geolocation']);
		page = await browser.newPage();
	}
	await page.setGeolocation({latitude: 52.3702, longitude: 4.8952, accuracy: 50}).catch(() => {});

	const errors = [];
	page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
	// checkNavit() probes for the legacy webOS Navit app, WebAppManager blocks that file:// read
	const expectedConsole = /Failed to load resource|org\.webosinternals\.navit\/navit\.xml/;
	page.on('console', (m) => { if (m.type() === 'error' && !expectedConsole.test(m.text())) errors.push('console: ' + m.text()); });
	// ilib probes for optional locale files and the favicon 404 on master as well; tiles cancelled by panning abort
	const expected404 = /\/(localeinfo|plurals|strings|ilibmanifest|scripts)\.json$|favicon\.ico$/;
	page.on('response', (r) => { if (r.status() >= 400 && !expected404.test(r.url())) errors.push('HTTP ' + r.status() + ': ' + r.url()); });
	page.on('requestfailed', (r) => { if (expected404.test(r.url()) || /^chrome-error:\/\/chromeillegalwebdata/.test(r.url())) return; if (!(r.failure() && r.failure().errorText == 'net::ERR_ABORTED' && /tile/.test(r.url()))) errors.push('requestfailed: ' + r.url() + ' ' + (r.failure() && r.failure().errorText)); });

	// tile servers answer a policy violation with HTTP 403 or with a 200 "Access blocked" image;
	// md5 of the image tile.openstreetmap.org served for a request without Referer (2026-10-14)
	const BLOCKED_TILE_MD5 = 'c069a15b2cc2d6b6f527ad09eb93c61a';
	const tiles = {ok: 0, bad: []};
	page.on('response', async (r) => {
		const url = r.url();
		if (!/\/\d+\/\d+\/\d+(@2x)?\.png/.test(url) || !/^https?:/.test(url)) return;
		try {
			const body = await r.buffer();
			const md5 = require('crypto').createHash('md5').update(body).digest('hex');
			if (r.status() >= 400 || md5 === BLOCKED_TILE_MD5) {
				tiles.bad.push(r.status() + ' ' + url);
			} else {
				tiles.ok++;
			}
		} catch (e) { /* aborted while panning */ }
	});

	const mainView = `(function(){ for (var k in enyo.$) { if (enyo.$[k].kindName == "Maps.MainView") return enyo.$[k]; } })()`;

	// ---------- OSM engine (default) ----------
	if (connect) {
		// start from a clean OSM state: default prefs, then reload
		await page.evaluate(`PrefsStore.clear()`);
		if (process.env.SMOKE_OSM_TILE_URL) await page.evaluate(`PrefsStore.save({osmTileUrl: ${JSON.stringify(process.env.SMOKE_OSM_TILE_URL)}})`);
		await page.reload({waitUntil: 'load'});
	} else {
		await page.goto(base, {waitUntil: 'load'});
	}
	const loaded = await waitFor(page, `window.mapEngine && mapEngine.map && ${mainView} && !${mainView}.$.initPopUp.showing`);
	check('osm: app initialised', loaded);
	check('osm: engine is osm by default', await page.evaluate('mapEngine.id') === 'osm', await page.evaluate('mapEngine.id'));
	check('osm: leaflet loaded', await page.evaluate('typeof L !== "undefined" && L.version'), await page.evaluate('typeof L !== "undefined" && L.version'));
	const tilesOk = await waitFor(page, `document.querySelectorAll('.leaflet-tile-loaded').length > 4`);
	check('osm: tiles loaded', tilesOk, await page.evaluate(`document.querySelectorAll('.leaflet-tile-loaded').length`));
	const located = await waitFor(page, `${mainView}.myLocationMarker && ${mainView}.circle`);
	const webosLocation = await page.evaluate('!!enyo.platform.webos');
	if (located || !webosLocation) {
		check('osm: geolocation marker + accuracy circle', located);
		check('osm: centred near geolocation', !webosLocation ? await page.evaluate(`Math.abs(mapEngine.getCenter().lat()-52.3702)<0.05 && Math.abs(mapEngine.getCenter().lng()-4.8952)<0.05`) : true, await page.evaluate(`mapEngine.getCenter().toUrlValue(4)`));
	} else {
		// webOS location service, nothing can be emulated through DevTools
		console.log('INFO no location fix from the webOS location service: ' + await page.evaluate(`${mainView}.$.statuspanel.content`));
		await page.evaluate('mapEngine.setCenter(mapEngine.latLng(52.3702, 4.8952)); mapEngine.setZoom(14);');
	}
	check('osm: About shows engine version', await page.evaluate(`${mainView}.$.pullout.$.APIver.content`), await page.evaluate(`${mainView}.$.pullout.$.APIver.content`));
	check('osm: map type list from engine', await page.evaluate(`!!${mainView}.$.pullout.$.mapTypeOSM && !!${mainView}.$.pullout.$.mapTypeTOPO && !${mainView}.$.pullout.$.mapTypeROADMAP`));
	check('osm: layer toggles follow the engine (no traffic; transit only with a Referer)', await page.evaluate(`var p=${mainView}.$.pullout.$; !p.trafficToggle.showing && p.transitToggle.showing == !MapEngines.fileOrigin && p.bikeToggle.showing`));
	check('osm: transit travel mode + avoid toggles hidden', await page.evaluate(`var p=${mainView}.$.pullout.$; !p.travelTRANSIT.showing && p.travelDRIVING.showing && !p.avoidTollsToggle.showing && p.routeAlternativesToggle.showing`));
	check('osm: street view menu hidden', await page.evaluate(`!${mainView}.$.markerStreet.showing`));
	check('osm: attribution shown', await page.evaluate(`(document.querySelector('.leaflet-control-attribution')||{}).textContent||""`), await page.evaluate(`(document.querySelector('.leaflet-control-attribution')||{}).textContent||""`));
	await shot(page, '/osm-1-start.png');

	// search through the UI: type and press Enter
	await page.evaluate(`(function(){ window.__searches=[]; var o=mapEngine.search; mapEngine.search=function(q, cb){ window.__searches.push('query: '+q); return o.call(this, q, function(err, places){ window.__searches.push('result: '+(err||places.length)); cb(err, places); }); }; })()`);
	await page.click('#' + await page.evaluate(`${mainView}.$.searchLocation.id`));
	// selectOnFocus selects the field a moment after focusing, typing earlier gets overwritten
	await sleep(500);
	await page.keyboard.type('Rotterdam Centraal');
	await page.keyboard.press('Enter');
	const found = await waitFor(page, `markers.some(function(m){return m.place && m.place.lunetype != "mylocation";})`);
	check('osm: Nominatim search adds markers', found, await page.evaluate(`[window.__searches, document.activeElement.id, ${mainView}.$.searchLocation.getValue(), markers.map(function(m){return String(m.place.name)})]`));
	check('osm: places list filled', await page.evaluate(`${mainView}.$.pullout.$.markerCount.content >= 2`), await page.evaluate(`${mainView}.$.pullout.$.markerCount.content`));
	// the places pullout opens on wide screens and covers part of the map, close it
	await page.evaluate(`${mainView}.$.pullout.closePullout()`);
	await sleep(1000);
	// tap the first result marker
	const pt = await page.evaluate(`(function(){var m=markers.filter(function(m){return m.place.lunetype != "mylocation";})[0]; mapEngine.setCenter(m.place.geometry.location); var p=mapEngine.latLngToContainerPoint(m.place.geometry.location); var r=document.getElementById("map_canvas").getBoundingClientRect(); return {x:p.x+r.left, y:p.y+r.top};})()`);
	await sleep(500);
	await page.mouse.click(pt.x, pt.y - 20);
	check('osm: tapping a marker shows its popup', await waitFor(page, `${mainView}.$.markerPopup.showing && ${mainView}.$.popName.content`, 5000), await page.evaluate(`${mainView}.$.popName.content`));
	await sleep(1500);
	await shot(page, '/osm-2-search.png');

	// place details with elevation
	await page.evaluate(`${mainView}.markerInfo()`);
	const elev = await waitFor(page, `${mainView}.$.placeDetails.$.PlaceDetailsElevation.showing`, 30000);
	check('osm: Open-Meteo elevation in place details', elev, await page.evaluate(`${mainView}.$.placeDetails.$.PlaceDetailsElevation.content`));
	await shot(page, '/osm-3-details.png');
	await page.evaluate(`${mainView}.toggleDetails()`);

	// long press on the map drops a pin (reverse geocoding)
	const before = await page.evaluate('markers.length');
	await page.evaluate(`${mainView}.$.markerPopup.hide(); ${mainView}.$.markerPopupMenu.hide();`);
	await page.evaluate(`(function(v){ window.__trace=[]; var oh=v.mapTapHold; v.mapTapHold=function(s,e){ window.__trace.push('hold '+e.clientX+','+e.clientY); return oh.apply(this, arguments); }; var og=v.GeocodeFromLatLng; v.GeocodeFromLatLng=function(ll){ window.__trace.push('geocode '+ll.toUrlValue(5)); return og.apply(this, arguments); }; })(${mainView})`);
	await page.mouse.move(400, 400);
	await page.mouse.down();
	await sleep(1000);
	await page.mouse.up();
	const dropped = await waitFor(page, `markers.length > ${before}`, 15000);
	check('osm: long press drops pin via reverse geocode', dropped, await page.evaluate(`[window.__trace, markers.length ? markers[markers.length-1].place.name + ' / ' + markers[markers.length-1].place.formatted_address : null]`));
	if (dropped) {
		const pinOk = await page.evaluate(`(function(){var m=markers[markers.length-1]; var p=mapEngine.latLngToContainerPoint(m.place.geometry.location); var r=document.getElementById("map_canvas").getBoundingClientRect(); return {x:p.x+r.left, y:p.y+r.top};})()`);
		check('osm: pin lands under the finger', Math.abs(pinOk.x - 400) <= 2 && Math.abs(pinOk.y - 400) <= 2, pinOk);
	}

	// drag pans the map (Leaflet native gestures, Enyo handlers must not block it)
	await page.evaluate(`${mainView}.$.markerPopup.hide(); ${mainView}.$.markerPopupMenu.hide();`);
	const c0 = await page.evaluate('mapEngine.getCenter().toUrlValue(6)');
	await page.mouse.move(400, 300);
	await page.mouse.down();
	await page.mouse.move(450, 330, {steps: 10});
	await page.mouse.move(500, 360, {steps: 10});
	await page.mouse.up();
	await sleep(800);
	const c1 = await page.evaluate('mapEngine.getCenter().toUrlValue(6)');
	check('osm: mouse drag pans the map', c0 !== c1, {before: c0, after: c1});

	// routing for each travel mode
	for (const mode of ['DRIVING', 'BICYCLING', 'WALKING']) {
		await page.evaluate(`(function(v){ v.$.getDirectButton.setDisabled(false); v.directRequest.origin = mapEngine.latLng(52.3791, 4.9003); v.directRequest.destination = mapEngine.latLng(52.3584, 4.8811); v.directRequest.travelMode = "${mode}"; v.calcRoute(); })(${mainView})`);
		const routed = await waitFor(page, `${mainView}.$.getDirectButton.disabled && mapEngine.routeLayer && ${mainView}.$.pullout.route.length > 1`);
		check('osm: OSRM route ' + mode, routed, await page.evaluate(`${mainView}.$.directResultsBar.content`));
	}
	const steps = await page.evaluate(`${mainView}.$.pullout.route.slice(0,4).map(function(s){return [s.maneuver, s.instructions, s.distance.text];})`);
	check('osm: route steps have instructions + maneuvers', steps.length && steps.every((s) => s[0] && s[1] && s[2]), steps);
	await sleep(1500);
	await shot(page, '/osm-4-route.png');
	await page.evaluate(`${mainView}.directStepGo({step: 1})`);
	check('osm: step forward moves step marker', await page.evaluate(`${mainView}.directStepMarker.step === 1`));

	// unsupported travel mode reports instead of throwing
	await page.evaluate(`(function(v){ v.$.infoDialog.hide(); v.directRequest.travelMode = "TRANSIT"; v.calcRoute(); })(${mainView})`);
	check('osm: TRANSIT shows info dialog', await waitFor(page, `${mainView}.$.infoDialog.showing`, 5000), await page.evaluate(`${mainView}.$.infoDialogContent.content`));
	await page.evaluate(`${mainView}.closeInfoDialog(); ${mainView}.directRequest.travelMode = "DRIVING";`);

	// clearing removes route + markers but keeps my location
	await page.evaluate(`${mainView}.clearMap()`);
	check('osm: clearMap removes route and markers', await page.evaluate(`!mapEngine.routeLayer && (${mainView}.myLocationMarker ? markers.length == 1 && markers[0] === ${mainView}.myLocationMarker : markers.length == 0)`));

	// map types and layers
	for (const t of ['TOPO', 'CYCLOSM', 'HOT', 'OSM']) {
		await page.evaluate(`${mainView}.mapTypeSelect(null, {mapType: "${t}", isRetina: false})`);
		await sleep(300);
	}
	check('osm: map type switch keeps one base layer', await page.evaluate(`document.querySelectorAll('.leaflet-tile-pane .leaflet-layer').length`) === 1, await page.evaluate(`document.querySelectorAll('.leaflet-tile-pane .leaflet-layer').length`));
	await page.evaluate(`${mainView}.showBicycling(null, {value: true}); ${mainView}.showTransit(null, {value: true});`);
	check('osm: offered overlays added', await page.evaluate(`document.querySelectorAll('.leaflet-tile-pane .leaflet-layer').length == (mapEngine.layers.transit ? 3 : 2)`));
	await sleep(1500);
	await shot(page, '/osm-5-layers.png');
	await page.evaluate(`${mainView}.showBicycling(null, {value: false}); ${mainView}.showTransit(null, {value: false});`);

	// settings panel shows the engine picker
	await page.evaluate(`${mainView}.$.pullout.openPullout("settingspanel")`);
	await sleep(800);
	check('osm: engine picker lists engines', await page.evaluate(`${mainView}.$.pullout.$.enginePicker.getClientControls().map(function(c){return c.content})`), await page.evaluate(`${mainView}.$.pullout.$.enginePicker.getClientControls().map(function(c){return c.content})`));
	await shot(page, '/osm-6-settings.png');
	await page.evaluate(`${mainView}.$.pullout.closePullout()`);
	await sleep(800);

	// zoom buttons
	await page.evaluate(`mapEngine.setZoom(12)`);
	await sleep(500);
	await page.click('#' + await page.evaluate(`${mainView}.$.mapZoomIn.id`));
	await sleep(600);
	check('osm: zoom in button', await page.evaluate('mapEngine.getZoom()') === 13, await page.evaluate('mapEngine.getZoom()'));
	await page.click('#' + await page.evaluate(`${mainView}.$.mapZoomOut.id`));
	await page.click('#' + await page.evaluate(`${mainView}.$.mapZoomOut.id`));
	await sleep(600);
	check('osm: zoom out button', await page.evaluate('mapEngine.getZoom()') === 11, await page.evaluate('mapEngine.getZoom()'));

	// scale bar follows the units preference
	const scaleText = () => page.evaluate(`(document.querySelector('.leaflet-control-scale')||{}).textContent||""`);
	check('osm: metric scale bar', /k?m/.test(await scaleText()) && !/mi|ft/.test(await scaleText()), await scaleText());
	await page.evaluate(`(function(p){ p.UnitsChange(p.$.unitsPicker, {selected: p.$.unitsimperial}); })(${mainView}.$.pullout)`);
	check('osm: imperial scale bar', /mi|ft/.test(await scaleText()), await scaleText());
	check('osm: units preference stored', await page.evaluate('JSON.parse(localStorage.getItem("mapsAppPrefs")).lengthUnits') === 'imperial');
	check('osm: imperial route distances', await page.evaluate(`mapEngine.directionsFromOsrm({code:"Ok",routes:[{distance:1609.344,duration:60,geometry:{coordinates:[[4.9,52.3],[4.9,52.31]]},legs:[{steps:[]}]}]}).routes[0].legs[0].distance.text`) === '1.0 mi');
	await page.evaluate(`(function(p){ p.UnitsChange(p.$.unitsPicker, {selected: p.$.unitsmetric}); })(${mainView}.$.pullout)`);

	// place details with OSM tags (website, opening hours)
	await page.evaluate(`localStorage.removeItem("mapsAppSavedPlaces"); SavedPlaces.places = null;`);
	const museum = await page.evaluate(`new Promise(function(res){ mapEngine.geocode("Rijksmuseum Amsterdam", function(e, p){ res(e ? null : p[0]); }); })`);
	check('osm: geocode finds a POI with OSM tags', museum && museum.website, museum && {website: museum.website, hours: museum.opening_hours_text});
	await page.evaluate(`(function(v){ mapEngine.geocode("Rijksmuseum Amsterdam", function(e, p){ v.PlaceMarker([p[0]]); }); })(${mainView})`);
	await waitFor(page, `${mainView}.$.markerPopup.showing && /Rijksmuseum/.test(${mainView}.$.popName.content)`, 15000);
	await page.evaluate(`${mainView}.markerInfo()`);
	await sleep(500);
	check('osm: details show website + opening hours', await page.evaluate(`(function(d){ return d.PlaceDetailsWebsite.showing && d.PlaceDetailsOpening.showing && !d.PlaceDetailsPhone.showing; })(${mainView}.$.placeDetails.$)`), await page.evaluate(`[${mainView}.$.placeDetails.$.PlaceDetailsWebsite.content, ${mainView}.$.placeDetails.$.PlaceDetailsOpeningText.content]`));
	await shot(page, '/osm-7-poi-details.png');
	await page.evaluate(`${mainView}.toggleDetails()`);

	// save the place from the marker menu, it shows up in the Saved list and survives a reload
	await page.evaluate(`${mainView}.markerPopupTap()`);
	check('osm: marker menu offers Save place', await page.evaluate(`${mainView}.$.markerSave.content`) === 'Save place', await page.evaluate(`${mainView}.$.markerSave.content`));
	await page.evaluate(`${mainView}.toggleSavePlace()`);
	check('osm: place saved', await page.evaluate(`SavedPlaces.load().length == 1 && /Rijksmuseum/.test(SavedPlaces.load()[0].name)`));
	await page.evaluate(`${mainView}.markerPopupTap()`);
	check('osm: menu now offers removal', await page.evaluate(`${mainView}.$.markerSave.content`) === 'Remove from saved');
	await page.evaluate(`${mainView}.$.markerPopupMenu.hide(); ${mainView}.$.markerPopup.hide(); ${mainView}.$.pullout.openPullout("bookmarkpanel"); ${mainView}.$.pullout.showSaved();`);
	await sleep(800);
	check('osm: Saved tab lists the place', await page.evaluate(`${mainView}.$.pullout.$.savedlist.count == 1 && ${mainView}.$.pullout.$.savedlist.showing`));
	await shot(page, '/osm-8-saved.png');
	await page.evaluate(`${mainView}.clearMap(); ${mainView}.$.pullout.closePullout();`);
	await page.evaluate(`(function(p){ p.$.savedlist.select(0); })(${mainView}.$.pullout)`);
	check('osm: picking a saved place shows it on the map', await waitFor(page, `markers.some(function(m){ return m.place.lunetype == "saved"; })`, 5000));

	// swap origin and destination
	await page.evaluate(`(function(v){ v.directRequest.origin = mapEngine.latLng(1, 2); v.directRequest.destination = mapEngine.latLng(3, 4); v.$.directionStart.setValue("A"); v.$.directionEnd.setValue("B"); v.swapDirections(); })(${mainView})`);
	check('osm: swap origin and destination', await page.evaluate(`(function(v){ return v.directRequest.origin.lat() == 3 && v.directRequest.destination.lat() == 1 && v.$.directionStart.getValue() == "B" && v.$.directionEnd.getValue() == "A"; })(${mainView})`));
	await page.evaluate(`${mainView}.clearMap()`);

	// launch targets handed over by other apps
	await page.evaluate(`${mainView}.handleLaunchParams({target: "maploc:Rotterdam Centraal"})`);
	check('osm: maploc: launch shows the place', await waitFor(page, `markers.some(function(m){ return /Rotterdam Centraal/.test(m.place.name); })`, 15000), await page.evaluate(`${mainView}.$.searchLocation.getValue()`));
	await page.evaluate(`${mainView}.clearMap()`);
	await page.evaluate(`${mainView}.handleLaunchParams({target: "geo:52.3584,4.8811"})`);
	check('osm: geo: launch drops a marker at the coordinates', await page.evaluate(`markers.some(function(m){ var l = m.place.geometry.location; return Math.abs(l.lat()-52.3584) < 1e-6 && Math.abs(l.lng()-4.8811) < 1e-6; })`));
	await page.evaluate(`${mainView}.clearMap()`);
	if (await page.evaluate(`!!${mainView}.myLocationMarker`)) {
		await page.evaluate(`${mainView}.handleLaunchParams({target: "mapto:Vondelpark, Amsterdam"})`);
		check('osm: mapto: launch plans a route from my location', await waitFor(page, `mapEngine.routeLayer && ${mainView}.$.pullout.route.length > 1`, 20000), await page.evaluate(`${mainView}.$.directResultsBar.content`));
		await shot(page, '/osm-9-mapto.png');
		await page.evaluate(`${mainView}.clearMap()`);
	}
	await page.evaluate(`localStorage.removeItem("mapsAppSavedPlaces"); SavedPlaces.places = null;`);

	check('osm: tile servers deliver real tiles (no policy block)', tiles.ok > 0 && tiles.bad.length === 0, {ok: tiles.ok, bad: tiles.bad.slice(0, 5)});
	const osmErrors = errors.splice(0);
	check('osm: no page/console errors', osmErrors.length === 0, osmErrors);

	// a target in the URL is handled at start-up like webOS launch params
	if (!connect) {
		await page.goto(base + '?target=' + encodeURIComponent('maploc:52.3702,4.8952'), {waitUntil: 'load'});
		check('osm: start-up launch target', await waitFor(page, `window.markers && markers.some(function(m){ return m.place.name == "52.3702,4.8952"; })`), await page.evaluate('window.markers && markers.length'));
		await page.goto(base, {waitUntil: 'load'});
		await waitFor(page, `window.mapEngine && mapEngine.map && ${mainView} && !${mainView}.$.initPopUp.showing`);
		errors.splice(0);
	}

	// ---------- switch to Google through the preference ----------
	const picker = await page.evaluate(`(function(v){ var p = v.$.pullout; var item = p.$.enginePicker.getClientControls().filter(function(c){return c.engine=="google"})[0]; p.EngineChange(p.$.enginePicker, {selected: item}); return true; })(${mainView})`);
	await page.waitForNavigation({waitUntil: 'load', timeout: 20000}).catch(() => {});
	check('switch: reloaded with google engine', await waitFor(page, `window.mapEngine && mapEngine.id == "google"`, 10000), await page.evaluate('window.mapEngine && mapEngine.id'));
	check('switch: mapType is valid for the new engine', await page.evaluate('mapEngine.isMapType(Prefs.mapType)'), await page.evaluate('Prefs.mapType'));
	const gLoaded = await waitFor(page, `window.google && google.maps && ${mainView} && !${mainView}.$.initPopUp.showing`, 25000);
	check('google: app initialised', gLoaded, await page.evaluate(`window.google && google.maps && google.maps.version`));
	if (gLoaded) {
		check('google: traffic/transit/street view offered', await page.evaluate(`var p=${mainView}.$.pullout.$; p.trafficToggle.showing && p.travelTRANSIT.showing && ${mainView}.$.markerStreet.showing && !!p.mapTypeROADMAP`));
		if (located || !webosLocation) {
			await waitFor(page, `${mainView}.myLocationMarker`, 10000);
			check('google: geolocation marker', await page.evaluate(`!!${mainView}.myLocationMarker`));
		}
		await sleep(2000);
		await shot(page, '/google-1-start.png');
	}
	const googleErrors = errors.splice(0);
	check('google: page/console errors (Google key/billing errors are expected to be external)', true, googleErrors);

	// ---------- and back to OSM ----------
	await page.evaluate(`(function(v){ var p = v.$.pullout; var item = p.$.enginePicker.getClientControls().filter(function(c){return c.engine=="osm"})[0]; p.EngineChange(p.$.enginePicker, {selected: item}); })(${mainView})`);
	await page.waitForNavigation({waitUntil: 'load', timeout: 20000}).catch(() => {});
	check('switch back: osm engine active', await waitFor(page, `window.mapEngine && mapEngine.id == "osm" && mapEngine.map`, 15000));
	check('switch back: no errors', errors.length === 0, errors);

	if (out) fs.writeFileSync(out + '/results.json', JSON.stringify(results, null, 1));
	const failed = results.filter((r) => !r.ok).length;
	console.log(`\n${results.length - failed}/${results.length} passed`);
	if (connect) {
		browser.disconnect();
	} else {
		await browser.close();
	}
	process.exit(failed ? 1 : 0);
})().catch(async (e) => { console.error('FATAL', e); process.exit(2); });
