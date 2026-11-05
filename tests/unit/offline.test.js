/*
 * Unit tests for offline areas (source/engines/OfflineAreas.js and
 * OfflineStyle.js): tile arithmetic, the download with the OpenFreeMap
 * limits, storage, the search index and the raster fallback. The network,
 * Cache Storage and localStorage are mocks; the vector tiles are decoded by
 * the bundled protomaps-leaflet.
 * Run with: node --test tests/unit
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {encodeTile} = require('./mvt');

const root = path.join(__dirname, '..', '..');
const TEMPLATE = 'https://tiles.openfreemap.org/planet/20261101_080013_pt/{z}/{x}/{y}.pbf';
/* the middle of Amsterdam is tile 14/8414/5384 */
const AMSTERDAM = {south: 52.366, west: 4.885, north: 52.376, east: 4.900};
/* objects made inside the vm context have other prototypes: compare their JSON */
const plain = (v) => JSON.parse(JSON.stringify(v));

function memoryCaches() {
	const stores = new Map();
	return {
		stores,
		open: async (name) => {
			if (!stores.has(name)) stores.set(name, new Map());
			const store = stores.get(name);
			return {
				put: async (url, response) => { store.set(String(url), await response.arrayBuffer()); },
				match: async (url) => (store.has(String(url)) ? new Response(store.get(String(url)).slice(0)) : undefined),
				keys: async () => Array.from(store.keys())
			};
		},
		delete: async (name) => stores.delete(name),
		has: async (name) => stores.has(name)
	};
}

function memoryStorage() {
	const items = {};
	return {
		getItem: (k) => (k in items ? items[k] : null),
		setItem: (k, v) => { items[k] = String(v); },
		removeItem: (k) => { delete items[k]; }
	};
}

/* a tile fetcher: inBody(z, x, y) gives the body or a status number; records concurrency */
function tileServer(inBody) {
	const server = {requests: [], running: 0, maxRunning: 0, failures: {}};
	server.fetch = (url, options) => {
		server.requests.push(url);
		server.running++;
		server.maxRunning = Math.max(server.maxRunning, server.running);
		const m = /\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(url);
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				server.running--;
				if (options && options.signal && options.signal.aborted) {
					reject(new Error('aborted'));
					return;
				}
				const body = inBody(Number(m[1]), Number(m[2]), Number(m[3]), url);
				if (body instanceof Error) {
					reject(body);
				} else if (typeof body == 'number') {
					resolve(new Response('', {status: body}));
				} else {
					const headers = body.contentLength ? {'Content-Length': String(body.contentLength)} : {};
					resolve(new Response(body.data || body, {status: 200, headers}));
				}
			}, 1);
		});
	};
	return server;
}

function load(options) {
	const opts = options || {};
	const caches = opts.caches || memoryCaches();
	const context = {
		Prefs: Object.assign({engine: 'osm', mapType: 'OSM', lengthUnits: 'metric', lang: 'en'}, opts.prefs || {}),
		$L: (s) => s,
		N_: (s) => s,
		$LF: (s, values) => String(s).replace(/\{(\w+)\}/g, (all, name) => (values && values[name] !== undefined ? values[name] : all)),
		enyo: {mixin: (a, b) => Object.assign(a, b), log: () => {}, error: () => {}},
		window: {devicePixelRatio: 1, localStorage: opts.storage || memoryStorage()},
		console, caches, Response, AbortController, URL, TextDecoder, setTimeout, Promise,
		fetch: opts.fetch || (() => Promise.reject(new Error('no network in this test')))
	};
	vm.createContext(context);
	const files = ['lib/protomaps-leaflet/protomaps-leaflet.js', 'source/engines/MapEngine.js', 'source/engines/OfflineAreas.js', 'source/engines/OfflineStyle.js'];
	if (opts.engine) files.push('source/engines/OsmEngine.js');
	for (const file of files) {
		vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
	}
	vm.runInContext('globalThis.protomapsL = protomapsL;', context);
	const tileJson = opts.tileJson || {tiles: [TEMPLATE]};
	context.MapEngines.getJSON = (url, cb) => setTimeout(() => (tileJson instanceof Error ? cb(tileJson.message) : cb(null, tileJson)), 0);
	return context;
}

