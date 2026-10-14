/*
 * Offline map tiles: keeps the tiles the user has looked at and shows them
 * again when there is no network. Online every tile still comes from the
 * tile server (they are served with Cache-Control: no-cache), so this adds no
 * load there; nothing is downloaded in advance, which the OpenStreetMap tile
 * usage policy does not allow.
 */
var TILE_CACHE = "tiles-v1";
/* roughly 50 MB of OSM tiles at about 20 kB each */
var MAX_TILES = 2500;

function isTile(url) {
	return /^https:\/\/([a-z0-9-]+\.)*(tile\.openstreetmap\.org|tile\.openstreetmap\.fr|tile\.opentopomap\.org|tile-cyclosm\.openstreetmap\.fr|tiles\.openrailwaymap\.org)\/(.*\/)?\d+\/\d+\/\d+\.png$/.test(url);
}

self.addEventListener("install", function () {
	self.skipWaiting();
});

self.addEventListener("activate", function (event) {
	event.waitUntil(self.clients.claim());
});

/* listing every key is the expensive part, so trim only every TRIM_EVERY tiles */
var TRIM_EVERY = 100;
var putsSinceTrim = 0;

function trim(cache) {
	return cache.keys().then(function (keys) {
		/* keys come back in insertion order: drop the oldest */
		var excess = keys.length - MAX_TILES;
		var deletions = [];
		for (var i = 0; i < excess; i++) {
			deletions.push(cache.delete(keys[i]));
		}
		return Promise.all(deletions);
	});
}

/*
 * The worker of a webOS application has universal access to the network, so
 * its fetch() hands back a "basic" response even for a tile server; passed on
 * to the page's cross-origin tile request as is, Chromium rejects it. Pass on
 * a response built from the same body and type instead, which is valid for
 * any request.
 */
function rebuild(response) {
	return response.blob().then(function (body) {
		return new Response(body, {
			status: response.status,
			statusText: response.statusText,
			headers: {"Content-Type": response.headers.get("Content-Type") || "image/png"}
		});
	});
}

function remember(url, response) {
	return caches.open(TILE_CACHE).then(function (cache) {
		/* put() replaces an older copy and adds it at the end, so trim() drops the least recently seen */
		return cache.put(url, response).then(function () {
			if (++putsSinceTrim < TRIM_EVERY) return;
			putsSinceTrim = 0;
			return trim(cache);
		});
	});
}

self.addEventListener("fetch", function (event) {
	var request = event.request;
	if (request.method !== "GET" || !isTile(request.url)) {
		return;
	}
	event.respondWith(
		fetch(request.url, {credentials: "omit"}).then(rebuild).then(function (response) {
			if (response.ok) {
				event.waitUntil(remember(request.url, response.clone()));
			}
			return response;
		}).catch(function (error) {
			return caches.open(TILE_CACHE).then(function (cache) {
				return cache.match(request.url);
			}).then(function (cached) {
				if (cached) {
					return cached;
				}
				throw error;
			});
		})
	);
});
