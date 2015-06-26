/* webOSCompass.js - webOS compass component
 * 
 */

enyo.kind({
	name: "webOSCompass",
	kind: "Component",
	events: {
		onHeading: "",
		onTrackingHeading: ""
    },
    components: [
		{kind: "Signals", name: "compassSignal"}
    ],
	blockScreenTimeout: function (block) {
		window.PalmSystem.setWindowProperties({
			blockScreenTimeout: block
		});
	},
	getCurrentHeading: function (inSender, inEvent) {
		this.$.compassSignal.oncompass = 'compassSingle';
		this.blockScreenTimeout(true);
		enyo.dispatcher.listen(document, "compass");
	},
	startTracking: function(inSender, inEvent) {
		this.$.compassSignal.oncompass = 'compassTracking';
		this.blockScreenTimeout(true);
		enyo.dispatcher.listen(document, "compass");
    },
    stopTracking: function(inSender, inEvent) {
		enyo.dispatcher.stopListening(document, "compass");
		this.blockScreenTimeout(false);
	},
	compassTracking: function (inSender, inEvent) {
		var degrees = Math.round(Number(inEvent.trueHeading));
		this.doTrackingHeading({heading: degrees});
	},
	compassSingle: function (inSender, inEvent) {
		var degrees = Math.round(Number(inEvent.trueHeading));
		this.doHeading({heading: degrees});
		this.stopTracking();
	}	
});
