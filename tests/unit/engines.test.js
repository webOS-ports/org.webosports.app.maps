/*
 * Unit tests for the engine layer that need neither a browser nor network:
 * MapEngines helpers and the OSRM/Nominatim conversions of the OSM engine.
 * Run with: node --test tests/unit
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', '..');

/* ilib looks in resources/<language>/<region>/, so "zh-TW" is resources/zh/TW/strings.json */
function stringsFile(lang) {
	return path.join(root, 'resources', ...lang.split('-'), 'strings.json');
}

function readStrings(lang) {
	return JSON.parse(fs.readFileSync(stringsFile(lang), 'utf8'));
}

/* prefs.lang other than en: $L() translates with the strings.json of that language, as ilib does */
function loadEngines(prefs) {
	const lang = (prefs && prefs.lang) || 'en';
	const strings = lang == 'en' ? {} : readStrings(lang);
	const $L = (s) => (strings[s] !== undefined ? strings[s] : s);
	const context = {
		Prefs: Object.assign({engine: 'osm', mapType: 'OSM', lengthUnits: 'metric', lang: 'en'}, prefs || {}),
		$L: $L,
		N_: (s) => s,
		$LF: (s, values) => String($L(s)).replace(/\{(\w+)\}/g, (all, name) => (values && values[name] !== undefined ? values[name] : all)),
		enyo: {
			mixin: (a, b) => Object.assign(a, b),
			log: () => {},
			error: () => {}
		},
		window: {devicePixelRatio: 1},
		console: console
	};
	vm.createContext(context);
	for (const file of ['source/engines/MapEngine.js', 'source/engines/OsmEngine.js', 'source/engines/GoogleEngine.js']) {
		vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
	}
	return context;
}

/* an OSRM v1 response shaped like routing.openstreetmap.de returns it */
function osrmResponse() {
	const step = (type, modifier, name, distance, location, extra) => Object.assign({
		name: name,
		distance: distance,
		duration: distance / 10,
		driving_side: 'right',
		maneuver: Object.assign({type: type, modifier: modifier, location: location, bearing_after: 315}, extra || {})
	});
	return {
		code: 'Ok',
		routes: [{
			distance: 4900,
			duration: 720,
			geometry: {type: 'LineString', coordinates: [[4.9003, 52.3791], [4.89, 52.37], [4.8811, 52.3584]]},
			legs: [{steps: [
				step('depart', undefined, 'Stationsplein', 18, [4.9003, 52.3791]),
				step('turn', 'left', 'IJ-passage', 65, [4.9001, 52.3790]),
				step('roundabout', 'right', 'Museumplein', 300, [4.89, 52.37], {exit: 2}),
				step('fork', 'slight left', '', 100, [4.885, 52.365]),
				step('on ramp', 'right', 'A10', 500, [4.884, 52.36]),
				step('continue', 'uturn', 'Hobbemastraat', 40, [4.883, 52.359]),
				step('arrive', undefined, '', 0, [4.8811, 52.3584])
			]}]
		}]
	};
}

test('engine registry: osm is the default, google is selectable', () => {
	const c = loadEngines();
	assert.deepStrictEqual(Array.from(c.MapEngines.list(), (e) => e.id), ['osm', 'google']);
	assert.strictEqual(c.MapEngines.create('osm').id, 'osm');
	assert.strictEqual(c.MapEngines.create('google').id, 'google');
	assert.strictEqual(c.MapEngines.create('does-not-exist').id, 'osm');
});

test('engine capabilities drive the UI', () => {
	const c = loadEngines();
	const osm = c.MapEngines.create('osm');
	const google = c.MapEngines.create('google');
	assert.ok(osm.nativeGestures, 'Leaflet pans by itself');
	assert.ok(!google.nativeGestures, 'Google relies on the app gesture code');
	assert.ok(!osm.layers.traffic && osm.layers.bike && osm.layers.transit);
	assert.deepStrictEqual(Array.from(osm.travelModes), ['DRIVING', 'WALKING', 'BICYCLING']);
	assert.ok(!osm.routeOptions.avoidTolls, 'FOSSGIS OSRM has no exclude classes');
	assert.ok(google.streetView && !osm.streetView);
});