function download(c, request) {
	const progress = [];
	return new Promise((resolve) => {
		const handle = c.OfflineAreas.download(request, (p) => progress.push(p), (error, area) => resolve({error, area, progress, handle}));
		if (!handle) return;
	});
}

/* tiles of the test area: the city at zoom 14 holds names, the rest is empty */
function amsterdamTile(z, x, y) {
	if (z == 14 && x == 8414 && y == 5384) {
		return encodeTile({
			place: [{type: 'point', at: [2048, 2048], props: {name: 'Amsterdam', class: 'city'}},
				{type: 'point', at: [1000, 1000], props: {name: 'Jordaan', class: 'neighbourhood'}}],
			poi: [{type: 'point', at: [3000, 3000], props: {name: 'Café de Jaren', class: 'cafe'}},
				{type: 'point', at: [3100, 3000], props: {class: 'bench'}}],
			transportation_name: [{type: 'line', path: [[100, 200], [2000, 2100], [4000, 4000]], props: {name: 'Damrak', class: 'primary'}}]
		});
	}
	return encodeTile({});
}

test('tile numbers match the tile servers', () => {
	const c = load();
	const A = c.OfflineAreas;
	assert.strictEqual(A.tileX(4.893, 14), 8414);
	assert.strictEqual(A.tileY(52.373, 14), 5384);
	assert.strictEqual(A.tileX(-180, 3), 0);
	assert.strictEqual(A.tileX(180, 3), 7);
	assert.strictEqual(A.tileY(89, 3), 0);
	assert.strictEqual(A.tileY(-89, 3), 7);
	/* the corners of a tile are the edges of its neighbours */
	assert.ok(Math.abs(A.tileLng(8414, 14) - (8414 / 16384 * 360 - 180)) < 1e-9);
	assert.strictEqual(A.tileY(A.tileLat(5384.5, 14), 14), 5384);
	assert.strictEqual(A.tileX(A.tileLng(8414.5, 14), 14), 8414);
});

test('the tiles of an area: count, list and membership agree', () => {
	const A = load().OfflineAreas;
	const tiles = A.tileList(AMSTERDAM, 5, 14);
	assert.strictEqual(tiles.length, A.countTiles(AMSTERDAM, 5, 14));
	assert.deepStrictEqual(plain(tiles[0]), {z: 5, x: 16, y: 10});
	assert.ok(tiles.every((t, i) => i == 0 || tiles[i - 1].z <= t.z), 'lowest zoom first');
	const area = {bounds: AMSTERDAM, minZoom: 5, maxZoom: 14};
	assert.ok(tiles.every((t) => A.hasTile(area, t.z, t.x, t.y)));
	assert.ok(!A.hasTile(area, 15, 16828, 10768), 'above the highest zoom');
	assert.ok(!A.hasTile(area, 4, 8, 5), 'below the lowest zoom');
	assert.ok(!A.hasTile(area, 14, 8420, 5384), 'beside the area');
	/* out-of-range coordinates are clamped, not wrapped into nonsense */
	const world = A.clampBounds({south: -100, west: -200, north: 100, east: 200});
	assert.deepStrictEqual(plain(world), {south: -A.maxLat, west: -180, north: A.maxLat, east: 180});
	assert.strictEqual(A.countTiles(world, 0, 2), 1 + 4 + 16);
});

test('only an https tile URL template of OpenFreeMap is taken from the TileJSON', () => {
	const A = load().OfflineAreas;
	assert.ok(A.validTemplate(TEMPLATE));
	for (const bad of [
		'http://tiles.openfreemap.org/planet/x/{z}/{x}/{y}.pbf',
		'https://tiles.openfreemap.org.evil.example/planet/{z}/{x}/{y}.pbf',
		'https://evil.example/https://tiles.openfreemap.org/{z}/{x}/{y}.pbf',
		'https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf?callback=x',
		'https://tiles.openfreemap.org/planet/"><script>/{z}/{x}/{y}.pbf',
		'javascript:alert(1)//{z}/{x}/{y}.pbf',
		undefined,
		42
	]) {
		assert.ok(!A.validTemplate(bad), String(bad));
	}
});

