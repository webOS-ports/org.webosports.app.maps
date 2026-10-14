/* webOSGeolocation.js - LuneOS/webOS geolocation API
 * 
 */

enyo.kind({
	name: "webOSGeolocation",
	kind: "Component",
	events: {
		onSuccess: "",
		onFailure: ""
    },
	/*
	 * LuneOS uses the webOS OSE location service (com.webos.service.location),
	 * legacy webOS devices have com.palm.location. Try OSE first and fall back.
	 */
	components: [{
			name: "cachedLocationService",
			kind: "PalmService",
			service: "luna://com.webos.service.location/",
			method: "getCachedPosition",
			subscribe: false,
			resubscribe: false,
			onResponse: "LocationSuccess",
			onError: "CachedLocationFail"
	},
	{
			name: "updatesLocationService",
			kind: "PalmService",
			service: "luna://com.webos.service.location/",
			method: "getLocationUpdates",
			subscribe: true,
			onResponse: "LocationSuccess",
			onError: "UpdatesLocationFail"
	},
	{
			name: "singleLocationService",
			kind: "PalmService",
			service: "palm://com.palm.location/",
			method: "getCurrentPosition",
			subscribe: false,
			resubscribe: false,
			onResponse: "LocationSuccess",
			onError: "LocationFail"
	},
	{
			name: "trackingLocationService",
			kind: "PalmService",
			service: "palm://com.palm.location/",
			method: "startTracking",
			subscribe: true,
			//resubscribe: false,
			onResponse: "LocationSuccess",
			onError: "LocationFail"
	}],
	legacy: false,
		
	getCurrentPosition: function (inSender, inEvent) {
		if (this.legacy) {
			this.$.singleLocationService.send({accuracy: 3, maximumAge: 5, responseTime: 1});
		} else {
			this.$.cachedLocationService.send({});
		}
	},
	LocationSuccess: function (inSender, inEvent) {
		/* subscription acknowledgements carry no position */
		if (inEvent.data.latitude === undefined) return;
		this.doSuccess(this.webOStoW3C(inEvent.data));
	},
	isUnknownService: function (inData) {
		return /Unknown (service|method)|not (found|running)/i.test(inData.errorText || "");
	},
	CachedLocationFail: function (inSender, inEvent) {
		if (this.isUnknownService(inEvent.data)) {
			this.legacy = true;
			this.getCurrentPosition();
			return;
		}
		/* no cached fix yet, the first live update will answer instead */
		this.startTracking();
	},
	UpdatesLocationFail: function (inSender, inEvent) {
		this.tracking = false;
		if (this.isUnknownService(inEvent.data)) {
			this.legacy = true;
			this.startTracking();
			return;
		}
		this.LocationFail(inSender, inEvent);
	},
	LocationFail: function (inSender, inEvent) {
		
		var msg = "errorCode: " + inEvent.data.errorCode + " errorText: " + inEvent.data.errorText;
		if (this.legacy && this.errorCodes[inEvent.data.errorCode]) {
			msg = this.errorCodes[inEvent.data.errorCode];
		}
		this.log(msg);
		this.doFailure({message: msg});
	},
	startTracking: function() {
		if (this.tracking) return;
		this.tracking = true;
		if (this.legacy) {
			this.trackingRequest = this.$.trackingLocationService.send({subscribe: true});
		} else {
			this.trackingRequest = this.$.updatesLocationService.send({subscribe: true, minimumInterval: Prefs.GPSinterval * 1000});
		}
    },
    stopTracking: function() {
		this.tracking = false;
		/* PalmService.cancel() needs the request returned by send() */
		if (this.trackingRequest) this.trackingRequest.cancel();
		this.trackingRequest = null;
	},
	webOStoW3C: function(inData) {
				
		/* WC3 Coordinates object Specification */
		/**
		Coordinates.latitude
		Coordinates.longitude	
		Coordinates.altitude
		Coordinates.accuracy
		Coordinates.altitudeAccuracy	
		Coordinates.heading
		Coordinates.speed
		**/
		 
		/* webOS legacy geolocation API specifications */
		/**
		["altitude", "heading", "horizAccuracy", "latitude", "longitude", "timestamp", "velocity", "vertAccuracy"]
		**/
		/* webOS OSE uses "direction" and "speed", -1 means unknown */
		var known = function (inValue) { return (inValue === undefined || inValue < 0) ? null : inValue; };
		 
		return {
			"coords": {
					"latitude": inData.latitude,
					"longitude": inData.longitude,
					"altitude": known(inData.altitude),
					"accuracy": known(inData.horizAccuracy),
					"altitudeAccuracy": known(inData.vertAccuracy),
					"heading": known(inData.heading !== undefined ? inData.heading : inData.direction),
					"speed": known(inData.velocity !== undefined ? inData.velocity : inData.speed)
				},
			"timestamp": inData.timestamp
		}
		
	},
	errorCodes: ["Success", "Timeout", "Position_Unavailable", "Unknown", 
	             "GPS_Permanent_Error - No GPS fix but can still get the cell and Wifi fixes. A TouchPad without GPS returns this error.", 
	             "LocationServiceOFF - No Location source available. Both Google and GPS are off.", 
	             "Permission Denied - The user has not accepted the terms of use for the Google Location Service, or the Google Service is off.", 
	             "The application already has a pending message ", 
	             "The application has been temporarily blacklisted. (The user is not allowing this application to use this service.)"]
});