test('map types: valid per engine, _HDPI suffix ignored', () => {
	const c = loadEngines();
	const osm = c.MapEngines.create('osm');
	const google = c.MapEngines.create('google');
	assert.ok(osm.isMapType('OSM') && osm.isMapType('TOPO'));
	assert.ok(!osm.isMapType('ROADMAP') && !osm.isMapType('ROADMAP_HDPI'));
	assert.ok(google.isMapType('ROADMAP_HDPI') && google.isMapType('OSM'));
	assert.ok(!google.isMapType('TOPO'));
});

test('LatLng behaves like google.maps.LatLng', () => {
	const c = loadEngines();
	const p = new c.MapEngines.LatLng('52.370216', '4.895168');
	assert.strictEqual(p.lat(), 52.370216);
	assert.strictEqual(p.lng(), 4.895168);
	assert.strictEqual(p.toUrlValue(3), '52.37,4.895');
	assert.strictEqual(p.toUrlValue(), '52.370216,4.895168');
	assert.ok(p.equals(new c.MapEngines.LatLng(52.370216, 4.895168)));
});

test('distance: one degree of latitude is 2*pi*R/360', () => {
	const c = loadEngines();
	const R = 6371008.8; /* mean earth radius used by MapEngines.distance */
	const d = c.MapEngines.distance(new c.MapEngines.LatLng(52, 4.9), new c.MapEngines.LatLng(53, 4.9));
	assert.ok(Math.abs(d - 2 * Math.PI * R / 360) < 0.01, 'got ' + d);
	/* along the equator the same holds for longitude */
	const e = c.MapEngines.distance(new c.MapEngines.LatLng(0, 10), new c.MapEngines.LatLng(0, 11));
	assert.ok(Math.abs(e - 2 * Math.PI * R / 360) < 0.01, 'got ' + e);
	assert.strictEqual(c.MapEngines.distance(new c.MapEngines.LatLng(52, 4.9), new c.MapEngines.LatLng(52, 4.9)), 0);
});

test('distance and duration formatting', () => {
	const metric = loadEngines().MapEngines;
	assert.strictEqual(metric.formatDistance(18), '18 m');
	assert.strictEqual(metric.formatDistance(1234), '1.2 km');
	assert.strictEqual(metric.formatDistance(23456), '23 km');
	assert.strictEqual(metric.formatDuration(720), '12 min');
	assert.strictEqual(metric.formatDuration(3900), '1 h 5 min');
	const imperial = loadEngines({lengthUnits: 'imperial'}).MapEngines;
	assert.strictEqual(imperial.formatDistance(100), '328 ft');
	assert.strictEqual(imperial.formatDistance(1609.344), '1.0 mi');
});

test('the OSM engine offers transit and bike overlays everywhere', () => {
	const osm = loadEngines().MapEngines.create('osm');
	assert.ok(osm.layers.transit && osm.layers.bike && !osm.layers.traffic);
});

test('query strings drop empty values and encode', () => {
	const c = loadEngines();
	assert.strictEqual(c.MapEngines.query({q: 'Rotterdam Centraal', a: '', b: null, c: undefined, n: 0}), 'q=Rotterdam%20Centraal&n=0');
});

test('OSRM response becomes a DirectionsResult-like object', () => {
	const c = loadEngines();
	const osm = c.MapEngines.create('osm');
	const result = osm.directionsFromOsrm(osrmResponse());
	const leg = result.routes[0].legs[0];
	assert.strictEqual(leg.distance.text, '4.9 km');
	assert.strictEqual(leg.duration.text, '12 min');
	assert.strictEqual(leg.steps.length, 7);
	assert.deepStrictEqual(Array.from(result.routes[0].warnings), []);
	assert.ok(result.routes[0].copyrights.indexOf('OpenStreetMap') >= 0);
	/* GeoJSON is [lng, lat], Leaflet wants [lat, lng] */
	assert.deepStrictEqual(Array.from(result.routes[0].path[0]), [52.3791, 4.9003]);
	const first = leg.steps[0];
	assert.strictEqual(first.start_location.lat(), 52.3791);
	assert.strictEqual(first.start_point, first.start_location);
	assert.strictEqual(first.distance.text, '18 m');
	assert.deepStrictEqual(Array.from(leg.steps, (s) => s.arrival), [false, false, false, false, false, false, true]);
});