test('an area over 3000 tiles is refused before anything is fetched', async () => {
	const server = tileServer(() => encodeTile({}));
	const c = load({fetch: server.fetch});
	const big = {south: 51.9, west: 4.0, north: 52.6, east: 5.4};
	assert.ok(c.OfflineAreas.countTiles(big, 5, 14) > 3000);
	let result;
	const handle = c.OfflineAreas.download({bounds: big, maxZoom: 14}, null, (e) => { result = e; });
	assert.strictEqual(handle, null);
	assert.ok(result.tooMany > 3000, JSON.stringify(result));
	assert.strictEqual(server.requests.length, 0);
	/* less detail fits */
	assert.ok(c.OfflineAreas.countTiles(big, 5, 12) <= 3000);
});

test('a download stores every tile, at most 4 at a time, and lists the area', async () => {
	const server = tileServer((z, x, y) => ({data: amsterdamTile(z, x, y), contentLength: 100}));
	const caches = memoryCaches();
	const storage = memoryStorage();
	const c = load({fetch: server.fetch, caches, storage});
	const {error, area, progress} = await download(c, {bounds: AMSTERDAM, maxZoom: 14});
	assert.strictEqual(error, null);
	const total = c.OfflineAreas.countTiles(AMSTERDAM, 5, 14);
	assert.strictEqual(server.requests.length, total);
	assert.ok(server.maxRunning <= 4 && server.maxRunning >= 2, 'parallel requests: ' + server.maxRunning);
	assert.ok(server.requests.every((u) => u.startsWith('https://tiles.openfreemap.org/planet/20261101_080013_pt/')));
	assert.strictEqual(progress.length, total);
	assert.deepStrictEqual(plain(progress[progress.length - 1]), {done: total, total: total, bytes: total * 100});
	assert.strictEqual(area.name, 'Amsterdam', 'named after the largest place');
	assert.strictEqual(area.tiles, total);
	assert.strictEqual(area.bytes, total * 100, 'counts what came over the network');
	assert.deepStrictEqual(plain([area.minZoom, area.maxZoom, area.template]), [5, 14, TEMPLATE]);
	const store = caches.stores.get('offline-area-' + area.id);
	assert.strictEqual(store.size, total + 1, 'every tile and the index');
	const stored = JSON.parse(storage.getItem('mapsAppOfflineAreas'));
	assert.strictEqual(stored.length, 1);
	assert.strictEqual(stored[0].id, area.id);
	/* stored tiles come back, others do not */
	const buffer = await c.OfflineAreas.getTile(14, 8414, 5384);
	assert.ok(buffer && buffer.byteLength > 50);
	assert.strictEqual(await c.OfflineAreas.getTile(14, 9000, 5384), null);
	assert.strictEqual(await c.OfflineAreas.getTile(14, 8414, 5384, 12), null, 'only the areas of the layer\'s zoom');
});

test('a download over 50 MB stops, keeps nothing and says so', async () => {
	const server = tileServer(() => ({data: encodeTile({}), contentLength: 5 * 1024 * 1024}));
	const caches = memoryCaches();
	const c = load({fetch: server.fetch, caches});
	const {error} = await download(c, {bounds: AMSTERDAM, maxZoom: 14});
	assert.ok(error.tooLarge > 50 * 1024 * 1024, JSON.stringify(error));
	assert.ok(server.requests.length < c.OfflineAreas.countTiles(AMSTERDAM, 5, 14), 'stopped early: ' + server.requests.length);
	await new Promise((r) => setTimeout(r, 20));
	assert.strictEqual(caches.stores.size, 0, 'the partial tiles are deleted');
	assert.strictEqual(c.OfflineAreas.list().length, 0);
});

