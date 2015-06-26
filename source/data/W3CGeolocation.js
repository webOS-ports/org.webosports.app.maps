enyo.kind({
	name: "W3CGeolocation",
	kind: "Component",
	events: {
		onSuccess: "",
		onFailure: ""
    },
    destroy: function() {
		this.stopTracking();
		this.inherited(arguments);
	},
	stopTracking: function() {
		//console.log("Trying to stop tracking...");
		if (this._watchId) {
			//console.log("Did stop tracking.");
			navigator.geolocation.clearWatch(this._watchId);
		}
	},
	getCurrentPosition: function() {
        if(!!navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
                enyo.bind(this, "doSuccess"),
                enyo.bind(this, "doFailure"),
                {maximumAge: 600, timeout: 5000, enableHighAccuracy: false});
        } else {
            enyo.log("Geolocation error: Device does not support navigator.geolocation!");
            this.doFailure("Geolocation error: Device does not support navigator.geolocation!");
        }
    },
    startTracking: function() {
        if(!!navigator.geolocation) {
            this._watchId = navigator.geolocation.watchPosition(
                enyo.bind(this, "doSuccess"),
                enyo.bind(this, "doFailure"),
                {maximumAge: 6000, timeout: 5000, enableHighAccuracy: false});
        } else {
            enyo.log("Geolocation error: Device does not support navigator.geolocation!");
            this.doFailure("Geolocation error: Device does not support navigator.geolocation!");
        }
    }
});