test('OSRM steps get readable instructions', () => {
	const c = loadEngines();
	const steps = c.MapEngines.create('osm').directionsFromOsrm(osrmResponse()).routes[0].legs[0].steps;
	assert.deepStrictEqual(Array.from(steps, (s) => s.instructions), [
		'Head northwest on <b>Stationsplein</b>',
		'Turn left onto <b>IJ-passage</b>',
		'At the roundabout, take exit 2 onto <b>Museumplein</b>',
		'Keep left at the fork',
		'Take the ramp on the right onto <b>A10</b>',
		'Make a U-turn onto <b>Hobbemastraat</b>',
		'Arrive at your destination'
	]);
});

test('OSRM steps map onto the maneuver sprite classes', () => {
	const c = loadEngines();
	const steps = c.MapEngines.create('osm').directionsFromOsrm(osrmResponse()).routes[0].legs[0].steps;
	assert.deepStrictEqual(Array.from(steps, (s) => s.maneuver), [
		'straight', 'turn-left', 'roundabout-right', 'fork-left', 'ramp-right', 'straight', 'straight'
	]);
	const css = fs.readFileSync(path.join(root, 'source/style/maps.css'), 'utf8');
	for (const cls of new Set(steps.map((s) => s.maneuver))) {
		assert.ok(css.indexOf('.' + cls + '{') >= 0, 'maps.css has no .' + cls);
	}
});

test('street names are HTML escaped in instructions', () => {
	const c = loadEngines();
	const data = osrmResponse();
	data.routes[0].legs[0].steps[1].name = '<img src=x onerror=alert(1)>';
	const steps = c.MapEngines.create('osm').directionsFromOsrm(data).routes[0].legs[0].steps;
	assert.strictEqual(steps[1].instructions, 'Turn left onto <b>&lt;img src=x onerror=alert(1)&gt;</b>');
});

test('Nominatim results become PlaceResult-like places', () => {
	const c = loadEngines();
	const place = c.MapEngines.create('osm').placeFromNominatim({
		place_id: 108407657, lat: '51.9244424', lon: '4.4777500', category: 'boundary', type: 'administrative',
		name: 'Rotterdam', display_name: 'Rotterdam, Zuid-Holland, Nederland',
		boundingbox: ['51.8616672', '51.9942735', '4.3793095', '4.6018092']
	});
	assert.strictEqual(place.name, 'Rotterdam');
	assert.strictEqual(place.formatted_address, 'Rotterdam, Zuid-Holland, Nederland');
	assert.strictEqual(place.geometry.location.lat(), 51.9244424);
	assert.deepStrictEqual(Object.assign({}, place.geometry.viewport), {south: 51.8616672, north: 51.9942735, west: 4.3793095, east: 4.6018092});
	assert.strictEqual(typeof place.icon, 'string');

	/* reverse geocoding of a house: no name, a point bounding box */
	const house = c.MapEngines.create('osm').placeFromNominatim({
		place_id: 1, lat: '52.37', lon: '4.89', name: '', display_name: '14, Sint Agnietenstraat, Amsterdam',
		boundingbox: ['52.37', '52.37', '4.89', '4.89']
	});
	assert.strictEqual(house.name, '14');
	assert.strictEqual(house.geometry.viewport, undefined, 'a point viewport would zoom in endlessly');
});

test('unsupported travel mode is reported, not sent', () => {
	const c = loadEngines();
	const osm = c.MapEngines.create('osm');
	let error;
	osm.route({travelMode: 'TRANSIT', origin: new c.MapEngines.LatLng(0, 0), destination: new c.MapEngines.LatLng(1, 1)}, (e) => { error = e; });
	assert.ok(error && /not available/.test(error));
});

