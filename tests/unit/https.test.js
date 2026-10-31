/*
 * Map tiles reveal where the user is looking. Every tile server that answers
 * over HTTPS must be asked over HTTPS. The servers listed in PLAIN_HTTP_ONLY
 * did not answer over HTTPS when this was written (2026-10-29), so their
 * http:// URLs are expected; any other http:// tile URL is a regression.
 * Run with: node --test tests/unit
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const FILES = ['source/OsmMap.js', 'source/engines/GoogleEngine.js', 'source/engines/OsmEngine.js'];
// Yandex's URL is built as "http://vec0" + n + ".maps.yandex.net/...".
const PLAIN_HTTP_ONLY = ['maptile.maps.svc.ovi.com', 'tile.opencyclemap.org', 'http://vec0'];

function plainHttpUrls(file) {
	const src = fs.readFileSync(path.join(root, file), 'utf8');
	return (src.match(/["']http:\/\/[^"']+/g) || [])
		.map((s) => s.slice(1))
		.filter((url) => !/^http:\/\/(www\.)?viewfinderpanoramas\.org/.test(url)); // an attribution link, not a tile
}

for (const file of FILES) {
	test('no plain-HTTP tile server in ' + file + ' that has HTTPS', () => {
		const offenders = plainHttpUrls(file).filter((url) => !PLAIN_HTTP_ONLY.some((host) => url.includes(host)));
		assert.deepStrictEqual(offenders, []);
	});
}

test('OpenStreetMap and Google tiles are fetched over HTTPS', () => {
	const osm = fs.readFileSync(path.join(root, 'source/OsmMap.js'), 'utf8');
	const google = fs.readFileSync(path.join(root, 'source/engines/GoogleEngine.js'), 'utf8');
	assert.match(osm, /"https:\/\/tile\.openstreetmap\.org\//);
	assert.match(google, /"https:\/\/mts0\.google\.com\/vt/);
	assert.match(google, /"https:\/\/mts0\.googleapis\.com\/vt/);
});
