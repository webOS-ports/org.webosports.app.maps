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

function loadEngines(prefs) {
	const context = {
		Prefs: Object.assign({engine: 'osm', mapType: 'OSM', lengthUnits: 'metric', lang: 'en'}, prefs || {}),
		$L: (s) => s,
		enyo: {
			mixin: (a, b) => Object.assign(a, b),
			log: () => {},
			error: () => {}
		},
		window: {devicePixelRatio: 1, location: {protocol: (prefs && prefs.protocol) || 'http:'}},
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

test('file:// apps get tile servers that accept requests without Referer', () => {
	const web = loadEngines().MapEngines;
	const app = loadEngines({protocol: 'file:'}).MapEngines;
	assert.ok(!web.fileOrigin && app.fileOrigin);
	assert.ok(web.create('osm').layers.transit, 'OpenRailwayMap works with a Referer');
	assert.ok(!app.create('osm').layers.transit, 'OpenRailwayMap answers 403 without Referer');
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
});

test('OSRM steps get readable instructions', () => {
	const c = loadEngines();
	const steps = c.MapEngines.create('osm').directionsFromOsrm(osrmResponse()).routes[0].legs[0].steps;
	assert.deepStrictEqual(Array.from(steps, (s) => s.instructions), [
		'Head northwest on <b>Stationsplein</b>',
		'Turn left onto <b>IJ-passage</b>',
		'At the roundabout, take exit 2 onto <b>Museumplein</b>',
		'Keep slightly left at the fork',
		'Take the ramp right onto <b>A10</b>',
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
