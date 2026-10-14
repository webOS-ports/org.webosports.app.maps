/*
 * Open engine: Leaflet with OpenStreetMap based services, no API key needed.
 *  - tiles:     OpenStreetMap and other free OSM tile servers
 *  - search:    Nominatim
 *  - routing:   OSRM (FOSSGIS servers, the ones openstreetmap.org uses)
 *  - elevation: Open-Meteo
 * The service URLs can be overridden through Prefs.osmNominatimUrl,
 * Prefs.osmRoutingUrl, Prefs.osmElevationUrl and Prefs.osmTileUrl.
 *
 * tile.openstreetmap.org and OpenRailwayMap refuse requests that do not say
 * which application they come from. A packaged app is a file:// page; the
 * LuneOS web runtime identifies it with its own origin as the Referer,
 * file://<app id>-webos/.
 */

MapEngines.register("osm", MapEngines.extend({
	label: "OpenStreetMap",
	nativeGestures: true,
	layers: {transit: true, bike: true},
	travelModes: ["DRIVING", "WALKING", "BICYCLING"],
	/* the FOSSGIS OSRM profiles have no exclude classes, so avoidTolls/avoidHighways are unsupported */
	routeOptions: {provideRouteAlternatives: true},
	streetView: false,
	defaultMapType: "OSM",

	nominatimUrl: "https://nominatim.openstreetmap.org",
	routingUrl: "https://routing.openstreetmap.de",
	elevationUrl: "https://api.open-meteo.com/v1/elevation",
	osmAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

	/* OSRM instance per travel mode, below routingUrl */
	routingProfiles: {
		DRIVING: "routed-car",
		WALKING: "routed-foot",
		BICYCLING: "routed-bike"
	},

	loadApi: function (inCallback) {
		MapEngines.loadStylesheet("lib/leaflet/leaflet.css");
		MapEngines.loadScript("lib/leaflet/leaflet.js", inCallback, function () {
			enyo.error("Cannot load lib/leaflet/leaflet.js");
		});
	},
	versionText: function () {
		return "Leaflet: v" + L.version + ", OpenStreetMap";
	},
	mapTypes: function () {
		return [
			{header: $L("Map Type (OpenStreetMap)")},
			{id: "OSM", label: $L("OpenStreetMap"), isRetina: false, icon: "assets/map-type-osm.png"},
			{id: "HOT", label: $L("Humanitarian"), isRetina: false, icon: "assets/map-type-road.png"},
			{id: "TOPO", label: $L("OpenTopoMap"), isRetina: false, icon: "assets/map-type-terrain.png"},
			{id: "CYCLOSM", label: $L("CyclOSM"), isRetina: false, icon: "assets/map-type-ocm.png"}
		];
	},
	tileLayer: function (inId) {
		var attribution = this.osmAttribution;
		switch (inId) {
			case "HOT":
				return L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
					maxZoom: 19,
					attribution: attribution + ', tiles style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/">OpenStreetMap France</a>'
				});
			case "TOPO":
				return L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
					maxZoom: 17,
					attribution: attribution + ', <a href="http://viewfinderpanoramas.org">SRTM</a> | map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
				});
			case "CYCLOSM":
				return L.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", {
					maxZoom: 20,
					attribution: attribution + ', <a href="https://www.cyclosm.org">CyclOSM</a> hosted by <a href="https://openstreetmap.fr/">OpenStreetMap France</a>'
				});
			default:
				if (Prefs.OSMMapCache) return this.cachedTileLayer();
				if (Prefs.osmTileUrl) {
					return L.tileLayer(Prefs.osmTileUrl, {maxZoom: 19, attribution: attribution});
				}
				return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
					maxZoom: 19,
					attribution: attribution
				});
		}
	},
	/* the webOS download manager backed tile cache, see OsmMap.js */
	cachedTileLayer: function () {
		var cache = new OSMMapType(Prefs);
		var CachedLayer = L.GridLayer.extend({
			createTile: function (coords) {
				return cache.getTile(coords, coords.z, document);
			}
		});
		return new CachedLayer({maxZoom: 18, attribution: this.osmAttribution});
	},

	createMap: function (inDiv, inOptions, inOnReady) {
		this.map = L.map(inDiv, {
			zoomControl: false,
			attributionControl: false
		});
		/* bottom right belongs to the pullout grabber, keep the attribution visible */
		L.control.attribution({position: "bottomleft", prefix: '<a href="https://leafletjs.com">Leaflet</a>'}).addTo(this.map);
		this.updateScale();
		this.map.setView(this.toLeaflet(inOptions.center), inOptions.zoom);
		this.setMapType(inOptions.mapType);
		this.overlays = {
			transit: L.tileLayer("https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", {
				maxZoom: 19,
				attribution: 'Transit: <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a> (CC-BY-SA)'
			}),
			bike: L.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm-lite/{z}/{x}/{y}.png", {
				maxZoom: 20,
				attribution: 'Bike: <a href="https://www.cyclosm.org">CyclOSM</a>'
			})
		};
		this.markerLayer = L.layerGroup().addTo(this.map);
		this.targetZoom = null;
		this.map.on("zoomend", function () {
			if (this.targetZoom === this.map.getZoom()) this.targetZoom = null;
		}, this);
		this.routeLayer = null;
		/* Leaflet is usable right away, call back asynchronously like the Google 'idle' event */
		setTimeout(inOnReady, 0);
	},
	toLeaflet: function (inLatLng) {
		return L.latLng(inLatLng.lat(), inLatLng.lng());
	},
	fromLeaflet: function (inLatLng) {
		return new MapEngines.LatLng(inLatLng.lat, inLatLng.lng);
	},
	resize: function () {
		this.map.invalidateSize();
	},
	updateScale: function () {
		if (this.scale) this.map.removeControl(this.scale);
		var imperial = (Prefs.lengthUnits == "imperial");
		this.scale = L.control.scale({position: "bottomleft", metric: !imperial, imperial: imperial}).addTo(this.map);
	},
	getCenter: function () { return this.fromLeaflet(this.map.getCenter()); },
	setCenter: function (inLatLng) { this.map.setView(this.toLeaflet(inLatLng), this.map.getZoom(), {animate: false}); },
	panTo: function (inLatLng) { this.map.panTo(this.toLeaflet(inLatLng)); },
	panBy: function (inX, inY) { this.map.panBy([inX, inY]); },
	/* while a zoom animates getZoom() still reports the old level, so repeated taps on +/- would get lost */
	getZoom: function () { return (this.targetZoom !== null && this.targetZoom !== undefined) ? this.targetZoom : this.map.getZoom(); },
	setZoom: function (inZoom) {
		var zoom = Math.max(this.map.getMinZoom(), Math.min(this.map.getMaxZoom(), inZoom));
		if (zoom == this.map.getZoom()) {
			this.targetZoom = null;
			return;
		}
		this.targetZoom = zoom;
		this.map.setZoom(zoom);
	},
	fitLatLngs: function (inLatLngs) {
		var points = [];
		for (var i = 0; i < inLatLngs.length; i++) {
			points.push(this.toLeaflet(inLatLngs[i]));
		}
		if (points.length) this.map.fitBounds(L.latLngBounds(points), {maxZoom: 17});
	},
	/* viewport: {south, west, north, east} */
	fitViewport: function (inViewport) {
		this.map.fitBounds([[inViewport.south, inViewport.west], [inViewport.north, inViewport.east]]);
	},
	setMapType: function (inId) {
		if (this.baseLayer) this.map.removeLayer(this.baseLayer);
		this.baseLayer = this.tileLayer(String(inId).replace(/_HDPI$/, "")).addTo(this.map);
		this.baseLayer.bringToBack();
	},
	setLayer: function (inName, inEnabled) {
		var layer = this.overlays[inName];
		if (!layer || !this.layers[inName]) return;
		if (inEnabled) {
			layer.addTo(this.map);
		} else {
			this.map.removeLayer(layer);
		}
	},
	eventName: function (inEvent) {
		return (inEvent == "idle") ? "moveend" : (inEvent == "bounds_changed") ? "move" : inEvent;
	},
	on: function (inEvent, inHandler) {
		this.map.on(this.eventName(inEvent), function () { inHandler(); });
	},
	once: function (inEvent, inHandler) {
		this.map.once(this.eventName(inEvent), function () { inHandler(); });
	},
	latLngToContainerPoint: function (inLatLng) {
		var point = this.map.latLngToContainerPoint(this.toLeaflet(inLatLng));
		return {x: Math.floor(point.x), y: Math.floor(point.y)};
	},
	containerPointToLatLng: function (inPoint) {
		return this.fromLeaflet(this.map.containerPointToLatLng(L.point(inPoint.x, inPoint.y)));
	},
	getOverlayContainer: function () {
		return this.map.getContainer();
	},
	getPanContainer: function () {
		return this.map.getContainer();
	},

	addMarker: function (inOptions) {
		var size = inOptions.size;
		var anchor = (inOptions.anchor == "center") ? [size / 2, size / 2] : [size / 2, size];
		var handle = L.marker(this.toLeaflet(inOptions.position), {
			icon: L.icon({iconUrl: inOptions.iconUrl, iconSize: [size, size], iconAnchor: anchor}),
			title: inOptions.title || "",
			keyboard: false
		});
		var layer = this.markerLayer;
		var self = this;
		layer.addLayer(handle);
		var marker = {
			handle: handle,
			iconUrl: inOptions.iconUrl,
			getPosition: function () { return self.fromLeaflet(handle.getLatLng()); },
			setPosition: function (inLatLng) { handle.setLatLng(self.toLeaflet(inLatLng)); },
			remove: function () { layer.removeLayer(handle); },
			restore: function () { layer.addLayer(handle); },
			onClick: function (inHandler) {
				handle.off("click");
				handle.on("click", function () { inHandler(); });
			}
		};
		if (inOptions.onClick) marker.onClick(inOptions.onClick);
		return marker;
	},
	addCircle: function (inOptions) {
		var self = this;
		var handle = L.circle(this.toLeaflet(inOptions.center), {
			radius: inOptions.radius,
			interactive: false,
			fillColor: "#60bbe5",
			fillOpacity: 0.1,
			color: "#60bbe5",
			opacity: 0.4,
			weight: 1
		}).addTo(this.map);
		return {
			handle: handle,
			setCenter: function (inLatLng) { handle.setLatLng(self.toLeaflet(inLatLng)); },
			setRadius: function (inRadius) { handle.setRadius(inRadius); },
			remove: function () { self.map.removeLayer(handle); }
		};
	},
	fitCircle: function (inCircle) {
		this.map.fitBounds(inCircle.handle.getBounds());
	},

	/* Nominatim's usage policy forbids search-as-you-type, so search on Enter only */
	attachSearch: function (inInputNode, inOnPlaces, inOnError) {
		inInputNode.addEventListener("keydown", function (inEvent) {
			if (inEvent.keyCode != 13) return;
			var query = inInputNode.value.replace(/^\s+|\s+$/g, "");
			if (!query) return;
			this.search(query, function (inError, inPlaces) {
				if (inError) {
					if (inOnError) inOnError(inError);
				} else if (!inPlaces.length) {
					if (inOnError) inOnError($L("No results"));
				} else {
					inOnPlaces(inPlaces);
				}
			});
		}.bind(this), false);
	},
	geocode: function (inQuery, inCallback) {
		this.search(inQuery, inCallback);
	},
	search: function (inQuery, inCallback) {
		var bounds = this.map.getBounds();
		var url = (Prefs.osmNominatimUrl || this.nominatimUrl) + "/search?" + MapEngines.query({
			format: "jsonv2",
			q: inQuery,
			limit: 10,
			extratags: 1,
			"accept-language": Prefs.lang,
			viewbox: [bounds.getWest(), bounds.getNorth(), bounds.getEast(), bounds.getSouth()].join(",")
		});
		MapEngines.getJSON(url, function (inError, inData) {
			if (inError) {
				inCallback(inError);
				return;
			}
			var places = [];
			for (var i = 0; i < inData.length; i++) {
				places.push(this.placeFromNominatim(inData[i]));
			}
			inCallback(null, places);
		}.bind(this));
	},
	reverseGeocode: function (inLatLng, inCallback) {
		var url = (Prefs.osmNominatimUrl || this.nominatimUrl) + "/reverse?" + MapEngines.query({
			format: "jsonv2",
			lat: inLatLng.lat(),
			lon: inLatLng.lng(),
			zoom: 18,
			extratags: 1,
			"accept-language": Prefs.lang
		});
		MapEngines.getJSON(url, function (inError, inData) {
			if (inError) {
				inCallback(inError);
			} else if (inData.error) {
				inCallback(inData.error);
			} else {
				inCallback(null, this.placeFromNominatim(inData));
			}
		}.bind(this));
	},
	placeFromNominatim: function (inResult) {
		var place = {
			id: inResult.place_id,
			name: inResult.name || inResult.display_name.split(",")[0],
			formatted_address: inResult.display_name,
			icon: "assets/lune-marker-red-64-64.png",
			types: [inResult.category, inResult.type],
			geometry: {
				location: new MapEngines.LatLng(inResult.lat, inResult.lon)
			}
		};
		/* OSM tags shown in the place details, the Google engine fills the same fields */
		var tags = inResult.extratags || {};
		var phone = tags.phone || tags["contact:phone"];
		var website = tags.website || tags["contact:website"] || tags.url;
		if (phone) place.formatted_phone_number = phone.split(";")[0];
		if (website) place.website = website.split(";")[0];
		if (tags.opening_hours) place.opening_hours_text = tags.opening_hours;
		var bb = inResult.boundingbox;
		if (bb && bb.length == 4 && (bb[0] != bb[1] || bb[2] != bb[3])) {
			place.geometry.viewport = {south: Number(bb[0]), north: Number(bb[1]), west: Number(bb[2]), east: Number(bb[3])};
		}
		return place;
	},

	route: function (inRequest, inCallback) {
		var profile = this.routingProfiles[inRequest.travelMode];
		if (!profile) {
			inCallback($L("This travel mode is not available with OpenStreetMap"));
			return;
		}
		var coordinates = inRequest.origin.lng() + "," + inRequest.origin.lat() + ";" + inRequest.destination.lng() + "," + inRequest.destination.lat();
		var url = (Prefs.osmRoutingUrl || this.routingUrl) + "/" + profile + "/route/v1/driving/" + coordinates + "?" + MapEngines.query({
			overview: "full",
			geometries: "geojson",
			steps: "true",
			alternatives: inRequest.provideRouteAlternatives ? "true" : "false"
		});
		MapEngines.getJSON(url, function (inError, inData) {
			if (inError) {
				inCallback(inError);
			} else if (inData.code != "Ok" || !inData.routes || !inData.routes.length) {
				inCallback(inData.message || inData.code || "ZERO_RESULTS");
			} else {
				inCallback(null, this.directionsFromOsrm(inData));
			}
		}.bind(this));
	},
	directionsFromOsrm: function (inData) {
		var routes = [];
		for (var r = 0; r < inData.routes.length; r++) {
			var osrmRoute = inData.routes[r];
			var steps = [];
			for (var l = 0; l < osrmRoute.legs.length; l++) {
				var legSteps = osrmRoute.legs[l].steps;
				for (var s = 0; s < legSteps.length; s++) {
					var step = legSteps[s];
					var location = new MapEngines.LatLng(step.maneuver.location[1], step.maneuver.location[0]);
					steps.push({
						instructions: this.instruction(step),
						maneuver: this.maneuverClass(step),
						distance: {value: step.distance, text: MapEngines.formatDistance(step.distance)},
						duration: {value: step.duration, text: MapEngines.formatDuration(step.duration)},
						start_location: location,
						start_point: location
					});
				}
			}
			var path = [];
			var coords = osrmRoute.geometry.coordinates;
			for (var c = 0; c < coords.length; c++) {
				path.push([coords[c][1], coords[c][0]]);
			}
			routes.push({
				legs: [{
					distance: {value: osrmRoute.distance, text: MapEngines.formatDistance(osrmRoute.distance)},
					duration: {value: osrmRoute.duration, text: MapEngines.formatDuration(osrmRoute.duration)},
					steps: steps
				}],
				warnings: [],
				copyrights: "Routing: OSRM, FOSSGIS. Map data " + "© OpenStreetMap contributors",
				path: path
			});
		}
		return {routes: routes};
	},
	maneuverClass: function (inStep) {
		var type = inStep.maneuver.type;
		var modifier = inStep.maneuver.modifier || "straight";
		var side = (modifier.indexOf("left") >= 0) ? "left" : "right";
		switch (type) {
			case "fork":
				return "fork-" + side;
			case "on ramp":
			case "off ramp":
				return "ramp-" + side;
			case "merge":
				return "merge";
			case "roundabout":
			case "rotary":
			case "roundabout turn":
			case "exit roundabout":
			case "exit rotary":
				return (inStep.driving_side == "left") ? "roundabout-left" : "roundabout-right";
		}
		switch (modifier) {
			case "left": return "turn-left";
			case "right": return "turn-right";
			case "slight left": return "turn-slight-left";
			case "slight right": return "turn-slight-right";
			case "sharp left": return "turn-sharp-left";
			case "sharp right": return "turn-sharp-right";
		}
		return "straight";
	},
	instruction: function (inStep) {
		var m = inStep.maneuver;
		var road = inStep.name || inStep.ref || "";
		var onto = road ? " " + $L("onto") + " <b>" + this.escape(road) + "</b>" : "";
		var direction = this.modifierText(m.modifier);
		switch (m.type) {
			case "depart":
				return $L("Head") + " " + this.headingText(m.bearing_after) + (road ? " " + $L("on") + " <b>" + this.escape(road) + "</b>" : "");
			case "arrive":
				return $L("Arrive at your destination");
			case "roundabout":
			case "rotary":
			case "roundabout turn":
				return $L("At the roundabout, take exit") + " " + (m.exit || 1) + onto;
			case "exit roundabout":
			case "exit rotary":
				return $L("Exit the roundabout") + onto;
			case "merge":
				return $L("Merge") + " " + direction + onto;
			case "on ramp":
				return $L("Take the ramp") + " " + direction + onto;
			case "off ramp":
				return $L("Take the exit") + " " + direction + onto;
			case "fork":
				return $L("Keep") + " " + direction + " " + $L("at the fork") + onto;
			case "new name":
			case "continue":
				if (m.modifier == "uturn") return $L("Make a U-turn") + onto;
				return $L("Continue") + onto;
		}
		/* turn, end of road, notification, use lane, ... */
		if (m.modifier == "uturn") return $L("Make a U-turn") + onto;
		if (m.modifier == "straight" || !m.modifier) return $L("Continue straight") + onto;
		return $L("Turn") + " " + direction + onto;
	},
	modifierText: function (inModifier) {
		switch (inModifier) {
			case "left": return $L("left");
			case "right": return $L("right");
			case "slight left": return $L("slightly left");
			case "slight right": return $L("slightly right");
			case "sharp left": return $L("sharp left");
			case "sharp right": return $L("sharp right");
			case "uturn": return $L("around");
		}
		return $L("straight");
	},
	headingText: function (inBearing) {
		var names = [$L("north"), $L("northeast"), $L("east"), $L("southeast"), $L("south"), $L("southwest"), $L("west"), $L("northwest")];
		return names[Math.round((inBearing || 0) / 45) % 8];
	},
	escape: function (inText) {
		return String(inText).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	},
	showRoute: function (inResponse) {
		this.clearRoute();
		this.routeLayer = L.polyline(inResponse.routes[0].path, {
			interactive: false,
			color: '#4941e3',
			opacity: 0.7,
			weight: 8
		}).addTo(this.map);
		this.map.fitBounds(this.routeLayer.getBounds());
	},
	clearRoute: function () {
		if (this.routeLayer) this.map.removeLayer(this.routeLayer);
		this.routeLayer = null;
	},
	elevation: function (inLatLng, inCallback) {
		var url = (Prefs.osmElevationUrl || this.elevationUrl) + "?" + MapEngines.query({
			latitude: inLatLng.lat(),
			longitude: inLatLng.lng()
		});
		MapEngines.getJSON(url, function (inError, inData) {
			if (inError) {
				inCallback(inError);
			} else if (!inData.elevation || !inData.elevation.length) {
				inCallback("No elevation");
			} else {
				inCallback(null, inData.elevation[0]);
			}
		});
	}
}));