test('offline tile cache only takes tile requests of the offered servers', () => {
	const context = {self: {addEventListener: () => {}}, caches: {}, fetch: () => {}, Response: function () {}};
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context, {filename: 'sw.js'});
	for (const url of [
		'https://tile.openstreetmap.org/15/16848/10768.png',
		'https://a.tile.openstreetmap.fr/hot/15/16848/10768.png',
		'https://b.tile.opentopomap.org/15/16848/10768.png',
		'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/15/16848/10768.png',
		'https://a.tile-cyclosm.openstreetmap.fr/cyclosm-lite/15/16848/10768.png',
		'https://a.tiles.openrailwaymap.org/standard/15/16848/10768.png'
	]) {
		assert.ok(context.isTile(url), url);
	}
	for (const url of [
		'https://nominatim.openstreetmap.org/search?q=Rotterdam',
		'https://routing.openstreetmap.de/routed-car/route/v1/driving/1,2;3,4',
		'https://evil.example/tile.openstreetmap.org/15/1/2.png',
		'http://tile.openstreetmap.org/15/16848/10768.png',
		'https://tile.openstreetmap.org/15/16848/10768.png?x=1'
	]) {
		assert.ok(!context.isTile(url), url);
	}
});

test('OSRM alternatives become separate routes, each with its own summary and steps', () => {
	const c = loadEngines();
	const data = osrmResponse();
	const second = JSON.parse(JSON.stringify(data.routes[0]));
	second.distance = 6100;
	second.duration = 900;
	second.legs[0].steps = second.legs[0].steps.slice(0, 3);
	second.geometry.coordinates = [[4.9003, 52.3791], [4.87, 52.36]];
	data.routes.push(second);
	const routes = c.MapEngines.create('osm').directionsFromOsrm(data).routes;
	assert.strictEqual(routes.length, 2);
	assert.deepStrictEqual(Array.from(routes, (r) => r.legs[0].duration.text), ['12 min', '15 min']);
	assert.deepStrictEqual(Array.from(routes, (r) => r.legs[0].distance.text), ['4.9 km', '6.1 km']);
	assert.deepStrictEqual(Array.from(routes, (r) => r.legs[0].steps.length), [7, 3]);
	assert.deepStrictEqual(Array.from(routes[1].path[1]), [52.36, 4.87]);
});

test('a route with a stop: steps of both legs, the stop announced, all points requested', () => {
	const c = loadEngines();
	const osm = c.MapEngines.create('osm');
	const data = osrmResponse();
	const legs = data.routes[0].legs;
	// split the route at the roundabout into two legs, each ending in an arrival
	const first = {steps: legs[0].steps.slice(0, 3).concat([
		{name: '', distance: 0, duration: 0, driving_side: 'right', maneuver: {type: 'arrive', location: [4.89, 52.37], bearing_after: 0}}
	])};
	const second = {steps: [
		{name: 'Museumstraat', distance: 40, duration: 4, driving_side: 'right', maneuver: {type: 'depart', location: [4.89, 52.37], bearing_after: 180}}
	].concat(legs[0].steps.slice(3))};
	data.routes[0].legs = [first, second];
	const steps = c.MapEngines.routeSteps(osm.directionsFromOsrm(data).routes[0]);
	const texts = Array.from(steps, (s) => s.instructions);
	assert.strictEqual(steps.length, 4 + 5);
	assert.strictEqual(texts[3], 'Arrive at stop 1');
	assert.strictEqual(texts[texts.length - 1], 'Arrive at your destination');

	let url;
	c.MapEngines.getJSON = (u) => { url = u; };
	osm.route({
		travelMode: 'DRIVING',
		origin: new c.MapEngines.LatLng(52.3791, 4.9003),
		waypoints: [{location: new c.MapEngines.LatLng(52.36, 4.8852), name: 'Rijksmuseum'}],
		destination: new c.MapEngines.LatLng(52.3584, 4.8811)
	}, () => {});
	assert.ok(url.includes('/route/v1/driving/4.9003,52.3791;4.8852,52.36;4.8811,52.3584?'), url);
});

