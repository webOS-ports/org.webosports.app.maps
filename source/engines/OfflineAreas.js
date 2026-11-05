/*
 * Offline areas: the user downloads the map of an area once and it shows,
 * and can be searched, without a network.
 *
 * The tiles are OpenMapTiles vector tiles from OpenFreeMap. The OpenStreetMap
 * tile servers forbid downloading areas in advance; OpenFreeMap allows it
 * for downloads of at most 3,000 tiles or 50 MB, fetched with at most 4
 * parallel requests (openfreemap.org/tos). One vector tile at zoom 14 holds
 * every detail of the zooms above it, so an area needs zoom 14 and below
 * only, a fraction of the raster tiles the same area would take.
 *
 * Each area keeps its tiles and a search index of the names in it in
 * IndexedDB (OfflineAreas.IdbCaches); the list of areas is in localStorage.
 * The web runtime has no Cache Storage for an application's file: pages,
 * while IndexedDB works there; Cache Storage is only used where there is no
 * IndexedDB. The tiles
 * are drawn with protomaps-leaflet (lib/protomaps-leaflet) on a canvas, below
 * the raster map, wherever the raster tiles fail.
 */
var OfflineAreas = {
	storeKey: "mapsAppOfflineAreas",
	tileJsonUrl: "https://tiles.openfreemap.org/planet",
	attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	/* the OpenFreeMap limits per download */
	maxTiles: 3000,
	maxBytes: 50 * 1024 * 1024,
	parallel: 4,
	/* attempts per tile before the download gives up */
	attempts: 3,
	/* OpenFreeMap tiles go up to zoom 14; the map draws higher zooms from them */
	minZoom: 5,
	maxDataZoom: 14,
	/* the detail levels offered: the highest zoom downloaded */
	detailZooms: [14, 12, 10],
	libraryUrl: "lib/protomaps-leaflet/protomaps-leaflet.js",
	/* where an area's search index is kept in its cache; .invalid never resolves */
	indexUrl: "https://offline-area.invalid/index.json",
	areas: null,
	indexes: {},

	supported: function () {
		return this.storage() !== null && typeof fetch == "function";
	},
	/* where the tiles are kept: the Cache Storage interface, over IndexedDB where there is one */
	storage: function () {
		if (typeof indexedDB != "undefined" && indexedDB) return OfflineAreas.IdbCaches;
		if (typeof caches != "undefined" && caches) return caches;
		return null;
	},

	/* ---------- tile arithmetic (Web Mercator, the scheme of the tile servers) ---------- */

	maxLat: 85.0511287798,
	clampBounds: function (inBounds) {
		var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v))); };
		return {
			south: clamp(inBounds.south, -this.maxLat, this.maxLat),
			north: clamp(inBounds.north, -this.maxLat, this.maxLat),
			west: clamp(inBounds.west, -180, 180),
			east: clamp(inBounds.east, -180, 180)
		};
	},
	tileX: function (inLng, inZoom) {
		var n = Math.pow(2, inZoom);
		return Math.min(n - 1, Math.max(0, Math.floor((inLng + 180) / 360 * n)));
	},
	tileY: function (inLat, inZoom) {
		var n = Math.pow(2, inZoom);
		var lat = Math.max(-this.maxLat, Math.min(this.maxLat, inLat)) * Math.PI / 180;
		var y = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * n;
		return Math.min(n - 1, Math.max(0, Math.floor(y)));
	},
	/* longitude/latitude of a point of a tile, inX/inY in tiles (fractions allowed) */
	tileLng: function (inX, inZoom) {
		return inX / Math.pow(2, inZoom) * 360 - 180;
	},
	tileLat: function (inY, inZoom) {
		var n = Math.PI - 2 * Math.PI * inY / Math.pow(2, inZoom);
		return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
	},
	/* the tiles of inZoom that cover inBounds: {minX, maxX, minY, maxY} */
	tileRange: function (inBounds, inZoom) {
		var b = this.clampBounds(inBounds);
		return {
			minX: this.tileX(b.west, inZoom),
			maxX: this.tileX(b.east, inZoom),
			minY: this.tileY(b.north, inZoom),
			maxY: this.tileY(b.south, inZoom)
		};
	},
	countTiles: function (inBounds, inMinZoom, inMaxZoom) {
		var count = 0;
		for (var z = inMinZoom; z <= inMaxZoom; z++) {
			var r = this.tileRange(inBounds, z);
			count += (r.maxX - r.minX + 1) * (r.maxY - r.minY + 1);
		}
		return count;
	},
	/* every tile of the area, lowest zoom first: [{z, x, y}] */
	tileList: function (inBounds, inMinZoom, inMaxZoom) {
		var tiles = [];
		for (var z = inMinZoom; z <= inMaxZoom; z++) {
			var r = this.tileRange(inBounds, z);
			for (var x = r.minX; x <= r.maxX; x++) {
				for (var y = r.minY; y <= r.maxY; y++) {
					tiles.push({z: z, x: x, y: y});
				}
			}
		}
		return tiles;
	},
	/* true if the area downloaded tile z/x/y */
	hasTile: function (inArea, inZ, inX, inY) {
		if (inZ < inArea.minZoom || inZ > inArea.maxZoom) return false;
		var r = this.tileRange(inArea.bounds, inZ);
		return inX >= r.minX && inX <= r.maxX && inY >= r.minY && inY <= r.maxY;
	},
	contains: function (inArea, inLat, inLng) {
		var b = inArea.bounds;
		return inLat >= b.south && inLat <= b.north && inLng >= b.west && inLng <= b.east;
	},
	/* the area around inLat/inLng, if any */
	areaAt: function (inLat, inLng) {
		var areas = this.list();
		for (var i = 0; i < areas.length; i++) {
			if (this.contains(areas[i], inLat, inLng)) return areas[i];
		}
		return null;
	},
	/* the area with a stored tile at or above raster tile z/x/y: its map can be drawn there, if only coarsely */
	areaCovering: function (inZ, inX, inY) {
		var areas = this.list();
		for (var i = 0; i < areas.length; i++) {
			for (var z = Math.min(inZ, areas[i].maxZoom); z >= areas[i].minZoom; z--) {
				var shift = inZ - z;
				if (this.hasTile(areas[i], z, Math.floor(inX / Math.pow(2, shift)), Math.floor(inY / Math.pow(2, shift)))) return areas[i];
			}
		}
		return null;
	},
	tileUrl: function (inTemplate, inZ, inX, inY) {
		return inTemplate.replace("{z}", inZ).replace("{x}", inX).replace("{y}", inY);
	},
	/* the TileJSON comes from the network: accept only an https tile URL of the same server */
	validTemplate: function (inTemplate) {
		return typeof inTemplate == "string" &&
			/^https:\/\/tiles\.openfreemap\.org\/[A-Za-z0-9_.\/-]*\{z\}\/\{x\}\/\{y\}\.pbf$/.test(inTemplate);
	},

	/* ---------- the list of areas ---------- */

	list: function () {
		if (this.areas) return this.areas;
		this.areas = [];
		try {
			var stored = window.localStorage.getItem(this.storeKey);
			if (stored) this.areas = JSON.parse(stored) || [];
		} catch (e) {
			enyo.log("Cannot read the offline areas, starting empty: ", e);
		}
		return this.areas;
	},
	persist: function () {
		try {
			window.localStorage.setItem(this.storeKey, JSON.stringify(this.areas || []));
		} catch (e) {
			enyo.log("Cannot store the offline areas: ", e);
		}
	},
	cacheName: function (inId) {
		return "offline-area-" + inId;
	},
	remove: function (inId, inCallback) {
		var areas = this.list();
		for (var i = 0; i < areas.length; i++) {
			if (areas[i].id == inId) {
				areas.splice(i, 1);
				break;
			}
		}
		this.persist();
		delete this.indexes[inId];
		this.storage()["delete"](this.cacheName(inId)).then(function () {
			if (inCallback) inCallback();
		}, function (inError) {
			enyo.log("Cannot delete the tiles of offline area ", inId, ": ", inError);
			if (inCallback) inCallback();
		});
	},
	/* the stored tile z/x/y of the areas with inMaxZoom as highest zoom, or null */
	getTile: function (inZ, inX, inY, inMaxZoom) {
		var areas = this.list().filter(function (inArea) {
			return (inMaxZoom === undefined || inArea.maxZoom == inMaxZoom) && this.hasTile(inArea, inZ, inX, inY);
		}, this);
		var self = this;
		var next = function (inIndex) {
			if (inIndex >= areas.length) return Promise.resolve(null);
			var area = areas[inIndex];
			return self.storage().open(self.cacheName(area.id)).then(function (inCache) {
				return inCache.match(self.tileUrl(area.template, inZ, inX, inY));
			}).then(function (inResponse) {
				return inResponse ? inResponse.arrayBuffer() : next(inIndex + 1);
			});
		};
		return next(0);
	},

	/* ---------- the protomaps-leaflet library, loaded the first time it is needed ---------- */

	/* inCallback() once protomapsL is there, inOnError() if it cannot be loaded */
	loadLibrary: function (inCallback, inOnError) {
		if (typeof protomapsL != "undefined") {
			inCallback();
			return;
		}
		var waiting = {ok: inCallback, fail: inOnError};
		if (this.libraryWaiting) {
			this.libraryWaiting.push(waiting);
			return;
		}
		this.libraryWaiting = [waiting];
		var self = this;
		var settle = function (inLoaded) {
			var list = self.libraryWaiting;
			self.libraryWaiting = null;
			list.forEach(function (inWaiting) {
				var cb = inLoaded ? inWaiting.ok : inWaiting.fail;
				if (cb) cb();
			});
		};
		MapEngines.loadScript(this.libraryUrl, function () {
			settle(typeof protomapsL != "undefined");
		}, function () {
			enyo.error("Cannot load " + self.libraryUrl);
			settle(false);
		});
	},
	/* the features of a vector tile, decoded by protomaps-leaflet: Map of layer name to features,
	   geometry in pixels of a tile inTileSize wide */
	decode: function (inBuffer, inZ, inX, inY, inTileSize) {
		var archive = {getZxy: function () { return Promise.resolve({data: inBuffer}); }};
		return new protomapsL.PmtilesSource(archive, false).get({z: inZ, x: inX, y: inY}, inTileSize);
	},

	/*
	 * Leaflet layers that draw the areas, one per highest zoom so that each
	 * draws the zooms above it from its own most detailed tiles; the most
	 * detailed comes last, on top. inOptions are passed to every layer (pane).
	 */
	leafletLayers: function (inOptions) {
		var zooms = [];
		this.list().forEach(function (inArea) {
			if (zooms.indexOf(inArea.maxZoom) < 0) zooms.push(inArea.maxZoom);
		});
		zooms.sort(function (a, b) { return a - b; });
		var self = this;
		return zooms.map(function (inMaxZoom) {
			var archive = {
				getZxy: function (inZ, inX, inY) {
					return self.getTile(inZ, inX, inY, inMaxZoom).then(function (inBuffer) {
						return inBuffer ? {data: inBuffer} : undefined;
					});
				}
			};
			var layer = protomapsL.leafletLayer(enyo.mixin({
				url: archive,
				maxDataZoom: inMaxZoom,
				paintRules: OfflineStyle.paintRules(),
				labelRules: OfflineStyle.labelRules(),
				attribution: self.attribution
			}, inOptions || {}));
			self.wrapSource(layer);
			return layer;
		});
	},
	/*
	 * Around what protomaps-leaflet reads from a layer's source:
	 * - a tile that was not downloaded is drawn from the nearest stored tile
	 *   above it (lower zoom: fewer details, but no empty map next to an area);
	 * - a "background" feature covers every tile that has data, so land is
	 *   drawn and the rest stays empty.
	 */
	wrapSource: function (inLayer) {
		inLayer.views.forEach(function (inView) {
			var source = inView.tileCache.source;
			var get = source.get;
			var parents = new OfflineAreas.TileMemo(8);
			var getOrParent = function (inZxy, inTileSize) {
				return get.call(source, inZxy, inTileSize).then(function (inLayers) {
					if (inLayers.size || inZxy.z <= OfflineAreas.minZoom) return inLayers;
					var parent = {z: inZxy.z - 1, x: Math.floor(inZxy.x / 2), y: Math.floor(inZxy.y / 2)};
					return parents.get(parent, function () { return getOrParent(parent, inTileSize); }).then(function (inParent) {
						return OfflineAreas.childOf(inParent, parent, inZxy, inTileSize);
					});
				});
			};
			source.get = function (inZxy, inTileSize) {
				return getOrParent(inZxy, inTileSize).then(function (inLayers) {
					if (inLayers.size) inLayers.set("background", [OfflineAreas.square(inTileSize)]);
					return inLayers;
				});
			};
		});
	},
	/*
	 * The features of inParentLayers (tile inParent) that reach into its
	 * descendant tile inChild, in inChild's coordinates. Points are scaled
	 * with the clone(), mult() and add() of the decoder's points.
	 */
	childOf: function (inParentLayers, inParent, inChild, inTileSize) {
		var scale = Math.pow(2, inChild.z - inParent.z);
		var offset = {
			x: -(inChild.x - inParent.x * scale) * inTileSize,
			y: -(inChild.y - inParent.y * scale) * inTileSize
		};
		/* features just outside still draw their edges and labels into the tile */
		var margin = inTileSize / 8;
		var layers = new Map();
		inParentLayers.forEach(function (inFeatures, inName) {
			if (inName == "background") return;
			var kept = [];
			for (var i = 0; i < inFeatures.length; i++) {
				var f = inFeatures[i];
				var b = f.bbox;
				var bbox = {
					minX: b.minX * scale + offset.x, minY: b.minY * scale + offset.y,
					maxX: b.maxX * scale + offset.x, maxY: b.maxY * scale + offset.y
				};
				if (bbox.maxX < -margin || bbox.maxY < -margin || bbox.minX > inTileSize + margin || bbox.minY > inTileSize + margin) continue;
				kept.push({
					props: f.props,
					geomType: f.geomType,
					numVertices: f.numVertices,
					bbox: bbox,
					geom: f.geom.map(function (inRing) {
						return inRing.map(function (inPoint) { return inPoint.clone().mult(scale).add(offset); });
					})
				});
			}
			if (kept.length) layers.set(inName, kept);
		});
		return layers;
	},
	square: function (inSize) {
		/* the little of @mapbox/point-geometry that protomaps-leaflet uses on tile geometry */
		var corner = function (inX, inY) {
			return {
				x: inX,
				y: inY,
				clone: function () { return corner(this.x, this.y); },
				mult: function (inK) { this.x *= inK; this.y *= inK; return this; },
				add: function (inP) { this.x += inP.x; this.y += inP.y; return this; }
			};
		};
		return {
			props: {},
			geomType: 3,
			geom: [[corner(0, 0), corner(inSize, 0), corner(inSize, inSize), corner(0, inSize), corner(0, 0)]],
			numVertices: 5,
			bbox: {minX: 0, minY: 0, maxX: inSize, maxY: inSize}
		};
	},

	/* ---------- download ---------- */

	/*
	 * Downloads the tiles of inRequest.bounds ({south, west, north, east}) from
	 * minZoom up to inRequest.maxZoom. inProgress({done, total, bytes}) after
	 * each tile; inDone(error, area) at the end, error {tooMany: count},
	 * {tooLarge: bytes}, {cancelled: true} or {message}. Returns a handle with
	 * cancel(), or null when the request was refused straight away.
	 */
	download: function (inRequest, inProgress, inDone) {
		var maxZoom = Math.min(this.maxDataZoom, inRequest.maxZoom || this.maxDataZoom);
		var minZoom = Math.min(this.minZoom, maxZoom);
		var bounds = this.clampBounds(inRequest.bounds);
		var total = this.countTiles(bounds, minZoom, maxZoom);
		if (total > this.maxTiles) {
			inDone({tooMany: total});
			return null;
		}
		var self = this;
		var id = inRequest.id || (Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
		var area = {id: id, name: "", bounds: bounds, minZoom: minZoom, maxZoom: maxZoom, template: "", tiles: total, bytes: 0, size: 0, created: new Date().toISOString().slice(0, 10)};
		var tiles = this.tileList(bounds, minZoom, maxZoom);
		var index = new OfflineAreas.Index();
		var controller = (typeof AbortController != "undefined") ? new AbortController() : null;
		var finished = false;
		var next = 0, done = 0, running = 0;
		var cache = null;

		var finish = function (inError) {
			if (finished) return;
			finished = true;
			if (controller) controller.abort();
			if (inError) {
				self.storage()["delete"](self.cacheName(id)).then(function () { inDone(inError); }, function () { inDone(inError); });
				return;
			}
			area.name = inRequest.name || index.areaName(bounds) || self.coordinateName(bounds);
			cache.put(self.indexUrl, new Response(JSON.stringify(index.entries), {headers: {"Content-Type": "application/json"}})).then(function () {
				self.list().push(area);
				self.persist();
				self.indexes[id] = index.entries;
				inDone(null, area);
			}, function (inError) {
				var error = {message: String(inError)};
				self.storage()["delete"](self.cacheName(id)).then(function () { inDone(error); }, function () { inDone(error); });
			});
		};
		var fetchTile = function (inTile, inAttempt) {
			var url = self.tileUrl(area.template, inTile.z, inTile.x, inTile.y);
			return fetch(url, {credentials: "omit", signal: controller ? controller.signal : undefined}).then(function (inResponse) {
				if (!inResponse.ok) throw new Error("HTTP " + inResponse.status);
				/* Content-Length is what came over the network (compressed), the body what is stored */
				var length = Number(inResponse.headers.get("Content-Length"));
				return inResponse.arrayBuffer().then(function (inBuffer) {
					return {url: url, buffer: inBuffer, bytes: length > 0 ? length : inBuffer.byteLength};
				});
			})["catch"](function (inError) {
				if (finished || inAttempt + 1 >= self.attempts) throw inError;
				return fetchTile(inTile, inAttempt + 1);
			});
		};
		var pump = function () {
			while (!finished && running < self.parallel && next < tiles.length) {
				running++;
				var tile = tiles[next++];
				(function (inTile) {
					fetchTile(inTile, 0).then(function (inResult) {
						if (finished) return;
						area.bytes += inResult.bytes;
						area.size += inResult.buffer.byteLength;
						if (area.bytes > self.maxBytes) {
							finish({tooLarge: area.bytes});
							return;
						}
						var stored = cache.put(inResult.url, new Response(inResult.buffer, {headers: {"Content-Type": "application/vnd.mapbox-vector-tile"}}));
						/* the names come from the most detailed zoom, which has them all */
						var indexed = (inTile.z == maxZoom && inResult.buffer.byteLength) ?
							self.decode(inResult.buffer, inTile.z, inTile.x, inTile.y, OfflineAreas.Index.tileSize).then(function (inLayers) {
								index.add(inLayers, inTile.z, inTile.x, inTile.y);
							}) : null;
						return Promise.all([stored, indexed]).then(function () {
							if (finished) return;
							running--;
							done++;
							if (inProgress) inProgress({done: done, total: total, bytes: area.bytes});
							if (done == total) {
								finish(null);
							} else {
								pump();
							}
						});
					})["catch"](function (inError) {
						finish({message: (inError && inError.message) || String(inError)});
					});
				})(tile);
			}
		};

		var start = function () {
			MapEngines.getJSON(self.tileJsonUrl, gotTileJson);
		};
		var gotTileJson = function (inError, inTileJson) {
			if (finished) return;
			var template = !inError && inTileJson && inTileJson.tiles && inTileJson.tiles[0];
			if (inError || !self.validTemplate(template)) {
				finish({message: inError || "Unexpected tile server answer"});
				return;
			}
			area.template = template;
			self.storage().open(self.cacheName(id)).then(function (inCache) {
				cache = inCache;
				/* ask the runtime not to evict the tiles when space runs low */
				if (typeof navigator != "undefined" && navigator.storage && navigator.storage.persist) {
					navigator.storage.persist()["catch"](function () {});
				}
				pump();
			}, function (inError) {
				finish({message: String(inError)});
			});
		};
		/* the names for search are read from the tiles with protomaps-leaflet */
		this.loadLibrary(start, function () {
			finish({message: "Cannot load " + self.libraryUrl});
		});

		return {
			cancel: function () {
				finish({cancelled: true});
			}
		};
	},
	coordinateName: function (inBounds) {
		var lat = (inBounds.south + inBounds.north) / 2;
		var lng = (inBounds.west + inBounds.east) / 2;
		return lat.toFixed(3) + ", " + lng.toFixed(3);
	},

	/* ---------- offline search ---------- */

	loadIndex: function (inArea) {
		if (this.indexes[inArea.id]) return Promise.resolve(this.indexes[inArea.id]);
		var self = this;
		return this.storage().open(this.cacheName(inArea.id)).then(function (inCache) {
			return inCache.match(self.indexUrl);
		}).then(function (inResponse) {
			return inResponse ? inResponse.json() : [];
		}).then(function (inEntries) {
			self.indexes[inArea.id] = inEntries;
			return inEntries;
		}, function () {
			return [];
		});
	},
	/* places of the downloaded areas whose names match inQuery, nearest to inCenter first among equals */
	search: function (inQuery, inCenter, inCallback) {
		var areas = this.list().slice();
		var self = this;
		Promise.all(areas.map(function (inArea) { return self.loadIndex(inArea); })).then(function (inIndexes) {
			inCallback(null, OfflineAreas.Index.search(inQuery, areas, inIndexes, inCenter, 10));
		}, function (inError) {
			inCallback(String(inError));
		});
	}
};

