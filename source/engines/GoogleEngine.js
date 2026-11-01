/* Google Maps JavaScript API v3 engine - the behaviour the app always had */

/*
 * The Google Maps APIs need a key. None is in this repository: the build puts
 * the builder's own key in place of the placeholder below (GOOGLE_MAPS_API_KEY
 * in meta-luneos' org.webosports.app.maps.bb). Without one this engine is not
 * offered and the app stays on the open engine.
 */
var gAPIKey = "PLACEHOLDER_GOOGLE_MAPS_API_KEY";
var gAPI = "?key=" + encodeURIComponent(gAPIKey) + "&v=3";

/* the placeholder is matched by its prefix, so filling it in at build time cannot change this test */
function googleApiKeyUsable(inKey) {
	return typeof inKey === "string" && /^[A-Za-z0-9_-]+$/.test(inKey) && inKey.indexOf("PLACEHOLDER_") !== 0;
}

var GoogleMapEngine = MapEngines.extend({
	label: "Google Maps",
	nativeGestures: false,
	layers: {traffic: true, transit: true, bike: true},
	travelModes: ["DRIVING", "WALKING", "TRANSIT", "BICYCLING"],
	routeOptions: {provideRouteAlternatives: true, avoidTolls: true, avoidHighways: true},
	streetView: true,
	defaultMapType: ((window.devicePixelRatio >= 1.5) ? "ROADMAP_HDPI" : "ROADMAP"),

	loadApi: function (inCallback) {
		window.googleMapsLoaded = inCallback;
		MapEngines.loadScript("https://maps.googleapis.com/maps/api/js" + gAPI + "&libraries=places,geometry&language=" + Prefs.lang + "&callback=googleMapsLoaded");
	},
	versionText: function () {
		return "Google Maps API: v" + google.maps.version;
	},
	latLng: function (inLat, inLng) {
		return new google.maps.LatLng(inLat, inLng);
	},
	mapTypes: function () {
		return [
			{header: $L("Map Type (Google)")},
			{id: "ROADMAP", label: $L("Roadmap"), isRetina: true, icon: "assets/map-type-road.png"},
			{id: "SATELLITE", label: $L("Satellite"), isRetina: false, icon: "assets/map-type-satellite.png"},
			{id: "HYBRID", label: $L("Hybrid"), isRetina: true, icon: "assets/map-type-hybrid.png"},
			{id: "TERRAIN", label: $L("Terrain"), isRetina: true, icon: "assets/map-type-terrain.png"},
			{header: $L("Map Type (Others)")},
			{id: "OSM", label: $L("OpenStreetMap"), isRetina: false, icon: "assets/map-type-osm.png"},
			{id: "OCM", label: $L("OpenCycleMap"), isRetina: false, icon: "assets/map-type-ocm.png"},
			{id: "NOKIA", label: $L("Nokia Maps"), isRetina: false, icon: "assets/map-type-nokia.jpg"},
			{id: "Yandex", label: $L("Yandex Maps"), isRetina: false, icon: "assets/map-type-yandex.png"}
		];
	},

	createMap: function (inDiv, inOptions, inOnReady) {
		this.map = new google.maps.Map(inDiv, {
			zoom: inOptions.zoom,
			center: inOptions.center,
			disableDefaultUI: true,
			scaleControl: true,
			streetViewControl: false,
			draggable: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		});
		this.initCustomMapTypes();
		this.setMapType(inOptions.mapType);

		this.bikeLayer = new google.maps.BicyclingLayer();
		this.geocoder = new google.maps.Geocoder();
		this.elevator = new google.maps.ElevationService();
		this.directionsService = new google.maps.DirectionsService();
		this.directionsDisplay = new google.maps.DirectionsRenderer({
			map: this.map,
			suppressMarkers: true,
			polylineOptions: {
				clickable: false,
				strokeColor: '#4941e3',
				strokeOpacity: 0.7,
				strokeWeight: 8
			},
			markerOptions: {
				optimized: true
			},
			suppressInfoWindows: true,
			draggable: false
		});

		this.markerCluster = new MarkerClusterer(this.map, [], {
			styles: [{
				url: 'assets/lune-marker-red-64-64-cluster.png',
				height: 64,
				width: 64,
				anchor: [64, 64],
				textColor: "black",
				textSize: 24
			}]
		});

		google.maps.event.addListenerOnce(this.map, 'idle', inOnReady);
	},
	resize: function () {
		google.maps.event.trigger(this.map, "resize");
	},
	getCenter: function () { return this.map.getCenter(); },
	setCenter: function (inLatLng) { this.map.setCenter(inLatLng); },
	panTo: function (inLatLng) { this.map.panTo(inLatLng); },
	panBy: function (inX, inY) { this.map.panBy(inX, inY); },
	getZoom: function () { return this.map.getZoom(); },
	setZoom: function (inZoom) { this.map.setZoom(inZoom); },
	fitLatLngs: function (inLatLngs) {
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < inLatLngs.length; i++) {
			bounds.extend(inLatLngs[i]);
		}
		this.map.fitBounds(bounds);
	},
	fitViewport: function (inViewport) { this.map.fitBounds(inViewport); },

	setMapType: function (inId) {
		var mapTypeId;
		switch (inId) {
			default:
				mapTypeId = inId;
				break;
			case "OSM":
				mapTypeId = Prefs.OSMMapCache ? "OSMCached" : "OSM";
				break;
			case "ROADMAP":
				mapTypeId = google.maps.MapTypeId.ROADMAP;
				break;
			case "SATELLITE":
				mapTypeId = google.maps.MapTypeId.SATELLITE;
				break;
			case "HYBRID":
				mapTypeId = google.maps.MapTypeId.HYBRID;
				break;
			case "TERRAIN":
				mapTypeId = google.maps.MapTypeId.TERRAIN;
				break;
		}
		this.map.setOptions({mapTypeId: mapTypeId});
	},
	setLayer: function (inName, inEnabled) {
		switch (inName) {
			case "traffic":
				this.map.overlayMapTypes.setAt(0, inEnabled ? this.trafficMapType : null);
				break;
			case "transit":
				this.map.overlayMapTypes.setAt(1, inEnabled ? this.transitMapType : null);
				break;
			case "bike":
				this.bikeLayer.setMap(inEnabled ? this.map : null);
				break;
		}
	},
	on: function (inEvent, inHandler) {
		google.maps.event.addListener(this.map, inEvent, inHandler);
	},
	once: function (inEvent, inHandler) {
		google.maps.event.addListenerOnce(this.map, inEvent, inHandler);
	},
	latLngToContainerPoint: function (inLatLng) {
		var scale = Math.pow(2, this.map.getZoom());
		var proj = this.map.getProjection();
		var bounds = this.map.getBounds();
		var nw = proj.fromLatLngToPoint(new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()));
		var point = proj.fromLatLngToPoint(inLatLng);
		return {
			x: Math.floor((point.x - nw.x) * scale),
			y: Math.floor((point.y - nw.y) * scale)
		};
	},
	containerPointToLatLng: function (inPoint) {
		var scale = Math.pow(2, this.map.getZoom());
		var proj = this.map.getProjection();
		var bounds = this.map.getBounds();
		var nw = proj.fromLatLngToPoint(new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()));
		return proj.fromPointToLatLng(new google.maps.Point(inPoint.x / scale + nw.x, inPoint.y / scale + nw.y));
	},
	getOverlayContainer: function () {
		return this.map.getDiv().firstChild.firstChild;
	},
	getPanContainer: function () {
		return this.map.getDiv().firstChild.firstChild;
	},
	distance: function (a, b) {
		return google.maps.geometry.spherical.computeDistanceBetween(a, b);
	},

	addMarker: function (inOptions) {
		var size = inOptions.size;
		var anchor = (inOptions.anchor == "center") ? new google.maps.Point(size / 2, size / 2) : new google.maps.Point(size / 2, size);
		var handle = new google.maps.Marker({
			map: this.map,
			icon: {
				url: inOptions.iconUrl,
				size: new google.maps.Size(size, size),
				origin: new google.maps.Point(0, 0),
				anchor: anchor,
				scaledSize: new google.maps.Size(size, size)
			},
			title: inOptions.title,
			optimized: inOptions.optimized,
			position: inOptions.position
		});
		var map = this.map;
		var marker = {
			handle: handle,
			iconUrl: inOptions.iconUrl,
			getPosition: function () { return handle.getPosition(); },
			setPosition: function (inLatLng) { handle.setPosition(inLatLng); },
			remove: function () { handle.setMap(null); },
			restore: function () { handle.setMap(map); },
			onClick: function (inHandler) {
				if (this._listener) google.maps.event.removeListener(this._listener);
				this._listener = google.maps.event.addListener(handle, "click", inHandler);
			}
		};
		if (inOptions.onClick) marker.onClick(inOptions.onClick);
		return marker;
	},
	updateMarkers: function (inMarkers) {
		var natives = [];
		for (var i = 0; i < inMarkers.length; i++) {
			natives.push(inMarkers[i].handle);
		}
		this.markerCluster.clearMarkers();
		this.markerCluster.addMarkers(natives);
	},
	addCircle: function (inOptions) {
		var handle = new google.maps.Circle({
			center: inOptions.center,
			radius: inOptions.radius,
			map: this.map,
			fillColor: "#60bbe5",
			fillOpacity: 0.1,
			strokeColor: "#60bbe5",
			strokeOpacity: 0.4,
			strokeWeight: 1
		});
		return {
			handle: handle,
			setCenter: function (inLatLng) { handle.setCenter(inLatLng); },
			setRadius: function (inRadius) { handle.setRadius(inRadius); },
			remove: function () { handle.setMap(null); }
		};
	},
	fitCircle: function (inCircle) {
		this.map.fitBounds(inCircle.handle.getBounds());
	},

	attachSearch: function (inInputNode, inOnPlaces, inOnError) {
		var searchBox = new google.maps.places.SearchBox(inInputNode);
		searchBox.bindTo('bounds', this.map);
		google.maps.event.addListener(searchBox, 'places_changed', function () {
			var places = searchBox.getPlaces();
			if (places && places.length) {
				inOnPlaces(places);
			} else if (inOnError) {
				inOnError($L("No results"));
			}
		});
	},
	geocode: function (inQuery, inCallback) {
		this.geocoder.geocode({address: inQuery, bounds: this.map.getBounds()}, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				inCallback(null, results);
			} else {
				inCallback(status);
			}
		});
	},
	reverseGeocode: function (inLatLng, inCallback) {
		this.geocoder.geocode({'latLng': inLatLng}, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				inCallback(null, results[0]);
			} else {
				inCallback(status);
			}
		});
	},
	route: function (inRequest, inCallback) {
		var request = enyo.mixin({}, inRequest);
		request.travelMode = google.maps.TravelMode[inRequest.travelMode];
		request.unitSystem = (Prefs.lengthUnits == "imperial") ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC;
		request.waypoints = (inRequest.waypoints || []).map(function (inStop) {
			return {location: inStop.location, stopover: true};
		});
		this.directionsService.route(request, function (response, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				inCallback(null, response);
			} else {
				inCallback(status);
			}
		});
	},
	showRoute: function (inResponse, inIndex, inOptions) {
		var options = inOptions || {};
		this.directionsDisplay.setOptions({preserveViewport: true});
		this.directionsDisplay.setDirections(inResponse);
		this.directionsDisplay.setRouteIndex(inIndex || 0);
		this.directionsDisplay.setMap(this.map);
		if (options.fit !== false) {
			this.map.fitBounds(inResponse.routes[inIndex || 0].bounds, {top: 20, left: 20, bottom: 20, right: 20 + (options.padRight || 0)});
		}
	},
	clearRoute: function () {
		this.directionsDisplay.setMap(null);
	},
	elevation: function (inLatLng, inCallback) {
		this.elevator.getElevationForLocations({'locations': [inLatLng]}, function (results, status) {
			if (status == google.maps.ElevationStatus.OK && results[0]) {
				inCallback(null, results[0].elevation);
			} else {
				inCallback(status);
			}
		});
	},
	placeImage: function (inPlace, inWidth, inHeight, inCallback) {
		var location = inPlace.geometry.location;
		if (inPlace.photos) {
			inCallback(inPlace.photos[0].getUrl({'maxWidth': inWidth, 'maxHeight': inHeight}));
			return;
		}
		this.hasStreetView(location, function (inHasStreetView) {
			if (inHasStreetView) {
				/* Get an StreetView image */
				inCallback("https://maps.googleapis.com/maps/api/streetview?key=" + encodeURIComponent(gAPIKey) + "&size=" + inWidth + "x" + inHeight + "&location=" + location.lat() + "," + location.lng() + "&heading=235");
			} else {
				inCallback("https://maps.googleapis.com/maps/api/staticmap?key=" + encodeURIComponent(gAPIKey) + "&center=" + location.lat() + "," + location.lng() + "&zoom=19&size=" + inWidth + "x" + inHeight + "&maptype=satellite");
			}
		});
	},
	hasStreetView: function (inLatLng, inCallback) {
		new google.maps.StreetViewService().getPanoramaByLocation(inLatLng, 50, function (result, status) {
			inCallback(status == "OK");
		});
	},
	createPanorama: function (inDiv, inLatLng) {
		return new google.maps.StreetViewPanorama(inDiv, {
			position: inLatLng,
			visible: false,
			addressControl: true,
			linksControl: true,
			panControl: false,
			zoomControl: false,
			enableCloseButton: false,
			pov: {
				heading: 34,
				pitch: 10,
				zoom: 1
			}
		});
	},

	initCustomMapTypes: function () {
		var map = this.map;

		map.mapTypes.set("ROADMAP_HDPI", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "https://mts0.google.com/vt?lyrs=m@216000000,seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			maxZoom: 17,
			name: "ROADMAP_HDPI"
		}));

		map.mapTypes.set("TERRAIN_HDPI", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "https://mts0.google.com/vt?lyrs=p@216000000,seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			maxZoom: 17,
			name: "TERRAIN_HDPI"
		}));

		map.mapTypes.set("HYBRID_HDPI", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "https://mts0.google.com/vt?lyrs=y@216000000,seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			maxZoom: 17,
			name: "HYBRID_HDPI"
		}));

		map.mapTypes.set("OSM", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "https://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			name: "OpenStreetMap",
			credit: 'OpenStreetMap',
			maxZoom: 18
		}));

		OSMMapType.tileSize = new google.maps.Size(256, 256);
		map.mapTypes.set("OSMCached", new OSMMapType(Prefs));

		map.mapTypes.set("NOKIA", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/normal.day/" + zoom + "/" + coord.x + "/" + coord.y + "/256/png8";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			maxZoom: 17,
			name: "NOKIA"
		}));

		map.mapTypes.set("OCM", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "http://tile.opencyclemap.org/cycle/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
			},
			tileSize: new google.maps.Size(256, 256),
			name: "OpenCycleMap",
			maxZoom: 18
		}));

		map.mapTypes.set("Yandex", new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "http://vec0" + ((coord.x + coord.y) % 5) + ".maps.yandex.net/tiles?l=map&v=2.26.0&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
			},
			tileSize: new google.maps.Size(256, 256),
			name: "Yandex maps",
			maxZoom: 18
		}));

		map.mapTypes['Yandex'].projection = new YandexProjection();

		/* Overlays map types - unofficial, but only way how to show them on other map types */
		this.transitMapType = new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				/* This URL gets just transit lines on the transparent background */
				return "https://mts0.googleapis.com/vt?lyrs=a,transit|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=1";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true
		});

		this.trafficMapType = new google.maps.ImageMapType({
			getTileUrl: function(coord, zoom) {
				return "https://mts0.googleapis.com/vt?lyrs=h,traffic|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=3";
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true
		});
	}
});

if (googleApiKeyUsable(gAPIKey)) {
	MapEngines.register("google", GoogleMapEngine);
}