test('route summary and steps add up the legs of a route with stops', () => {
	const c = loadEngines();
	const route = {legs: [
		{distance: {value: 1500, text: '1.5 km'}, duration: {value: 300, text: '5 min'}, steps: [{n: 1}, {n: 2}]},
		{distance: {value: 2600, text: '2.6 km'}, duration: {value: 600, text: '10 min'}, steps: [{n: 3}]}
	]};
	const summary = c.MapEngines.routeSummary(route);
	assert.strictEqual(summary.distance.text, '4.1 km');
	assert.strictEqual(summary.duration.text, '15 min');
	assert.deepStrictEqual(Array.from(c.MapEngines.routeSteps(route), (s) => s.n), [1, 2, 3]);
	const single = {legs: [route.legs[0]]};
	assert.strictEqual(c.MapEngines.routeSummary(single).duration.text, '5 min');
});

test('sharing a place: text with an openstreetmap.org link, mailto and sms encoded', () => {
	const c = loadEngines();
	vm.runInContext(fs.readFileSync(path.join(root, 'source/data/Share.js'), 'utf8'), c, {filename: 'Share.js'});
	const place = {name: 'Rijksmuseum', formatted_address: 'Museumstraat 1, Amsterdam',
		geometry: {location: new c.MapEngines.LatLng(52.36, 4.885222)}};
	const link = 'https://www.openstreetmap.org/?mlat=52.360000&mlon=4.885222#map=17/52.360000/4.885222';
	assert.strictEqual(c.Share.osmUrl(place.geometry.location), link);
	assert.strictEqual(c.Share.text(place), 'Rijksmuseum\nMuseumstraat 1, Amsterdam\n' + link);
	const mail = new URL(c.Share.mailto(place));
	assert.strictEqual(mail.protocol, 'mailto:');
	assert.strictEqual(mail.searchParams.get('subject'), 'Rijksmuseum');
	assert.strictEqual(mail.searchParams.get('body'), c.Share.text(place));
	assert.strictEqual(new URL(c.Share.sms(place)).searchParams.get('body'), c.Share.text(place));
	// a place named after its address does not repeat it
	assert.strictEqual(c.Share.text({name: 'A', formatted_address: 'A', geometry: place.geometry}), 'A\n' + link);
});

function loadGuidance(prefs) {
	const c = loadEngines(prefs);
	vm.runInContext(fs.readFileSync(path.join(root, 'source/data/Guidance.js'), 'utf8'), c, {filename: 'Guidance.js'});
	return c;
}

// a 2 km route due north: start, a left turn after 1 km, arrival after 2 km
function straightRoute(c) {
	const LatLng = c.MapEngines.LatLng;
	const north = (m) => new LatLng(52 + m / 111195, 5);
	const steps = [
		{instructions: 'Head north on <b>Startweg</b>', start_location: north(0), leg: 0},
		{instructions: 'Turn left onto <b>Damrak</b>', start_location: north(1000), leg: 0},
		{instructions: 'Arrive at your destination', arrival: true, start_location: north(2000), leg: 0}
	];
	const path = [[52, 5], [52 + 1000 / 111195, 5], [52 + 2000 / 111195, 5]];
	return {steps, path, north};
}

test('voice guidance announces each maneuver early, then now, then arrival - once each', () => {
	const c = loadGuidance();
	const {steps, path, north} = straightRoute(c);
	const said = [c.Guidance.start(steps, path, 'DRIVING')[0]];
	for (let m = 0; m <= 2000; m += 50) {
		said.push(...c.Guidance.update(north(m)));
	}
	assert.deepStrictEqual(said, [
		'Head north on Startweg',
		// the first fix within 500 m of the turn is 450 m before it
		'In 450 meters, turn left onto Damrak',
		'Now, turn left onto Damrak',
		'In 450 meters, arrive at your destination',
		'Arrive at your destination'
	]);
	assert.ok(c.Guidance.arrived);
	assert.deepStrictEqual(Array.from(c.Guidance.update(north(2000))), [], 'nothing more after arriving');
});