test('a failing tile is tried again, a tile that keeps failing stops the download', async () => {
	const tries = {};
	const flaky = tileServer((z, x, y, url) => {
		tries[url] = (tries[url] || 0) + 1;
		return (z == 10 && tries[url] < 3) ? new Error('network') : encodeTile({});
	});
	const c = load({fetch: flaky.fetch});
	const ok = await download(c, {bounds: AMSTERDAM, maxZoom: 10});
	assert.strictEqual(ok.error, null);
	assert.ok(Object.keys(tries).some((u) => tries[u] == 3));

	const broken = tileServer((z) => (z == 9 ? 500 : encodeTile({})));
	const caches = memoryCaches();
	const c2 = load({fetch: broken.fetch, caches});
	const failed = await download(c2, {bounds: AMSTERDAM, maxZoom: 10});
	assert.deepStrictEqual(plain(failed.error), {message: 'HTTP 500'});
	assert.strictEqual(broken.requests.filter((u) => /\/9\//.test(u)).length, 3, 'three attempts');
	await new Promise((r) => setTimeout(r, 20));
	assert.strictEqual(caches.stores.size, 0);
	assert.strictEqual(c2.OfflineAreas.list().length, 0);
});

test('a TileJSON that is not OpenFreeMap\'s, or no network, downloads nothing', async () => {
	const server = tileServer(() => encodeTile({}));
	const c = load({fetch: server.fetch, tileJson: {tiles: ['https://evil.example/{z}/{x}/{y}.pbf']}});
	const bad = await download(c, {bounds: AMSTERDAM, maxZoom: 10});
	assert.ok(bad.error.message);
	const c2 = load({fetch: server.fetch, tileJson: new Error('HTTP 0')});
	const offline = await download(c2, {bounds: AMSTERDAM, maxZoom: 10});
	assert.deepStrictEqual(plain(offline.error), {message: 'HTTP 0'});
	assert.strictEqual(server.requests.length, 0);
});

test('a cancelled download keeps nothing', async () => {
	const server = tileServer(() => encodeTile({}));
	const caches = memoryCaches();
	const c = load({fetch: server.fetch, caches});
	const result = await new Promise((resolve) => {
		let handle;
		handle = c.OfflineAreas.download({bounds: AMSTERDAM, maxZoom: 14}, (p) => { if (p.done == 3) handle.cancel(); }, (error) => resolve(error));
	});
	assert.deepStrictEqual(plain(result), {cancelled: true});
	await new Promise((r) => setTimeout(r, 20));
	assert.strictEqual(caches.stores.size, 0);
	assert.ok(server.requests.length < 20, 'stopped: ' + server.requests.length);
});

test('deleting an area removes its tiles and its entry', async () => {
	const server = tileServer((z, x, y) => amsterdamTile(z, x, y));
	const caches = memoryCaches();
	const c = load({fetch: server.fetch, caches});
	const first = await download(c, {bounds: AMSTERDAM, maxZoom: 12});
	const second = await download(c, {bounds: AMSTERDAM, maxZoom: 14});
	assert.strictEqual(c.OfflineAreas.list().length, 2);
	await new Promise((resolve) => c.OfflineAreas.remove(first.area.id, resolve));
	assert.deepStrictEqual(plain(c.OfflineAreas.list().map((a) => a.id)), [second.area.id]);
	assert.ok(!caches.stores.has('offline-area-' + first.area.id));
	assert.ok(caches.stores.has('offline-area-' + second.area.id));
});

test('offline search finds names of the area, best match and largest place first', async () => {
	const server = tileServer((z, x, y) => amsterdamTile(z, x, y));
	const c = load({fetch: server.fetch});
	const {area} = await download(c, {bounds: AMSTERDAM, maxZoom: 14});
	const search = (q) => new Promise((resolve) => c.OfflineAreas.search(q, new c.MapEngines.LatLng(52.37, 4.89), (e, places) => resolve(places)));
	const cafe = await search('cafe de');
	assert.deepStrictEqual(Array.from(cafe, (p) => p.name), ['Café de Jaren'], 'without accents, prefix');
	assert.strictEqual(cafe[0].formatted_address, 'Amsterdam');
	assert.deepStrictEqual(Array.from(cafe[0].types), ['poi', 'cafe']);
	assert.ok(cafe[0].offline);
	/* the point lies where the tile says: 3000/4096 into tile 14/8414/5384 */
	const loc = cafe[0].geometry.location;
	assert.ok(Math.abs(loc.lng() - c.OfflineAreas.tileLng(8414 + 3000 / 4096, 14)) < 1e-6);
	assert.ok(Math.abs(loc.lat() - c.OfflineAreas.tileLat(5384 + 3000 / 4096, 14)) < 1e-6);
	assert.deepStrictEqual(Array.from(await search('JAREN'), (p) => p.name), ['Café de Jaren'], 'any word');
	assert.deepStrictEqual(Array.from(await search('damrak'), (p) => p.name), ['Damrak']);
	assert.deepStrictEqual(Array.from(await search('rotterdam'), (p) => p.name), []);
	assert.deepStrictEqual(Array.from(await search(''), (p) => p.name), []);
	/* the index is kept with the area and read back after a restart */
	const fresh = load({fetch: server.fetch, caches: c.caches, storage: c.window.localStorage});
	const again = await new Promise((resolve) => fresh.OfflineAreas.search('amsterdam', null, (e, p) => resolve(p)));
	assert.deepStrictEqual(Array.from(again, (p) => p.name), ['Amsterdam']);
	assert.strictEqual(fresh.OfflineAreas.list()[0].id, area.id);
});

test('search ranking: whole name, then start, then words; towns before shops; nearer first', () => {
	const c = load();
	const I = c.OfflineAreas.Index;
	const areas = [{id: 'a', name: 'A'}, {id: 'b', name: 'B'}];
	const indexes = [
		[['Haarlemmerstraat', 52.38, 4.89, 'transportation_name:minor'],
			['Haarlem', 52.38, 4.64, 'place:city'],
			['Bakkerij Haarlem', 52.37, 4.9, 'poi:bakery'],
			['Haarlem', 52.3801, 4.6401, 'poi:shop'],
			['Far Café', 53.0, 6.0, 'poi:cafe'],
			['Near Café', 52.37, 4.9, 'poi:cafe']],
		/* overlapping area: the same city again */
		[['Haarlem', 52.3802, 4.6402, 'place:city']]
	];
	const names = (q, center) => Array.from(I.search(q, areas, indexes, center, 10), (p) => p.name + '|' + p.types[1]);
	assert.deepStrictEqual(names('haarlem', null), ['Haarlem|city', 'Haarlemmerstraat|minor', 'Bakkerij Haarlem|bakery'], 'the shop called Haarlem in Haarlem is the same result');
	/* a restaurant called Zandvoort far from the town: the town comes first, wherever it is in the index */
	const town = [[['Zandvoort', 52.0, 5.0, 'poi:restaurant'], ['Zandvoort', 52.37, 4.53, 'place:town']]];
	assert.deepStrictEqual(Array.from(I.search('zandvoort', [areas[0]], town, null, 10), (p) => p.types[1]), ['town', 'restaurant']);
	assert.deepStrictEqual(names('cafe', new c.MapEngines.LatLng(52.37, 4.9)), ['Near Café|cafe', 'Far Café|cafe']);
	assert.deepStrictEqual(names('cafe', new c.MapEngines.LatLng(53.0, 6.0)), ['Far Café|cafe', 'Near Café|cafe']);
	assert.strictEqual(I.normalize('  Sint-Jans  Straße! '), 'sint jans straße');
	assert.strictEqual(I.normalize('Zürich'), 'zurich');
	assert.strictEqual(I.match('de jar', 'cafe de jaren'), 1);
	assert.strictEqual(I.match('cafe d', 'cafe de jaren'), 2);
	assert.strictEqual(I.match('jaren cafe', 'cafe de jaren'), 1);
	assert.strictEqual(I.match('jaren thee', 'cafe de jaren'), 0);
	assert.strictEqual(I.search('h', areas, indexes, null, 2).length, 2, 'limit');
});

test('a street that crosses many tiles is indexed once', () => {
	const c = load();
	const index = new c.OfflineAreas.Index();
	const line = (x) => new Map([['transportation_name', [{props: {name: 'Damrak', class: 'primary'}, geomType: 2, geom: [[{x, y: 0}, {x: x + 1, y: 1}, {x: x + 2, y: 2}]], bbox: {}}]]]);
	/* the same street twice close together, then 1.5 km on and running on into the next tile */
	index.add(line(0), 14, 8414, 5384);
	index.add(line(10), 14, 8414, 5384);
	assert.strictEqual(index.entries.length, 1);
	index.add(line(4090), 14, 8414, 5384);
	assert.strictEqual(index.entries.length, 2, 'a long street has a name every few hundred metres');
	index.add(line(0), 14, 8415, 5384);
	assert.strictEqual(index.entries.length, 2, 'not again across the tile edge');
	index.add(line(0), 14, 8500, 5384);
	assert.strictEqual(index.entries.length, 3, 'the same name far away is another street');
	const noName = new Map([['poi', [{props: {class: 'bench'}, geomType: 1, geom: [[{x: 1, y: 1}]], bbox: {}}]], ['building', [{props: {name: 'X'}, geomType: 3, geom: [[{x: 1, y: 1}]], bbox: {minX: 0, minY: 0, maxX: 2, maxY: 2}}]]]);
	index.add(noName, 14, 8414, 5384);
	assert.strictEqual(index.entries.length, 3, 'nameless features and unlisted layers are left out');
});

test('the fallback shows offline areas while raster tiles inside one fail', () => {
	const c = load();
	c.OfflineAreas.areas = [{id: 'a', bounds: AMSTERDAM, minZoom: 5, maxZoom: 14}];
	const changes = [];
	const f = new c.OfflineAreas.Fallback((shown) => changes.push(shown));
	f.loading();
	f.tileError(16, 16828 + 10, 10768 - 500);   /* far away */
	f.load();
	assert.deepStrictEqual(changes, []);
	f.loading();
	f.tileError(16, 33657, 21537);   /* inside the area */
	assert.deepStrictEqual(changes, [true]);
	const zoomedOut = new c.OfflineAreas.Fallback((shown) => changes.push('z12 ' + shown));
	/* at zoom 12 the area is a corner of one tile whose middle lies outside it */
	const z12 = {x: c.OfflineAreas.tileX(4.89, 12), y: c.OfflineAreas.tileY(52.37, 12)};
	assert.ok(!c.OfflineAreas.areaAt(c.OfflineAreas.tileLat(z12.y + 0.5, 12), c.OfflineAreas.tileLng(z12.x + 0.5, 12)));
	zoomedOut.tileError(12, z12.x, z12.y);
	assert.deepStrictEqual(changes, [true, 'z12 true']);
	changes.pop();
	f.tileError(16, 33657, 21538);
	f.load();
	assert.deepStrictEqual(changes, [true], 'still failing: stays');
	f.loading();
	f.load();
	assert.deepStrictEqual(changes, [true, false], 'a round without failures hides it');
});

test('the OSM engine searches offline when Nominatim cannot be reached', async () => {
	const c = load({engine: true});
	c.OfflineAreas.areas = [{id: 'a', name: 'Amsterdam', bounds: AMSTERDAM, minZoom: 5, maxZoom: 14}];
	c.OfflineAreas.indexes.a = [['Damrak', 52.376, 4.896, 'transportation_name:primary']];
	const osm = c.MapEngines.create('osm');
	osm.map = {getBounds: () => ({getWest: () => 4, getNorth: () => 53, getEast: () => 5, getSouth: () => 52}), getCenter: () => ({lat: 52.37, lng: 4.89})};
	c.MapEngines.getJSON = (url, cb) => setTimeout(() => cb('HTTP 0'), 0);
	const found = await new Promise((resolve) => osm.search('Damrak', (e, places) => resolve({e, places})));
	assert.strictEqual(found.e, null);
	assert.deepStrictEqual(Array.from(found.places, (p) => p.name), ['Damrak']);
	const missing = await new Promise((resolve) => osm.search('Rotterdam', (e, places) => resolve({e, places})));
	assert.strictEqual(missing.e, 'HTTP 0', 'the network error, not an empty result');
	c.OfflineAreas.areas = [];
	const none = await new Promise((resolve) => osm.search('Damrak', (e) => resolve(e)));
	assert.strictEqual(none, 'HTTP 0');
	assert.ok(osm.offlineAreas, 'the engine offers offline areas');
	assert.ok(!new c.MapEngines.Base().offlineAreas, 'an engine does not unless it says so');
});

test('offline layers: one per highest zoom, most detailed on top, land only where an area has tiles', async () => {
	const c = load();
	c.OfflineAreas.areas = [
		{id: 'a', bounds: AMSTERDAM, minZoom: 5, maxZoom: 14, template: TEMPLATE},
		{id: 'b', bounds: AMSTERDAM, minZoom: 5, maxZoom: 10, template: TEMPLATE},
		{id: 'c', bounds: AMSTERDAM, minZoom: 5, maxZoom: 14, template: TEMPLATE}
	];
	const made = [];
	c.protomapsL = Object.assign({}, c.protomapsL, {
		leafletLayer: (options) => {
			const source = new c.protomapsL.PmtilesSource(options.url, false);
			const layer = {options, views: new Map([['', {tileCache: {source}}]])};
			made.push(layer);
			return layer;
		}
	});
	const layers = c.OfflineAreas.leafletLayers({pane: 'offline'});
	assert.deepStrictEqual(plain(layers.map((l) => l.options.maxDataZoom)), [10, 14]);
	assert.ok(layers.every((l) => l.options.pane == 'offline' && /OpenFreeMap/.test(l.options.attribution)));
	/* tile 14/8414/5384 is stored in area c only */
	c.OfflineAreas.getTile = (z, x, y, maxZoom) => Promise.resolve(maxZoom == 14 && x == 8414 ? amsterdamTile(14, 8414, 5384) : null);
	const source = layers[1].views.get('').tileCache.source;
	const inside = await source.get({z: 14, x: 8414, y: 5384}, 512);
	assert.ok(inside.has('place') && inside.has('background'));
	assert.deepStrictEqual(plain(inside.get('background')[0].bbox), {minX: 0, minY: 0, maxX: 512, maxY: 512});
	const outside = await source.get({z: 14, x: 9000, y: 5384}, 512);
	assert.strictEqual(outside.size, 0, 'no background where there is no area');
	/* the background square survives the scaling protomaps-leaflet does for overzoomed tiles */
	const corner = inside.get('background')[0].geom[0][2].clone().mult(2).add({x: 1, y: 1});
	assert.deepStrictEqual([corner.x, corner.y], [1025, 1025]);
});

test('the offline style builds with the bundled protomaps-leaflet and picks the right features', () => {
	const c = load({prefs: {lang: 'nl-NL'}});
	const S = c.OfflineStyle;
	const paint = S.paintRules();
	const labels = S.labelRules();
	assert.ok(paint.length > 10 && labels.length >= 4);
	assert.ok(paint.every((r) => r.dataLayer && r.symbolizer));
	assert.strictEqual(paint[0].dataLayer, 'background', 'land is drawn first');
	const roads = paint.filter((r) => r.dataLayer == 'transportation' && r.symbolizer.lineCap);
	const road = (cls, extra) => ({props: Object.assign({class: cls}, extra || {})});
	const fill = roads[roads.length - 1];
	assert.ok(fill.filter(14, road('primary')));
	assert.ok(!fill.filter(14, road('rail')));
	assert.ok(!fill.filter(13, road('minor', {brunnel: 'tunnel'})), 'tunnels only close up');
	assert.ok(S.roadWidth('motorway', 16) > S.roadWidth('motorway', 12));
	assert.ok(S.roadWidth('motorway', 14) > S.roadWidth('minor', 14));
	assert.deepStrictEqual(Array.from(S.labelProps()), ['name:nl', 'name:latin', 'name']);
	const place = labels.find((r) => r.dataLayer == 'place');
	assert.ok(place.filter(5, road('city')));
	assert.ok(!place.filter(13, road('neighbourhood')) && place.filter(14, road('neighbourhood')));
});
