/*
 * Offline map tiles: keeps the raster tiles the user has looked at and shows
 * them again when there is no network. Online every tile still comes from the
 * tile server; nothing is downloaded in advance, which the OpenStreetMap tile
 * usage policy does not allow.
 *
 * The page fetches the tiles itself and keeps them in IndexedDB. The web
 * runtime identifies an application's requests to the tile servers with a
 * Referer only for its pages, not for a service worker, and has no Cache
 * Storage for an application's file: pages.
 */
var TileStore = {
	dbName: "mapsAppViewedTiles",
	storeName: "tiles",
	/* roughly 50 MB of OSM tiles at about 20 kB each */
	maxTiles: 2500,
	/* counting every tile is the expensive part, so trim only every trimEvery tiles */
	trimEvery: 100,
	putsSinceTrim: 0,
	db: null,

	supported: function () {
		return typeof indexedDB != "undefined" && !!indexedDB && typeof fetch == "function" &&
			typeof URL != "undefined" && typeof URL.createObjectURL == "function";
	},
	/* the tile servers the map offers */
	isTile: function (inUrl) {
		return /^https:\/\/([a-z0-9-]+\.)*(tile\.openstreetmap\.org|tile\.openstreetmap\.fr|tile\.opentopomap\.org|tile-cyclosm\.openstreetmap\.fr|tiles\.openrailwaymap\.org)\/(.*\/)?\d+\/\d+\/\d+\.png$/.test(inUrl);
	},

	openDb: function () {
		var self = this;
		if (!this.db) {
			this.db = new Promise(function (resolve, reject) {
				var request = indexedDB.open(self.dbName, 1);
				request.onupgradeneeded = function () {
					request.result.createObjectStore(self.storeName).createIndex("seen", "seen");
				};
				request.onsuccess = function () { resolve(request.result); };
				request.onerror = function () { reject(request.error); };
			});
			this.db["catch"](function () { self.db = null; });
		}
		return this.db;
	},
	/* runs inWork(store) in one transaction; resolves with what inWork's request gave once it completes */
	transact: function (inMode, inWork) {
		var self = this;
		return this.openDb().then(function (inDb) {
			return new Promise(function (resolve, reject) {
				var tx = inDb.transaction(self.storeName, inMode);
				var request = inWork(tx.objectStore(self.storeName));
				tx.oncomplete = function () { resolve(request ? request.result : undefined); };
				tx.onerror = function () { reject(tx.error); };
				tx.onabort = function () { reject(tx.error || new Error("IndexedDB transaction aborted")); };
			});
		});
	},
	/* the kept tile of inUrl, {type, body} with an ArrayBuffer body, or undefined */
	get: function (inUrl) {
		return this.transact("readonly", function (inStore) {
			return inStore.get(String(inUrl));
		});
	},
	/* keeps the tile, as the most recently seen; the least recently seen go beyond maxTiles */
	put: function (inUrl, inType, inBody) {
		var self = this;
		return this.transact("readwrite", function (inStore) {
			return inStore.put({type: inType, body: inBody, seen: Date.now()}, String(inUrl));
		}).then(function () {
			if (++self.putsSinceTrim < self.trimEvery) return;
			self.putsSinceTrim = 0;
			return self.trim();
		});
	},
	trim: function () {
		var self = this;
		return this.transact("readwrite", function (inStore) {
			var count = inStore.count();
			count.onsuccess = function () {
				var excess = count.result - self.maxTiles;
				if (excess <= 0) return;
				var cursor = inStore.index("seen").openCursor();
				cursor.onsuccess = function () {
					if (!cursor.result || excess-- <= 0) return;
					cursor.result["delete"]();
					cursor.result["continue"]();
				};
			};
			return count;
		});
	},
	count: function () {
		return this.transact("readonly", function (inStore) {
			return inStore.count();
		});
	},
	/* forgets every kept tile */
	clear: function () {
		var self = this;
		var opened = this.db;
		this.db = null;
		return Promise.resolve(opened && opened.then(function (inDb) { inDb.close(); }, function () {})).then(function () {
			return new Promise(function (resolve) {
				var request = indexedDB.deleteDatabase(self.dbName);
				request.onsuccess = request.onerror = request.onblocked = function () { resolve(); };
			});
		});
	},

	/*
	 * Loads tile inUrl into inImg and calls inDone(error) once it shows or
	 * failed: from the network, keeping it, or from the kept tiles when the
	 * network fails. A tile that is not kept either is left to the image
	 * itself, so its failure reaches the map like any other.
	 */
	load: function (inImg, inUrl, inDone) {
		var self = this;
		var show = function (inType, inBody) {
			var objectUrl = URL.createObjectURL(new Blob([inBody], {type: inType || "image/png"}));
			inImg.onload = function () {
				inImg.onload = inImg.onerror = null;
				/* the browser has decoded it: the Blob is no longer needed */
				URL.revokeObjectURL(objectUrl);
				inDone(null);
			};
			inImg.onerror = function (inError) {
				inImg.onload = inImg.onerror = null;
				URL.revokeObjectURL(objectUrl);
				inDone(inError || new Error("Cannot show tile " + inUrl));
			};
			inImg.src = objectUrl;
		};
		var plain = function () {
			inImg.onload = function () { inImg.onload = inImg.onerror = null; inDone(null); };
			inImg.onerror = function (inError) { inImg.onload = inImg.onerror = null; inDone(inError || new Error("Cannot load tile " + inUrl)); };
			inImg.crossOrigin = "";
			inImg.src = inUrl;
		};
		fetch(inUrl, {credentials: "omit"}).then(function (inResponse) {
			if (!inResponse.ok) throw new Error("HTTP " + inResponse.status);
			var type = inResponse.headers.get("Content-Type") || "image/png";
			return inResponse.arrayBuffer().then(function (inBody) {
				show(type, inBody);
				self.put(inUrl, type, inBody)["catch"](function (inError) {
					enyo.log("Cannot keep tile ", inUrl, ": ", inError);
				});
			});
		})["catch"](function () {
			self.get(inUrl).then(function (inKept) {
				if (inKept) {
					show(inKept.type, inKept.body);
				} else {
					plain();
				}
			}, plain);
		});
	}
};

/*
 * A Leaflet tile layer that keeps the tiles it shows (TileStore) while the
 * "Offline map tiles" preference is on, and is a plain one otherwise. Made
 * on first use: Leaflet is loaded with the OpenStreetMap engine.
 */
TileStore.layerClass = function () {
	if (!this.KeptLayer) {
		this.KeptLayer = L.TileLayer.extend({
			createTile: function (inCoords, inDone) {
				var url = this.getTileUrl(inCoords);
				if (!Prefs.offlineTiles || !TileStore.supported() || !TileStore.isTile(url)) {
					return L.TileLayer.prototype.createTile.call(this, inCoords, inDone);
				}
				var tile = document.createElement("img");
				tile.alt = "";
				tile.setAttribute("role", "presentation");
				TileStore.load(tile, url, function (inError) {
					inDone(inError, tile);
				});
				return tile;
			}
		});
	}
	return this.KeptLayer;
};
