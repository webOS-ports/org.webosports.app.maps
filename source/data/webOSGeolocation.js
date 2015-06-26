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
	components: [{
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
		
	getCurrentPosition: function (inSender, inEvent) {
		this.$.singleLocationService.send({accuracy: 3, maximumAge: 5, responseTime: 1});
	},
	LocationSuccess: function (inSender, inEvent) {
		this.doSuccess(this.webOStoW3C(inEvent.data));
	},
	LocationFail: function (inSender, inEvent) {
		
		var msg = "errorCode: " + inEvent.data.errorCode + "errorText: " + inEvent.data.errorText;
		if (this.errorCodes[inEvent.data.errorCode]) {
			msg = this.errorCodes[inEvent.data.errorCode];
		}
		this.log(msg);
		this.doFailure({message: msg});
	},
	startTracking: function() {
        this.$.trackingLocationService.send({subscribe: true});
    },
    stopTracking: function() {
		this.$.trackingLocationService.cancel();
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
		 
		return {
			"coords": {
					"latitude": inData.latitude,
					"longitude": inData.longitude,
					"altitude": inData.altitude,
					"accuracy": inData.horizAccuracy,
					"altitudeAccuracy": inData.vertAccuracy,
					"heading": inData.heading,
					"speed": inData.velocity
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
