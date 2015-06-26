/* webOSAccel.js - webOS accelerometer component
 * 
 */

enyo.kind({
	name: "webOSAccel",
	kind: "Component",
	events: {
		onAcceleration: ""
    },
    components: [
		{kind: "Signals", name: "Signal", onacceleration: "accelerationHandler"}
    ],
	start: function(inSender, inEvent) {
		enyo.dispatcher.listen(document, "acceleration");
    },
    stop: function(inSender, inEvent) {
		enyo.dispatcher.stopListening(document, "acceleration");
	},
	accelerationHandler: function (inSender, inEvent) {
		this.doAcceleration(inEvent);
	}	
});