/*
 * The names of an area for offline search: [name, lat, lng, kind] where kind
 * is "<layer>:<class>" of the OpenMapTiles schema, e.g. "place:city".
 */
OfflineAreas.Index = function () {
	this.entries = [];
	this.seen = {};
};
/* the geometry of the decoded tiles is in pixels of a tile this wide */
OfflineAreas.Index.tileSize = 4096;
/* the layers with names worth finding, and the property holding their class */
OfflineAreas.Index.layers = {
	place: "class",
	poi: "class",
	transportation_name: "class",
	water_name: "class",
	waterway: "class",
	park: "class",
	mountain_peak: "class",
	aerodrome_label: "class"
};
/* the same name and kind closer than this is one place (a street spans many tiles) */
OfflineAreas.Index.sameWithin = 500;
/* weight of a kind in the results: towns before streets before shops */
OfflineAreas.Index.weights = {
	"place:city": 9, "place:town": 8, "place:village": 7, "place:suburb": 6, "place:hamlet": 5,
	"place:quarter": 5, "place:neighbourhood": 4, "place:island": 4, "place:isolated_dwelling": 3,
	"aerodrome_label": 4, "transportation_name": 3, "water_name": 3, "park": 3, "mountain_peak": 3
};
OfflineAreas.Index.prototype = {
	add: function (inLayers, inZ, inX, inY) {
		var size = OfflineAreas.Index.tileSize;
		inLayers.forEach(function (inFeatures, inLayer) {
			var classKey = OfflineAreas.Index.layers[inLayer];
			if (!classKey) return;
			for (var i = 0; i < inFeatures.length; i++) {
				var f = inFeatures[i];
				var name = f.props.name;
				if (typeof name != "string" || !name) continue;
				var point = OfflineAreas.Index.anchor(f);
				if (!point) continue;
				var lng = OfflineAreas.tileLng(inX + point.x / size, inZ);
				var lat = OfflineAreas.tileLat(inY + point.y / size, inZ);
				var kind = inLayer + ":" + (f.props[classKey] || "");
				this.put(name, lat, lng, kind);
			}
		}, this);
	},
	put: function (inName, inLat, inLng, inKind) {
		var key = inKind + "|" + inName;
		var near = this.seen[key] || (this.seen[key] = []);
		var here = new MapEngines.LatLng(inLat, inLng);
		for (var i = 0; i < near.length; i++) {
			if (MapEngines.distance(near[i], here) < OfflineAreas.Index.sameWithin) return;
		}
		near.push(here);
		this.entries.push([inName, Math.round(inLat * 1e6) / 1e6, Math.round(inLng * 1e6) / 1e6, inKind]);
	},
	/* the name of the largest place nearest the middle of inBounds */
	areaName: function (inBounds) {
		var center = new MapEngines.LatLng((inBounds.south + inBounds.north) / 2, (inBounds.west + inBounds.east) / 2);
		var best = null, bestWeight = -1, bestDistance = Infinity;
		for (var i = 0; i < this.entries.length; i++) {
			var e = this.entries[i];
			if (e[3].indexOf("place:") !== 0) continue;
			var weight = OfflineAreas.Index.weight(e[3]);
			var distance = MapEngines.distance(center, new MapEngines.LatLng(e[1], e[2]));
			if (weight > bestWeight || (weight == bestWeight && distance < bestDistance)) {
				best = e;
				bestWeight = weight;
				bestDistance = distance;
			}
		}
		return best ? best[0] : "";
	}
};
/* a point to put the name at: the point itself, the middle vertex of a line, the middle of a polygon's box */
OfflineAreas.Index.anchor = function (inFeature) {
	var geom = inFeature.geom;
	if (!geom || !geom.length || !geom[0].length) return null;
	if (inFeature.geomType == 1) return geom[0][0];
	if (inFeature.geomType == 2) {
		var longest = geom[0];
		for (var i = 1; i < geom.length; i++) {
			if (geom[i].length > longest.length) longest = geom[i];
		}
		return longest[Math.floor(longest.length / 2)];
	}
	var b = inFeature.bbox;
	return {x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2};
};
OfflineAreas.Index.weight = function (inKind) {
	var w = OfflineAreas.Index.weights;
	if (w[inKind] !== undefined) return w[inKind];
	var layer = inKind.split(":")[0];
	return (w[layer] !== undefined) ? w[layer] : 2;
};
/* lower case, without accents and punctuation: "Café-Zürich" -> "cafe zurich" */
OfflineAreas.Index.normalize = function (inText) {
	var text = String(inText).toLowerCase();
	if (text.normalize) text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	return text.replace(/[\s!-\/:-@\[-`{-~\u00a0-\u00bf\u2010-\u2027]+/g, " ").replace(/^ +| +$/g, "");
};
/*
 * 3: the whole name, 2: the name starts with the query, 1: every word of the
 * query starts a word of the name, 0: no match
 */
OfflineAreas.Index.match = function (inQuery, inName) {
	if (!inQuery) return 0;
	if (inName == inQuery) return 3;
	if (inName.indexOf(inQuery) === 0) return 2;
	var words = inName.split(" ");
	var parts = inQuery.split(" ");
	for (var p = 0; p < parts.length; p++) {
		var found = false;
		for (var w = 0; w < words.length && !found; w++) {
			found = words[w].indexOf(parts[p]) === 0;
		}
		if (!found) return 0;
	}
	return 1;
};
/* inIndexes[i] belongs to inAreas[i]; returns places shaped like the other engines' */
/*
 * What to look for when the query as typed finds nothing: the part before a
 * comma, without house numbers ("Oudegracht 12a, Utrecht" -> "oudegracht"),
 * as the index has streets but no addresses. "" when that is the query itself.
 */
OfflineAreas.Index.streetQuery = function (inQuery) {
	var street = OfflineAreas.Index.normalize(String(inQuery).split(",")[0]).split(" ").filter(function (inWord) {
		return !/^\d+[a-z]?$/.test(inWord);
	}).join(" ");
	return (street == OfflineAreas.Index.normalize(inQuery)) ? "" : street;
};
OfflineAreas.Index.search = function (inQuery, inAreas, inIndexes, inCenter, inLimit) {
	var places = OfflineAreas.Index.searchFor(OfflineAreas.Index.normalize(inQuery), inAreas, inIndexes, inCenter, inLimit);
	var street = OfflineAreas.Index.streetQuery(inQuery);
	if (!places.length && street) {
		places = OfflineAreas.Index.searchFor(street, inAreas, inIndexes, inCenter, inLimit);
	}
	return places;
};
OfflineAreas.Index.searchFor = function (query, inAreas, inIndexes, inCenter, inLimit) {
	var hits = [];
	for (var a = 0; a < inIndexes.length; a++) {
		var entries = inIndexes[a] || [];
		for (var i = 0; i < entries.length; i++) {
			var e = entries[i];
			var quality = OfflineAreas.Index.match(query, OfflineAreas.Index.normalize(e[0]));
			if (!quality) continue;
			var location = new MapEngines.LatLng(e[1], e[2]);
			hits.push({
				entry: e,
				area: inAreas[a],
				location: location,
				quality: quality,
				weight: OfflineAreas.Index.weight(e[3]),
				distance: inCenter ? MapEngines.distance(inCenter, location) : 0
			});
		}
	}
	hits.sort(function (x, y) {
		return (y.quality - x.quality) || (y.weight - x.weight) || (x.distance - y.distance);
	});
	var places = [];
	var kept = [];
	for (var h = 0; h < hits.length && places.length < inLimit; h++) {
		var hit = hits[h];
		/* one name in one spot is one result: a square, its bus stop and its street, or overlapping areas */
		var twice = kept.some(function (inKept) {
			return inKept.entry[0] == hit.entry[0] &&
				MapEngines.distance(inKept.location, hit.location) < OfflineAreas.Index.sameWithin;
		});
		if (twice) continue;
		kept.push(hit);
		var kind = hit.entry[3].split(":");
		places.push({
			id: "offline:" + hit.area.id + ":" + hit.entry[1] + "," + hit.entry[2],
			name: hit.entry[0],
			formatted_address: hit.area.name,
			icon: "assets/lune-marker-red-64-64.png",
			types: [kind[0], kind[1] || ""],
			offline: true,
			geometry: {location: hit.location}
		});
	}
	return places;
};

/*
 * When to draw the offline areas: as soon as a raster tile inside one fails,
 * until a later round of tiles loads without a failure. inOnChange(shown).
 */
OfflineAreas.Fallback = function (inOnChange) {
	this.onChange = inOnChange;
	this.shown = false;
	this.errors = 0;
};
OfflineAreas.Fallback.prototype = {
	/* the raster layer starts loading a new set of tiles */
	loading: function () {
		this.errors = 0;
	},
	/* a raster tile z/x/y failed */
	tileError: function (inZ, inX, inY) {
		if (!OfflineAreas.areaCovering(inZ, inX, inY)) return;
		this.errors++;
		this.set(true);
	},
	/* every tile of the set has loaded or failed */
	load: function () {
		if (this.errors === 0) this.set(false);
	},
	set: function (inShown) {
		if (this.shown == inShown) return;
		this.shown = inShown;
		this.onChange(inShown);
	}
};

/*
 * The part of the Cache Storage interface the offline areas use (open, then
 * match and put; delete), kept in IndexedDB: one object store whose keys are
 * [cache name, URL] and whose values are {type, body}, the body an
 * ArrayBuffer.
 */
OfflineAreas.IdbCaches = {
	dbName: "mapsAppOfflineAreas",
	storeName: "responses",
	db: null,
	openDb: function () {
		var self = this;
		if (!this.db) {
			this.db = new Promise(function (resolve, reject) {
				var request = indexedDB.open(self.dbName, 1);
				request.onupgradeneeded = function () {
					request.result.createObjectStore(self.storeName);
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
	open: function (inName) {
		var self = this;
		var name = String(inName);
		return Promise.resolve({
			match: function (inUrl) {
				return self.transact("readonly", function (inStore) {
					return inStore.get([name, String(inUrl)]);
				}).then(function (inValue) {
					return inValue ? new Response(inValue.body, {headers: {"Content-Type": inValue.type}}) : undefined;
				});
			},
			put: function (inUrl, inResponse) {
				var type = inResponse.headers.get("Content-Type") || "";
				return inResponse.arrayBuffer().then(function (inBody) {
					return self.transact("readwrite", function (inStore) {
						return inStore.put({type: type, body: inBody}, [name, String(inUrl)]);
					});
				}).then(function () {});
			}
		});
	},
	/* resolves with whether there was anything under inName, as CacheStorage.delete does */
	"delete": function (inName) {
		var name = String(inName);
		/* every [name, url] key: arrays sort after strings, so [name, []] is above any URL */
		var range = IDBKeyRange.bound([name, ""], [name, []]);
		return this.transact("readwrite", function (inStore) {
			var count = inStore.count(range);
			count.onsuccess = function () {
				if (count.result) inStore["delete"](range);
			};
			return count;
		}).then(function (inCount) {
			return inCount > 0;
		});
	}
};

/* the last inSize results of inMake() by tile, so the children of one parent tile decode it once */
OfflineAreas.TileMemo = function (inSize) {
	this.size = inSize;
	this.keys = [];
	this.values = {};
};
OfflineAreas.TileMemo.prototype = {
	get: function (inZxy, inMake) {
		var key = inZxy.z + "/" + inZxy.x + "/" + inZxy.y;
		if (this.values.hasOwnProperty(key)) return this.values[key];
		var value = this.values[key] = inMake();
		this.keys.push(key);
		if (this.keys.length > this.size) delete this.values[this.keys.shift()];
		var self = this;
		/* a failure is not kept */
		value["catch"](function () {
			if (self.values[key] === value) delete self.values[key];
		});
		return value;
	}
};
