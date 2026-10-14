var markers = [];
var selectMode = false; 
var appInfo;
var API = false;
var Prefs = {
			engine: "osm",
			lastPosLat: 37.39281,
			lastPosLng: -122.04046199999999,
			lastZoom: 8,
			mapType: ((window.devicePixelRatio >= 1.5) ? 'ROADMAP_HDPI' : 'ROADMAP'),
			layers: {
				traffic: false,
				transit: false,
				bike: false
			},
			lang: navigator.language,
			GPSinterval: 5,
			MapCacheExternal: false,
			OSMMapCache: false,
			offlineTiles: true,
			retina: ((window.devicePixelRatio >= 1.5) ? true : false),
			lengthUnits: "metric"
};

var FallbackAppInfo = {
		"title": "Maps",
		"id": "org.webosports.app.maps",
		"version": "0.0.1",
		"vendor": "WebOS Ports, Jan Herman (72ka)",
		"vendor_url": "http://wiki.webos-ports.org/wiki/Application:Maps",
		"icon": "icon.png",
		"splashicon": "icon-256x256.png"
	};

try {
	appInfo = webos.fetchAppInfo();   
	enyo.log("APP version: ", appInfo.version);
} catch (e) {
	enyo.log("Using fallback appInfo: ", e);
	/* fallback appinfo */
	appInfo = FallbackAppInfo;
};
		
/*
 * Preferences live in localStorage: WebAppManager keeps no cookies for file://
 * apps, so the cookie only persisted in browsers. It is still read once so
 * existing browser users keep their settings.
 */
var PrefsStore = {
	key: "mapsAppPrefs",
	load: function () {
		var stored = null;
		try {
			stored = window.localStorage.getItem(this.key);
		} catch (e) {}
		if (!stored) stored = enyo.getCookie(this.key);
		return stored;
	},
	save: function (inPrefs) {
		var json = enyo.json.stringify(inPrefs);
		try {
			window.localStorage.setItem(this.key, json);
		} catch (e) {
			enyo.setCookie(this.key, json);
		}
	},
	clear: function () {
		try {
			window.localStorage.removeItem(this.key);
		} catch (e) {}
		enyo.setCookie(this.key, null, { "Max-Age": 0 });
	}
};

var storedPrefs = PrefsStore.load();
if (storedPrefs) {
	// if it exists and correct, else reset and use the default
	try {
		Prefs = enyo.mixin(Prefs, enyo.json.parse(storedPrefs));
	} catch (e) {
		enyo.log("Cannot parse stored preferences, resetting: ", e);
		PrefsStore.clear();
	};	
};

var currentPos;

/*
 * Offline map tiles (sw.js): the tiles the user has looked at stay available
 * without a network. Only for the OpenStreetMap engine; turning the
 * preference off removes the worker and the tiles it kept.
 */
var TileCache = {
	name: "tiles-v1",
	supported: function () {
		return ("serviceWorker" in navigator) && ("caches" in window);
	},
	update: function () {
		if (!this.supported()) {
			return;
		}
		if (Prefs.offlineTiles && mapEngine.id == "osm") {
			navigator.serviceWorker.register("sw.js").then(function (inRegistration) {
				enyo.log("Offline tiles kept by ", inRegistration.scope);
			}, function (inError) {
				enyo.log("Offline tiles unavailable: ", inError);
			});
		} else {
			navigator.serviceWorker.getRegistrations().then(function (inRegistrations) {
				inRegistrations.forEach(function (inRegistration) {
					inRegistration.unregister();
				});
			});
			window.caches["delete"](this.name);
		}
	}
};

function loadScript() {
	TileCache.update();
	/* mapEngine is created from Prefs.engine in source/engines/setup.js */
	mapEngine.loadApi(initialize);
}

function initialize() {

			currentPos = mapEngine.latLng(37.39281, -122.04046199999999);

			console.log("*** API INITIALIZED *** ", mapEngine.id);
			API = true;

}

window.onload = loadScript;
