/*
 * Map engine abstraction.
 *
 * The views talk to the global "mapEngine" only, never to a map API directly.
 * Every engine registers itself with MapEngines.register() and implements the
 * interface documented in MapEngines.Base below. Prefs.engine selects which
 * one is used; switching needs a reload because each engine loads its own API.
 *
 * Shared data model, identical for all engines:
 *  - positions are objects with lat(), lng() and toUrlValue(precision)
 *    (google.maps.LatLng already is one, other engines use MapEngines.LatLng)
 *  - places look like a Google PlaceResult:
 *      {id, name, formatted_address, icon, geometry: {location, viewport}}
 *  - directions look like a Google DirectionsResult:
 *      {routes: [{legs: [{distance: {text, value}, duration: {text, value},
 *        steps: [{instructions, maneuver, distance: {text, value},
 *                 start_location, start_point}]}], warnings: [], copyrights}]}
 */

var MapEngines = {

	registry: {},
	order: [],
	defaultEngine: "osm",

	register: function (inId, inConstructor) {
		inConstructor.prototype.id = inId;
		this.registry[inId] = inConstructor;
		this.order.push(inId);
	},

	/* [{id, label}] for the preferences picker */
	list: function () {
		var result = [];
		for (var i = 0; i < this.order.length; i++) {
			result.push({id: this.order[i], label: this.registry[this.order[i]].prototype.label});
		}
		return result;
	},

	create: function (inId) {
		var Ctor = this.registry[inId] || this.registry[this.defaultEngine];
		return new Ctor();
	},

	LatLng: function (inLat, inLng) {
		this._lat = Number(inLat);
		this._lng = Number(inLng);
	},

	/* great-circle distance in meters */
	distance: function (a, b) {
		var R = 6371008.8;
		var toRad = Math.PI / 180;
		var dLat = (b.lat() - a.lat()) * toRad;
		var dLng = (b.lng() - a.lng()) * toRad;
		var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(a.lat() * toRad) * Math.cos(b.lat() * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
		return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
	},

	formatDistance: function (inMeters) {
		if (Prefs.lengthUnits == "imperial") {
			var miles = inMeters * 0.000621371192;
			if (miles < 0.1) return Math.round(inMeters * 3.2808399) + " ft";
			return miles.toFixed(miles < 10 ? 1 : 0) + " " + $L("mi");
		}
		if (inMeters < 1000) return Math.round(inMeters) + " m";
		return (inMeters / 1000).toFixed(inMeters < 10000 ? 1 : 0) + " km";
	},

	formatDuration: function (inSeconds) {
		var minutes = Math.round(inSeconds / 60);
		if (minutes < 60) return minutes + " " + $L("min");
		return Math.floor(minutes / 60) + " h " + (minutes % 60) + " " + $L("min");
	},

	/* all steps of a route, over every leg (a leg per stop) */
	routeSteps: function (inRoute) {
		var steps = [];
		for (var l = 0; l < inRoute.legs.length; l++) {
			steps = steps.concat(inRoute.legs[l].steps);
		}
		return steps;
	},

	/* total distance and duration of a route, over every leg */
	routeSummary: function (inRoute) {
		if (inRoute.legs.length == 1) {
			return {distance: inRoute.legs[0].distance, duration: inRoute.legs[0].duration};
		}
		var meters = 0, seconds = 0;
		for (var l = 0; l < inRoute.legs.length; l++) {
			meters += inRoute.legs[l].distance.value;
			seconds += inRoute.legs[l].duration.value;
		}
		return {
			distance: {value: meters, text: this.formatDistance(meters)},
			duration: {value: seconds, text: this.formatDuration(seconds)}
		};
	},

	loadScript: function (inSrc, inOnLoad, inOnError) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = inSrc;
		if (inOnLoad) script.onload = inOnLoad;
		if (inOnError) script.onerror = inOnError;
		document.body.appendChild(script);
	},

	loadStylesheet: function (inHref) {
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = inHref;
		document.getElementsByTagName("head")[0].appendChild(link);
	},

	/* GET a JSON document, inCallback(error, data) */
	getJSON: function (inUrl, inCallback) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (xhr.readyState != 4) return;
			if (xhr.status == 200) {
				var data;
				try {
					data = JSON.parse(xhr.responseText);
				} catch (e) {
					inCallback("Invalid response: " + e.message);
					return;
				}
				inCallback(null, data);
			} else {
				var message = "HTTP " + xhr.status;
				try {
					message = JSON.parse(xhr.responseText).message || message;
				} catch (e) {}
				inCallback(message);
			}
		};
		xhr.open("GET", inUrl, true);
		xhr.send();
	},

	query: function (inParams) {
		var parts = [];
		for (var key in inParams) {
			if (inParams.hasOwnProperty(key) && inParams[key] !== undefined && inParams[key] !== null && inParams[key] !== "") {
				parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(inParams[key]));
			}
		}
		return parts.join("&");
	}
};

