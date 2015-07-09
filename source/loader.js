var gAPI = "?v=3"; //default Google API
var map;
var geocoder;
var elevator;
var markers = [];
var selectMode = false; 
var appInfo;
var API = false;
var Prefs = {
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
		
var cookie = enyo.getCookie("mapsAppPrefs");
if (cookie) {
	// if it exists and correct, else reset and use the default
	try {
		Prefs = enyo.mixin(Prefs, enyo.json.parse(cookie));
	} catch (e) {
		enyo.log("Cannot parse cookie, resetting: ", e);
		enyo.setCookie("mapsAppPrefs", null, { "Max-Age": 0 }); 
	};	
};

function loadScript() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  //script.src = "http://maps.google.com/maps/api/js" + gAPI + "&libraries=places,geometry&language=" + Prefs.lang + '&callback=initialize';
   script.src = "https://maps.googleapis.com/maps/api/js" + gAPI + "&libraries=places,geometry&language=" + Prefs.lang + '&callback=initialize';
  document.body.appendChild(script);
}

function initialize() {

			directionsDisplay = new google.maps.DirectionsRenderer();
			directionsService = new google.maps.DirectionsService();
			trafficLayer = new google.maps.TrafficLayer();
			transitLayer = new google.maps.TransitLayer();
			bikeLayer = new google.maps.BicyclingLayer();
			geocoder = new google.maps.Geocoder();
			currentPos = new google.maps.LatLng(37.39281, -122.04046199999999);

			console.log("*** API INITIALIZED ***");
			API = true;

}

window.onload = loadScript;