test('voice guidance asks for a new route only after several fixes off it', () => {
	const c = loadGuidance();
	const {steps, path} = straightRoute(c);
	let reroutes = 0;
	c.Guidance.start(steps, path, 'DRIVING', {onReroute: () => { reroutes++; }});
	const east = (m) => new c.MapEngines.LatLng(52 + 300 / 111195, 5 + m / (111195 * Math.cos(52 * Math.PI / 180)));
	assert.deepStrictEqual(Array.from(c.Guidance.update(east(150))), []);
	assert.deepStrictEqual(Array.from(c.Guidance.update(east(160))), []);
	assert.deepStrictEqual(Array.from(c.Guidance.update(east(170))), ['Recalculating']);
	assert.strictEqual(reroutes, 1);
	// 20 m beside the road is still on it
	c.Guidance.start(steps, path, 'DRIVING', {onReroute: () => { reroutes++; }});
	for (let i = 0; i < 5; i++) c.Guidance.update(east(20));
	assert.strictEqual(reroutes, 1);
});

test('voice guidance counts the stops passed by the leg of the next maneuver', () => {
	const c = loadGuidance();
	const route = {legs: [
		{steps: [{instructions: 'Head north'}, {instructions: 'Arrive at stop 1'}]},
		{steps: [{instructions: 'Head east'}, {instructions: 'Arrive at your destination'}]}
	]};
	const steps = c.Guidance.stepsOf(route);
	assert.deepStrictEqual(Array.from(steps, (s) => s.leg), [0, 0, 1, 1]);
	c.Guidance.start(steps.map((s, i) => Object.assign(s, {start_location: new c.MapEngines.LatLng(52 + i / 100, 5)})), [], 'WALKING');
	c.Guidance.next = 3;
	assert.strictEqual(c.Guidance.stopsPassed(), 1);
});

test('spoken distances are rounded the way people say them', () => {
	const metric = loadGuidance().Guidance;
	assert.strictEqual(metric.spokenDistance(47), '50 meters');
	assert.strictEqual(metric.spokenDistance(312), '300 meters');
	assert.strictEqual(metric.spokenDistance(1460), '1.5 kilometers');
	const imperial = loadGuidance({lengthUnits: 'imperial'}).Guidance;
	assert.strictEqual(imperial.spokenDistance(100), '300 feet');
	assert.strictEqual(imperial.spokenDistance(1609.344), '1 mile');
	assert.strictEqual(imperial.spokenDistance(3218.7), '2 miles');
});

/* every string the sources hand to $L(), $LF() or N_() */
function translatableStrings() {
	const files = [];
	(function walk(dir) {
		for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
			const file = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(file);
			else if (file.endsWith('.js')) files.push(file);
		}
	})(path.join(root, 'source'));
	const keys = new Set();
	const call = /(?:\$LF?|N_)\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
	for (const file of files) {
		const text = fs.readFileSync(file, 'utf8');
		let m;
		while ((m = call.exec(text))) keys.add(m[1][0] == '"' ? JSON.parse(m[1]) : m[1].slice(1, -1));
	}
	return keys;
}

/* every translation there is: resources/nl/strings.json is "nl", resources/zh/TW/strings.json "zh-TW" */
const languages = (function find(dir, parts) {
	let found = fs.existsSync(path.join(dir, 'strings.json')) && parts.length ? [parts.join('-')] : [];
	for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
		if (entry.isDirectory()) found = found.concat(find(path.join(dir, entry.name), parts.concat(entry.name)));
	}
	return found;
})(path.join(root, 'resources'), []).filter((l) => l != 'en');

test('every string is translated in every language, with the same placeholders', () => {
	const keys = translatableStrings();
	assert.ok(keys.size > 150, 'found the strings: ' + keys.size);
	assert.ok(keys.has('Turn left onto {road}') && keys.has('Add as stop'));
	const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(' ');
	const problems = [];
	for (const lang of languages) {
		const strings = readStrings(lang);
		for (const key of keys) {
			if (typeof strings[key] != 'string' || !strings[key].trim()) problems.push(lang + ': missing "' + key + '"');
			else if (placeholders(strings[key]) != placeholders(key)) problems.push(lang + ': placeholders of "' + key + '" -> "' + strings[key] + '"');
		}
	}
	assert.deepStrictEqual(languages.slice().sort(), ['cs', 'de', 'es', 'fr', 'it', 'nl', 'pl', 'sv', 'zh-CN', 'zh-HK', 'zh-TW']);
	assert.deepStrictEqual(problems, []);
});