MapEngines.LatLng.prototype = {
	lat: function () { return this._lat; },
	lng: function () { return this._lng; },
	equals: function (other) { return !!other && other.lat() == this._lat && other.lng() == this._lng; },
	toUrlValue: function (inPrecision) {
		var p = (inPrecision === undefined) ? 6 : inPrecision;
		return parseFloat(this._lat.toFixed(p)) + "," + parseFloat(this._lng.toFixed(p));
	},
	toString: function () { return "(" + this._lat + ", " + this._lng + ")"; }
};

/*
 * Interface every engine implements. The defaults describe an engine that
 * supports nothing optional, so a new engine only overrides what it has.
 */
MapEngines.Base = function () {};
MapEngines.Base.prototype = {
	label: "",
	/* true if the engine pans/zooms on touch itself; the Google engine relies on MainView's custom gesture code */
	nativeGestures: true,
	/* {traffic, transit, bike} */
	layers: {},
	/* travel modes offered in the directions panel, subset of DRIVING/WALKING/TRANSIT/BICYCLING */
	travelModes: ["DRIVING"],
	/* direction options offered: provideRouteAlternatives, avoidTolls, avoidHighways */
	routeOptions: {},
	streetView: false,
	defaultMapType: "",

	/* loads the API, calls inCallback once usable */
	loadApi: function (inCallback) { inCallback(); },
	versionText: function () { return this.label; },
	latLng: function (inLat, inLng) { return new MapEngines.LatLng(inLat, inLng); },
	/* [{id, label, icon, isRetina, header}] - header starts a new group in the map type list */
	mapTypes: function () { return []; },
	isMapType: function (inId) {
		var types = this.mapTypes();
		var base = String(inId).replace(/_HDPI$/, "");
		for (var i = 0; i < types.length; i++) {
			if (types[i].id == base) return true;
		}
		return false;
	},

	/* inOptions: {center, zoom, mapType}; inOnReady is called once the map has rendered */
	createMap: function (inDiv, inOptions, inOnReady) {},
	resize: function () {},
	getCenter: function () {},
	setCenter: function (inLatLng) {},
	panTo: function (inLatLng) {},
	panBy: function (inX, inY) {},
	getZoom: function () {},
	setZoom: function (inZoom) {},
	fitLatLngs: function (inLatLngs) {},
	/* viewport as produced by this engine for place.geometry.viewport */
	fitViewport: function (inViewport) {},
	setMapType: function (inId) {},
	setLayer: function (inName, inEnabled) {},
	/* inEvent: "idle" (move finished) or "bounds_changed" (while moving) */
	on: function (inEvent, inHandler) {},
	once: function (inEvent, inHandler) {},
	latLngToContainerPoint: function (inLatLng) {},
	containerPointToLatLng: function (inPoint) {},
	/* element that overlays like the compass are appended to */
	getOverlayContainer: function () {},
	/* element MainView translates during its own drag/pinch handling (nativeGestures false only) */
	getPanContainer: function () {},
	distance: function (a, b) { return MapEngines.distance(a, b); },

	/* inOptions: {position, iconUrl, size, anchor: "bottom"|"center", title, onClick} returns marker */
	addMarker: function (inOptions) {},
	/* called after the marker set changed, lets an engine (re)cluster */
	updateMarkers: function (inMarkers) {},
	/* inOptions: {center, radius} returns circle with setCenter, setRadius, remove */
	addCircle: function (inOptions) {},
	fitCircle: function (inCircle) {},

	/* runs inOnPlaces(places) when a search is submitted from inInputNode; inOnError(message) otherwise */
	attachSearch: function (inInputNode, inOnPlaces, inOnError) {},
	/* free text to places, inCallback(error, places) */
	geocode: function (inQuery, inCallback) { inCallback("Not supported"); },
	/* shows a scale bar in Prefs.lengthUnits */
	updateScale: function () {},
	/* inCallback(error, place) */
	reverseGeocode: function (inLatLng, inCallback) { inCallback("Not supported"); },
	/* inRequest: {origin, destination, waypoints: [{location, name}], travelMode, provideRouteAlternatives, avoidTolls, avoidHighways}; inCallback(error, response) */
	route: function (inRequest, inCallback) { inCallback("Not supported"); },
	/* draws route inIndex of inResponse; inOptions: {fit: fit the view to it, padRight: pixels covered on the right (the directions panel), onSelect(index): the user picked another route on the map} */
	showRoute: function (inResponse, inIndex, inOptions) {},
	clearRoute: function () {},
	/* inCallback(error, meters) */
	elevation: function (inLatLng, inCallback) { inCallback("Not supported"); },
	/* inCallback(url) when there is a picture for the place, never called otherwise */
	placeImage: function (inPlace, inWidth, inHeight, inCallback) {},
	/* inCallback(boolean) */
	hasStreetView: function (inLatLng, inCallback) { inCallback(false); },
	createPanorama: function (inDiv, inLatLng) { return null; }
};

MapEngines.extend = function (inProto) {
	var Ctor = function () {};
	Ctor.prototype = enyo.mixin(new MapEngines.Base(), inProto);
	return Ctor;
};