test('directions and spoken guidance in Dutch and German', () => {
	const nl = loadGuidance({lang: 'nl'});
	const steps = nl.MapEngines.create('osm').directionsFromOsrm(osrmResponse()).routes[0].legs[0].steps;
	assert.deepStrictEqual(Array.from(steps, (s) => s.instructions), [
		'Rijd in noordwestelijke richting over <b>Stationsplein</b>',
		'Sla linksaf naar <b>IJ-passage</b>',
		'Neem op de rotonde afslag 2 naar <b>Museumplein</b>',
		'Houd links aan bij de splitsing',
		'Neem de oprit rechts naar <b>A10</b>',
		'Keer om naar <b>Hobbemastraat</b>',
		'U bent op uw bestemming'
	]);
	const {path: route, north} = straightRoute(nl);
	const translated = Array.from(steps.slice(0, 3), (s, i) => Object.assign({}, s, {start_location: north(i * 1000), arrival: i == 2}));
	translated[2].instructions = steps[6].instructions;
	nl.Guidance.start(translated, route, 'DRIVING');
	assert.deepStrictEqual(Array.from(nl.Guidance.update(north(550))), ['Over 450 meter: sla linksaf naar IJ-passage']);
	assert.deepStrictEqual(Array.from(nl.Guidance.update(north(950))), ['Nu: sla linksaf naar IJ-passage']);
	nl.Guidance.update(north(1000));
	nl.Guidance.update(north(1100));
	nl.Guidance.update(north(1550));
	assert.deepStrictEqual(Array.from(nl.Guidance.update(north(1950))), ['U bent op uw bestemming'], 'arrival is not prefixed with "now"');
	assert.ok(nl.Guidance.arrived);

	const de = loadGuidance({lang: 'de'});
	const first = de.MapEngines.create('osm').directionsFromOsrm(osrmResponse()).routes[0].legs[0].steps[1].instructions;
	assert.strictEqual(first, 'Links abbiegen auf <b>IJ-passage</b>');
	assert.strictEqual(de.Guidance.spokenDistance(1460), '1,5 Kilometer');
	assert.strictEqual(nl.Guidance.spokenDistance(2000), '2 kilometer');
	const zh = loadEngines({lang: 'zh-TW'});
	assert.strictEqual(zh.MapEngines.create('osm').directionsFromOsrm(osrmResponse()).routes[0].legs[0].steps[1].instructions, '左轉進入<b>IJ-passage</b>');
});

/* SAM takes a field from resources/<language>[/<script>][/<region>]/appinfo.json only when appinfo.json has it with the same type */
test('localized appinfo.json files only override fields of appinfo.json', () => {
	const base = JSON.parse(fs.readFileSync(path.join(root, 'appinfo.json'), 'utf8'));
	const files = [];
	(function walk(dir) {
		for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
			const file = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(file);
			else if (entry.name == 'appinfo.json') files.push(file);
		}
	})(path.join(root, 'resources'));
	assert.ok(files.length >= 4, files.join());
	const titles = {};
	for (const file of files) {
		const local = JSON.parse(fs.readFileSync(file, 'utf8'));
		for (const key of Object.keys(local)) {
			assert.ok(key in base, path.relative(root, file) + ': ' + key + ' is not in appinfo.json');
			assert.strictEqual(typeof local[key], typeof base[key], path.relative(root, file) + ': ' + key);
		}
		titles[path.relative(path.join(root, 'resources'), path.dirname(file))] = local.title;
	}
	assert.strictEqual(titles['zh'], '地图');
	for (const dir of ['zh/Hant', 'zh/TW', 'zh/HK']) assert.strictEqual(titles[dir], '地圖', dir);
});
